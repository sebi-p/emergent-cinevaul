from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import httpx
import json
import time

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# API Keys (configurable for future use)
TMDB_API_KEY = os.environ.get('TMDB_API_KEY', '')
OMDB_API_KEY = os.environ.get('OMDB_API_KEY', '')

# Cache settings
CACHE_TTL_DEFAULT = 60 * 60  # 1 hour
CACHE_TTL_CONFIG = 24 * 60 * 60  # 24 hours
cache: Dict[str, Dict] = {}

# TMDB Configuration
IMAGE_BASE = "https://image.tmdb.org/t/p/"

# Create the main app
app = FastAPI(title="CineVault API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    name: str
    avatar_color: str = "#6366f1"

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    avatar_color: str = "#6366f1"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class WatchlistItemCreate(BaseModel):
    tmdb_id: int
    media_type: str  # "movie" or "tv"
    title: str
    poster_path: Optional[str] = None
    status: str = "plan_to_watch"  # plan_to_watch, watching, watched

class WatchlistItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tmdb_id: int
    media_type: str
    title: str
    poster_path: Optional[str] = None
    status: str = "plan_to_watch"
    added_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class WatchlistCreate(BaseModel):
    user_id: str
    name: str

class Watchlist(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    items: List[WatchlistItem] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class WatchlistItemUpdate(BaseModel):
    status: Optional[str] = None
    watchlist_id: Optional[str] = None

# ==================== TMDB API HELPERS ====================

async def tmdb_request(endpoint: str, params: Optional[Dict] = None, ttl: int = CACHE_TTL_DEFAULT) -> Optional[Dict]:
    """Make a request to TMDB API with caching"""
    if not TMDB_API_KEY:
        logger.warning("TMDB_API_KEY not configured, using demo mode")
        return None
    
    params = params or {}
    cache_key = f"tmdb_{endpoint}_{json.dumps(params, sort_keys=True)}"
    
    # Check cache
    cached = cache.get(cache_key)
    if cached and time.time() - cached["ts"] < ttl:
        return cached["data"]
    
    url = f"https://api.themoviedb.org/3{endpoint}"
    params = {"api_key": TMDB_API_KEY, **params}
    params = {k: v for k, v in params.items() if v is not None}
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            if response.status_code == 429:
                retry_after = int(response.headers.get("Retry-After", 2))
                await asyncio.sleep(retry_after)
                response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            cache[cache_key] = {"data": data, "ts": time.time()}
            return data
    except Exception as e:
        logger.error(f"TMDB request failed: {e}")
        return None

async def omdb_request(imdb_id: str) -> Optional[Dict]:
    """Make a request to OMDB API for ratings"""
    if not OMDB_API_KEY:
        logger.warning("OMDB_API_KEY not configured")
        return None
    
    cache_key = f"omdb_{imdb_id}"
    cached = cache.get(cache_key)
    if cached and time.time() - cached["ts"] < CACHE_TTL_DEFAULT:
        return cached["data"]
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "http://www.omdbapi.com/",
                params={"i": imdb_id, "apikey": OMDB_API_KEY}
            )
            response.raise_for_status()
            data = response.json()
            if data.get("Response") == "True":
                cache[cache_key] = {"data": data, "ts": time.time()}
                return data
            return None
    except Exception as e:
        logger.error(f"OMDB request failed: {e}")
        return None

def get_image_url(path: Optional[str], size: str = "w500") -> Optional[str]:
    """Get full image URL from TMDB path"""
    return f"{IMAGE_BASE}{size}{path}" if path else None

def normalize_media_item(item: Dict, media_type: Optional[str] = None) -> Dict:
    """Normalize movie/TV data to common format"""
    mt = media_type or item.get("media_type", "movie")
    return {
        "id": item.get("id"),
        "media_type": mt,
        "title": item.get("title") or item.get("name"),
        "original_title": item.get("original_title") or item.get("original_name"),
        "overview": item.get("overview"),
        "poster_path": get_image_url(item.get("poster_path"), "w342"),
        "backdrop_path": get_image_url(item.get("backdrop_path"), "w1280"),
        "release_date": item.get("release_date") or item.get("first_air_date"),
        "vote_average": item.get("vote_average"),
        "vote_count": item.get("vote_count"),
        "popularity": item.get("popularity"),
        "genre_ids": item.get("genre_ids", []),
        "genres": item.get("genres", []),
    }

# ==================== USER ENDPOINTS ====================

@api_router.get("/users", response_model=List[User])
async def get_users():
    """Get all users"""
    users = await db.users.find({}, {"_id": 0}).to_list(100)
    return users

@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate):
    """Create a new user"""
    user = User(**user_data.model_dump())
    doc = user.model_dump()
    await db.users.insert_one(doc)
    return user

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    """Get a specific user"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    """Delete a user and their watchlists"""
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    await db.watchlists.delete_many({"user_id": user_id})
    return {"message": "User deleted"}

# ==================== WATCHLIST ENDPOINTS ====================

@api_router.get("/watchlists", response_model=List[Watchlist])
async def get_watchlists(user_id: str = Query(...)):
    """Get all watchlists for a user"""
    watchlists = await db.watchlists.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    return watchlists

@api_router.post("/watchlists", response_model=Watchlist)
async def create_watchlist(watchlist_data: WatchlistCreate):
    """Create a new watchlist"""
    watchlist = Watchlist(**watchlist_data.model_dump())
    doc = watchlist.model_dump()
    await db.watchlists.insert_one(doc)
    return watchlist

@api_router.get("/watchlists/{watchlist_id}", response_model=Watchlist)
async def get_watchlist(watchlist_id: str):
    """Get a specific watchlist"""
    watchlist = await db.watchlists.find_one({"id": watchlist_id}, {"_id": 0})
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    return watchlist

@api_router.put("/watchlists/{watchlist_id}")
async def update_watchlist(watchlist_id: str, name: str = Query(...)):
    """Update watchlist name"""
    result = await db.watchlists.update_one(
        {"id": watchlist_id},
        {"$set": {"name": name}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    return {"message": "Watchlist updated"}

@api_router.delete("/watchlists/{watchlist_id}")
async def delete_watchlist(watchlist_id: str):
    """Delete a watchlist"""
    result = await db.watchlists.delete_one({"id": watchlist_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    return {"message": "Watchlist deleted"}

# ==================== WATCHLIST ITEMS ENDPOINTS ====================

@api_router.post("/watchlists/{watchlist_id}/items", response_model=WatchlistItem)
async def add_to_watchlist(watchlist_id: str, item_data: WatchlistItemCreate):
    """Add an item to a watchlist"""
    watchlist = await db.watchlists.find_one({"id": watchlist_id})
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    
    # Check if item already exists in this watchlist
    for existing in watchlist.get("items", []):
        if existing["tmdb_id"] == item_data.tmdb_id and existing["media_type"] == item_data.media_type:
            raise HTTPException(status_code=400, detail="Item already in watchlist")
    
    item = WatchlistItem(**item_data.model_dump())
    await db.watchlists.update_one(
        {"id": watchlist_id},
        {"$push": {"items": item.model_dump()}}
    )
    return item

@api_router.put("/watchlists/{watchlist_id}/items/{item_id}")
async def update_watchlist_item(watchlist_id: str, item_id: str, update_data: WatchlistItemUpdate):
    """Update an item's status in a watchlist"""
    if update_data.status:
        await db.watchlists.update_one(
            {"id": watchlist_id, "items.id": item_id},
            {"$set": {"items.$.status": update_data.status}}
        )
    return {"message": "Item updated"}

