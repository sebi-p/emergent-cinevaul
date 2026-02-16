import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  timeout: 30000,
});

// ==================== USERS ====================

export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post('/users', userData);
  return response.data;
};

export const getUser = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/users/${userId}`);
  return response.data;
};

// ==================== WATCHLISTS ====================

export const getWatchlists = async (userId) => {
  const response = await api.get('/watchlists', { params: { user_id: userId } });
  return response.data;
};

export const createWatchlist = async (data) => {
  const response = await api.post('/watchlists', data);
  return response.data;
};

export const getWatchlist = async (watchlistId) => {
  const response = await api.get(`/watchlists/${watchlistId}`);
  return response.data;
};

export const updateWatchlist = async (watchlistId, name) => {
  const response = await api.put(`/watchlists/${watchlistId}`, null, { params: { name } });
  return response.data;
};

export const deleteWatchlist = async (watchlistId) => {
  const response = await api.delete(`/watchlists/${watchlistId}`);
  return response.data;
};

// ==================== WATCHLIST ITEMS ====================

export const addToWatchlist = async (watchlistId, item) => {
  const response = await api.post(`/watchlists/${watchlistId}/items`, item);
  return response.data;
};

export const updateWatchlistItem = async (watchlistId, itemId, data) => {
  const response = await api.put(`/watchlists/${watchlistId}/items/${itemId}`, data);
  return response.data;
};

export const removeFromWatchlist = async (watchlistId, itemId) => {
  const response = await api.delete(`/watchlists/${watchlistId}/items/${itemId}`);
  return response.data;
};

// ==================== TMDB ====================

export const getGenres = async (mediaType = 'movie') => {
  const response = await api.get('/tmdb/genres', { params: { media_type: mediaType } });
  return response.data;
};

export const getTrending = async (mediaType = 'all', timeWindow = 'week', page = 1) => {
  const response = await api.get('/tmdb/trending', { 
    params: { media_type: mediaType, time_window: timeWindow, page } 
  });
  return response.data;
};

export const getNowPlaying = async (page = 1) => {
  const response = await api.get('/tmdb/movie/now-playing', { params: { page } });
  return response.data;
};

export const getUpcoming = async (page = 1) => {
  const response = await api.get('/tmdb/movie/upcoming', { params: { page } });
  return response.data;
};

export const getPopularMovies = async (page = 1) => {
  const response = await api.get('/tmdb/movie/popular', { params: { page } });
  return response.data;
};

export const getTopRatedMovies = async (page = 1) => {
  const response = await api.get('/tmdb/movie/top-rated', { params: { page } });
  return response.data;
};

export const getPopularTV = async (page = 1) => {
  const response = await api.get('/tmdb/tv/popular', { params: { page } });
  return response.data;
};

export const getTopRatedTV = async (page = 1) => {
  const response = await api.get('/tmdb/tv/top-rated', { params: { page } });
  return response.data;
};

export const getOnTheAir = async (page = 1) => {
  const response = await api.get('/tmdb/tv/on-the-air', { params: { page } });
  return response.data;
};

export const searchMulti = async (query, page = 1) => {
  const response = await api.get('/tmdb/search', { params: { query, page } });
  return response.data;
};

export const discover = async (mediaType, filters = {}, page = 1) => {
  const response = await api.get(`/tmdb/discover/${mediaType}`, { 
    params: { page, ...filters } 
  });
  return response.data;
};

export const getMovieDetails = async (movieId) => {
  const response = await api.get(`/tmdb/movie/${movieId}`);
  return response.data;
};

export const getTVDetails = async (tvId) => {
  const response = await api.get(`/tmdb/tv/${tvId}`);
  return response.data;
};

export const getWatchProviders = async (watchRegion = 'US') => {
  const response = await api.get('/tmdb/watch-providers', { params: { watch_region: watchRegion } });
  return response.data;
};

// ==================== OMDB ====================

export const getOMDBRatings = async (imdbId) => {
  if (!imdbId) return null;
  const response = await api.get(`/omdb/${imdbId}`);
  return response.data;
};

// ==================== HEALTH ====================

export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
