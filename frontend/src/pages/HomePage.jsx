import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info, TrendingUp, Film, Tv, Star } from 'lucide-react';
import { getTrending, getPopularMovies, getPopularTV, getNowPlaying, getOnTheAir } from '../lib/api';
import { MediaRow } from '../components/MediaRow';
import { AddToWatchlistButton } from '../components/AddToWatchlistButton';
import { Button } from '../components/ui/button';
import { formatYear, formatVoteAverage } from '../lib/utils';

export const HomePage = () => {
  const [trending, setTrending] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTV, setPopularTV] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [onTheAir, setOnTheAir] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroItem, setHeroItem] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [trendingRes, moviesRes, tvRes, nowPlayingRes, onTheAirRes] = await Promise.all([
          getTrending('all', 'week'),
          getPopularMovies(),
          getPopularTV(),
          getNowPlaying(),
          getOnTheAir()
        ]);
        
        setTrending(trendingRes.results || []);
        setPopularMovies(moviesRes.results || []);
        setPopularTV(tvRes.results || []);
        setNowPlaying(nowPlayingRes.results || []);
        setOnTheAir(onTheAirRes.results || []);
        
        // Set hero item from trending
        if (trendingRes.results?.length > 0) {
          const heroCandidate = trendingRes.results.find(item => item.backdrop_path) || trendingRes.results[0];
          setHeroItem(heroCandidate);
        }
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background" data-testid="home-page">
      {/* Hero Section */}
      {heroItem && (
        <section 
          className="hero-backdrop relative"
          style={{
            backgroundImage: heroItem.backdrop_path 
              ? `url(${heroItem.backdrop_path})`
              : 'none'
          }}
          data-testid="hero-section"
        >
          <div className="absolute inset-0 z-10 flex items-end">
            <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 pb-16 md:pb-24 w-full">
              <div className="max-w-2xl animate-slide-up">
                {/* Media Type Badge */}
                <div className="flex items-center gap-2 mb-4">
                  {heroItem.media_type === 'movie' ? (
                    <Film className="w-5 h-5 text-primary" />
                  ) : (
                    <Tv className="w-5 h-5 text-primary" />
                  )}
                  <span className="text-sm font-medium text-primary uppercase tracking-wider">
                    {heroItem.media_type === 'movie' ? 'Movie' : 'TV Series'}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 text-sm">{formatYear(heroItem.release_date)}</span>
                  {heroItem.vote_average > 0 && (
                    <>
                      <span className="text-slate-500">•</span>
                      <span className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-slate-300">{formatVoteAverage(heroItem.vote_average)}</span>
                      </span>
                    </>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
                  {heroItem.title}
                </h1>

                {/* Overview */}
                <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-8 line-clamp-3">
                  {heroItem.overview}
                </p>

                {/* Actions */}
                <div className="flex flex-wrap gap-4">
                  <Link to={`/${heroItem.media_type}/${heroItem.id}`}>
                    <Button 
                      size="lg" 
                      className="gap-2 bg-white text-black hover:bg-white/90"
                      data-testid="hero-play-btn"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      View Details
                    </Button>
                  </Link>
                  <AddToWatchlistButton 
                    media={heroItem}
                    variant="secondary"
                    className="h-11"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Content Sections */}
      <div className="relative z-20 -mt-16 md:-mt-24 space-y-12 md:space-y-16 pb-16">
        {/* Trending */}
        <div className="max-w-7xl mx-auto">
          <MediaRow 
            title={
              <span className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                Trending This Week
              </span>
            }
            items={trending}
            loading={loading}
          />
        </div>

        {/* Now Playing in Theaters */}
        <div className="max-w-7xl mx-auto">
          <MediaRow 
            title="Now Playing in Theaters"
            items={nowPlaying}
            loading={loading}
          />
        </div>

        {/* Popular Movies */}
        <div className="max-w-7xl mx-auto">
          <MediaRow 
            title="Popular Movies"
            items={popularMovies}
            loading={loading}
          />
        </div>

        {/* On The Air - TV */}
        <div className="max-w-7xl mx-auto">
          <MediaRow 
            title="Currently Airing TV Shows"
            items={onTheAir}
            loading={loading}
          />
        </div>

        {/* Popular TV */}
        <div className="max-w-7xl mx-auto">
          <MediaRow 
            title="Popular TV Shows"
            items={popularTV}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};
