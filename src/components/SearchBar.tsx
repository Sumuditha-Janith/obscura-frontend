import { useState, useEffect, useRef } from "react";
import { searchMedia } from "../services/media.service";

interface SearchResult {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path?: string;
  release_date: string;
  vote_average: number;
  type: "movie" | "tv";
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null); // Use number for browser setTimeout

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await searchMedia(searchQuery, 1);
      setResults(response.data || []);
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Debounce search
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }

    if (value.trim()) {
      timeoutRef.current = window.setTimeout(() => {
        handleSearch(value);
      }, 500);
    } else {
      setResults([]);
      setShowResults(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };


  return (
    <div className="relative w-full max-w-2xl" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search movies and TV shows..."
          className="w-full pl-10 pr-10 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-50 placeholder-slate-500"
          onFocus={() => query.trim() && setShowResults(true)}
        />
        
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            type="button"
          >
            <svg className="w-5 h-5 text-slate-400 hover:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="absolute right-3 top-3">
          <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-[500px] overflow-y-auto">
          <div className="p-4 border-b border-slate-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-50">Search Results</h3>
              <span className="text-sm text-slate-400">
                {results.length} {results.length === 1 ? 'result' : 'results'}
              </span>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {results.slice(0, 5).map((result) => (
              <div 
                key={`${result.id}-${result.type}`} 
                className="flex items-center space-x-3 p-3 bg-slate-900/50 hover:bg-slate-700/50 rounded-lg transition cursor-pointer"
                onClick={() => {
                  setShowResults(false);
                  setQuery("");
                  // Optional: Navigate to media details
                  // window.location.href = `/media/${result.type}/${result.id}`;
                }}
              >
                {result.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${result.poster_path}`}
                    alt={result.title}
                    className="w-12 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-16 bg-slate-700 rounded flex items-center justify-center">
                    <span className="text-2xl">🎬</span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-50 truncate">{result.title}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs px-2 py-1 bg-slate-700 rounded">
                      {result.type === 'movie' ? 'Movie' : 'TV Show'}
                    </span>
                    {result.release_date && (
                      <span className="text-xs text-slate-400">
                        {new Date(result.release_date).getFullYear()}
                      </span>
                    )}
                    <span className="text-xs text-rose-400">
                      ⭐ {(result.vote_average || 0).toFixed(1)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1 line-clamp-1">
                    {result.overview || "No description available"}
                  </p>
                </div>
              </div>
            ))}
            
            {results.length > 5 && (
              <div className="text-center pt-2">
                <button 
                  className="text-sm text-rose-400 hover:text-rose-300 hover:underline"
                  type="button"
                  onClick={() => {
                    // Handle view all results
                    window.location.href = `/movies?search=${encodeURIComponent(query)}`;
                  }}
                >
                  View all {results.length} results
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Results */}
      {showResults && !loading && results.length === 0 && query.trim() && (
        <div className="absolute z-50 mt-2 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4">
          <div className="text-center py-4">
            <div className="text-4xl mb-2">🔍</div>
            <h3 className="text-lg font-bold text-slate-50 mb-1">No results found</h3>
            <p className="text-slate-400">Try different keywords</p>
          </div>
        </div>
      )}
    </div>
  );
}