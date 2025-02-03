import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Calendar } from 'lucide-react';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc, updateDoc, setDoc, arrayUnion } from 'firebase/firestore';

const handleGameClick = async (gameName) => {
  try {
    const userId = auth.currentUser.uid;
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      await updateDoc(userRef, {
        clickHistory: arrayUnion(gameName.toLowerCase()),
      });
    } else {
      await setDoc(userRef, { clickHistory: [gameName.toLowerCase()] });
    }

    // Optional: Navigate to game details or perform other actions
    // navigate(`/game/${gameName}`);
  } catch (err) {
    console.error('Failed to log game click', err);
  }
};

const GameCard = ({ game }) => (
  <Link onClick={()=>handleGameClick(game.name)} to={`/game/${game.id}`} className="block h-full">
    <div className="relative group overflow-hidden rounded-lg border border-[#2ECC71]/20 bg-[#1C1C1C]">
      <GameImage image={game.image} />
      <GameOverlay game={game} />
    </div>
  </Link>
);

const GameImage = ({ image }) => (
  <div
    className="aspect-video w-full bg-cover bg-center transform transition-transform duration-300 group-hover:scale-110"
    style={{ backgroundImage: `url(${image || '/default-game-image.jpg'})` }}
  />
);

const GameOverlay = ({ game }) => (
  <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C] via-[#1C1C1C]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
    <div className="absolute bottom-0 p-4 w-full">
      <h3 className="text-lg font-bold text-[#EAECEE] mb-2">{game.name}</h3>
      <GameInfo game={game} />
      <GameGenres genres={game.genres} />
    </div>
  </div>
);

const GameInfo = ({ game }) => (
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
);

const GameGenres = ({ genres }) => (
  <div className="mt-2 flex flex-wrap gap-2">
    {genres?.slice(0, 3).map(genre => (
      <span
        key={genre.id}
        className="text-xs bg-[#2ECC71]/10 text-[#2ECC71] rounded-full px-2 py-1 border border-[#2ECC71]/20"
      >
        {genre.name}
      </span>
    ))}
  </div>
);

export default GameCard;