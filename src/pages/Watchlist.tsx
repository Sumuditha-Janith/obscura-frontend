import { useState, useEffect } from "react";
import { 
  getWatchlist, 
  getWatchlistStats, 
  updateWatchStatus, 
  removeFromWatchlist,
  getEpisodeStatistics
} from "../services/media.service";
import MovieCard from "../components/MovieCard";
import TVEpisodeTracker from "../components/TVEpisodeTracker";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/authContext";
import { debug } from "../utils/debug";
import TMDBService from "../services/tmdb.service";

interface WatchlistItem {
    _id: string;
    tmdbId: number;
    title: string;
    type: "movie" | "tv";
    posterPath: string;
    backdrop_path?: string;
    releaseDate: string;
    watchStatus: "planned" | "watching" | "completed";
    rating?: number;
    watchTimeMinutes: number;
    vote_average?: number;
    vote_count?: number;
    overview?: string;
    
    // TV Show specific fields
    seasonCount?: number;
    episodeCount?: number;
    totalEpisodesWatched?: number;
    totalWatchTime?: number;
}

interface TVShowDetails {
    _id: string;
    tmdbId: number;
    title: string;
    posterPath: string;
    backdrop_path?: string;
    seasonCount?: number;
    episodeCount?: number;
    totalEpisodesWatched?: number;
    totalWatchTime?: number;
    watchStatus: "planned" | "watching" | "completed";
}

interface WatchlistStats {
    totalItems: number;
    totalWatchTime: number;
    totalWatchTimeFormatted: string;

    movieStats: {
        total: number;
        completed: number;
        watchTime: number;
        watchTimeFormatted: string;
    };

    tvStats: {
        total: number;
        completed: number;
        watchTime: number;
        watchTimeFormatted: string;
    };

    byStatus: Array<{
        status: string;
        count: number;
        time: number;
    }>;

    byType: Array<{
        type: string;
        count: number;
    }>;

    plannedCount: number;
    watchingCount: number;
    completedCount: number;
}

