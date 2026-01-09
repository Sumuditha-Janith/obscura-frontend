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
import TMDBService from "../services/tmdb.service";
import ReportGenerator from "../components/ReportGenerator";

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
    const [showReportGenerator, setShowReportGenerator] = useState(false);

    // Separate filters for movies and TV shows
    const [movieFilter, setMovieFilter] = useState<"all" | "planned" | "completed">("all");
    const [tvFilter, setTvFilter] = useState<"all" | "planned" | "watching" | "completed">("all");

    // Content type state
    const [contentType, setContentType] = useState<"movies" | "tv">("movies");

    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [expandedTVShow, setExpandedTVShow] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            fetchWatchlist();
            fetchStats();
        }
    }, [user]);

    // Fetch watchlist when filter changes
    useEffect(() => {
        if (user) {
            fetchWatchlist();
        }
    }, [movieFilter, tvFilter, contentType]);

    const fetchWatchlist = async () => {
        try {
            // Fetch all watchlist items without filter
            const response = await getWatchlist(1);

            // Separate movies and TV shows
            const allMovies = response.data.filter((item: WatchlistItem) => item.type === "movie");
            const allTVShows = response.data.filter((item: WatchlistItem) => item.type === "tv");

            // Apply filters
            const filteredMovies = filterMovies(allMovies);
            const filteredTVShows = filterTVShows(allTVShows);

            setMovies(filteredMovies);
            setTVShows(filteredTVShows);
            setWatchlist(response.data);
        } catch (error: any) {
            setWatchlist([]);
            setMovies([]);
            setTVShows([]);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to filter movies
    const filterMovies = (moviesList: WatchlistItem[]): WatchlistItem[] => {
        if (movieFilter === "all") return moviesList;
        return moviesList.filter(movie => movie.watchStatus === movieFilter);
    };

    // Helper function to filter TV shows
    const filterTVShows = (tvList: WatchlistItem[]): WatchlistItem[] => {
        if (tvFilter === "all") return tvList;
        return tvList.filter(tv => tv.watchStatus === tvFilter);
    };

    const fetchStats = async () => {
        try {
            const [watchlistStatsRes, episodeStatsRes] = await Promise.all([
                getWatchlistStats(),
                getEpisodeStatistics()
            ]);

            setStats(watchlistStatsRes.data);
            setEpisodeStats(episodeStatsRes.data);
            setLastUpdated(new Date());
        } catch (error: any) {
            // Error handling
        }
    };

    const forceRefreshStats = async () => {
        setRefreshingStats(true);
        try {
            await Promise.all([fetchStats(), fetchWatchlist()]);
        } catch (error) {
            // Error handling
        } finally {
            setRefreshingStats(false);
        }
    };

    const handleStatusUpdate = async (mediaId: string, newStatus: "planned" | "watching" | "completed") => {
        const itemToUpdate = watchlist.find(item => item._id === mediaId);
        if (!itemToUpdate) {
            return;
        }

        if (itemToUpdate.type === "tv" && newStatus === "watching") {
            setExpandedTVShow(itemToUpdate._id);
        }

        // Update local state
        if (itemToUpdate.type === "movie") {
            setMovies(prev => prev.map(item =>
                item._id === mediaId ? { ...item, watchStatus: newStatus } : item
            ));
        } else {
            setTVShows(prev => prev.map(item =>
                item._id === mediaId ? { ...item, watchStatus: newStatus } : item
            ));
        }

        try {
            await updateWatchStatus(mediaId, { watchStatus: newStatus });
            await forceRefreshStats();
        } catch (error: any) {
            await fetchWatchlist();
        }
    };

    const handleRemove = async (mediaId: string) => {
        const itemToRemove = watchlist.find(item => item._id === mediaId);
        if (!itemToRemove) return;

        const confirmMessage = itemToRemove.type === "tv"
            ? `Are you sure you want to remove "${itemToRemove.title}" from your watchlist? This will also delete all episode tracking data for this show.`
            : `Are you sure you want to remove "${itemToRemove.title}" from your watchlist?`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            await removeFromWatchlist(mediaId);

            // Remove from local state immediately
            if (itemToRemove.type === "movie") {
                setMovies(prev => prev.filter(item => item._id !== mediaId));
            } else {
                setTVShows(prev => prev.filter(item => item._id !== mediaId));
            }
            setWatchlist(prev => prev.filter(item => item._id !== mediaId));

            // Close expanded view if open
            if (expandedTVShow === mediaId) {
                setExpandedTVShow(null);
            }

            // Force refresh stats to update totals
            await forceRefreshStats();

            alert(`${itemToRemove.type === "movie" ? "Movie" : "TV show"} removed successfully!`);
        } catch (error: any) {
            console.error("Remove error:", error);
            alert(error.response?.data?.message || "Failed to remove from watchlist");
        }
    };

    const handleEpisodeStatusChange = async () => {
        await forceRefreshStats();
    };

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

    // Get counts for filter tabs
    const getMovieCounts = () => {
        const allMovies = watchlist.filter(item => item.type === "movie");
        return {
            all: allMovies.length,
            planned: allMovies.filter(m => m.watchStatus === "planned").length,
            completed: allMovies.filter(m => m.watchStatus === "completed").length
        };
    };

    const getTVShowCounts = () => {
        const allTVShows = watchlist.filter(item => item.type === "tv");
        return {
            all: allTVShows.length,
            planned: allTVShows.filter(t => t.watchStatus === "planned").length,
            watching: allTVShows.filter(t => t.watchStatus === "watching").length,
            completed: allTVShows.filter(t => t.watchStatus === "completed").length
        };
    };

    const movieCounts = getMovieCounts();
    const tvShowCounts = getTVShowCounts();

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
                {/* Header with Report and Refresh Buttons */}
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
                        {/* Report Button */}
                        <button
                            onClick={() => setShowReportGenerator(true)}
                            className="flex items-center bg-blue-600 hover:bg-blue-700 text-slate-50 px-4 py-2 rounded-lg transition"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Generate Report
                        </button>

                        {/* Refresh Button - KEPT as requested */}
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

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    {/* 1. Movie Time - Completed movies only */}
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-3xl">🎬</div>

                        </div>
                        <p className="text-slate-400 text-sm mb-1">Movie Time</p>
                        <p className="text-2xl font-bold">{stats?.movieStats?.watchTimeFormatted || "0h 0m"}</p>
                        <div className="mt-2 pt-2 border-t border-slate-700">
                            <p className="text-xs text-slate-500">From {stats?.movieStats?.completed || 0} movies</p>
                        </div>
                    </div>

                    {/* 2. Movies Watched - Completed movies count */}
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-3xl">🎥</div>
                        </div>
                        <p className="text-slate-400 text-sm mb-1">Movies Watched</p>
                        <p className="text-2xl font-bold">{stats?.movieStats?.completed || 0}</p>
                        <div className="mt-2 pt-2 border-t border-slate-700">
                            <p className="text-xs text-slate-500">Out of {movieCounts.all} total</p>
                        </div>
                    </div>

                    {/* 3. TV Time - Completed TV shows only */}
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-3xl">📺</div>
                        </div>
                        <p className="text-slate-400 text-sm mb-1">TV Time</p>
                        <p className="text-2xl font-bold">{stats?.tvStats?.watchTimeFormatted || "0h 0m"}</p>
                        <div className="mt-2 pt-2 border-t border-slate-700">
                            <p className="text-xs text-slate-500">From {episodeStats?.summary?.totalWatched || 0} episodes</p>
                        </div>
                    </div>

                    {/* 4. Episodes Watched */}
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                        <div className="text-3xl mb-3">📊</div>
                        <p className="text-slate-400 text-sm">Episodes Watched</p>
                        <p className="text-2xl font-bold">{episodeStats?.summary?.totalWatched || 0}</p>
                        <div className="mt-2 pt-2 border-t border-slate-700">
                            <p className="text-xs text-slate-500">
                                {/* {episodeStats?.summary?.watchedEpisodes || 0} watched • {episodeStats?.summary?.skippedEpisodes || 0} skipped */}
                            </p>
                        </div>
                    </div>

                    {/* 5. Total Time */}
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                        <div className="text-3xl mb-3">⏱️</div>
                        <p className="text-slate-400 text-sm">Total Time</p>
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
                            🎬 Movies ({movieCounts.all})
                        </button>
                        <button
                            onClick={() => setContentType("tv")}
                            className={`px-4 py-3 font-medium transition ${contentType === "tv"
                                ? "text-rose-400 border-b-2 border-rose-400"
                                : "text-slate-400 hover:text-slate-300"
                            }`}
                        >
                            📺 TV Shows ({tvShowCounts.all})
                        </button>
                    </div>
                </div>

                {/* Movie Filter Tabs */}
                {contentType === "movies" && (
                    <div className="mb-6">
                        <div className="flex space-x-1 border-b border-slate-700">
                            <button
                                onClick={() => setMovieFilter("all")}
                                className={`px-4 py-3 font-medium text-sm transition ${movieFilter === "all"
                                    ? "text-rose-400 border-b-2 border-rose-400"
                                    : "text-slate-400 hover:text-slate-300"
                                }`}
                            >
                                All ({movieCounts.all})
                            </button>
                            <button
                                onClick={() => setMovieFilter("planned")}
                                className={`px-4 py-3 font-medium text-sm transition ${movieFilter === "planned"
                                    ? "text-rose-400 border-b-2 border-rose-400"
                                    : "text-slate-400 hover:text-slate-300"
                                }`}
                            >
                                Planned ({movieCounts.planned})
                            </button>
                            <button
                                onClick={() => setMovieFilter("completed")}
                                className={`px-4 py-3 font-medium text-sm transition ${movieFilter === "completed"
                                    ? "text-rose-400 border-b-2 border-rose-400"
                                    : "text-slate-400 hover:text-slate-300"
                                }`}
                            >
                                Completed ({movieCounts.completed})
                            </button>
                        </div>
                    </div>
                )}

                {/* TV Show Filter Tabs */}
                {contentType === "tv" && (
                    <div className="mb-6">
                        <div className="flex space-x-1 border-b border-slate-700">
                            <button
                                onClick={() => setTvFilter("all")}
                                className={`px-4 py-3 font-medium text-sm transition ${tvFilter === "all"
                                    ? "text-rose-400 border-b-2 border-rose-400"
                                    : "text-slate-400 hover:text-slate-300"
                                }`}
                            >
                                All ({tvShowCounts.all})
                            </button>
                            <button
                                onClick={() => setTvFilter("planned")}
                                className={`px-4 py-3 font-medium text-sm transition ${tvFilter === "planned"
                                    ? "text-rose-400 border-b-2 border-rose-400"
                                    : "text-slate-400 hover:text-slate-300"
                                }`}
                            >
                                Planned ({tvShowCounts.planned})
                            </button>
                            <button
                                onClick={() => setTvFilter("watching")}
                                className={`px-4 py-3 font-medium text-sm transition ${tvFilter === "watching"
                                    ? "text-rose-400 border-b-2 border-rose-400"
                                    : "text-slate-400 hover:text-slate-300"
                                }`}
                            >
                                Watching ({tvShowCounts.watching})
                            </button>
                            <button
                                onClick={() => setTvFilter("completed")}
                                className={`px-4 py-3 font-medium text-sm transition ${tvFilter === "completed"
                                    ? "text-rose-400 border-b-2 border-rose-400"
                                    : "text-slate-400 hover:text-slate-300"
                                }`}
                            >
                                Completed ({tvShowCounts.completed})
                            </button>
                        </div>
                    </div>
                )}

                {/* Movies Content */}
                {contentType === "movies" && (
                    <>
                        {movies.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {movies.map((item) => (
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
                                    {movieFilter === "all"
                                        ? "No movies in your watchlist"
                                        : `No ${movieFilter} movies`
                                    }
                                </h3>
                                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                                    {movieFilter === "all"
                                        ? "Start building your watchlist by searching for movies you want to watch"
                                        : `Try adding some movies to your ${movieFilter} list`
                                    }
                                </p>
                                <a
                                    href="/movies"
                                    className="inline-block bg-rose-600 hover:bg-rose-700 text-slate-50 font-bold py-3 px-6 rounded-lg transition duration-200"
                                >
                                    Discover Movies
                                </a>
                            </div>
                        )}
                    </>
                )}

                {/* TV Shows Content */}
                {contentType === "tv" && (
                    <>
                        {tvShows.length > 0 ? (
                            <div className="space-y-6">
                                {tvShows.map((item) => {
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
                                    {tvFilter === "all"
                                        ? "No TV shows in your watchlist"
                                        : `No ${tvFilter} TV shows`
                                    }
                                </h3>
                                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                                    {tvFilter === "all"
                                        ? "Add TV shows to track episodes and seasons individually"
                                        : `Try adding some TV shows to your ${tvFilter} list`
                                    }
                                </p>
                                <a
                                    href="/tvshows"
                                    className="inline-block bg-rose-600 hover:bg-rose-700 text-slate-50 font-bold py-3 px-6 rounded-lg transition duration-200"
                                >
                                    Discover TV Shows
                                </a>
                            </div>
                        )}
                    </>
                )}

                {showReportGenerator && (
                    <ReportGenerator onClose={() => setShowReportGenerator(false)} />
                )}
            </div>
        </div>
    );
}