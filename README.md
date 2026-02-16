# CineVault - Movie & TV Tracker

A full-stack application to track movies and TV series with watchlists and advanced filtering.

## Features

- 🎬 Browse trending, popular, and upcoming movies/TV shows
- 🔍 Search with filters (genre, year, rating, language, streaming provider)
- 📋 Create multiple custom watchlists
- ✅ Track status: Plan to Watch, Watching, Watched
- 👥 Multi-user support (Netflix-style profile switching)
- ⭐ View IMDb & Rotten Tomatoes ratings

## Prerequisites

- Docker & Docker Compose (recommended)
- OR Node.js 18+ and Python 3.11+ for native setup
- TMDB API key (free): https://www.themoviedb.org/settings/api
- OMDB API key (free): https://www.omdbapi.com/

## Quick Start with Docker

1. **Create environment file:**
   ```bash
   echo "TMDB_API_KEY=your_tmdb_key_here" > .env
   echo "OMDB_API_KEY=your_omdb_key_here" >> .env
   ```

2. **Start the application:**
   ```bash
   docker-compose up --build
   ```

3. **Access the app:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8001
   - API Docs: http://localhost:8001/docs

## Native Setup (without Docker)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # macOS/Linux
# OR: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo 'MONGO_URL=mongodb://localhost:27017' > .env
echo 'DB_NAME=cinevault' >> .env
echo 'TMDB_API_KEY=your_key' >> .env
echo 'OMDB_API_KEY=your_key' >> .env

# Start backend
uvicorn server:app --reload --port 8001
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install

# Create .env file
echo 'REACT_APP_BACKEND_URL=http://localhost:8001' > .env

# Start frontend
yarn start
```

### MongoDB Setup

Install MongoDB locally or use Docker:
```bash
docker run -d -p 27017:27017 --name mongodb mongo:6
```

## Project Structure

```
cinevault/
├── backend/
│   ├── server.py          # FastAPI application
│   ├── requirements.txt   # Python dependencies
│   ├── Dockerfile
│   └── .env              # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── context/      # React context providers
│   │   └── lib/          # API and utilities
│   ├── package.json
│   ├── Dockerfile
│   └── .env
├── docker-compose.yml
└── README.md
```

## API Endpoints

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `DELETE /api/users/{id}` - Delete user

### Watchlists
- `GET /api/watchlists?user_id=` - Get user's watchlists
- `POST /api/watchlists` - Create watchlist
- `POST /api/watchlists/{id}/items` - Add item to watchlist

### TMDB
- `GET /api/tmdb/trending` - Trending content
- `GET /api/tmdb/discover/{type}` - Discover with filters
- `GET /api/tmdb/search?query=` - Search
- `GET /api/tmdb/movie/{id}` - Movie details
- `GET /api/tmdb/tv/{id}` - TV details

## Tech Stack

- **Frontend:** React, Tailwind CSS, Shadcn/UI
- **Backend:** FastAPI, Python
- **Database:** MongoDB
- **APIs:** TMDB, OMDB

## License

MIT
