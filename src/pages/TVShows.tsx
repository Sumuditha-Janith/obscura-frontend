import { useState, useEffect, useCallback } from "react";
import { getTrending, searchMedia } from "../services/media.service";
import MovieCard from "../components/MovieCard";
import SearchBar from "../components/SearchBar";
import Navbar from "../components/Navbar";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";

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
        trending: false,
        search: false,
    });
    const [activeTab, setActiveTab] = useState<"trending" | "search">("trending");
    
    // Pagination states
    const [trendingPage, setTrendingPage] = useState(1);
    const [searchPage, setSearchPage] = useState(1);
    const [hasMoreTrending, setHasMoreTrending] = useState(true);
    const [hasMoreSearch, setHasMoreSearch] = useState(true);

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

    // Fetch trending TV shows with pagination
    const fetchTrendingTVShows = async (page: number = 1, append: boolean = false) => {
        try {
            setLoading(prev => ({ ...prev, trending: true }));
            const response = await getTrending(page, "week");
            
            const formattedItems = response.data.map(formatMediaItem);
            const tvOnly = formattedItems.filter((item: MediaItem) => item.type === "tv");

            if (append) {
                setTrending(prev => [...prev, ...tvOnly]);
            } else {
                setTrending(tvOnly);
            }
            
            setHasMoreTrending(page < (response.pagination?.total_pages || 1));
            setTrendingPage(page);
        } catch (error) {
            console.error("Failed to fetch trending TV shows:", error);
        } finally {
            setLoading(prev => ({ ...prev, trending: false }));
        }
    };

    useEffect(() => {
        fetchTrendingTVShows(1);
    }, []);

    const handleSearch = async (query: string) => {
        setSearchQuery(query);

        if (!query.trim()) {
            setSearchResults([]);
            setActiveTab("trending");
            setSearchPage(1);
            setHasMoreSearch(true);
            return;
        }

        setLoading(prev => ({ ...prev, search: true }));
        setActiveTab("search");

        try {
            const response = await searchMedia(query, 1);
            const formattedItems = response.data.map(formatMediaItem);
            const tvOnly = formattedItems.filter((item: MediaItem) => item.type === "tv");

            setSearchResults(tvOnly);
            setHasMoreSearch(1 < (response.pagination?.total_pages || 1));
            setSearchPage(1);
        } catch (error) {
            console.error("TV Shows - Search error:", error);
            setSearchResults([]);
        } finally {
            setLoading(prev => ({ ...prev, search: false }));
        }
    };

    // Infinite scroll handlers
    const loadMoreTrending = useCallback(async () => {
        if (!hasMoreTrending || loading.trending) return;
        await fetchTrendingTVShows(trendingPage + 1, true);
    }, [hasMoreTrending, loading.trending, trendingPage]);

    const loadMoreSearch = useCallback(async () => {
        if (!hasMoreSearch || loading.search || !searchQuery.trim()) return;
        
        setLoading(prev => ({ ...prev, search: true }));
        try {
            const response = await searchMedia(searchQuery, searchPage + 1);
            const formattedItems = response.data.map(formatMediaItem);
            const tvOnly = formattedItems.filter((item: MediaItem) => item.type === "tv");

            setSearchResults(prev => [...prev, ...tvOnly]);
            setHasMoreSearch(searchPage + 1 < (response.pagination?.total_pages || 1));
            setSearchPage(prev => prev + 1);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setLoading(prev => ({ ...prev, search: false }));
        }
    }, [hasMoreSearch, loading.search, searchQuery, searchPage]);

    // Get active load more function
    const getLoadMoreFunction = () => {
        switch (activeTab) {
            case "trending": return loadMoreTrending;
            case "search": return loadMoreSearch;
            default: return async () => {};
        }
    };

    // Get active hasMore state
    const getHasMore = () => {
        switch (activeTab) {
            case "trending": return hasMoreTrending;
            case "search": return hasMoreSearch;
            default: return false;
        }
    };

    // Get active loading state
    const getIsLoading = () => {
        switch (activeTab) {
            case "trending": return loading.trending;
            case "search": return loading.search;
            default: return false;
        }
    };

    // Setup infinite scroll
    const { sentinelRef, isFetching } = useInfiniteScroll(
        getLoadMoreFunction(),
        getHasMore(),
        getIsLoading()
    );

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
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {getActiveContent().map((show) => (
                                            <MovieCard
                                                key={`${show.id}-${show.type}-${Math.random()}`}
                                                media={{
                                                    ...show,
                                                    backdrop_path: show.backdrop_path || "",
                                                    vote_count: show.vote_count || 0,
                                                }}
                                                showActions={true}
                                            />
                                        ))}
                                    </div>

                                    {/* Sentinel for infinite scroll */}
                                    <div ref={sentinelRef} className="h-20 flex items-center justify-center">
                                        {(isFetching || (activeTab === "trending" && loading.trending) ||
                                            (activeTab === "search" && loading.search)) && (
                                                <div className="flex flex-col items-center space-y-4">
                                                    <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                                                    <p className="text-slate-400 text-sm">Loading more TV shows...</p>
                                                </div>
                                            )}
                                    </div>

                                    {/* No more content message */}
                                    {!getHasMore() && getActiveContent().length > 0 && (
                                        <div className="text-center py-8">
                                            <p className="text-slate-400">No more TV shows to load</p>
                                            <p className="text-sm text-slate-500 mt-1">
                                                You've reached the end of {getActiveTitle().toLowerCase()}
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* Empty State */
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📺</div>
                                    <h3 className="text-xl font-bold mb-2">No TV shows found</h3>
                                    <p className="text-slate-400">
                                        {activeTab === "search"
                                            ? "Try a different search term"
                                            : "Unable to load TV shows at the moment."}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}