import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, MoreVertical, X, MessageSquarePlus } from 'lucide-react';
import { auth, db } from '../firebase/firebase.js';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

const Sidebar = ({ user, onLogout, isOpen, onClose }) => {
  const [activeRoom, setActiveRoom] = useState(null);
  const navigate = useNavigate();

  const createChatRoom = async () => {
    if (!user) {
      console.error("No user found");
      return;
    }

    try {
      // First, clean up any existing rooms for this user
      const roomsRef = collection(db, 'chatRooms');
      const q = query(roomsRef, where('createdBy', '==', user.uid));

      const existingRooms = await getDocs(q);

      // Delete any existing rooms
      const deletePromises = existingRooms.docs.map(
        (doc) => deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);

      // Create new room
      const roomId = Math.random().toString(36).substring(2, 10);
      const newRoomRef = await addDoc(roomsRef, {
        id: roomId,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      });

      console.log("Room created successfully:", roomId);

      setActiveRoom(roomId);
      navigate(`/chat/${roomId}`);
    } catch (error) {
      console.error("Error creating chat room:", error);
      alert("Failed to create chat room. Please try again.");
    }
  };


  return (
    <div className={`fixed top-0 left-0 z-10 h-screen w-64 bg-[#1C1C1C] border-r border-[#2ECC71]/20 transition-transform transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#2ECC71] hover:text-[#01FF70] transition"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-[#2ECC71] mb-8">Big Dawgs</h2>

        {user ? (
          <UserSection
            user={user}
            onLogout={onLogout}
            createChatRoom={createChatRoom}
            activeRoom={activeRoom}
          />
        ) : (
          <AuthButtons />
        )}
      </div>
    </div>
  );
};

const UserSection = ({ user, onLogout, createChatRoom, activeRoom }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {user.photoURL && (
          <img
            src={user.photoURL}
            alt="Profile"
            className="w-12 h-12 rounded-full border-2 border-[#2ECC71]"
          />
        )}
        <UserInfo user={user} />
      </div>

      {activeRoom ? (
        <div className="bg-[#2ECC71]/10 p-3 rounded-lg">
          <Link
            to={`/chat/${activeRoom}`}
            className="flex items-center gap-3 text-[#2ECC71] hover:underline"
          >
            <MessageSquarePlus className="w-6 h-6" />
            Your Active Chat Room
          </Link>
        </div>
      ) : (
        <button
          onClick={createChatRoom}
          className="flex items-center gap-3 w-full p-3 rounded-lg bg-[#2ECC71] text-[#1C1C1C] font-semibold hover:bg-[#01FF70] transition-colors"
        >
          <MessageSquarePlus className="w-6 h-6" />
          Create Chat Room
        </button>
      )}

      <LogoutButton onLogout={onLogout} />
    </div>
  );
};

const UserInfo = ({ user }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#2ECC71]/10">
    <User className="w-6 h-6 text-[#2ECC71]" />
    <div className="flex flex-col">
      <span className="text-[#EAECEE] font-medium">{user.displayName || 'User'}</span>
      <span className="text-[#2ECC71] text-sm">{user.email}</span>
    </div>
  </div>
);

const LogoutButton = ({ onLogout }) => (
  <button
    onClick={onLogout}
    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-[#2ECC71]/10 text-[#EAECEE] transition-colors"
  >
    <LogOut className="w-6 h-6 text-[#2ECC71]" />
    <span>Logout</span>
  </button>
);

const AuthButtons = () => (
  <div className="space-y-4">
    <Link
      to="/login"
      className="block w-full p-3 text-center rounded-lg bg-[#2ECC71] text-[#1C1C1C] font-semibold hover:bg-[#01FF70] transition-colors"
    >
      Login
    </Link>
    <Link
      to="/register"
      className="block w-full p-3 text-center rounded-lg border border-[#2ECC71] text-[#2ECC71] font-semibold hover:bg-[#2ECC71]/10 transition-colors"
    >
      Register
    </Link>
  </div>
);

export default Sidebar;