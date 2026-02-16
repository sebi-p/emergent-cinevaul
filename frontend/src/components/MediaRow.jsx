import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaCard, MediaCardSkeleton } from './MediaCard';
import { cn } from '../lib/utils';

export const MediaRow = ({ title, items, loading, className }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getTestId = () => {
    if (typeof title === 'string') {
      return `media-row-${title.toLowerCase().replace(/\s+/g, '-')}`;
    }
    return 'media-row';
  };

  return (
    <section className={cn("relative media-row", className)} data-testid={getTestId()}>
      {/* Section Title */}
      {title && (
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-6 px-4 md:px-0">
          {title}
        </h2>
      )}

      {/* Scroll Buttons */}
      <button 
        onClick={() => scroll('left')}
        className="scroll-btn left-0"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button 
        onClick={() => scroll('right')}
        className="scroll-btn right-0"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Scrollable Content */}
      <div 
        ref={scrollRef}
        className="horizontal-scroll gap-4 px-4 md:px-0 pb-4"
      >
        {loading ? (
          // Skeleton loading
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="w-40 md:w-48 flex-shrink-0">
              <MediaCardSkeleton />
            </div>
          ))
        ) : (
          items?.map((item, index) => (
            <div 
              key={`${item.id}-${item.media_type}-${index}`} 
              className="w-40 md:w-48 flex-shrink-0"
            >
              <MediaCard item={item} />
            </div>
          ))
        )}
      </div>
    </section>
  );
};
