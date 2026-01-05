import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchMedia } from "../services/media.service";
import MovieCard from "../components/MovieCard";
import Navbar from "../components/Navbar";

interface MediaItem {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path?: string;
  release_date: string;
  vote_average: number;
  vote_count?: number;
  type: "movie" | "tv";
  genre_ids?: number[];
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("search") || "";
  const type = searchParams.get("type") || "all";
  
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (query) {
      fetchSearchResults();
    }
  }, [query, page, type]);

  const fetchSearchResults = async () => {
    try {
      setLoading(true);
      const response = await searchMedia(query, page);
      
      // Filter by type if specified
      let filteredResults = response.data || [];
      if (type !== "all") {
        filteredResults = filteredResults.filter((item: MediaItem) => item.type === type);
      }
      
      setResults(filteredResults);
      setTotalPages(response.pagination?.total_pages || 1);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case "movie": return "Movies";
      case "tv": return "TV Shows";
      default: return "All";
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-slate-50 mb-4 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          
          <h1 className="text-3xl font-bold mb-2">
            Search Results for "{query}"
          </h1>
          <p className="text-slate-400">
            Found {results.length} {getTypeLabel().toLowerCase()}
          </p>
        </div>

        {/* Type Filter */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {["all", "movie", "tv"].map((filterType) => (
              <button
                key={filterType}
                onClick={() => {
                  navigate(`/search-results?search=${encodeURIComponent(query)}&type=${filterType}`);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg ${type === filterType
                  ? "bg-rose-600 text-slate-50"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {filterType === "movie" ? "🎬 Movies" : 
                 filterType === "tv" ? "📺 TV Shows" : "All"}
              </button>
            ))}
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-slate-800 rounded-2xl p-4 animate-pulse">
                <div className="w-full h-48 bg-slate-700 rounded-xl mb-4"></div>
                <div className="h-4 bg-slate-700 rounded mb-2"></div>
                <div className="h-3 bg-slate-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {results.map((media) => (
                <MovieCard
                  key={`${media.id}-${media.type}`}
                  media={{
                    id: media.id,
                    title: media.title,
                    overview: media.overview || "",
                    poster_path: media.poster_path || "",
                    backdrop_path: media.backdrop_path,
                    release_date: media.release_date || "",
                    vote_average: media.vote_average || 0,
                    vote_count: media.vote_count || 0,
                    type: media.type,
                    genre_ids: media.genre_ids || []
                  }}
                  showActions={true}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <button
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-slate-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold mb-2">No results found</h3>
            <p className="text-slate-400 mb-6">Try a different search term</p>
            <button
              onClick={() => navigate("/")}
              className="bg-rose-600 hover:bg-rose-700 text-slate-50 font-bold py-3 px-6 rounded-lg transition"
            >
              Go Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}