@api_router.delete("/watchlists/{watchlist_id}/items/{item_id}")
async def remove_from_watchlist(watchlist_id: str, item_id: str):
    """Remove an item from a watchlist"""
    await db.watchlists.update_one(
        {"id": watchlist_id},
        {"$pull": {"items": {"id": item_id}}}
    )
    return {"message": "Item removed"}

# ==================== TMDB ENDPOINTS ====================

@api_router.get("/tmdb/genres")
async def get_genres(media_type: str = "movie"):
    """Get all genres for movies or TV"""
    data = await tmdb_request(f"/genre/{media_type}/list")
    if not data:
        # Return default genres if TMDB is not configured
        return {"genres": [
            {"id": 28, "name": "Action"},
            {"id": 12, "name": "Adventure"},
            {"id": 16, "name": "Animation"},
            {"id": 35, "name": "Comedy"},
            {"id": 80, "name": "Crime"},
            {"id": 99, "name": "Documentary"},
            {"id": 18, "name": "Drama"},
            {"id": 10751, "name": "Family"},
            {"id": 14, "name": "Fantasy"},
            {"id": 36, "name": "History"},
            {"id": 27, "name": "Horror"},
            {"id": 10402, "name": "Music"},
            {"id": 9648, "name": "Mystery"},
            {"id": 10749, "name": "Romance"},
            {"id": 878, "name": "Science Fiction"},
            {"id": 10770, "name": "TV Movie"},
            {"id": 53, "name": "Thriller"},
            {"id": 10752, "name": "War"},
            {"id": 37, "name": "Western"},
        ]}
    return data

