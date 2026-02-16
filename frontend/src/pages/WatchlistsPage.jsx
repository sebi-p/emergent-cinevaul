import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Trash2, Edit2, MoreVertical, List, Grid, 
  Film, Tv, Loader2, Check, X 
} from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';
import { useUser } from '../context/UserContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import { STATUS_OPTIONS, getStatusLabel, getStatusClass } from '../lib/utils';

export const WatchlistsPage = () => {
  const { currentUser } = useUser();
  const { 
    watchlists, 
    loading, 
    createWatchlist, 
    deleteWatchlist, 
    updateWatchlist,
    removeItem,
    updateItemStatus 
  } = useWatchlist();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingList, setEditingList] = useState(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedList, setSelectedList] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [statusFilter, setStatusFilter] = useState('all');
  const [creating, setCreating] = useState(false);

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    
    setCreating(true);
    try {
      await createWatchlist(newListName.trim());
      setShowCreateDialog(false);
      setNewListName('');
      toast.success('Watchlist created!');
    } catch (error) {
      toast.error('Failed to create watchlist');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateList = async () => {
    if (!editName.trim() || !editingList) return;
    
    try {
      await updateWatchlist(editingList.id, editName.trim());
      setEditingList(null);
      setEditName('');
      toast.success('Watchlist updated!');
    } catch (error) {
      toast.error('Failed to update watchlist');
    }
  };

  const handleDeleteList = async () => {
    if (!deleteConfirm) return;
    
    try {
      await deleteWatchlist(deleteConfirm);
      setDeleteConfirm(null);
      if (selectedList?.id === deleteConfirm) {
        setSelectedList(null);
      }
      toast.success('Watchlist deleted!');
    } catch (error) {
      toast.error('Failed to delete watchlist');
    }
  };

  const handleRemoveItem = async (watchlistId, itemId) => {
    try {
      await removeItem(watchlistId, itemId);
      toast.success('Removed from watchlist');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleStatusChange = async (watchlistId, itemId, newStatus) => {
    try {
      await updateItemStatus(watchlistId, itemId, newStatus);
      toast.success(`Status updated to ${getStatusLabel(newStatus)}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Filter items by status
  const getFilteredItems = (items) => {
    if (statusFilter === 'all') return items;
    return items.filter(item => item.status === statusFilter);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20" data-testid="watchlists-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">My Watchlists</h1>
            <p className="text-slate-400 mt-1">
              {watchlists.length} {watchlists.length === 1 ? 'list' : 'lists'} • {' '}
              {watchlists.reduce((sum, w) => sum + w.items.length, 0)} total items
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="gap-2"
            data-testid="create-watchlist-btn"
          >
            <Plus className="w-4 h-4" />
            New Watchlist
          </Button>
        </div>

        {watchlists.length === 0 ? (
          // Empty State
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-secondary/30 flex items-center justify-center">
              <List className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No watchlists yet</h3>
            <p className="text-slate-400 max-w-md mx-auto mb-6">
              Create your first watchlist to start organizing movies and TV shows you want to watch.
            </p>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Watchlist
            </Button>
          </div>
        ) : (
          <div className="flex gap-8">
            {/* Watchlist Sidebar */}
            <aside className="w-72 flex-shrink-0 hidden lg:block">
              <div className="glass rounded-xl p-4 sticky top-24">
                <h2 className="text-sm font-medium text-slate-400 mb-4 px-2">Your Lists</h2>
                <div className="space-y-1">
                  {watchlists.map(list => (
                    <button
                      key={list.id}
                      onClick={() => setSelectedList(list)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors duration-200 ${
                        selectedList?.id === list.id 
                          ? 'bg-primary/20 text-white' 
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                      data-testid={`watchlist-item-${list.id}`}
                    >
                      <span className="truncate">{list.name}</span>
                      <Badge variant="secondary" className="ml-2 bg-white/10">
                        {list.items.length}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              {/* Mobile List Selector */}
              <div className="lg:hidden mb-6">
                <Select 
                  value={selectedList?.id || ''} 
                  onValueChange={(value) => setSelectedList(watchlists.find(w => w.id === value))}
                >
                  <SelectTrigger className="bg-secondary/50 border-white/10">
                    <SelectValue placeholder="Select a watchlist" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10">
                    {watchlists.map(list => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name} ({list.items.length})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedList ? (
                <>
                  {/* List Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-semibold text-white">{selectedList.name}</h2>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-card border-white/10">
                          <DropdownMenuItem 
                            onClick={() => {
                              setEditingList(selectedList);
                              setEditName(selectedList.name);
                            }}
                            className="cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeleteConfirm(selectedList.id)}
                            className="cursor-pointer text-red-400"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* View Controls */}
                    <div className="flex items-center gap-3">
                      {/* Status Filter */}
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40 bg-secondary/50 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-white/10">
                          <SelectItem value="all">All Status</SelectItem>
                          {STATUS_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* View Mode Toggle */}
                      <div className="flex items-center bg-secondary/30 p-1 rounded-lg">
                        <Button
                          variant={viewMode === 'grid' ? 'default' : 'ghost'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setViewMode('grid')}
                        >
                          <Grid className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={viewMode === 'list' ? 'default' : 'ghost'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setViewMode('list')}
                        >
                          <List className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  {getFilteredItems(selectedList.items).length === 0 ? (
                    <div className="text-center py-12 glass rounded-xl">
                      <p className="text-slate-400">
                        {statusFilter !== 'all' 
                          ? `No items with status "${getStatusLabel(statusFilter)}"`
                          : 'This watchlist is empty. Start adding movies and TV shows!'}
                      </p>
                    </div>
                  ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {getFilteredItems(selectedList.items).map(item => (
                        <div 
                          key={item.id}
                          className="group relative"
                          data-testid={`watchlist-item-card-${item.id}`}
                        >
                          <Link to={`/${item.media_type}/${item.tmdb_id}`}>
                            <div className="movie-card relative aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-card">
                              {item.poster_path ? (
                                <img 
                                  src={item.poster_path} 
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="poster-placeholder w-full h-full">
                                  {item.media_type === 'movie' ? (
                                    <Film className="w-10 h-10 text-slate-600" />
                                  ) : (
                                    <Tv className="w-10 h-10 text-slate-600" />
                                  )}
                                </div>
                              )}
                              
                              {/* Status Badge */}
                              <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${getStatusClass(item.status)}`}>
                                {getStatusLabel(item.status)}
                              </div>
                            </div>
                          </Link>
                          
                          {/* Hover Actions */}
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-b-xl">
                            <p className="text-white text-sm font-medium truncate mb-2">{item.title}</p>
                            <div className="flex gap-1">
                              <Select 
                                value={item.status} 
                                onValueChange={(value) => handleStatusChange(selectedList.id, item.id, value)}
                              >
                                <SelectTrigger className="h-7 text-xs bg-white/10 border-0 flex-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-white/10">
                                  {STATUS_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleRemoveItem(selectedList.id, item.id);
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getFilteredItems(selectedList.items).map(item => (
                        <div 
                          key={item.id}
                          className="glass rounded-xl p-4 flex items-center gap-4 group"
                          data-testid={`watchlist-item-row-${item.id}`}
                        >
                          <Link to={`/${item.media_type}/${item.tmdb_id}`} className="flex-shrink-0">
                            {item.poster_path ? (
                              <img 
                                src={item.poster_path} 
                                alt={item.title}
                                className="w-16 h-24 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-16 h-24 rounded-lg bg-secondary/50 flex items-center justify-center">
                                {item.media_type === 'movie' ? (
                                  <Film className="w-6 h-6 text-slate-600" />
                                ) : (
                                  <Tv className="w-6 h-6 text-slate-600" />
                                )}
                              </div>
                            )}
                          </Link>
                          
                          <div className="flex-1 min-w-0">
                            <Link to={`/${item.media_type}/${item.tmdb_id}`}>
                              <h3 className="text-white font-medium hover:text-primary transition-colors duration-200">
                                {item.title}
                              </h3>
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="border-white/20 text-slate-400 text-xs">
                                {item.media_type === 'movie' ? 'Movie' : 'TV'}
                              </Badge>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusClass(item.status)}`}>
                                {getStatusLabel(item.status)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Select 
                              value={item.status} 
                              onValueChange={(value) => handleStatusChange(selectedList.id, item.id, value)}
                            >
                              <SelectTrigger className="w-36 bg-secondary/50 border-white/10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-card border-white/10">
                                {STATUS_OPTIONS.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-400 hover:text-red-400"
                              onClick={() => handleRemoveItem(selectedList.id, item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 glass rounded-xl">
                  <List className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">Select a watchlist to view its contents</p>
                </div>
              )}
            </main>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
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
              data-testid="new-watchlist-name-input"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateList} disabled={!newListName.trim() || creating}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingList} onOpenChange={() => setEditingList(null)}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader>
            <DialogTitle>Rename Watchlist</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter new name..."
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="bg-secondary/50 border-white/10"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingList(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateList} disabled={!editName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader>
            <DialogTitle>Delete Watchlist?</DialogTitle>
          </DialogHeader>
          <p className="text-slate-400 py-4">
            This will permanently delete this watchlist and all its items. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteList}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
