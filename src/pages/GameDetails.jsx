import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchGameDetails } from './GameService';
import { Star, Calendar, Globe, Clock, Trophy, ChevronLeft } from 'lucide-react';
import GameDiscussion from '../Components/GameDiscussion';

const GameDetails = () => {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadGameDetails = async () => {
      try {
        setLoading(true);
        const data = await fetchGameDetails(id);
        setGame(data);
      } catch (err) {
        setError('Failed to load game details');
      } finally {
        setLoading(false);
      }
    };

    loadGameDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1C1C] text-[#EAECEE] flex items-center justify-center">
        <div className="animate-pulse text-[#2ECC71]">Loading...</div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-[#1C1C1C] text-[#EAECEE] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#2ECC71]">{error || 'Game not found'}</p>
          <Link to="/" className="mt-4 inline-block text-[#2ECC71] hover:text-[#01FF70]">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1C1C1C] pb-8">
      {/* Hero Section */}
      <div className="relative h-[50vh] lg:h-[70vh]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${game.backgroundImage || game.image})`,
            backgroundAttachment: 'fixed'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C] via-[#1C1C1C]/80" />
        </div>
        <Link
          to="/home"
          className="absolute top-6 left-6 text-[#2ECC71] hover:text-[#01FF70] flex items-center gap-2 z-10"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Games
        </Link>
      </div>

      <div className="container mx-auto px-4 lg:px-6 -mt-32 relative z-10">
        {/* Game Title Section */}
        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          <div className="lg:w-1/3">
            <img
              src={game.image}
              alt={game.name}
              className="w-full h-auto rounded-lg border border-[#2ECC71]/20"
            />
          </div>
          <div className="lg:w-2/3">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#EAECEE] mb-4">
              {game.name}
            </h1>
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2 text-[#2ECC71]">
                <Star className="w-5 h-5" />
                <span>{game.rating?.toFixed(1)}</span>
              </div>
              {game.releaseDate && (
                <div className="flex items-center gap-2 text-[#2ECC71]">
                  <Calendar className="w-5 h-5" />
                  <span>{new Date(game.releaseDate).getFullYear()}</span>
                </div>
              )}
              {game.metacritic && (
                <div className="px-2 py-1 bg-[#2ECC71]/10 rounded-full border border-[#2ECC71]/20">
                  <span className="text-[#2ECC71]">Metacritic: {game.metacritic}</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {game.genres?.map(genre => (
                <span
                  key={genre.id}
                  className="px-3 py-1 bg-[#2ECC71]/10 text-[#2ECC71] rounded-full border border-[#2ECC71]/20"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Game Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-[#EAECEE] mb-4 border-l-4 border-[#2ECC71] pl-4">
              About
            </h2>
            <p className="text-[#EAECEE]/90 leading-relaxed whitespace-pre-line">
              {game.description}
            </p>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-[#EAECEE] mb-3">Details</h3>
              <div className="space-y-4">
                {game.platforms && (
                  <div>
                    <h4 className="text-[#2ECC71] font-medium mb-2">Platforms</h4>
                    <div className="flex flex-wrap gap-2">
                      {game.platforms.map(platform => (
                        <span
                          key={platform.platform.id}
                          className="text-sm text-[#EAECEE]/70"
                        >
                          {platform.platform.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {game.developers && (
                  <div>
                    <h4 className="text-[#2ECC71] font-medium mb-2">Developers</h4>
                    <div className="text-[#EAECEE]/70">
                      {game.developers.map(dev => dev.name).join(', ')}
                    </div>
                  </div>
                )}
                {game.publishers && (
                  <div>
                    <h4 className="text-[#2ECC71] font-medium mb-2">Publishers</h4>
                    <div className="text-[#EAECEE]/70">
                      {game.publishers.map(pub => pub.name).join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {game.website && (
              <a
                href={game.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#2ECC71] hover:text-[#01FF70]"
              >
                <Globe className="w-5 h-5" />
                Official Website
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 lg:px-6 mt-12">
        <h2 className="text-2xl font-bold text-[#EAECEE] mb-6 border-l-4 border-[#2ECC71] pl-4">
          Discussion
        </h2>
        <GameDiscussion gameId={id} />
      </div>
    </div>
  );
};

export default GameDetails;