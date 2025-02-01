import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebase'; // Import Firebase auth
import { signOut } from 'firebase/auth';

const Welcome = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/'); // Redirect to home after logout
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="bg-black h-screen flex flex-col items-center justify-center">
      <div className="flex gap-5 justify-end mb-10">
        {user ? (
          <>
            <span className="text-[#2ADC35] text-2xl font-mono font-semibold">
              {user.displayName || user.email}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-600 rounded-md px-3 text-2xl py-2 font-mono transition-all font-semibold cursor-pointer hover:bg-red-800"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate('/login')}
              className="bg-[#2ADC35] rounded-md px-3 text-2xl py-2 font-mono transition-all font-semibold cursor-pointer hover:bg-[#138d1b]"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="bg-[#2ADC35] rounded-md px-3 text-2xl py-2 font-mono transition-all font-semibold cursor-pointer hover:bg-[#138d1b]"
            >
              SignUp
            </button>
          </>
        )}
      </div>
      <img
        src="/LogoMakerCa-1724589494272.png"
        alt="Logo"
        className="w-4/5 md:w-1/2 lg:w-1/3 animate-pulse"
      />
      <p className="text-[#2ADC35] text-center mt-10 text-3xl font-bold font-mono">
        Squad Up And Chill With Your Fellow Dawgs!
      </p>
    </div>
  );
};

export default Welcome;
