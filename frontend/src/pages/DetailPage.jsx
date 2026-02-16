import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Star, Calendar, Clock, Play, ExternalLink, Users, 
  Film, Tv, Loader2, ChevronLeft 
} from 'lucide-react';
import { getMovieDetails, getTVDetails, getOMDBRatings } from '../lib/api';
import { AddToWatchlistButton } from '../components/AddToWatchlistButton';
import { MediaRow } from '../components/MediaRow';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { formatDate, formatRuntime, formatVoteAverage } from '../lib/utils';

export const DetailPage = () => {
  const { type, id } = useParams();
  const [details, setDetails] = useState(null);
  const [omdbRatings, setOmdbRatings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const data = type === 'movie' 
          ? await getMovieDetails(id)
          : await getTVDetails(id);
        setDetails(data);
        
        // Fetch OMDB ratings if we have an IMDb ID
        if (data.imdb_id) {
          const ratings = await getOMDBRatings(data.imdb_id);
          setOmdbRatings(ratings);
        }
      } catch (error) {
        console.error('Failed to fetch details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [type, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-white mb-4">Content not found</h1>
        <Link to="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    );
  }

  const {
    title,
    overview,
    poster_path,
    backdrop_path,
    release_date,
    vote_average,
    genres,
    runtime,
    number_of_seasons,
    number_of_episodes,
    status,
    tagline,
    cast,
    crew,
    trailer_url,
    streaming,
    recommendations
  } = details;

  return (
    <div className="min-h-screen bg-background" data-testid="detail-page">
      {/* Backdrop */}
      <div 
        className="hero-backdrop relative min-h-[60vh] md:min-h-[70vh]"
        style={{
          backgroundImage: backdrop_path ? `url(${backdrop_path})` : 'none'
        }}
      >
        {/* Back Button */}
        <div className="absolute top-20 left-4 md:left-8 z-20">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back
            </Button>
          </Link>
        </div>

        <div className="absolute inset-0 z-10 flex items-end">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 pb-8 md:pb-16 w-full">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Poster */}
              <div className="hidden md:block w-64 flex-shrink-0">
                {poster_path ? (
                  <img 
                    src={poster_path} 
                    alt={title}
                    className="w-full rounded-xl shadow-2xl border border-white/10"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] rounded-xl bg-card border border-white/10 flex items-center justify-center">
                    {type === 'movie' ? (
                      <Film className="w-16 h-16 text-slate-600" />
                    ) : (
                      <Tv className="w-16 h-16 text-slate-600" />
                    )}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 animate-slide-up">
                {/* Type & Status */}
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                    {type === 'movie' ? 'Movie' : 'TV Series'}
                  </Badge>
                  {status && (
                    <Badge variant="outline" className="border-white/20 text-slate-300">
                      {status}
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3">
                  {title}
                </h1>

                {/* Tagline */}
                {tagline && (
                  <p className="text-lg text-slate-400 italic mb-4">"{tagline}"</p>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-slate-300">
                  {release_date && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      {formatDate(release_date)}
                    </span>
                  )}
                  {runtime && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-500" />
                      {formatRuntime(runtime)}
                    </span>
                  )}
                  {number_of_seasons && (
                    <span className="flex items-center gap-1.5">
                      <Tv className="w-4 h-4 text-slate-500" />
                      {number_of_seasons} Seasons, {number_of_episodes} Episodes
                    </span>
                  )}
                </div>

                {/* Ratings */}
                <div className="flex flex-wrap gap-3 mb-6">
                  {vote_average > 0 && (
                    <div className="rating-badge rating-tmdb" data-testid="tmdb-rating">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-semibold">{formatVoteAverage(vote_average)}</span>
                      <span className="text-xs opacity-70">TMDB</span>
                    </div>
                  )}
                  {omdbRatings?.ratings?.imdb && (
                    <div className="rating-badge rating-imdb" data-testid="imdb-rating">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-semibold">{omdbRatings.ratings.imdb.value}</span>
                      <span className="text-xs opacity-70">IMDb</span>
                    </div>
                  )}
                  {omdbRatings?.ratings?.rotten_tomatoes && (
                    <div className="rating-badge rating-rt" data-testid="rt-rating">
                      <span className="font-semibold">{omdbRatings.ratings.rotten_tomatoes.value}</span>
                      <span className="text-xs opacity-70">RT</span>
                    </div>
                  )}
                </div>

                {/* Genres */}
                {genres?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {genres.map(genre => (
                      <Badge 
                        key={genre.id} 
                        variant="outline" 
                        className="border-white/20 text-slate-300"
                      >
                        {genre.name}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  {trailer_url && (
                    <Button 
                      size="lg"
                      onClick={() => setShowTrailer(true)}
                      className="gap-2 bg-white text-black hover:bg-white/90"
                      data-testid="watch-trailer-btn"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      Watch Trailer
                    </Button>
                  )}
                  <AddToWatchlistButton 
                    media={{ id: parseInt(id), media_type: type, title, poster_path }}
                    variant="default"
                    className="h-11"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-12 space-y-12">
        {/* Overview */}
        {overview && (
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Overview</h2>
            <p className="text-slate-300 text-lg leading-relaxed max-w-4xl">
              {overview}
            </p>
          </section>
        )}

        {/* Streaming Providers */}
        {(streaming?.flatrate?.length > 0 || streaming?.rent?.length > 0) && (
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Where to Watch</h2>
            <div className="space-y-4">
              {streaming.flatrate?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-3">Stream</h3>
                  <div className="flex flex-wrap gap-3">
                    {streaming.flatrate.map(provider => (
                      <div 
                        key={provider.provider_id}
                        className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2"
                        title={provider.provider_name}
                      >
                        {provider.logo_path && (
                          <img 
                            src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                            alt={provider.provider_name}
                            className="w-8 h-8 rounded"
                          />
                        )}
                        <span className="text-sm text-slate-300">{provider.provider_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {streaming.rent?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-3">Rent/Buy</h3>
                  <div className="flex flex-wrap gap-3">
                    {streaming.rent.slice(0, 5).map(provider => (
                      <div 
                        key={provider.provider_id}
                        className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2"
                        title={provider.provider_name}
                      >
                        {provider.logo_path && (
                          <img 
                            src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                            alt={provider.provider_name}
                            className="w-8 h-8 rounded"
                          />
                        )}
                        <span className="text-sm text-slate-300">{provider.provider_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Cast */}
        {cast?.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Cast
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {cast.map(person => (
                <div 
                  key={person.id}
                  className="bg-card rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors duration-200"
                >
                  {person.profile_path ? (
                    <img 
                      src={person.profile_path}
                      alt={person.name}
                      className="w-full aspect-square object-cover rounded-lg mb-3"
                    />
                  ) : (
                    <div className="w-full aspect-square rounded-lg bg-secondary/50 flex items-center justify-center mb-3">
                      <Users className="w-8 h-8 text-slate-600" />
                    </div>
                  )}
                  <h3 className="font-medium text-white text-sm truncate">{person.name}</h3>
                  <p className="text-xs text-slate-400 truncate">{person.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Crew */}
        {crew?.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Crew</h2>
            <div className="flex flex-wrap gap-4">
              {crew.map((person, index) => (
                <div 
                  key={`${person.id}-${index}`}
                  className="bg-card rounded-lg px-4 py-3 border border-white/5"
                >
                  <p className="font-medium text-white text-sm">{person.name}</p>
                  <p className="text-xs text-slate-400">{person.job}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recommendations */}
        {recommendations?.length > 0 && (
          <MediaRow 
            title="You Might Also Like"
            items={recommendations}
          />
        )}
      </div>

      {/* Trailer Modal */}
      {showTrailer && trailer_url && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowTrailer(false)}
        >
          <div className="relative w-full max-w-5xl aspect-video">
            <iframe
              src={`${trailer_url}?autoplay=1`}
              className="w-full h-full rounded-xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Trailer"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-white"
              onClick={() => setShowTrailer(false)}
            >
              <span className="sr-only">Close</span>
              ×
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
