// src/pages/TVShows.tsx - Fixed Version
import { useState, useEffect } from "react";
import { getTrending, searchMedia } from "../services/media.service";
import MovieCard from "../components/MovieCard";
import SearchBar from "../components/SearchBar";
import Navbar from "../components/Navbar";

interface TMDBMediaItem {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string;
  backdrop_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count?: number;
  media_type: "movie" | "tv";
  genre_ids?: number[];
}

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

export default function TVShows() {
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState({
    trending: true,
    search: false,
  });
  const [activeTab, setActiveTab] = useState<"trending" | "search">("trending");

  useEffect(() => {
    fetchTrendingTVShows();
  }, []);

  // Helper function to format TMDB data
  const formatMediaItem = (item: TMDBMediaItem): MediaItem => {
    const isTV = item.media_type === "tv" || (!item.media_type && item.name);
    
    return {
      id: item.id,
      title: isTV ? item.name || "Unknown TV Show" : item.title || "Unknown Movie",
      overview: item.overview || "No description available",
      poster_path: item.poster_path || "",
      backdrop_path: item.backdrop_path || "",
      release_date: isTV ? item.first_air_date || "" : item.release_date || "",
      vote_average: item.vote_average || 0,
      vote_count: item.vote_count || 0,
      type: isTV ? "tv" : "movie",
      genre_ids: item.genre_ids || [],
    };
  };

  // Fetch trending TV shows (filtered for TV only)
  const fetchTrendingTVShows = async () => {
    try {
      const response = await getTrending(1, "week");
      console.log("TV Shows - Trending API response:", response); // Debug log
      
      // Format data first
      const formattedItems = response.data.map(formatMediaItem);
      console.log("TV Shows - Formatted trending items:", formattedItems); // Debug log
      
      // Filter only TV shows
      const tvOnly = formattedItems.filter((item: MediaItem) => item.type === "tv");
      console.log("TV Shows only:", tvOnly); // Debug log
      
      setTrending(tvOnly);
    } catch (error) {
      console.error("Failed to fetch trending TV shows:", error);
    } finally {
      setLoading(prev => ({ ...prev, trending: false }));
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setActiveTab("trending");
      return;
    }

    setLoading(prev => ({ ...prev, search: true }));
    setActiveTab("search");
    
    try {
      const response = await searchMedia(query, 1);
      console.log("TV Shows - Search API response:", response); // Debug log
      
      // Format and filter only TV shows from search results
      const formattedItems = response.data.map(formatMediaItem);
      const tvOnly = formattedItems.filter((item: MediaItem) => item.type === "tv");
      
      setSearchResults(tvOnly);
    } catch (error) {
      console.error("TV Shows - Search error:", error);
      setSearchResults([]);
    } finally {
      setLoading(prev => ({ ...prev, search: false }));
    }
  };

  const getActiveContent = () => {
    switch (activeTab) {
      case "trending":
        return trending;
      case "search":
        return searchResults;
      default:
        return [];
    }
  };

  const getActiveTitle = () => {
    switch (activeTab) {
      case "trending":
        return `🔥 Trending TV Shows This Week (${trending.length})`;
      case "search":
        return `🔍 TV Show Search Results for "${searchQuery}" (${searchResults.length})`;
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Discover TV Shows</h1>
          <p className="text-slate-400">
            Explore trending TV shows, discover new series, and search from thousands of TV titles
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar />
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 border-b border-slate-700">
            <button
              onClick={() => setActiveTab("trending")}
              className={`px-4 py-3 font-medium text-sm transition ${
                activeTab === "trending"
                  ? "text-rose-400 border-b-2 border-rose-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              🔥 Trending TV Shows
            </button>
            {searchQuery && (
              <button
                onClick={() => setActiveTab("search")}
                className={`px-4 py-3 font-medium text-sm transition ${
                  activeTab === "search"
                    ? "text-rose-400 border-b-2 border-rose-400"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                🔍 Search Results
              </button>
            )}
          </div>
        </div>

        {/* Debug Info */}
        <div className="mb-4 p-4 bg-slate-800/50 rounded-lg">
          <p className="text-sm text-slate-400">
            Active Tab: {activeTab} | Trending TV Shows: {trending.length} | Search Results: {searchResults.length}
          </p>
        </div>

        {/* Content Section */}
        <div>
          {/* Section Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{getActiveTitle()}</h2>
            <span className="text-sm text-slate-400">
              Showing {getActiveContent().length} TV shows
            </span>
          </div>

          {/* Loading State */}
          {(loading.trending && activeTab === "trending") ||
           (loading.search && activeTab === "search") ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="bg-slate-800 rounded-2xl p-4 animate-pulse">
                  <div className="w-full h-48 bg-slate-700 rounded-xl mb-4"></div>
                  <div className="h-4 bg-slate-700 rounded mb-2"></div>
                  <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* TV Show Grid */}
              {getActiveContent().length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {getActiveContent().slice(0, 20).map((show) => (
                    <MovieCard
                      key={`${show.id}-${show.type}`}
                      media={{
                        ...show,
                        backdrop_path: show.backdrop_path || "",
                        vote_count: show.vote_count || 0,
                      }}
                      showActions={true}
                    />
                  ))}
                </div>
              ) : (
                /* Empty State */
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📺</div>
                  <h3 className="text-xl font-bold mb-2">No TV shows found</h3>
                  <p className="text-slate-400">
                    {activeTab === "search"
                      ? "Try a different search term"
                      : "Unable to load TV shows at the moment. Please check your TMDB API configuration."}
                  </p>
                  <div className="mt-4 text-sm text-slate-500">
                    <p>If you see 0 results, check:</p>
                    <p>1. TMDB API key in .env file</p>
                    <p>2. Network console for errors</p>
                    <p>3. API response format</p>
                  </div>
                </div>
              )}

              {/* View More Button */}
              {getActiveContent().length > 0 && (
                <div className="text-center mt-8">
                  <button className="bg-slate-800 hover:bg-slate-700 text-slate-50 font-medium py-3 px-6 rounded-lg transition duration-200 border border-slate-700">
                    Load More TV Shows
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}