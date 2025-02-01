import React from 'react';
import { Search } from 'lucide-react';

const HeroSection = ({ topGameImage, searchQuery, setSearchQuery, handleSearch }) => (
  <div className="relative h-[70vh] mb-12">
    <HeroBackground image={topGameImage} />
    <HeroContent searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />
  </div>
);

const HeroBackground = ({ image }) => (
  <div
    className="absolute inset-0 bg-cover bg-center"
    style={{
      backgroundImage: `url(${image})`,
      backgroundAttachment: 'fixed'
    }}
  >
    <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C] via-[#1C1C1C]/80" />
  </div>
);

const HeroContent = ({ searchQuery, setSearchQuery, handleSearch }) => (
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
);

export default HeroSection;