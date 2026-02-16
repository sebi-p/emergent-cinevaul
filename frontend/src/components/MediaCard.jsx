import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Calendar, Film, Tv } from 'lucide-react';
import { cn, formatVoteAverage, formatYear } from '../lib/utils';

export const MediaCard = ({ item, className }) => {
  const { id, media_type, title, poster_path, vote_average, release_date } = item;
  const mediaUrl = `/${media_type}/${id}`;

  return (
    <Link 
      to={mediaUrl}
      className={cn("movie-card relative aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-card group", className)}
      data-testid={`media-card-${id}`}
    >
      {/* Poster Image */}
      {poster_path ? (
        <img 
          src={poster_path} 
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="poster-placeholder w-full h-full">
          {media_type === 'movie' ? (
            <Film className="w-12 h-12 text-slate-600" />
          ) : (
            <Tv className="w-12 h-12 text-slate-600" />
          )}
        </div>
      )}

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
        <h3 className="text-white font-semibold text-sm line-clamp-2 mb-2">{title}</h3>
        <div className="flex items-center gap-3 text-xs text-slate-300">
          {vote_average > 0 && (
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              {formatVoteAverage(vote_average)}
            </span>
          )}
          {release_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatYear(release_date)}
            </span>
          )}
        </div>
      </div>

      {/* Rating Badge */}
      {vote_average > 0 && (
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-md px-2 py-1 flex items-center gap-1 text-xs">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-white font-medium">{formatVoteAverage(vote_average)}</span>
        </div>
      )}

      {/* Media Type Badge */}
      <div className="absolute top-2 left-2 bg-primary/80 backdrop-blur-sm rounded-md px-2 py-1 text-xs text-white font-medium uppercase">
        {media_type}
      </div>
    </Link>
  );
};

export const MediaCardSkeleton = () => (
  <div className="skeleton aspect-[2/3] w-full" />
);
