import React from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut, MoreVertical, X } from 'lucide-react';

const Sidebar = ({ user, onLogout, isOpen, onClose }) => (
  <div
    className={`fixed top-0 left-0 z-10 h-screen w-64 bg-[#1C1C1C] border-r border-[#2ECC71]/20 transition-transform transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
  >
    <div className="p-6 relative">
      <button onClick={onClose} className="absolute right-4 top-4 text-[#2ECC71] hover:text-[#01FF70] transition">
        <X size={24} />
      </button>

      <h2 className="text-2xl font-bold text-[#2ECC71] mb-8">Big Dawgs</h2>

      {user ? (
        <UserSection user={user} onLogout={onLogout} />
      ) : (
        <AuthButtons />
      )}
    </div>
  </div>
);

const UserSection = ({ user, onLogout }) => (
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
    <LogoutButton onLogout={onLogout} />
  </div>
);

const UserInfo = ({ user }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#2ECC71]/10">
    <User className="w-6 h-6 text-[#2ECC71]" />
    <div className="flex flex-col">
      <span className="text-[#EAECEE] font-medium">{user.displayName || 'User'}</span>
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