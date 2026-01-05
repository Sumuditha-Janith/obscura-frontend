import { useState, useEffect } from "react";
import { getTrending, getPopularMovies, searchMedia } from "../services/media.service";
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

export default function Movies() {
    const [trending, setTrending] = useState<MediaItem[]>([]);
    const [popular, setPopular] = useState<MediaItem[]>([]);
    const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState({
        trending: true,
        popular: true,
        search: false,
    });
    const [activeTab, setActiveTab] = useState<"trending" | "popular" | "search">("trending");

    useEffect(() => {
        fetchTrendingMovies();
        fetchPopularMovies();
    }, []);

    // Helper function to format TMDB data
    const formatMediaItem = (item: TMDBMediaItem): MediaItem => {
        const isMovie = item.media_type === "movie" || (!item.media_type && item.title);

        return {
            id: item.id,
            title: isMovie ? item.title || "Unknown Movie" : item.name || "Unknown TV Show",
            overview: item.overview || "No description available",
            poster_path: item.poster_path || "",
            backdrop_path: item.backdrop_path || "",
            release_date: isMovie ? item.release_date || "" : item.first_air_date || "",
            vote_average: item.vote_average || 0,
            vote_count: item.vote_count || 0,
            type: isMovie ? "movie" : "tv",
            genre_ids: item.genre_ids || [],
        };
    };

    // Fetch trending movies (filtered for movies only)
    const fetchTrendingMovies = async () => {
        try {
            const response = await getTrending(1, "week");
            console.log("Trending API response:", response); // Debug log

            // Format data first
            const formattedItems = response.data.map(formatMediaItem);
            console.log("Formatted trending items:", formattedItems); // Debug log

            // Filter only movies
            const moviesOnly = formattedItems.filter((item: MediaItem) => item.type === "movie");
            console.log("Movies only:", moviesOnly); // Debug log

            setTrending(moviesOnly);
        } catch (error) {
            console.error("Failed to fetch trending movies:", error);
        } finally {
            setLoading(prev => ({ ...prev, trending: false }));
        }
    };

    // Fetch popular movies (already movies only from API)
    const fetchPopularMovies = async () => {
        try {
            const response = await getPopularMovies(1);
            console.log("Popular API response:", response); // Debug log

            // Format data
            const formattedItems = response.data.map((item: TMDBMediaItem) => formatMediaItem(item));
            setPopular(formattedItems);
        } catch (error) {
            console.error("Failed to fetch popular movies:", error);
        } finally {
            setLoading(prev => ({ ...prev, popular: false }));
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
            console.log("Search API response:", response); // Debug log

            // Format and filter only movies from search results
            const formattedItems = response.data.map(formatMediaItem);
            const moviesOnly = formattedItems.filter((item: MediaItem) => item.type === "movie");

            setSearchResults(moviesOnly);
        } catch (error) {
            console.error("Search error:", error);
            setSearchResults([]);
        } finally {
            setLoading(prev => ({ ...prev, search: false }));
        }
    };

    const getActiveContent = () => {
        switch (activeTab) {
            case "trending":
                return trending;
            case "popular":
                return popular;
            case "search":
                return searchResults;
            default:
                return [];
        }
    };

    const getActiveTitle = () => {
        switch (activeTab) {
            case "trending":
                return `🔥 Trending Movies This Week (${trending.length})`;
            case "popular":
                return `🎬 Popular Movies (${popular.length})`;
            case "search":
                return `🔍 Movie Search Results for "${searchQuery}" (${searchResults.length})`;
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
                    <h1 className="text-4xl font-bold mb-4">Discover Movies</h1>
                    <p className="text-slate-400">
                        Explore trending movies, popular films, and search from thousands of movie titles
                    </p>
                </div>

                {/* Search Bar - You can keep the existing SearchBar component */}
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
                            🔥 Trending Movies
                        </button>
                        <button
                            onClick={() => setActiveTab("popular")}
                            className={`px-4 py-3 font-medium text-sm transition ${
                                activeTab === "popular"
                                    ? "text-rose-400 border-b-2 border-rose-400"
                                    : "text-slate-400 hover:text-slate-300"
                            }`}
                        >
                            🎬 Popular Movies
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
                        Active Tab: {activeTab} | Trending: {trending.length} | Popular: {popular.length} | Search: {searchResults.length}
                    </p>
                </div>

                {/* Content Section */}
                <div>
                    {/* Section Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">{getActiveTitle()}</h2>
                        <span className="text-sm text-slate-400">
              Showing {getActiveContent().length} movies
            </span>
                    </div>

                    {/* Loading State */}
                    {(loading.trending && activeTab === "trending") ||
                    (loading.popular && activeTab === "popular") ||
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
                            {/* Movie Grid */}
                            {getActiveContent().length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {getActiveContent().slice(0, 20).map((media) => (
                                        <MovieCard
                                            key={`${media.id}-${media.type}`}
                                            media={{
                                                ...media,
                                                backdrop_path: media.backdrop_path || "",
                                                vote_count: media.vote_count || 0,
                                            }}
                                            showActions={true}
                                        />
                                    ))}
                                </div>
                            ) : (
                                /* Empty State */
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">🎬</div>
                                    <h3 className="text-xl font-bold mb-2">No movies found</h3>
                                    <p className="text-slate-400">
                                        {activeTab === "search"
                                            ? "Try a different search term"
                                            : "Unable to load movies at the moment. Please check your TMDB API configuration."}
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
                                        Load More Movies
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