import React from 'react';
import { ChevronRight } from 'lucide-react';
import GameCard from './GameCard'; // Import the GameCard component

const GameSection = ({ title, games, loading }) => (
  <div className="mb-12">
    <SectionHeader title={title} />
    <GameGrid games={games} loading={loading} />
  </div>
);

const SectionHeader = ({ title }) => (
  <div className="flex justify-between items-center mb-6">
    <h2 className="text-2xl font-bold text-[#EAECEE] border-l-4 border-[#2ECC71] pl-4">{title}</h2>
    <button className="text-[#2ECC71] hover:text-[#01FF70] flex items-center gap-1 transition-colors">
      View All <ChevronRight className="w-4 h-4" />
    </button>
  </div>
);

const GameGrid = ({ games, loading }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    {loading ? (
      <LoadingPlaceholders />
    ) : (
      games?.map(game => <GameCard key={game.id} game={game} />)
    )}
  </div>
);

const LoadingPlaceholders = () => (
  <>
    {[...Array(4)].map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="aspect-video bg-[#3D9970]/20 rounded-lg mb-2" />
        <div className="h-4 bg-[#3D9970]/20 rounded w-3/4" />
      </div>
    ))}
  </>
);

export default GameSection;