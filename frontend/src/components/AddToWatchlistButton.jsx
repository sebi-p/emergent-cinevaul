import React, { useState } from 'react';
import { Plus, Check, ChevronDown, Loader2 } from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';
import { useUser } from '../context/UserContext';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { STATUS_OPTIONS, getStatusLabel } from '../lib/utils';

export const AddToWatchlistButton = ({ media, variant = 'default', className = '' }) => {
  const { currentUser } = useUser();
  const { watchlists, addItem, removeItem, createWatchlist, findItemInWatchlists } = useWatchlist();
  const [loading, setLoading] = useState(false);
  const [showNewListDialog, setShowNewListDialog] = useState(false);
  const [newListName, setNewListName] = useState('');

  const existingEntry = findItemInWatchlists(media.id, media.media_type);

  const handleAddToWatchlist = async (watchlistId, status = 'plan_to_watch') => {
    if (!currentUser) {
      toast.error('Please select a user first');
      return;
    }

    setLoading(true);
    try {
      await addItem(watchlistId, {
        tmdb_id: media.id,
        media_type: media.media_type,
        title: media.title,
        poster_path: media.poster_path,
        status
      });
      toast.success(`Added "${media.title}" to watchlist`);
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('Item already in this watchlist');
      } else {
        toast.error('Failed to add to watchlist');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!existingEntry) return;
    
    setLoading(true);
    try {
      await removeItem(existingEntry.watchlist.id, existingEntry.item.id);
      toast.success(`Removed "${media.title}" from watchlist`);
    } catch (error) {
      toast.error('Failed to remove from watchlist');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    
    setLoading(true);
    try {
      const newList = await createWatchlist(newListName.trim());
      await handleAddToWatchlist(newList.id);
      setShowNewListDialog(false);
      setNewListName('');
    } catch (error) {
      toast.error('Failed to create watchlist');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  // Already in a watchlist
  if (existingEntry) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="secondary"
            className={`gap-2 ${className}`}
            data-testid="watchlist-btn-added"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4 text-emerald-400" />
            )}
            In {existingEntry.watchlist.name}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-card border-white/10">
          <div className="px-2 py-1.5 text-sm text-slate-400">
            Status: {getStatusLabel(existingEntry.item.status)}
          </div>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem 
            onClick={handleRemove}
            className="text-red-400 cursor-pointer"
          >
            Remove from list
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Not in any watchlist
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={variant}
            className={`gap-2 ${className}`}
            disabled={loading}
            data-testid="watchlist-btn-add"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add to Watchlist
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-card border-white/10">
          {watchlists.length > 0 ? (
            <>
              {watchlists.map(list => (
                <DropdownMenuItem 
                  key={list.id}
                  onClick={() => handleAddToWatchlist(list.id)}
                  className="cursor-pointer"
                >
                  {list.name}
                  <span className="ml-auto text-xs text-slate-500">
                    {list.items.length} items
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-white/10" />
            </>
          ) : (
            <div className="px-2 py-3 text-sm text-slate-400 text-center">
              No watchlists yet
            </div>
          )}
          <DropdownMenuItem 
            onClick={() => setShowNewListDialog(true)}
            className="cursor-pointer text-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New List
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showNewListDialog} onOpenChange={setShowNewListDialog}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader>
            <DialogTitle>Create New Watchlist</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter watchlist name..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="bg-secondary/50 border-white/10"
              data-testid="new-watchlist-input"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewListDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateList} disabled={!newListName.trim() || loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create & Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