@api_router.get("/tmdb/trending")
async def get_trending(media_type: str = "all", time_window: str = "week", page: int = 1):
    """Get trending movies/TV shows"""
    data = await tmdb_request(f"/trending/{media_type}/{time_window}", {"page": page})
    if not data:
        return {"results": [], "page": 1, "total_pages": 0, "total_results": 0}
    
    results = [normalize_media_item(item) for item in data.get("results", [])]
    return {
        "results": results,
        "page": data.get("page", 1),
        "total_pages": data.get("total_pages", 0),
        "total_results": data.get("total_results", 0)
    }

@api_router.get("/tmdb/movie/now-playing")
async def get_now_playing(page: int = 1):
    """Get movies currently in theaters"""
    data = await tmdb_request("/movie/now_playing", {"page": page})
    if not data:
        return {"results": [], "page": 1, "total_pages": 0, "total_results": 0}
    
    results = [normalize_media_item(item, "movie") for item in data.get("results", [])]
    return {
        "results": results,
        "page": data.get("page", 1),
        "total_pages": data.get("total_pages", 0),
        "total_results": data.get("total_results", 0)
    }

@api_router.get("/tmdb/movie/upcoming")
async def get_upcoming(page: int = 1):
    """Get upcoming movies"""
    data = await tmdb_request("/movie/upcoming", {"page": page})
    if not data:
        return {"results": [], "page": 1, "total_pages": 0, "total_results": 0}
    
    results = [normalize_media_item(item, "movie") for item in data.get("results", [])]
    return {
        "results": results,
        "page": data.get("page", 1),
        "total_pages": data.get("total_pages", 0),
        "total_results": data.get("total_results", 0)
    }

@api_router.get("/tmdb/movie/popular")
async def get_popular_movies(page: int = 1):
    """Get popular movies"""
    data = await tmdb_request("/movie/popular", {"page": page})
    if not data:
        return {"results": [], "page": 1, "total_pages": 0, "total_results": 0}
    
    results = [normalize_media_item(item, "movie") for item in data.get("results", [])]
    return {
        "results": results,
        "page": data.get("page", 1),
        "total_pages": data.get("total_pages", 0),
        "total_results": data.get("total_results", 0)
    }

@api_router.get("/tmdb/movie/top-rated")
async def get_top_rated_movies(page: int = 1):
    """Get top rated movies"""
    data = await tmdb_request("/movie/top_rated", {"page": page})
    if not data:
        return {"results": [], "page": 1, "total_pages": 0, "total_results": 0}
    
    results = [normalize_media_item(item, "movie") for item in data.get("results", [])]
    return {
        "results": results,
        "page": data.get("page", 1),
        "total_pages": data.get("total_pages", 0),
        "total_results": data.get("total_results", 0)
    }

@api_router.get("/tmdb/tv/popular")
async def get_popular_tv(page: int = 1):
    """Get popular TV shows"""
    data = await tmdb_request("/tv/popular", {"page": page})
    if not data:
        return {"results": [], "page": 1, "total_pages": 0, "total_results": 0}
    
    results = [normalize_media_item(item, "tv") for item in data.get("results", [])]
    return {
        "results": results,
        "page": data.get("page", 1),
        "total_pages": data.get("total_pages", 0),
        "total_results": data.get("total_results", 0)
    }

@api_router.get("/tmdb/tv/top-rated")
async def get_top_rated_tv(page: int = 1):
    """Get top rated TV shows"""
    data = await tmdb_request("/tv/top_rated", {"page": page})
    if not data:
        return {"results": [], "page": 1, "total_pages": 0, "total_results": 0}
    
    results = [normalize_media_item(item, "tv") for item in data.get("results", [])]
    return {
        "results": results,
        "page": data.get("page", 1),
        "total_pages": data.get("total_pages", 0),
        "total_results": data.get("total_results", 0)
    }

