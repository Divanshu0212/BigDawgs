import React, { useState, useEffect, useRef } from 'react';
import {
  collection, addDoc, query, where,
  orderBy, onSnapshot, serverTimestamp,
  deleteDoc, getDocs, setDoc, doc
} from 'firebase/firestore';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, auth } from '../firebase/firebase';
import { Send, Copy, Mic, MicOff } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';

// Message Bubble Component
const MessageBubble = ({ message, isOwnMessage }) => (
  <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
    <div className={`
      max-w-[70%] p-3 rounded-lg
      ${isOwnMessage
        ? 'bg-[#2ECC71]/30 text-[#EAECEE]'
        : 'bg-[#2ECC71]/10 text-[#EAECEE]'}
    `}>
      {!isOwnMessage && (
        <div className="text-sm text-[#2ECC71] mb-1">
          {message.user.name}
        </div>
      )}
      <div>{message.text}</div>
    </div>
  </div>
);

const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomDetails, setRoomDetails] = useState(null);
  const messagesEndRef = useRef(null);
  const [unsubscribeFn, setUnsubscribeFn] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [roomError, setRoomError] = useState(null);

  // Voice communication states
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [peerConnections, setPeerConnections] = useState(new Map());
  const [activeUsers, setActiveUsers] = useState(new Set());
  const audioElements = useRef(new Map());

  // Authentication state tracking
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user); // Debug log
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Cleanup listener
  useEffect(() => {
    return () => {
      localStream?.getTracks().forEach(track => track.stop());
      peerConnections.forEach(pc => pc.close());
      setPeerConnections(new Map());
      audioElements.current.forEach(audio => {
        audio.pause();
        audio.srcObject = null;
      });
      audioElements.current.clear();
    };
  }, [localStream, peerConnections]);

  // Track active users
  useEffect(() => {
    if (!roomId || !currentUser) return;

    const activeUsersRef = collection(db, 'voiceCommunications', roomId, 'activeUsers');

    // Add current user to active users
    const addActiveUser = async () => {
      await setDoc(doc(activeUsersRef, currentUser.uid), {
        userId: currentUser.uid,
        displayName: currentUser.displayName || 'Anonymous',
        timestamp: serverTimestamp()
      });
    };

    addActiveUser();

    // Listen for active users changes
    const unsubscribe = onSnapshot(activeUsersRef, (snapshot) => {
      const users = new Set();
      snapshot.docs.forEach(doc => {
        users.add(doc.id);
      });
      setActiveUsers(users);
      console.log('Active users:', Array.from(users)); // Debug log
    });

    // Cleanup: Remove user from active users
    return () => {
      unsubscribe();
      if (currentUser) {
        deleteDoc(doc(activeUsersRef, currentUser.uid));
      }
    };
  }, [roomId, currentUser]);

  // Handle offers, answers, and ICE candidates
  useEffect(() => {
    if (!roomId || !currentUser || !isAudioEnabled) return;

    const offersRef = collection(db, 'voiceCommunications', roomId, 'offers');
    const answersRef = collection(db, 'voiceCommunications', roomId, 'answers');
    const candidatesRef = collection(db, 'voiceCommunications', roomId, 'candidates');

    // Handle offers
    const unsubscribeOffers = onSnapshot(
      query(offersRef, where('toUserId', '==', currentUser.uid)),
      async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          if (change.type === 'added') {
            const data = change.doc.data();
            const fromUserId = data.fromUserId;

            let pc = peerConnections.get(fromUserId);
            if (!pc) {
              pc = createPeerConnection(fromUserId);
              setPeerConnections(prev => new Map(prev).set(fromUserId, pc));
            }

            try {
              await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              await addDoc(answersRef, {
                answer: answer,
                fromUserId: currentUser.uid,
                toUserId: fromUserId,
                timestamp: serverTimestamp()
              });
            } catch (err) {
              console.error('Error handling offer:', err);
            }
          }
        }
      }
    );

    // Handle answers
    const unsubscribeAnswers = onSnapshot(
      query(answersRef, where('toUserId', '==', currentUser.uid)),
      async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          if (change.type === 'added') {
            const data = change.doc.data();
            const pc = peerConnections.get(data.fromUserId);
            if (pc && pc.signalingState === 'have-local-offer') {
              try {
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
              } catch (err) {
                console.error('Error handling answer:', err);
              }
            } else {
              console.warn('PeerConnection not in correct state to set remote answer:', pc?.signalingState);
            }
          }
        }
      }
    );

    // Handle ICE candidates
    const unsubscribeCandidates = onSnapshot(
      query(candidatesRef, where('toUserId', '==', currentUser.uid)),
      async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          if (change.type === 'added') {
            const data = change.doc.data();
            const pc = peerConnections.get(data.fromUserId);
            if (pc) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
              } catch (err) {
                console.error('Error adding ICE candidate:', err);
              }
            }
          }
        }
      }
    );

    return () => {
      unsubscribeOffers();
      unsubscribeAnswers();
      unsubscribeCandidates();
    };
  }, [roomId, isAudioEnabled, peerConnections]);
  // At the start of your component
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user);  // Debug log
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Create a peer connection
  const createPeerConnection = (remoteUserId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    });

    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    // Handle ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate && pc.remoteDescription) {
        await addDoc(collection(db, 'voiceCommunications', roomId, 'candidates'), {
          candidate: event.candidate.toJSON(),
          fromUserId: currentUser.uid,
          toUserId: remoteUserId,
          timestamp: serverTimestamp()
        });
      }
    };

    // Handle incoming tracks
    pc.ontrack = (event) => {
      const audioElement = new Audio();
      audioElement.srcObject = event.streams[0];
      audioElement.autoplay = true;
      audioElements.current.set(remoteUserId, audioElement);
      console.log('Remote stream received:', event.streams[0]); // Debug log
    };

    // Log connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state: ${pc.connectionState}`);
    };

    return pc;
  };

  // Initialize voice chat
  const initVoiceChat = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);

      // Create peer connections for all active users
      activeUsers.forEach(async (userId) => {
        if (userId !== currentUser.uid) {
          const pc = createPeerConnection(userId);
          setPeerConnections(prev => new Map(prev).set(userId, pc));

          // Create and send offer
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer); // Set local description before sending the offer
          await addDoc(collection(db, 'voiceCommunications', roomId, 'offers'), {
            offer: offer,
            fromUserId: currentUser.uid,
            toUserId: userId,
            timestamp: serverTimestamp()
          });
        }
      });

      setIsAudioEnabled(true);
    } catch (error) {
      console.error("Voice chat error:", error);
      setIsAudioEnabled(false);
    }
  };

  // Toggle voice communication
  const toggleAudio = () => {
    if (isAudioEnabled) {
      localStream?.getTracks().forEach(track => track.stop());
      peerConnections.forEach(pc => pc.close());
      setPeerConnections(new Map());
      audioElements.current.forEach(audio => {
        audio.pause();
        audio.srcObject = null;
      });
      audioElements.current.clear();
      setIsAudioEnabled(false);
      setLocalStream(null);
    } else {
      initVoiceChat();
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const messagesRef = collection(db, 'chatRooms', roomId, 'messages');

    await addDoc(messagesRef, {
      text: newMessage,
      createdAt: serverTimestamp(),
      user: {
        id: currentUser.uid,
        name: currentUser.displayName || 'Anonymous',
        avatar: currentUser.photoURL,
      },
    });

    setNewMessage('');
    scrollToBottom();
  };

  // Copy room link
  const copyRoomLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/chat/${roomId}`);
    alert('Room link copied to clipboard!');
  };

  // Error or loading states
  if (roomError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#1C1C1C] text-[#EAECEE] p-4 text-center">
        <h2 className="text-2xl font-bold text-[#FF6B6B] mb-4">
          {roomError}
        </h2>
        <p className="mb-6 text-[#EAECEE]">
          You will be redirected to home in a moment...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#1C1C1C] text-[#EAECEE] p-4 text-center">
        <h2 className="text-2xl font-bold text-[#2ECC71] mb-4">
          Please Login to Access Chat Room
        </h2>
        <Link
          to="/login"
          className="bg-[#2ECC71] text-[#1C1C1C] px-6 py-3 rounded-lg font-semibold hover:bg-[#01FF70] transition"
        >
          Login
        </Link>
      </div>
    );
  }


  return (
    <div className="flex flex-col h-screen bg-[#1C1C1C] text-[#EAECEE]">
      <div className="flex justify-between items-center p-4 bg-[#2ECC71]/10 border-b border-[#2ECC71]/20">
        <h2 className="text-xl font-bold text-[#2ECC71]">
          Chat Room: {roomId} ({activeUsers.size} users in chat)
        </h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={copyRoomLink}
            className="text-[#2ECC71] hover:text-[#01FF70] flex items-center gap-2"
          >
            <Copy size={20} />
            Copy Room Link
          </button>
          <button
            onClick={toggleAudio}
            className={`
              ${isAudioEnabled
                ? 'text-[#2ECC71] hover:text-green-400'
                : 'text-red-500 hover:text-red-400'
              } flex items-center gap-2
            `}
          >
            {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
            {isAudioEnabled ? 'Voice On' : 'Voice Off'}
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwnMessage={message.user.id === currentUser?.uid}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-[#2ECC71]/10">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow p-3 rounded-lg bg-[#2ECC71]/20 text-[#EAECEE]"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="text-[#2ECC71] hover:text-green-400"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatRoom;