import React, { useState, useEffect, useRef } from 'react';
import {
  collection, addDoc, query, where,
  orderBy, onSnapshot, serverTimestamp,
  deleteDoc, getDocs
} from 'firebase/firestore';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, auth } from '../firebase/firebase';
import { Send, Copy, Mic, MicOff } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import Peer from 'simple-peer/simplepeer.min.js';
import io from 'socket.io-client';

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
  const [peers, setPeers] = useState([]);
  const peersRef = useRef([]);
  const socketRef = useRef(null);

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
    };
  }, [unsubscribeFn]);

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

      socketRef.current = io('https://your-signaling-server.com');
      socketRef.current.emit('join room', roomId);

      socketRef.current.on('all users', users => {
        const newPeers = users.map(userID => {
          const peer = createPeer(userID, socketRef.current.id, stream);
          return peer;
        });
        setPeers(newPeers);
      });

      socketRef.current.on('user joined', payload => {
        const peer = addPeer(payload.signal, payload.callerID, stream);
        setPeers(prevPeers => [...prevPeers, peer]);
      });

      setIsAudioEnabled(true);
    } catch (error) {
      console.error('Voice chat initialization error:', error);
      alert('Could not start voice communication');
    }
  };

  // Create peer connection as initiator
  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', signal => {
      socketRef.current.emit('sending signal', { userToSignal, callerID, signal });
    });

    return peer;
  };

  // Add peer connection as receiver
  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', signal => {
      socketRef.current.emit('returning signal', { signal, callerID });
    });

    peer.signal(incomingSignal);
    return peer;
  };

  // Toggle voice communication
  const toggleAudio = () => {
    if (isAudioEnabled) {
      localStream?.getTracks().forEach(track => track.stop());
      peersRef.current.forEach(peerObj => peerObj.peer.destroy());
      socketRef.current?.disconnect();
      setIsAudioEnabled(false);
      setPeers([]);
    } else {
      initVoiceChat();
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        avatar: auth.currentUser.photoURL
      }
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

      <form onSubmit={sendMessage} className="p-4 bg-[#2ECC71]/10">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow p-3 rounded-lg bg-[#2ECC71]/10 text-[#EAECEE] focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
          />
          <button
            type="submit"
            className="bg-[#2ECC71] text-[#1C1C1C] p-3 rounded-lg hover:bg-[#01FF70] transition"
          >
            <Send size={20} />
          </button>
        </div>
      </form>

      {isAudioEnabled && (
        <div className="hidden">
          {peers.map((peer, index) => (
            <AudioStream key={index} peer={peer} />
          ))}
        </div>
      )}
    </div>
  );
};

// Audio stream component
const AudioStream = ({ peer }) => {
  const audioRef = useRef();

  useEffect(() => {
    peer.on('stream', stream => {
      audioRef.current.srcObject = stream;
    });
  }, [peer]);

  return <audio ref={audioRef} autoPlay />;
};

// Message bubble component
const MessageBubble = ({ message, isOwnMessage }) => (
  <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
    <div
      className={`
        max-w-[70%] p-3 rounded-lg 
        ${isOwnMessage
          ? 'bg-[#2ECC71] text-[#1C1C1C]'
          : 'bg-[#2ECC71]/10 text-[#EAECEE]'}
      `}
    >
      {!isOwnMessage && (
        <div className="flex items-center space-x-2 mb-1">
          {message.user.avatar && (
            <img
              src={message.user.avatar}
              alt={message.user.name}
              className="w-6 h-6 rounded-full"
            />
          )}
          <span className="text-sm font-semibold text-[#2ECC71]">
            {message.user.name}
          </span>
        </div>
      )}
      <p>{message.text}</p>
    </div>
  </div>
);

export default ChatRoom;