@api_router.get("/tmdb/tv/on-the-air")
async def get_on_the_air(page: int = 1):
    """Get TV shows currently on air"""
    data = await tmdb_request("/tv/on_the_air", {"page": page})
    if not data:
        return {"results": [], "page": 1, "total_pages": 0, "total_results": 0}
    
    results = [normalize_media_item(item, "tv") for item in data.get("results", [])]
    return {
        "results": results,
        "page": data.get("page", 1),
        "total_pages": data.get("total_pages", 0),
        "total_results": data.get("total_results", 0)
    }

@api_router.get("/tmdb/search")
async def search_multi(query: str, page: int = 1):
    """Search movies, TV shows, and people"""
    data = await tmdb_request("/search/multi", {"query": query, "page": page})
    if not data:
        return {"results": [], "page": 1, "total_pages": 0, "total_results": 0}
    
    # Filter out person results, only keep movies and TV
    results = [
        normalize_media_item(item)
        for item in data.get("results", [])
        if item.get("media_type") in ["movie", "tv"]
    ]
    return {
        "results": results,
        "page": data.get("page", 1),
        "total_pages": data.get("total_pages", 0),
        "total_results": data.get("total_results", 0)
    }

@api_router.get("/tmdb/discover/{media_type}")
async def discover(
    media_type: str,
    page: int = 1,
    sort_by: Optional[str] = "popularity.desc",
    with_genres: Optional[str] = None,
    year: Optional[int] = None,
    vote_average_gte: Optional[float] = None,
    vote_average_lte: Optional[float] = None,
    with_watch_providers: Optional[str] = None,
    with_original_language: Optional[str] = None,
    watch_region: str = "US"
):
    """Discover movies/TV with filters"""
    params = {
        "page": page,
        "sort_by": sort_by,
        "with_genres": with_genres,
        "vote_average.gte": vote_average_gte,
        "vote_average.lte": vote_average_lte,
        "with_watch_providers": with_watch_providers,
        "watch_region": watch_region if with_watch_providers else None,
        "with_original_language": with_original_language
    }
    
    if media_type == "movie" and year:
        params["primary_release_year"] = year
    elif media_type == "tv" and year:
        params["first_air_date_year"] = year
    
    data = await tmdb_request(f"/discover/{media_type}", params)
    if not data:
        return {"results": [], "page": 1, "total_pages": 0, "total_results": 0}
    
    results = [normalize_media_item(item, media_type) for item in data.get("results", [])]
    return {
        "results": results,
        "page": data.get("page", 1),
        "total_pages": data.get("total_pages", 0),
        "total_results": data.get("total_results", 0)
    }

@api_router.get("/tmdb/movie/{movie_id}")
async def get_movie_details(movie_id: int):
    """Get detailed movie information"""
    data = await tmdb_request(
        f"/movie/{movie_id}",
        {"append_to_response": "credits,videos,watch/providers,external_ids,recommendations"}
    )
    if not data:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    # Get trailer
    trailer_url = None
    videos = data.get("videos", {}).get("results", [])
    for video in videos:
        if video.get("type") == "Trailer" and video.get("site") == "YouTube":
            trailer_url = f"https://www.youtube.com/embed/{video['key']}"
            break
    
    # Get streaming providers for US
    providers = data.get("watch/providers", {}).get("results", {}).get("US", {})
    
    return {
        **normalize_media_item(data, "movie"),
        "runtime": data.get("runtime"),
        "status": data.get("status"),
        "tagline": data.get("tagline"),
        "budget": data.get("budget"),
        "revenue": data.get("revenue"),
        "imdb_id": data.get("external_ids", {}).get("imdb_id"),
        "cast": [
            {
                "id": c["id"],
                "name": c["name"],
                "character": c.get("character"),
                "profile_path": get_image_url(c.get("profile_path"), "w185")
            }
            for c in data.get("credits", {}).get("cast", [])[:10]
        ],
        "crew": [
            {
                "id": c["id"],
                "name": c["name"],
                "job": c.get("job"),
                "department": c.get("department")
            }
            for c in data.get("credits", {}).get("crew", [])
            if c.get("job") in ["Director", "Writer", "Screenplay"]
        ],
        "trailer_url": trailer_url,
        "streaming": {
            "flatrate": providers.get("flatrate", []),
            "rent": providers.get("rent", []),
            "buy": providers.get("buy", [])
        },
        "recommendations": [
            normalize_media_item(r, "movie")
            for r in data.get("recommendations", {}).get("results", [])[:8]
        ]
    }

