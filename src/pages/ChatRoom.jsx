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
  const peerRef = useRef(null);
  const audioRef = useRef(null);

  // Authentication state tracking
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Cleanup listener
  useEffect(() => {
    return () => {
      if (unsubscribeFn) unsubscribeFn();
      localStream?.getTracks().forEach(track => track.stop());
      // Additional cleanup for WebRTC can be added here if needed
    };
  }, [unsubscribeFn, localStream]);

  // Room and messages initialization
  useEffect(() => {
    setMessages([]);
    setRoomDetails(null);
    setRoomError(null);

    if (!currentUser || !roomId) return;

    const checkRoomValidity = async () => {
      const roomsRef = collection(db, 'chatRooms');
      const q = query(roomsRef, where('id', '==', roomId));

      try {
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setRoomError('Room does not exist');
          setTimeout(() => navigate('/home'), 3000);
          return;
        }

        const roomDoc = querySnapshot.docs[0];
        const roomData = roomDoc.data();

        if (roomData.expiresAt.toDate() < new Date()) {
          await deleteDoc(roomDoc.ref);
          setRoomError('Room has expired');
          setTimeout(() => navigate('/home'), 3000);
          return;
        }

        setRoomDetails(roomData);

        const messagesRef = collection(db, 'chatRooms', roomId, 'messages');
        const messagesQuery = query(messagesRef, orderBy('createdAt'));

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
          const fetchedMessages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setMessages(fetchedMessages);
        });

        setUnsubscribeFn(() => unsubscribe);
        scrollToBottom();
      } catch (error) {
        console.error('Room validity check error:', error);
        setRoomError('An error occurred');
        setTimeout(() => navigate('/home'), 3000);
      }
    };

    checkRoomValidity();
  }, [roomId, navigate, currentUser]);

  // Voice communication initialization
  const initVoiceChat = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setLocalStream(stream);
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    pc.ontrack = (event) => {
      if (audioRef.current) {
        audioRef.current.srcObject = event.streams[0];
      }
    };

    const offersRef = collection(db, 'voiceCommunications', roomId, 'offers');
    const answersRef = collection(db, 'voiceCommunications', roomId, 'answers');

    const unsubscribeOffers = onSnapshot(
      query(offersRef, where('userId', '!=', auth.currentUser.uid)),
      async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          if (change.type === 'added') {
            const data = change.doc.data();
            try {
              if (!data.offer || !data.offer.sdp) {
                console.error('Invalid remote description data:', data);
                continue;
              }

              const remoteDesc = new RTCSessionDescription({
                type: 'offer',
                sdp: data.offer.sdp
              });

              if (pc.signalingState !== 'closed') {
                await pc.setRemoteDescription(remoteDesc);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                await addDoc(answersRef, {
                  answer: {
                    type: 'answer',
                    sdp: answer.sdp
                  },
                  userId: auth.currentUser.uid,
                  timestamp: serverTimestamp()
                });
              }
            } catch (err) {
              console.error('Error processing remote description:', err);
            }
          }
        }
      }
    );

    if (pc.signalingState === 'stable') {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await addDoc(offersRef, {
        offer: {
          type: 'offer',
          sdp: offer.sdp
        },
        userId: auth.currentUser.uid,
        timestamp: serverTimestamp()
      });
    }

    setIsAudioEnabled(true);
    peerRef.current = pc;

    return () => {
      unsubscribeOffers();
      pc.close();
    };
  } catch (error) {
    console.error("Voice chat error:", error);
    setIsAudioEnabled(false);
  }
};

  // Toggle voice communication
  const toggleAudio = () => {
    if (isAudioEnabled) {
      localStream?.getTracks().forEach((track) => track.stop());

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.srcObject = null;
      }

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
    if (!newMessage.trim() || !auth.currentUser) return;

    const messagesRef = collection(db, 'chatRooms', roomId, 'messages');

    await addDoc(messagesRef, {
      text: newMessage,
      createdAt: serverTimestamp(),
      user: {
        id: auth.currentUser.uid,
        name: auth.currentUser.displayName || 'Anonymous',
        avatar: auth.currentUser.photoURL,
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

  if (!auth.currentUser) {
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

  if (!roomDetails) return <div className="bg-[#1C1C1C] h-screen flex items-center justify-center text-[#2ECC71]">Loading...</div>;

  return (
    <div className="flex flex-col h-screen bg-[#1C1C1C] text-[#EAECEE]">
      <div className="flex justify-between items-center p-4 bg-[#2ECC71]/10 border-b border-[#2ECC71]/20">
        <h2 className="text-xl font-bold text-[#2ECC71]">Chat Room: {roomId}</h2>
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
            isOwnMessage={message.user.id === auth.currentUser?.uid}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <audio ref={audioRef} style={{ display: 'none' }} />

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