import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebase'; // Make sure this is imported from your Firebase config
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  fetchTopGames,
  fetchNewReleases,
  fetchUpcoming,
  fetchByGenre,
  searchGames
} from './GameService';
import { Star, Calendar, ChevronRight, Search, User, LogOut, MoreVertical, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../firebase/firebase'; // Your Firebase config
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import Sidebar from '../Components/Sidebar';
import GameSection from '../Components/GameSection';
import HeroSection from '../Components/HeroSection';



const GameList = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [topGames, setTopGames] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [actionGames, setActionGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recommendedGames, setRecommendedGames] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchRecommendations(currentUser.uid);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [top, newGames, upcomingGames, action, recommendations] = await Promise.all([
          fetchTopGames(),
          fetchNewReleases(),
          fetchUpcoming(),
          fetchByGenre('action'),
          fetchRecommendations()
        ]);

        setTopGames(top);
        setNewReleases(newGames);
        setUpcoming(upcomingGames);
        setActionGames(action);
      } catch (err) {
        setError('Failed to fetch games');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAllData();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const userId = auth.currentUser.uid; // Replace with actual user ID from auth
      const results = await searchGames(searchQuery);
      setSearchResults(results);

      // Save search query in Firebase under the user's history
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        await updateDoc(userRef, {
          searchHistory: arrayUnion(searchQuery.toLowerCase()),
        });
      } else {
        await setDoc(userRef, { searchHistory: [searchQuery.toLowerCase()] });
      }
    } catch (err) {
      setError('Failed to search for games');
    }
  };

  const fetchRecommendations = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const response = await fetch("https://game-recommender-api.onrender.com/recommend", {
        method: "POST",  // <-- Change to POST
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ user_id: userId }), // Send user ID in the body
      });

      if (!response.ok) throw new Error("Failed to fetch recommendations");

      const recommendations = await response.json();
      setRecommendedGames(recommendations);
    } catch (err) {
      console.error("Failed to fetch recommendations", err);
    }
  };




  if (error) {
    return (
      <div className="flex">
        <Sidebar user={user} onLogout={handleLogout} />
        <div className="ml-64 min-h-screen bg-[#1C1C1C] text-[#EAECEE] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Error</h2>
            <p className="text-[#2ECC71]">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex'>
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 bg-[#1C1C1C] p-2 rounded-full border border-[#2ECC71]/50 text-[#2ECC71] hover:bg-[#2ECC71]/20 transition z-50"
      >
        {sidebarOpen ? null : <MoreVertical size={24} />}

      </button>
      <Sidebar user={user} onLogout={handleLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-h-screen bg-[#1C1C1C] text-[#EAECEE]">
        <HeroSection
          topGameImage={topGames[0]?.image}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearch={handleSearch}
        />

        <div className="container mx-auto px-6 pb-12">
          {searchQuery && searchResults.length > 0 && (
            <GameSection title="Search Results" games={searchResults} loading={loading} />
          )}

          <GameSection title="Top Rated Games" games={topGames} loading={loading} />
          <GameSection title="New Releases" games={newReleases} loading={loading} />
          <GameSection title="Upcoming Games" games={upcoming} loading={loading} />
          <GameSection title="Action Games" games={actionGames} loading={loading} />
          <GameSection title="Recommended For You" games={recommendedGames} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default GameList;