@api_router.get("/tmdb/tv/{tv_id}")
async def get_tv_details(tv_id: int):
    """Get detailed TV show information"""
    data = await tmdb_request(
        f"/tv/{tv_id}",
        {"append_to_response": "credits,videos,watch/providers,external_ids,recommendations"}
    )
    if not data:
        raise HTTPException(status_code=404, detail="TV show not found")
    
    # Get trailer
    trailer_url = None
    videos = data.get("videos", {}).get("results", [])
    for video in videos:
        if video.get("type") == "Trailer" and video.get("site") == "YouTube":
            trailer_url = f"https://www.youtube.com/embed/{video['key']}"
            break
    
    # Get streaming providers for US
    providers = data.get("watch/providers", {}).get("results", {}).get("US", {})
    
    return {
        **normalize_media_item(data, "tv"),
        "number_of_seasons": data.get("number_of_seasons"),
        "number_of_episodes": data.get("number_of_episodes"),
        "status": data.get("status"),
        "tagline": data.get("tagline"),
        "episode_run_time": data.get("episode_run_time", []),
        "imdb_id": data.get("external_ids", {}).get("imdb_id"),
        "networks": [
            {"id": n["id"], "name": n["name"], "logo_path": get_image_url(n.get("logo_path"), "w92")}
            for n in data.get("networks", [])
        ],
        "cast": [
            {
                "id": c["id"],
                "name": c["name"],
                "character": c.get("character"),
                "profile_path": get_image_url(c.get("profile_path"), "w185")
            }
            for c in data.get("credits", {}).get("cast", [])[:10]
        ],
        "crew": [
            {
                "id": c["id"],
                "name": c["name"],
                "job": c.get("job"),
                "department": c.get("department")
            }
            for c in data.get("credits", {}).get("crew", [])
            if c.get("job") in ["Executive Producer", "Creator"]
        ],
        "trailer_url": trailer_url,
        "streaming": {
            "flatrate": providers.get("flatrate", []),
            "rent": providers.get("rent", []),
            "buy": providers.get("buy", [])
        },
        "recommendations": [
            normalize_media_item(r, "tv")
            for r in data.get("recommendations", {}).get("results", [])[:8]
        ]
    }

@api_router.get("/tmdb/watch-providers")
async def get_watch_providers(watch_region: str = "US"):
    """Get available streaming providers"""
    movie_providers = await tmdb_request("/watch/providers/movie", {"watch_region": watch_region})
    tv_providers = await tmdb_request("/watch/providers/tv", {"watch_region": watch_region})
    
    # Merge and deduplicate providers
    all_providers = {}
    for p in (movie_providers or {}).get("results", []) + (tv_providers or {}).get("results", []):
        if p["provider_id"] not in all_providers:
            all_providers[p["provider_id"]] = {
                "provider_id": p["provider_id"],
                "provider_name": p["provider_name"],
                "logo_path": get_image_url(p.get("logo_path"), "w92")
            }
    
    return {"providers": list(all_providers.values())}

# ==================== OMDB ENDPOINTS ====================

@api_router.get("/omdb/{imdb_id}")
async def get_omdb_ratings(imdb_id: str):
    """Get IMDb and Rotten Tomatoes ratings from OMDB"""
    data = await omdb_request(imdb_id)
    if not data:
        return {"ratings": None}
    
    ratings = {
        "imdb": None,
        "rotten_tomatoes": None,
        "metacritic": None
    }
    
    # Parse IMDb rating
    if data.get("imdbRating") and data["imdbRating"] != "N/A":
        ratings["imdb"] = {
            "value": data["imdbRating"],
            "votes": data.get("imdbVotes", "").replace(",", "")
        }
    
    # Parse other ratings
    for rating in data.get("Ratings", []):
        source = rating.get("Source", "")
        value = rating.get("Value", "")
        if "Rotten Tomatoes" in source:
            ratings["rotten_tomatoes"] = {"value": value}
        elif "Metacritic" in source:
            ratings["metacritic"] = {"value": value}
    
    return {
        "ratings": ratings,
        "rated": data.get("Rated"),
        "awards": data.get("Awards"),
        "box_office": data.get("BoxOffice")
    }

# ==================== HEALTH CHECK ====================

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    tmdb_status = "configured" if TMDB_API_KEY else "not_configured"
    omdb_status = "configured" if OMDB_API_KEY else "not_configured"
    return {
        "status": "healthy",
        "tmdb_api": tmdb_status,
        "omdb_api": omdb_status
    }

@api_router.get("/")
async def root():
    return {"message": "CineVault API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

import asyncio
