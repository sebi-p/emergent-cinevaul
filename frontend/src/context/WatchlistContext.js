import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  getWatchlists, 
  createWatchlist as apiCreateWatchlist,
  deleteWatchlist as apiDeleteWatchlist,
  updateWatchlist as apiUpdateWatchlist,
  addToWatchlist as apiAddToWatchlist,
  removeFromWatchlist as apiRemoveFromWatchlist,
  updateWatchlistItem as apiUpdateWatchlistItem
} from '../lib/api';
import { useUser } from './UserContext';

const WatchlistContext = createContext(null);

export const WatchlistProvider = ({ children }) => {
  const { currentUser } = useUser();
  const [watchlists, setWatchlists] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWatchlists = useCallback(async () => {
    if (!currentUser) {
      setWatchlists([]);
      return;
    }
    
    setLoading(true);
    try {
      const data = await getWatchlists(currentUser.id);
      setWatchlists(data);
    } catch (error) {
      console.error('Failed to fetch watchlists:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchWatchlists();
  }, [fetchWatchlists]);

  const createWatchlist = async (name) => {
    if (!currentUser) return null;
    const newWatchlist = await apiCreateWatchlist({ user_id: currentUser.id, name });
    setWatchlists(prev => [...prev, newWatchlist]);
    return newWatchlist;
  };

  const deleteWatchlist = async (watchlistId) => {
    await apiDeleteWatchlist(watchlistId);
    setWatchlists(prev => prev.filter(w => w.id !== watchlistId));
  };

  const updateWatchlist = async (watchlistId, name) => {
    await apiUpdateWatchlist(watchlistId, name);
    setWatchlists(prev => prev.map(w => 
      w.id === watchlistId ? { ...w, name } : w
    ));
  };

  const addItem = async (watchlistId, item) => {
    const newItem = await apiAddToWatchlist(watchlistId, item);
    setWatchlists(prev => prev.map(w => 
      w.id === watchlistId ? { ...w, items: [...w.items, newItem] } : w
    ));
    return newItem;
  };

  const removeItem = async (watchlistId, itemId) => {
    await apiRemoveFromWatchlist(watchlistId, itemId);
    setWatchlists(prev => prev.map(w => 
      w.id === watchlistId ? { ...w, items: w.items.filter(i => i.id !== itemId) } : w
    ));
  };

  const updateItemStatus = async (watchlistId, itemId, status) => {
    await apiUpdateWatchlistItem(watchlistId, itemId, { status });
    setWatchlists(prev => prev.map(w => 
      w.id === watchlistId 
        ? { ...w, items: w.items.map(i => i.id === itemId ? { ...i, status } : i) }
        : w
    ));
  };

  // Check if an item exists in any watchlist
  const findItemInWatchlists = (tmdbId, mediaType) => {
    for (const watchlist of watchlists) {
      const item = watchlist.items.find(i => 
        i.tmdb_id === tmdbId && i.media_type === mediaType
      );
      if (item) {
        return { watchlist, item };
      }
    }
    return null;
  };

  return (
    <WatchlistContext.Provider value={{
      watchlists,
      loading,
      createWatchlist,
      deleteWatchlist,
      updateWatchlist,
      addItem,
      removeItem,
      updateItemStatus,
      findItemInWatchlists,
      refreshWatchlists: fetchWatchlists,
    }}>
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};
