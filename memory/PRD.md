# CineVault - Movie & TV Tracker PRD

## Original Problem Statement
Build an app to keep track of recently released movies and TV series with watchlist organization. Key features: streaming availability filters, genre, release date, IMDb/Rotten Tomatoes scores, popularity filters.

## User Choices
- Data Sources: TMDB + OMDB APIs (both)
- Authentication: No password auth, multi-user with simple switching
- Watchlists: Multiple custom watchlists + status tracking (Plan to Watch, Watching, Watched)
- Design: No preference (dark theme implemented)
- API Keys: Free tier with config for future paid keys

## Architecture

### Backend (FastAPI + MongoDB)
- **Port**: 8001 (internal)
- **Database**: MongoDB with collections for users, watchlists
- **API Prefix**: /api

### Frontend (React + Tailwind + Shadcn)
- **Port**: 3000
- **UI Framework**: Shadcn/UI components with dark theme

### Key Files
- `/app/backend/server.py` - Main FastAPI server
- `/app/frontend/src/App.js` - React app entry
- `/app/frontend/src/pages/` - Page components
- `/app/frontend/src/context/` - User and Watchlist context providers

## User Personas
1. **Casual Viewer**: Wants to track movies/shows to watch later
2. **Binge Watcher**: Needs status tracking for series progress
3. **Multi-household User**: Family members with separate profiles

## Core Requirements (Static)
1. Multi-user support without authentication
2. Custom watchlist management (CRUD)
3. Status tracking (Plan to Watch, Watching, Watched)
4. Movie/TV discovery with filters
5. TMDB + OMDB integration for data

## What's Been Implemented (Feb 2026)
- [x] User management (create, select, delete profiles)
- [x] Netflix-style user selection screen
- [x] Watchlist CRUD operations
- [x] Status tracking for watchlist items
- [x] Home page with trending/popular sections
- [x] Browse page with filters (genre, year, rating, sort)
- [x] Detail page with movie/TV info, cast, streaming providers
- [x] Search functionality
- [x] Dark theme UI with glassmorphism effects
- [x] API endpoints for TMDB integration (configured but needs API key)
- [x] OMDB endpoint for IMDb/RT ratings (configured but needs API key)

## Prioritized Backlog

### P0 (Critical)
- [x] User management
- [x] Watchlist management  
- [x] Navigation and routing
- [x] Basic UI structure

### P1 (Important)
- [ ] Configure TMDB API key to enable movie data
- [ ] Configure OMDB API key to enable IMDb/RT ratings
- [ ] Add streaming provider filter in browse page

### P2 (Nice to Have)
- [ ] Drag-and-drop reordering in watchlists
- [ ] Export watchlists to CSV/JSON
- [ ] Watch history statistics
- [ ] Recommendations based on watch history
- [ ] Calendar view for upcoming releases

## API Endpoints

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `DELETE /api/users/{id}` - Delete user

### Watchlists
- `GET /api/watchlists?user_id=` - Get user's watchlists
- `POST /api/watchlists` - Create watchlist
- `PUT /api/watchlists/{id}` - Update watchlist name
- `DELETE /api/watchlists/{id}` - Delete watchlist
- `POST /api/watchlists/{id}/items` - Add item
- `PUT /api/watchlists/{id}/items/{item_id}` - Update item status
- `DELETE /api/watchlists/{id}/items/{item_id}` - Remove item

### TMDB
- `GET /api/tmdb/trending` - Trending content
- `GET /api/tmdb/discover/{type}` - Discover with filters
- `GET /api/tmdb/search` - Search multi
- `GET /api/tmdb/movie/{id}` - Movie details
- `GET /api/tmdb/tv/{id}` - TV details
- `GET /api/tmdb/genres` - Genre list

### OMDB
- `GET /api/omdb/{imdb_id}` - Get ratings

## Environment Variables Required
```
# Backend (.env)
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
TMDB_API_KEY=<your_key>  # Get from themoviedb.org
OMDB_API_KEY=<your_key>  # Get from omdbapi.com
```

## Next Tasks
1. Get TMDB API key from https://www.themoviedb.org/settings/api
2. Get OMDB API key from https://www.omdbapi.com/
3. Add keys to `/app/backend/.env`
4. Restart backend: `sudo supervisorctl restart backend`
5. Test movie data fetching
