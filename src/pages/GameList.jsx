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



const Sidebar = ({ user, onLogout, isOpen, onClose }) => (
  <div
    className={`fixed top-0 left-0 z-10 h-screen w-64 bg-[#1C1C1C] border-r border-[#2ECC71]/20 transition-transform transform ${isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
  >
    <div className="p-6 relative">
      <button
        onClick={onClose}
        className="absolute right-4 top-4 text-[#2ECC71] hover:text-[#01FF70] transition"
      >
        <X size={24} />
      </button>

      <h2 className="text-2xl font-bold text-[#2ECC71] mb-8">Big Dawgs</h2>

      {user ? (
        <div className="space-y-6">
          <div className="space-y-3">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-12 h-12 rounded-full border-2 border-[#2ECC71]"
              />
            )}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#2ECC71]/10">
              <User className="w-6 h-6 text-[#2ECC71]" />
              <div className="flex flex-col">
                <span className="text-[#EAECEE] font-medium">
                  {user.displayName || 'User'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-[#2ECC71]/10 text-[#EAECEE] transition-colors"
          >
            <LogOut className="w-6 h-6 text-[#2ECC71]" />
            <span>Logout</span>
          </button>
        </div>
      ) : (
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
      )}
    </div>
  </div>
);



const GameCard = ({ game }) => (
  <Link to={`/game/${game.id}`} className="block h-full">
    <div className="relative group overflow-hidden rounded-lg border border-[#2ECC71]/20 bg-[#1C1C1C]">
      <div
        className="aspect-video w-full bg-cover bg-center transform transition-transform duration-300 group-hover:scale-110"
        style={{ backgroundImage: `url(${game.image || '/default-game-image.jpg'})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C] via-[#1C1C1C]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 p-4 w-full">
          <h3 className="text-lg font-bold text-[#EAECEE] mb-2">{game.name}</h3>
          <div className="flex items-center gap-2 text-sm text-[#EAECEE]/80">
            <Star className="w-4 h-4 text-[#2ECC71]" />
            <span>{game.rating?.toFixed(1)}</span>
            {game.releaseDate && (
              <>
                <span className="mx-2 text-[#2ECC71]">•</span>
                <Calendar className="w-4 h-4 text-[#2ECC71]" />
                <span>{new Date(game.releaseDate).getFullYear()}</span>
              </>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {game.genres?.slice(0, 3).map(genre => (
              <span key={genre.id} className="text-xs bg-[#2ECC71]/10 text-[#2ECC71] rounded-full px-2 py-1 border border-[#2ECC71]/20">
                {genre.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  </Link>
);

const GameSection = ({ title, games, loading }) => (
  <div className="mb-12">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold text-[#EAECEE] border-l-4 border-[#2ECC71] pl-4">{title}</h2>
      <button className="text-[#2ECC71] hover:text-[#01FF70] flex items-center gap-1 transition-colors">
        View All <ChevronRight className="w-4 h-4" />
      </button>
    </div>
    {loading ? (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-video bg-[#3D9970]/20 rounded-lg mb-2" />
            <div className="h-4 bg-[#3D9970]/20 rounded w-3/4" />
          </div>
        ))}
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {games?.map(game => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    )}
  </div>
);

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

      const response = await fetch("http://127.0.0.1:5000/recommend", {
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
        <div className="relative h-[70vh] mb-12">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${topGames[0]?.image})`,
              backgroundAttachment: 'fixed'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C] via-[#1C1C1C]/80" />
          </div>
          <div className="relative h-full container mx-auto px-6 flex flex-col justify-center">
            <h1 className="text-5xl font-bold text-[#EAECEE] mb-6">
              Discover Your Next
              <span className="text-[#2ECC71] ml-2 relative">
                Gaming Adventure
                <span className="absolute -inset-1 animate-pulse bg-[#2ECC71]/20 blur-lg"></span>
              </span>
            </h1>
            <form onSubmit={handleSearch} className="max-w-2xl">
              <div className="relative">
                <input
                  type="text"
                  className="w-full bg-[#1C1C1C]/80 text-[#EAECEE] placeholder-[#EAECEE]/30 border border-[#2ECC71]/20 backdrop-blur-lg px-6 py-4 rounded-full focus:outline-none focus:border-[#2ECC71] focus:ring-1 focus:ring-[#2ECC71]/50 transition-all"
                  placeholder="Search for games..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#2ECC71] p-3 rounded-full hover:bg-[#01FF70] transition-colors group"
                >
                  <Search className="w-5 h-5 text-[#1C1C1C]" />
                </button>
              </div>
            </form>
          </div>
        </div>

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