export default function Watchlist() {
    const { user } = useAuth();
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [movies, setMovies] = useState<WatchlistItem[]>([]);
    const [tvShows, setTVShows] = useState<WatchlistItem[]>([]);
    const [stats, setStats] = useState<WatchlistStats | null>(null);
    const [episodeStats, setEpisodeStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshingStats, setRefreshingStats] = useState(false);
    const [activeFilter, setActiveFilter] = useState<string>("all");
    const [contentType, setContentType] = useState<"movies" | "tv">("movies");
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [debugInfo, setDebugInfo] = useState<string[]>([]);
    const [expandedTVShow, setExpandedTVShow] = useState<string | null>(null);

    const addDebugInfo = (info: string) => {
        setDebugInfo(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${info}`]);
    };

    useEffect(() => {
        if (user) {
            debug.log('Watchlist', 'Component mounted or user changed', { user: user.email });
            addDebugInfo(`User logged in: ${user.email}`);
            fetchWatchlist();
            fetchStats();
        }
    }, [user, activeFilter]);

    const fetchWatchlist = async () => {
        try {
            addDebugInfo('Fetching watchlist...');
            const status = activeFilter === "all" ? undefined : activeFilter;
            const response = await getWatchlist(1, status);

            debug.log('Watchlist', 'Watchlist API response', {
                items: response.data.length,
                data: response.data
            });
            addDebugInfo(`Got ${response.data.length} watchlist items`);

            // Separate movies and TV shows
            const moviesList = response.data.filter((item: WatchlistItem) => item.type === "movie");
            const tvShowsList = response.data.filter((item: WatchlistItem) => item.type === "tv");
            
            setMovies(moviesList);
            setTVShows(tvShowsList);
            setWatchlist(response.data);

            // Calculate local stats from watchlist
            calculateLocalStats(response.data);
        } catch (error: any) {
            debug.error('Watchlist', 'Failed to fetch watchlist', error);
            addDebugInfo(`Error fetching watchlist: ${error.message}`);
            setWatchlist([]);
            setMovies([]);
            setTVShows([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            addDebugInfo('Fetching stats from API...');
            
            const [watchlistStatsRes, episodeStatsRes] = await Promise.all([
                getWatchlistStats(),
                getEpisodeStatistics()
            ]);

            setStats(watchlistStatsRes.data);
            setEpisodeStats(episodeStatsRes.data);
            setLastUpdated(new Date());
            
            addDebugInfo(`Stats loaded: ${watchlistStatsRes.data?.totalItems || 0} items`);
        } catch (error: any) {
            debug.error('Watchlist', 'Failed to fetch stats', error);
            addDebugInfo(`Error fetching stats: ${error.message}`);
            
            // Fall back to local calculation if API fails
            if (watchlist.length > 0) {
                addDebugInfo('Using local stats calculation');
                calculateLocalStats(watchlist);
            }
        }
    };

    const calculateLocalStats = (items: WatchlistItem[]) => {
        if (!items.length) {
            setStats(null);
            return;
        }

        const totalItems = items.length;

        // Calculate movie stats
        const movies = items.filter(item => item.type === "movie");
        const completedMovies = movies.filter(item => item.watchStatus === "completed");
        const movieWatchTime = completedMovies.reduce((sum, item) => sum + (item.watchTimeMinutes || 0), 0);

        // Calculate TV show stats (from episodeStats if available, otherwise from local data)
        const tvShows = items.filter(item => item.type === "tv");
        
        let tvWatchTime = 0;
        let totalEpisodesWatched = 0;
        
        if (episodeStats) {
            // Use episode statistics if available
            tvWatchTime = episodeStats.summary?.totalWatchTime || 0;
            totalEpisodesWatched = episodeStats.summary?.totalWatched || 0;
        } else {
            // Fall back to local calculation
            tvWatchTime = tvShows.reduce((sum, item) => sum + (item.totalWatchTime || 0), 0);
            totalEpisodesWatched = tvShows.reduce((sum, item) => sum + (item.totalEpisodesWatched || 0), 0);
        }

        // Calculate planned, watching, completed counts
        const plannedItems = items.filter(item => item.watchStatus === "planned");
        const watchingItems = items.filter(item => item.watchStatus === "watching");
        const completedCount = completedMovies.length + tvShows.filter(item => item.watchStatus === "completed").length;

        // Format times
        const formatTime = (minutes: number): string => {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours}h ${mins}m`;
        };

        // Build byStatus array
        const byStatus = [
            { status: "planned", count: plannedItems.length, time: 0 },
            { status: "watching", count: watchingItems.length, time: 0 },
            { status: "completed", count: completedCount, time: movieWatchTime + tvWatchTime }
        ].filter(s => s.count > 0);

        // Build byType array
        const byType = [
            { type: "movie", count: movies.length },
            { type: "tv", count: tvShows.length }
        ];

        const localStats = {
            totalItems,
            totalWatchTime: movieWatchTime + tvWatchTime,
            totalWatchTimeFormatted: formatTime(movieWatchTime + tvWatchTime),

            movieStats: {
                total: movies.length,
                completed: completedMovies.length,
                watchTime: movieWatchTime,
                watchTimeFormatted: formatTime(movieWatchTime)
            },

            tvStats: {
                total: tvShows.length,
                completed: 0, // We don't track completed TV shows
                watchTime: tvWatchTime,
                watchTimeFormatted: formatTime(tvWatchTime)
            },

            byStatus,
            byType,

            plannedCount: plannedItems.length,
            watchingCount: watchingItems.length,
            completedCount,
        };

        console.log("📊 Calculated local stats:", localStats);
        setStats(localStats);
    };

    const forceRefreshStats = async () => {
        addDebugInfo('Manual refresh triggered');
        setRefreshingStats(true);
        try {
            await Promise.all([fetchStats(), fetchWatchlist()]);
            addDebugInfo('Refresh completed successfully');
        } catch (error) {
            debug.error('Watchlist', 'Failed to refresh', error);
            addDebugInfo('Refresh failed');
        } finally {
            setRefreshingStats(false);
        }
    };

    const handleStatusUpdate = async (mediaId: string, newStatus: "planned" | "watching" | "completed") => {
        debug.log('Watchlist', 'handleStatusUpdate called', { mediaId, newStatus });
        addDebugInfo(`Updating status for ${mediaId} to ${newStatus}`);

        // Find the item being updated
        const itemToUpdate = watchlist.find(item => item._id === mediaId);
        if (!itemToUpdate) {
            debug.error('Watchlist', 'Item not found in watchlist', { mediaId });
            addDebugInfo(`Item ${mediaId} not found in watchlist`);
            return;
        }

        console.log('🔄 Status update details:', {
            title: itemToUpdate.title,
            currentStatus: itemToUpdate.watchStatus,
            newStatus,
            type: itemToUpdate.type
        });

        // If it's a TV show and we're marking it as "watching", auto-expand it
        if (itemToUpdate.type === "tv" && newStatus === "watching") {
            addDebugInfo(`Auto-expanding TV show: ${itemToUpdate.title}`);
            setExpandedTVShow(itemToUpdate._id);
        }

        // Update local state immediately (optimistic update)
        if (itemToUpdate.type === "movie") {
            setMovies(prev => prev.map(item => 
                item._id === mediaId ? { ...item, watchStatus: newStatus } : item
            ));
        } else {
            setTVShows(prev => prev.map(item => 
                item._id === mediaId ? { ...item, watchStatus: newStatus } : item
            ));
        }

        setWatchlist(prev => prev.map(item =>
            item._id === mediaId
                ? { ...item, watchStatus: newStatus }
                : item
        ));

        try {
            // Call the API to update status
            const response = await updateWatchStatus(mediaId, { watchStatus: newStatus });
            console.log('✅ API Response:', response);
            addDebugInfo(`API: Status updated to ${newStatus} for "${itemToUpdate.title}"`);

            // Refresh stats to ensure consistency
            await forceRefreshStats();

        } catch (error: any) {
            debug.error('Watchlist', 'Status update failed', error);
            console.error('❌ API Error:', error.response?.data || error.message);
            addDebugInfo(`Update failed: ${error.response?.data?.message || error.message}`);

            // Revert on error
            await fetchWatchlist();
        }
    }

    const handleRemove = async (mediaId: string) => {
        debug.log('Watchlist', 'handleRemove called', { mediaId });
        addDebugInfo(`Removing item ${mediaId}`);
        try {
            await removeFromWatchlist(mediaId);
            await forceRefreshStats();
        } catch (error) {
            debug.error('Watchlist', 'Failed to remove', error);
            addDebugInfo('Remove failed');
        }
    };

    const handleEpisodeStatusChange = async () => {
        // When episodes change, refresh the stats
        await forceRefreshStats();
    };

    const getFilteredMovies = () => {
        if (activeFilter === "all") return movies;
        return movies.filter(movie => movie.watchStatus === activeFilter);
    };

    const getFilteredTVShows = () => {
        if (activeFilter === "all") return tvShows;
        return tvShows.filter(tv => tv.watchStatus === activeFilter);
    };

    // Helper function to convert WatchlistItem to TVShowDetails
    const convertToTVShowDetails = (item: WatchlistItem): TVShowDetails => {
        return {
            _id: item._id,
            tmdbId: item.tmdbId,
            title: item.title,
            posterPath: item.posterPath,
            backdrop_path: item.backdrop_path,
            seasonCount: item.seasonCount || 1,
            episodeCount: item.episodeCount || 1,
            totalEpisodesWatched: item.totalEpisodesWatched || 0,
            totalWatchTime: item.totalWatchTime || 0,
            watchStatus: item.watchStatus
        };
    };

    const toggleTVShowExpand = (showId: string) => {
        setExpandedTVShow(expandedTVShow === showId ? null : showId);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 text-slate-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-slate-400">Loading your watchlist...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                {/* Header with Refresh Button */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">🎯 My Watchlist</h1>
                        <p className="text-slate-400">
                            Track your movies and TV shows
                        </p>
                        {lastUpdated && (
                            <p className="text-xs text-slate-500 mt-1">
                                Last updated: {lastUpdated.toLocaleTimeString()}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={forceRefreshStats}
                            disabled={refreshingStats}
                            className="flex items-center bg-rose-600 hover:bg-rose-700 text-slate-50 px-4 py-2 rounded-lg transition disabled:opacity-50"
                        >
                            {refreshingStats ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-slate-50 border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Refreshing...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Refresh Now
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Stats Overview - SIMPLIFIED */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Movie Stats */}
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-3xl">🎬</div>
                            <span className={`text-sm font-bold ${(stats?.movieStats?.completed || 0) > 0 ? "text-green-400" : "text-slate-400"}`}>
                                {(stats?.movieStats?.completed || 0)}/{(stats?.movieStats?.total || 0)}
                            </span>
                        </div>
                        <p className="text-slate-400 text-sm mb-1">Movies</p>
                        <p className="text-2xl font-bold">{stats?.movieStats?.total || 0}</p>
                        <div className="mt-2 pt-2 border-t border-slate-700">
                            <p className="text-xs text-slate-500">Completed Time</p>
                            <p className="text-sm font-medium text-slate-300">
                                {stats?.movieStats?.watchTimeFormatted || "0h 0m"}
                            </p>
                        </div>
                    </div>

                    {/* TV Shows */}
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                        <div className="text-3xl mb-3">📺</div>
                        <p className="text-slate-400 text-sm">TV Shows</p>
                        <p className="text-2xl font-bold">{stats?.tvStats?.total || 0}</p>
                        <div className="mt-2 pt-2 border-t border-slate-700">
                            <p className="text-xs text-slate-500">Episodes Watched</p>
                            <p className="text-sm font-medium text-slate-300">
                                {episodeStats?.summary?.totalWatched || 0} episodes
                            </p>
                        </div>
                    </div>

                    {/* Episodes Watched */}
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                        <div className="text-3xl mb-3">📊</div>
                        <p className="text-slate-400 text-sm">Episodes Watched</p>
                        <p className="text-2xl font-bold">{episodeStats?.summary?.totalWatched || 0}</p>
                        <div className="mt-2 pt-2 border-t border-slate-700">
                            <p className="text-xs text-slate-500">
                                {episodeStats?.summary?.watchedEpisodes || 0} watched • {episodeStats?.summary?.skippedEpisodes || 0} skipped
                            </p>
                        </div>
                    </div>

                    {/* Total Watch Time */}
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                        <div className="text-3xl mb-3">⏱️</div>
                        <p className="text-slate-400 text-sm">Total Watch Time</p>
                        <p className="text-2xl font-bold">{stats?.totalWatchTimeFormatted || "0h 0m"}</p>
                        <div className="mt-2 pt-2 border-t border-slate-700">
                            <p className="text-xs text-slate-500">
                                Movies: {stats?.movieStats?.watchTimeFormatted || "0h 0m"}
                            </p>
                            <p className="text-xs text-slate-500">
                                TV: {stats?.tvStats?.watchTimeFormatted || "0h 0m"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content Type Tabs */}
                <div className="mb-6">
                    <div className="flex space-x-1 border-b border-slate-700">
                        <button
                            onClick={() => setContentType("movies")}
                            className={`px-4 py-3 font-medium transition ${contentType === "movies"
                                    ? "text-rose-400 border-b-2 border-rose-400"
                                    : "text-slate-400 hover:text-slate-300"
                                }`}
                        >
                            🎬 Movies ({getFilteredMovies().length})
                        </button>
                        <button
                            onClick={() => setContentType("tv")}
                            className={`px-4 py-3 font-medium transition ${contentType === "tv"
                                    ? "text-rose-400 border-b-2 border-rose-400"
                                    : "text-slate-400 hover:text-slate-300"
                                }`}
                        >
                            📺 TV Shows ({getFilteredTVShows().length})
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="mb-4">
                    <div className="flex space-x-1 border-b border-slate-700">
                        <button
                            onClick={() => setActiveFilter("all")}
                            className={`px-4 py-3 font-medium text-sm transition ${activeFilter === "all"
                                    ? "text-rose-400 border-b-2 border-rose-400"
                                    : "text-slate-400 hover:text-slate-300"
                                }`}
                        >
                            All ({stats?.totalItems || 0})
                        </button>
                        <button
                            onClick={() => setActiveFilter("planned")}
                            className={`px-4 py-3 font-medium text-sm transition ${activeFilter === "planned"
                                    ? "text-rose-400 border-b-2 border-rose-400"
                                    : "text-slate-400 hover:text-slate-300"
                                }`}
                        >
                            Planned ({stats?.plannedCount || 0})
                        </button>
                        <button
                            onClick={() => setActiveFilter("watching")}
                            className={`px-4 py-3 font-medium text-sm transition ${activeFilter === "watching"
                                    ? "text-rose-400 border-b-2 border-rose-400"
                                    : "text-slate-400 hover:text-slate-300"
                                }`}
                        >
                            Watching ({stats?.watchingCount || 0})
                        </button>
                        <button
                            onClick={() => setActiveFilter("completed")}
                            className={`px-4 py-3 font-medium text-sm transition ${activeFilter === "completed"
                                    ? "text-rose-400 border-b-2 border-rose-400"
                                    : "text-slate-400 hover:text-slate-300"
                                }`}
                        >
                            Completed ({stats?.completedCount || 0})
                        </button>
                    </div>
                </div>

                {/* Separated Content */}
                {contentType === "movies" ? (
                    // Movies Section
                    getFilteredMovies().length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {getFilteredMovies().map((item) => (
                                <div key={item._id} className="relative">
                                    <MovieCard
                                        media={{
                                            id: item.tmdbId,
                                            title: item.title,
                                            overview: item.overview || "No description available",
                                            poster_path: item.posterPath,
                                            backdrop_path: item.backdrop_path || "",
                                            release_date: item.releaseDate,
                                            vote_average: item.vote_average || 0,
                                            vote_count: item.vote_count || 0,
                                            type: "movie",
                                        }}
                                        isInWatchlist={true}
                                        watchlistId={item._id}
                                        watchStatus={item.watchStatus}
                                        onStatusChange={(newStatus) => {
                                            debug.log('Watchlist', 'MovieCard onStatusChange triggered', {
                                                itemId: item._id,
                                                title: item.title,
                                                newStatus
                                            });
                                            addDebugInfo(`Status change for "${item.title}": ${item.watchStatus} → ${newStatus}`);
                                            handleStatusUpdate(item._id, newStatus);
                                        }}
                                        showActions={true}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="inline-block p-6 bg-slate-800 rounded-2xl mb-6">
                                <span className="text-6xl">🎬</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-2">
                                {activeFilter === "all"
                                    ? "No movies in your watchlist"
                                    : `No ${activeFilter} movies`
                                }
                            </h3>
                            <p className="text-slate-400 mb-6 max-w-md mx-auto">
                                {activeFilter === "all"
                                    ? "Start building your watchlist by searching for movies you want to watch"
                                    : `Try adding some movies to your ${activeFilter} list`
                                }
                            </p>
                            <a
                                href="/movies"
                                className="inline-block bg-rose-600 hover:bg-rose-700 text-slate-50 font-bold py-3 px-6 rounded-lg transition duration-200"
                            >
                                Discover Movies
                            </a>
                        </div>
                    )
                ) : (
                    // TV Shows Section
                    getFilteredTVShows().length > 0 ? (
                        <div className="space-y-6">
                            {getFilteredTVShows().map((item) => {
                                const tvShow: TVShowDetails = convertToTVShowDetails(item);
                                const isExpanded = expandedTVShow === item._id;
                                
                                return (
                                    <div key={item._id} className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                                        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
                                            {/* TV Show Poster */}
                                            <div className="md:w-48 flex-shrink-0">
                                                <div className="relative">
                                                    <img
                                                        src={TMDBService.getImageUrl(item.posterPath, "w342")}
                                                        alt={item.title}
                                                        className="w-full h-auto rounded-lg shadow-lg"
                                                    />
                                                    <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded-full">
                                                        <span className="text-sm font-bold text-rose-400">
                                                            ⭐ {item.vote_average?.toFixed(1) || "N/A"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* TV Show Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-2xl font-bold text-slate-50 mb-2">{item.title}</h3>
                                                        <div className="flex items-center space-x-3">
                                                            <span className="text-sm text-slate-400">
                                                                📅 {item.releaseDate ? new Date(item.releaseDate).getFullYear() : "Unknown"}
                                                            </span>
                                                            <span className="text-sm text-slate-400">
                                                                📺 {item.seasonCount || 1} season{item.seasonCount !== 1 ? 's' : ''}
                                                            </span>
                                                            <span className="text-sm text-slate-400">
                                                                🎬 {item.episodeCount || 1} episode{item.episodeCount !== 1 ? 's' : ''}
                                                            </span>
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.watchStatus === "completed" ? "bg-green-600 text-green-100" :
                                                                    item.watchStatus === "watching" ? "bg-blue-600 text-blue-100" :
                                                                        "bg-slate-600 text-slate-300"
                                                                }`}>
                                                                {item.watchStatus}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => toggleTVShowExpand(item._id)}
                                                            className="text-slate-400 hover:text-rose-400 px-3 py-1 rounded-lg hover:bg-slate-700 transition"
                                                            title={isExpanded ? "Collapse episodes" : "Show episodes"}
                                                        >
                                                            {isExpanded ? "▲" : "▼"} Episodes
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemove(item._id)}
                                                            className="text-slate-400 hover:text-rose-400 px-3 py-1 rounded-lg hover:bg-slate-700 transition"
                                                            title="Remove from watchlist"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                <p className="text-slate-300 mb-4 line-clamp-2">
                                                    {item.overview || "No description available"}
                                                </p>
                                                
                                                {/* Episode Progress */}
                                                <div className="mb-4">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-sm text-slate-400">
                                                            Episode Progress: {item.totalEpisodesWatched || 0}/{item.episodeCount || 1} episodes
                                                        </span>
                                                        <span className="text-sm text-rose-400">
                                                            {item.episodeCount ? Math.round(((item.totalEpisodesWatched || 0) / item.episodeCount) * 100) : 0}%
                                                        </span>
                                                    </div>
                                                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-green-500 rounded-full"
                                                            style={{
                                                                width: `${item.episodeCount ? ((item.totalEpisodesWatched || 0) / item.episodeCount) * 100 : 0}%`
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                
                                                {/* Episode Tracker (Expanded) */}
                                                {isExpanded && (
                                                    <div className="mt-4">
                                                        <TVEpisodeTracker
                                                            tvShow={tvShow}
                                                            onEpisodeStatusChange={handleEpisodeStatusChange}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="inline-block p-6 bg-slate-800 rounded-2xl mb-6">
                                <span className="text-6xl">📺</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-2">
                                {activeFilter === "all"
                                    ? "No TV shows in your watchlist"
                                    : `No ${activeFilter} TV shows`
                                }
                            </h3>
                            <p className="text-slate-400 mb-6 max-w-md mx-auto">
                                {activeFilter === "all"
                                    ? "Add TV shows to track episodes and seasons individually"
                                    : `Try adding some TV shows to your ${activeFilter} list`
                                }
                            </p>
                            <a
                                href="/movies"
                                className="inline-block bg-rose-600 hover:bg-rose-700 text-slate-50 font-bold py-3 px-6 rounded-lg transition duration-200"
                            >
                                Discover TV Shows
                            </a>
                        </div>
                    )
                )}

                {/* Debug Panel */}
                <div className="mt-8 p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold text-rose-400">Debug Console</h3>
                        <button
                            onClick={() => setDebugInfo([])}
                            className="text-xs text-slate-400 hover:text-slate-300"
                        >
                            Clear
                        </button>
                    </div>
                    <div className="h-32 overflow-y-auto bg-slate-900 rounded p-2 font-mono text-xs">
                        {debugInfo.length === 0 ? (
                            <p className="text-slate-500">No debug messages yet...</p>
                        ) : (
                            debugInfo.map((msg, idx) => (
                                <div key={idx} className="text-slate-300 mb-1">{msg}</div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}