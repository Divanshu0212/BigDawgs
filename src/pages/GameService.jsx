import axios from 'axios';

const RAWG_API_KEY = import.meta.env.RAWG_API_KEY;
;
const BASE_URL = 'https://api.rawg.io/api';

export const fetchGameDetails = async (gameId) => {
  try {
    const response = await axios.get(`${BASE_URL}/games/${gameId}`, {
      params: {
        key: RAWG_API_KEY,
      }
    });

    const game = response.data;
    return {
      id: game.id,
      name: game.name,
      description: game.description_raw,
      image: game.background_image,
      backgroundImage: game.background_image_additional,
      rating: game.rating,
      releaseDate: game.released,
      genres: game.genres,
      platforms: game.platforms,
      developers: game.developers,
      publishers: game.publishers,
      esrbRating: game.esrb_rating,
      metacritic: game.metacritic,
      screenshots: game.screenshots,
      website: game.website,
      playtime: game.playtime,
      achievements_count: game.achievements_count
    };
  } catch (error) {
    console.error('Error fetching game details:', error);
    throw error;
  }
};


export const fetchGames = async (params = {}) => {
  try {
    const response = await axios.get(`${BASE_URL}/games`, {
      params: {
        key: RAWG_API_KEY,
        page_size: 40,
        ...params
      }
    });

    return response.data.results.map(game => ({
      id: game.id,
      name: game.name,
      image: game.background_image,
      rating: game.rating,
      releaseDate: game.released,
      genres: game.genres,
      platforms: game.platforms
    }));
  } catch (error) {
    console.error('Error fetching games:', error);
    throw error;
  }
};

export const fetchTopGames = async () => {
  return fetchGames({ ordering: '-rating', page_size: 10 });
};

export const fetchNewReleases = async () => {
  const currentDate = new Date().toISOString().split('T')[0];
  return fetchGames({
    dates: `2024-01-01,${currentDate}`,
    ordering: '-released',
    page_size: 10
  });
};

export const fetchUpcoming = async () => {
  const currentDate = new Date().toISOString().split('T')[0];
  return fetchGames({
    dates: `${currentDate},2025-12-31`,
    ordering: 'released',
    page_size: 10
  });
};

export const fetchByGenre = async (genre) => {
  return fetchGames({ genres: genre, page_size: 10 });
};

export const searchGames = async (query) => {
  try {
    const response = await axios.get(`${BASE_URL}/games`, {
      params: {
        key: RAWG_API_KEY,
        search: query,
        page_size: 20
      }
    });

    return response.data.results.map(game => ({
      id: game.id,
      name: game.name,
      image: game.background_image,
      rating: game.rating,
      releaseDate: game.released,
      genres: game.genres,
      platforms: game.platforms
    }));
  } catch (error) {
    console.error('Error searching for games:', error);
    throw error;
  }
};