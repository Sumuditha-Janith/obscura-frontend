import { useState, useEffect } from "react";
import { getWatchlist, getWatchlistStats, updateWatchStatus, removeFromWatchlist } from "../services/media.service";
import MovieCard from "../components/MovieCard";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/authContext";

interface WatchlistItem {
  _id: string;
  tmdbId: number;
  title: string;
  type: "movie" | "tv";
  posterPath: string;
  releaseDate: string;
  watchStatus: "planned" | "watching" | "completed";
  rating?: number;
  watchTimeMinutes: number;
}

interface WatchlistStats {
  totalItems: number;
  totalWatchTime: number;
  totalWatchTimeFormatted: string;
  byStatus: Array<{
    status: string;
    count: number;
    time: number;
  }>;
  byType: Array<{
    type: string;
    count: number;
  }>;
}

export default function Watchlist() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [stats, setStats] = useState<WatchlistStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (user) {
      fetchWatchlist();
      fetchStats();
    }
  }, [user, activeFilter, refreshTrigger]);

  const fetchWatchlist = async () => {
    try {
      const status = activeFilter === "all" ? undefined : activeFilter;
      const response = await getWatchlist(1, status);
      setWatchlist(response.data);
    } catch (error) {
      console.error("Failed to fetch watchlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getWatchlistStats();
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleStatusUpdate = async (mediaId: string, newStatus: "planned" | "watching" | "completed") => {
    try {
      await updateWatchStatus(mediaId, { watchStatus: newStatus });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleRemove = async (mediaId: string) => {
    try {
      await removeFromWatchlist(mediaId);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Failed to remove:", error);
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusCount = (status: string): number => {
    if (!stats) return 0;
    const statusData = stats.byStatus.find(s => s.status === status);
    return statusData?.count || 0;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please login to view your watchlist</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🎯 My Watchlist</h1>
          <p className="text-slate-400">
            Track your movies and TV shows across different statuses
          </p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <div className="text-3xl mb-2">📊</div>
              <p className="text-slate-400 text-sm">Total Items</p>
              <p className="text-2xl font-bold">{stats.totalItems}</p>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <div className="text-3xl mb-2">⏱️</div>
              <p className="text-slate-400 text-sm">Total Watch Time</p>
              <p className="text-2xl font-bold">{stats.totalWatchTimeFormatted}</p>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-slate-400 text-sm">Planned</p>
              <p className="text-2xl font-bold">{getStatusCount("planned")}</p>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-slate-400 text-sm">Completed</p>
              <p className="text-2xl font-bold">{getStatusCount("completed")}</p>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 border-b border-slate-700">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-3 font-medium text-sm transition ${
                activeFilter === "all"
                  ? "text-rose-400 border-b-2 border-rose-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              All ({stats?.totalItems || 0})
            </button>
            <button
              onClick={() => setActiveFilter("planned")}
              className={`px-4 py-3 font-medium text-sm transition ${
                activeFilter === "planned"
                  ? "text-rose-400 border-b-2 border-rose-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Planned ({getStatusCount("planned")})
            </button>
            <button
              onClick={() => setActiveFilter("watching")}
              className={`px-4 py-3 font-medium text-sm transition ${
                activeFilter === "watching"
                  ? "text-rose-400 border-b-2 border-rose-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Watching ({getStatusCount("watching")})
            </button>
            <button
              onClick={() => setActiveFilter("completed")}
              className={`px-4 py-3 font-medium text-sm transition ${
                activeFilter === "completed"
                  ? "text-rose-400 border-b-2 border-rose-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Completed ({getStatusCount("completed")})
            </button>
          </div>
        </div>

        {/* Watchlist Content */}
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
        ) : watchlist.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {watchlist.map((item) => (
                <MovieCard
                  key={item._id}
                  media={{
                    id: item.tmdbId,
                    title: item.title,
                    overview: "",
                    poster_path: item.posterPath,
                    backdrop_path: "",
                    release_date: item.releaseDate,
                    vote_average: 0,
                    vote_count: 0, 
                    type: item.type,
                  }}
                  isInWatchlist={true}
                  watchlistId={item._id}
                  watchStatus={item.watchStatus}
                  onStatusChange={() => setRefreshTrigger(prev => prev + 1)}
                />
              ))}
            </div>

            {/* Empty state for filtered view */}
            {watchlist.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">
                  {activeFilter === "planned" ? "📋" :
                   activeFilter === "watching" ? "👀" :
                   activeFilter === "completed" ? "✅" : "🎬"}
                </div>
                <h3 className="text-xl font-bold mb-2">No {activeFilter} items</h3>
                <p className="text-slate-400 mb-4">
                  {activeFilter === "all" 
                    ? "Your watchlist is empty. Start adding movies and TV shows!"
                    : `You don't have any ${activeFilter} items in your watchlist.`}
                </p>
                {activeFilter !== "all" && (
                  <button
                    onClick={() => setActiveFilter("all")}
                    className="bg-rose-600 hover:bg-rose-700 text-slate-50 font-medium py-2 px-4 rounded-lg transition"
                  >
                    View All Items
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          /* Empty watchlist */
          <div className="text-center py-12">
            <div className="inline-block p-6 bg-slate-800 rounded-2xl mb-6">
              <span className="text-6xl">🎬</span>
            </div>
            <h3 className="text-2xl font-bold mb-2">Your watchlist is empty</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Start building your watchlist by searching for movies and TV shows you want to watch
            </p>
            <a
              href="/movies"
              className="inline-block bg-rose-600 hover:bg-rose-700 text-slate-50 font-bold py-3 px-6 rounded-lg transition duration-200"
            >
              Discover Movies
            </a>
          </div>
        )}

        {/* Watchlist Tips */}
        <div className="mt-12 p-6 bg-slate-800 rounded-2xl border border-slate-700">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-3">💡</span> Watchlist Tips
          </h3>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-center">
              <span className="text-rose-400 mr-2">•</span>
              Use the status buttons to track your progress
            </li>
            <li className="flex items-center">
              <span className="text-rose-400 mr-2">•</span>
              Add ratings to completed items to remember your favorites
            </li>
            <li className="flex items-center">
              <span className="text-rose-400 mr-2">•</span>
              Watch time is automatically calculated based on content type
            </li>
            <li className="flex items-center">
              <span className="text-rose-400 mr-2">•</span>
              Filter by status to focus on what you want to watch next
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}