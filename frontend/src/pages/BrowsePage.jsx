import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X, Loader2, SlidersHorizontal, Tv2 } from 'lucide-react';
import { searchMulti, discover, getGenres, getWatchProviders } from '../lib/api';
import { MediaCard, MediaCardSkeleton } from '../components/MediaCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'release_date.desc', label: 'Newest First' },
  { value: 'release_date.asc', label: 'Oldest First' },
];

const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { value: year.toString(), label: year.toString() };
});

// Popular streaming providers to show at top
const POPULAR_PROVIDER_IDS = [8, 337, 9, 350, 15, 386, 387, 531, 1899, 283]; // Netflix, Disney+, Prime, Apple TV, Hulu, Peacock, Max, Paramount+, etc.

export const BrowsePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [genres, setGenres] = useState([]);
  const [providers, setProviders] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const query = searchParams.get('q') || '';
  const mediaType = searchParams.get('type') || 'movie';
  const [localQuery, setLocalQuery] = useState(query);
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [ratingRange, setRatingRange] = useState([0, 10]);

  // Fetch genres and providers
  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        const [genresData, providersData] = await Promise.all([
          getGenres(mediaType),
          getWatchProviders()
        ]);
        setGenres(genresData.genres || []);
        
        // Sort providers: popular ones first, then alphabetically
        const allProviders = providersData.providers || [];
        const popularProviders = allProviders.filter(p => POPULAR_PROVIDER_IDS.includes(p.provider_id));
        const otherProviders = allProviders
          .filter(p => !POPULAR_PROVIDER_IDS.includes(p.provider_id))
          .sort((a, b) => a.provider_name.localeCompare(b.provider_name));
        
        // Sort popular providers by their order in POPULAR_PROVIDER_IDS
        popularProviders.sort((a, b) => 
          POPULAR_PROVIDER_IDS.indexOf(a.provider_id) - POPULAR_PROVIDER_IDS.indexOf(b.provider_id)
        );
        
        setProviders([...popularProviders, ...otherProviders]);
      } catch (error) {
        console.error('Failed to fetch filter data:', error);
      }
    };
    fetchFiltersData();
  }, [mediaType]);

  // Fetch results
  const fetchResults = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      let data;
      if (query) {
        // Search mode
        data = await searchMulti(query, pageNum);
        // Filter by media type if specified
        if (mediaType !== 'all') {
          data.results = data.results.filter(item => item.media_type === mediaType);
        }
      } else {
        // Discover mode with filters
        const filters = {
          sort_by: sortBy,
          with_genres: selectedGenre !== 'all' ? selectedGenre : undefined,
          year: selectedYear !== 'all' ? parseInt(selectedYear) : undefined,
          vote_average_gte: ratingRange[0] > 0 ? ratingRange[0] : undefined,
          vote_average_lte: ratingRange[1] < 10 ? ratingRange[1] : undefined,
          with_watch_providers: selectedProvider !== 'all' ? selectedProvider : undefined,
        };
        data = await discover(mediaType, filters, pageNum);
      }
      
      if (pageNum === 1) {
        setResults(data.results || []);
      } else {
        setResults(prev => [...prev, ...(data.results || [])]);
      }
      setTotalPages(Math.min(data.total_pages || 0, 500)); // TMDB limits to 500 pages
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch results:', error);
    } finally {
      setLoading(false);
    }
  }, [query, mediaType, sortBy, selectedGenre, selectedYear, selectedProvider, ratingRange]);

  // Initial fetch and when filters change
  useEffect(() => {
    fetchResults(1);
  }, [fetchResults]);

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (localQuery.trim()) {
      params.set('q', localQuery.trim());
    } else {
      params.delete('q');
    }
    setSearchParams(params);
  };

  // Handle media type change
  const handleMediaTypeChange = (type) => {
    const params = new URLSearchParams(searchParams);
    params.set('type', type);
    setSearchParams(params);
    setSelectedGenre('all'); // Reset genre when switching type
  };

  // Clear all filters
  const clearFilters = () => {
    setSortBy('popularity.desc');
    setSelectedGenre('all');
    setSelectedYear('all');
    setSelectedProvider('all');
    setRatingRange([0, 10]);
    setLocalQuery('');
    setSearchParams({ type: mediaType });
  };

  const hasActiveFilters = sortBy !== 'popularity.desc' || selectedGenre !== 'all' || selectedYear !== 'all' || selectedProvider !== 'all' || ratingRange[0] > 0 || ratingRange[1] < 10;

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Sort By */}
      <div>
        <label className="text-sm font-medium text-slate-300 mb-2 block">Sort By</label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="bg-secondary/50 border-white/10" data-testid="sort-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-white/10">
            {SORT_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Streaming Provider */}
      <div>
        <label className="text-sm font-medium text-slate-300 mb-2 block flex items-center gap-2">
          <Tv2 className="w-4 h-4 text-primary" />
          Streaming On
        </label>
        <Select value={selectedProvider} onValueChange={setSelectedProvider}>
          <SelectTrigger className="bg-secondary/50 border-white/10" data-testid="provider-select">
            <SelectValue placeholder="All Providers" />
          </SelectTrigger>
          <SelectContent className="bg-card border-white/10 max-h-72">
            <SelectItem value="all">All Providers</SelectItem>
            {providers.slice(0, 30).map(provider => (
              <SelectItem key={provider.provider_id} value={provider.provider_id.toString()}>
                <div className="flex items-center gap-2">
                  {provider.logo_path && (
                    <img 
                      src={provider.logo_path} 
                      alt="" 
                      className="w-5 h-5 rounded"
                    />
                  )}
                  {provider.provider_name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Genre */}
      <div>
        <label className="text-sm font-medium text-slate-300 mb-2 block">Genre</label>
        <Select value={selectedGenre} onValueChange={setSelectedGenre}>
          <SelectTrigger className="bg-secondary/50 border-white/10" data-testid="genre-select">
            <SelectValue placeholder="All Genres" />
          </SelectTrigger>
          <SelectContent className="bg-card border-white/10 max-h-60">
            <SelectItem value="all">All Genres</SelectItem>
            {genres.map(genre => (
              <SelectItem key={genre.id} value={genre.id.toString()}>{genre.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Year */}
      <div>
        <label className="text-sm font-medium text-slate-300 mb-2 block">Release Year</label>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="bg-secondary/50 border-white/10" data-testid="year-select">
            <SelectValue placeholder="Any Year" />
          </SelectTrigger>
          <SelectContent className="bg-card border-white/10 max-h-60">
            <SelectItem value="all">Any Year</SelectItem>
            {YEAR_OPTIONS.map(year => (
              <SelectItem key={year.value} value={year.value}>{year.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Rating Range */}
      <div>
        <label className="text-sm font-medium text-slate-300 mb-4 block">
          Rating: {ratingRange[0]} - {ratingRange[1]}
        </label>
        <Slider
          value={ratingRange}
          onValueChange={setRatingRange}
          min={0}
          max={10}
          step={0.5}
          className="py-2"
          data-testid="rating-slider"
        />
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button 
          variant="outline" 
          className="w-full border-white/10"
          onClick={clearFilters}
          data-testid="clear-filters-btn"
        >
          <X className="w-4 h-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pt-20" data-testid="browse-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            {query ? `Search: "${query}"` : mediaType === 'movie' ? 'Movies' : 'TV Shows'}
          </h1>
          
          {/* Media Type Tabs */}
          <div className="flex items-center gap-2 bg-secondary/30 p-1 rounded-lg">
            <Button
              variant={mediaType === 'movie' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleMediaTypeChange('movie')}
              data-testid="type-movie-btn"
            >
              Movies
            </Button>
            <Button
              variant={mediaType === 'tv' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleMediaTypeChange('tv')}
              data-testid="type-tv-btn"
            >
              TV Shows
            </Button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="glass rounded-xl p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </h2>
              </div>
              <FilterPanel />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Search Bar & Mobile Filter Button */}
            <div className="flex gap-3 mb-8">
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    type="text"
                    placeholder="Search for movies or TV shows..."
                    value={localQuery}
                    onChange={(e) => setLocalQuery(e.target.value)}
                    className="w-full pl-12 h-12 bg-secondary/50 border-white/10 text-base"
                    data-testid="browse-search-input"
                  />
                </div>
              </form>
              
              {/* Mobile Filter Button */}
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="lg:hidden h-12 w-12 border-white/10"
                    data-testid="mobile-filter-btn"
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-card border-white/10 w-80">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Filter className="w-5 h-5" />
                      Filters
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterPanel />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Active Provider Filter Badge */}
            {selectedProvider !== 'all' && (
              <div className="mb-4 flex items-center gap-2">
                <span className="text-sm text-slate-400">Streaming on:</span>
                {(() => {
                  const provider = providers.find(p => p.provider_id.toString() === selectedProvider);
                  return provider ? (
                    <div className="flex items-center gap-2 bg-primary/20 text-primary px-3 py-1 rounded-full text-sm">
                      {provider.logo_path && (
                        <img src={provider.logo_path} alt="" className="w-5 h-5 rounded" />
                      )}
                      {provider.provider_name}
                      <button 
                        onClick={() => setSelectedProvider('all')}
                        className="ml-1 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {/* Results Grid */}
            {loading && results.length === 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {Array(20).fill(0).map((_, i) => (
                  <MediaCardSkeleton key={i} />
                ))}
              </div>
            ) : results.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {results.map((item, index) => (
                    <MediaCard key={`${item.id}-${item.media_type}-${index}`} item={item} />
                  ))}
                </div>
                
                {/* Load More */}
                {page < totalPages && (
                  <div className="flex justify-center mt-12">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => fetchResults(page + 1)}
                      disabled={loading}
                      className="border-white/10"
                      data-testid="load-more-btn"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ) : null}
                      Load More
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-secondary/30 flex items-center justify-center">
                  <Search className="w-10 h-10 text-slate-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
                <p className="text-slate-400 max-w-md mx-auto">
                  {query 
                    ? `We couldn't find anything matching "${query}". Try different keywords.`
                    : 'Try adjusting your filters to see more results.'}
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
