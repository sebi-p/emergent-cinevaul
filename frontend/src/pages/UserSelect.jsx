import React, { useState } from 'react';
import { Plus, Trash2, Loader2, Film } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { AVATAR_COLORS } from '../lib/utils';

export const UserSelect = () => {
  const { users, loading, selectUser, createUser, removeUser } = useUser();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleCreateUser = async () => {
    if (!newUserName.trim()) return;
    
    setCreating(true);
    try {
      const user = await createUser({
        name: newUserName.trim(),
        avatar_color: selectedColor
      });
      selectUser(user);
      setShowCreateDialog(false);
      setNewUserName('');
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await removeUser(userId);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-background flex flex-col items-center justify-center p-8"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)`
      }}
      data-testid="user-select-page"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 mb-12 animate-fade-in">
        <Film className="w-12 h-12 text-primary" />
        <h1 className="text-5xl font-bold text-white font-outfit">CineVault</h1>
      </div>

      {/* Title */}
      <h2 className="text-2xl text-slate-300 mb-12 animate-fade-in stagger-1">
        Who's watching?
      </h2>

      {/* User Grid */}
      <div className="flex flex-wrap justify-center gap-8 mb-12 max-w-4xl">
        {users.map((user, index) => (
          <div 
            key={user.id}
            className={`relative group animate-fade-in stagger-${Math.min(index + 2, 5)}`}
          >
            <button
              onClick={() => selectUser(user)}
              className="flex flex-col items-center gap-4 focus:outline-none"
              data-testid={`user-card-${user.id}`}
            >
              <div 
                className="user-avatar shadow-xl"
                style={{ backgroundColor: user.avatar_color }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-slate-300 text-lg group-hover:text-white transition-colors duration-200">
                {user.name}
              </span>
            </button>
            
            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirm(user.id);
              }}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              data-testid={`delete-user-${user.id}`}
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          </div>
        ))}

        {/* Add User Button */}
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex flex-col items-center gap-4 group animate-fade-in"
          data-testid="add-user-btn"
        >
          <div className="user-avatar bg-slate-800 border-2 border-dashed border-slate-600 group-hover:border-primary transition-colors duration-200">
            <Plus className="w-12 h-12 text-slate-500 group-hover:text-primary transition-colors duration-200" />
          </div>
          <span className="text-slate-500 text-lg group-hover:text-primary transition-colors duration-200">
            Add Profile
          </span>
        </button>
      </div>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Create New Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Name</label>
              <Input
                placeholder="Enter your name..."
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="bg-secondary/50 border-white/10"
                data-testid="new-user-name-input"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-3 block">Choose Avatar Color</label>
              <div className="flex flex-wrap gap-3">
                {AVATAR_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded-lg transition-transform duration-200 ${selectedColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-background scale-110' : ''}`}
                    style={{ backgroundColor: color }}
                    data-testid={`color-${color}`}
                  />
                ))}
              </div>
            </div>
            {/* Preview */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30">
              <div 
                className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white"
                style={{ backgroundColor: selectedColor }}
              >
                {newUserName ? newUserName.charAt(0).toUpperCase() : '?'}
              </div>
              <span className="text-lg text-slate-300">
                {newUserName || 'Preview'}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateUser} 
              disabled={!newUserName.trim() || creating}
              data-testid="create-user-submit"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-card border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Profile?</DialogTitle>
          </DialogHeader>
          <p className="text-slate-400 py-4">
            This will permanently delete this profile and all associated watchlists.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => handleDeleteUser(deleteConfirm)}
              data-testid="confirm-delete-user"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
