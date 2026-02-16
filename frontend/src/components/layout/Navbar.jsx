import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Film, Tv, List, User, LogOut, ChevronDown } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export const Navbar = () => {
  const { currentUser, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isActive = (path) => location.pathname === path;

  if (!currentUser) return null;

  return (
    <nav className="navbar-glass fixed top-0 left-0 right-0 z-50" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 text-xl font-bold text-white"
            data-testid="navbar-logo"
          >
            <Film className="w-6 h-6 text-primary" />
            <span className="font-outfit">CineVault</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/" data-testid="nav-home">
              <Button 
                variant="ghost" 
                className={`text-sm ${isActive('/') ? 'text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Home
              </Button>
            </Link>
            <Link to="/browse?type=movie" data-testid="nav-movies">
              <Button 
                variant="ghost"
                className={`text-sm gap-2 ${isActive('/browse') && location.search.includes('movie') ? 'text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Film className="w-4 h-4" />
                Movies
              </Button>
            </Link>
            <Link to="/browse?type=tv" data-testid="nav-tv">
              <Button 
                variant="ghost"
                className={`text-sm gap-2 ${isActive('/browse') && location.search.includes('tv') ? 'text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Tv className="w-4 h-4" />
                TV Shows
              </Button>
            </Link>
            <Link to="/watchlists" data-testid="nav-watchlists">
              <Button 
                variant="ghost"
                className={`text-sm gap-2 ${isActive('/watchlists') ? 'text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
                My Lists
              </Button>
            </Link>
          </div>

          {/* Search & User */}
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="text"
                  placeholder="Search movies, TV shows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 bg-secondary/50 border-white/10 focus:border-primary/50 text-sm"
                  data-testid="search-input"
                />
              </div>
            </form>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 px-2"
                  data-testid="user-menu-trigger"
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                    style={{ backgroundColor: currentUser.avatar_color }}
                  >
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-sm text-slate-300">{currentUser.name}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card border-white/10">
                <DropdownMenuItem className="text-slate-300" disabled>
                  <User className="w-4 h-4 mr-2" />
                  {currentUser.name}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem 
                  onClick={logout}
                  className="text-slate-300 cursor-pointer"
                  data-testid="logout-btn"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Switch User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="sm:hidden px-4 pb-3">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 bg-secondary/50 border-white/10 text-sm"
              data-testid="search-input-mobile"
            />
          </div>
        </form>
      </div>
    </nav>
  );
};
