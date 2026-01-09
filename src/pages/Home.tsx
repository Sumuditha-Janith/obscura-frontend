import { useState, useEffect, useCallback } from "react";
import { getTrending, getPopularMovies, searchMedia, getWatchlist } from "../services/media.service";
import MovieCard from "../components/MovieCard";
import Navbar from "../components/Navbar";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import AIChat from "../components/AIChatBot";
import { useAuth } from "../context/authContext";

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
    media_type?: "movie" | "tv";
}

interface WatchlistItem {
    _id: string;
    tmdbId: number;
    title: string;
    type: "movie" | "tv";
    posterPath: string;
    releaseDate: string;
    watchStatus: "planned" | "watching" | "completed";
    watchTimeMinutes: number;
}

export default function Home() {
    const { user } = useAuth();
    const [trending, setTrending] = useState<MediaItem[]>([]);
    const [popular, setPopular] = useState<MediaItem[]>([]);
    const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
    const [searchQuery] = useState("");
    const [loading, setLoading] = useState({
        trending: false,
        popular: false,
        search: false,
        watchlist: false,
    });
    const [activeTab, setActiveTab] = useState<"trending" | "popular" | "search">("trending");
    const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
    
    // Pagination states
    const [trendingPage, setTrendingPage] = useState(1);
    const [popularPage, setPopularPage] = useState(1);
    const [searchPage, setSearchPage] = useState(1);
    const [hasMoreTrending, setHasMoreTrending] = useState(true);
    const [hasMorePopular, setHasMorePopular] = useState(true);
    const [hasMoreSearch, setHasMoreSearch] = useState(true);

    // Fetch watchlist
    const fetchWatchlist = async () => {
        if (!user) return;
        
        setLoading(prev => ({ ...prev, watchlist: true }));
        try {
            const response = await getWatchlist(1);
            setWatchlistItems(response.data || []);
        } catch (error) {
            console.error("Failed to fetch watchlist:", error);
            setWatchlistItems([]);
        } finally {
            setLoading(prev => ({ ...prev, watchlist: false }));
        }
    };

    useEffect(() => {
        fetchTrending(1);
        fetchPopular(1);
        if (user) {
            fetchWatchlist();
        }
    }, [user]);

    const fetchTrending = async (page: number = 1, append: boolean = false) => {
        try {
            setLoading(prev => ({ ...prev, trending: true }));
            const response = await getTrending(page, "week");
            console.log("Trending response:", response);

            const formattedData = response.data.map((item: any) => ({
                id: item.id,
                title: item.title || item.name || "Unknown",
                overview: item.overview || "",
                poster_path: item.poster_path || "",
                backdrop_path: item.backdrop_path,
                release_date: item.release_date || item.first_air_date || "",
                vote_average: item.vote_average || 0,
                vote_count: item.vote_count || 0,
                type: item.type || item.media_type || (item.title ? "movie" : "tv"),
                media_type: item.media_type || item.type || (item.title ? "movie" : "tv"),
                genre_ids: item.genre_ids || []
            }));

            if (append) {
                setTrending(prev => [...prev, ...formattedData]);
            } else {
                setTrending(formattedData);
            }
            
            setHasMoreTrending(page < (response.pagination?.total_pages || 1));
            setTrendingPage(page);
        } catch (error) {
            console.error("Failed to fetch trending:", error);
        } finally {
            setLoading(prev => ({ ...prev, trending: false }));
        }
    };

    const fetchPopular = async (page: number = 1, append: boolean = false) => {
        try {
            setLoading(prev => ({ ...prev, popular: true }));
            const response = await getPopularMovies(page);
            console.log("Popular response:", response);

            const formattedData = response.data.map((item: any) => ({
                id: item.id,
                title: item.title || item.name || "Unknown",
                overview: item.overview || "",
                poster_path: item.poster_path || "",
                backdrop_path: item.backdrop_path,
                release_date: item.release_date || item.first_air_date || "",
                vote_average: item.vote_average || 0,
                vote_count: item.vote_count || 0,
                type: "movie",
                media_type: "movie",
                genre_ids: item.genre_ids || []
            }));

            if (append) {
                setPopular(prev => [...prev, ...formattedData]);
            } else {
                setPopular(formattedData);
            }
            
            setHasMorePopular(page < (response.pagination?.total_pages || 1));
            setPopularPage(page);
        } catch (error) {
            console.error("Failed to fetch popular:", error);
        } finally {
            setLoading(prev => ({ ...prev, popular: false }));
        }
    };

    // Infinite scroll handlers
    const loadMoreTrending = useCallback(async () => {
        if (!hasMoreTrending || loading.trending) return;
        await fetchTrending(trendingPage + 1, true);
    }, [hasMoreTrending, loading.trending, trendingPage]);

    const loadMorePopular = useCallback(async () => {
        if (!hasMorePopular || loading.popular) return;
        await fetchPopular(popularPage + 1, true);
    }, [hasMorePopular, loading.popular, popularPage]);

    const loadMoreSearch = useCallback(async () => {
        if (!hasMoreSearch || loading.search || !searchQuery.trim()) return;
        
        setLoading(prev => ({ ...prev, search: true }));
        try {
            const response = await searchMedia(searchQuery, searchPage + 1);
            
            const formattedData = response.data.map((item: any) => ({
                id: item.id,
                title: item.title || "Unknown",
                overview: item.overview || "",
                poster_path: item.poster_path || "",
                backdrop_path: item.backdrop_path,
                release_date: item.release_date || "",
                vote_average: item.vote_average || 0,
                vote_count: item.vote_count || 0,
                type: item.type || (item.title ? "movie" : "tv"),
                media_type: item.media_type || item.type || (item.title ? "movie" : "tv"),
                genre_ids: item.genre_ids || []
            }));

            setSearchResults(prev => [...prev, ...formattedData]);
            setHasMoreSearch(searchPage + 1 < (response.pagination?.total_pages || 1));
            setSearchPage(prev => prev + 1);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setLoading(prev => ({ ...prev, search: false }));
        }
    }, [hasMoreSearch, loading.search, searchQuery, searchPage]);

    // Get active load more function
    const getLoadMoreFunction = useCallback(() => {
        switch (activeTab) {
            case "trending": return loadMoreTrending;
            case "popular": return loadMorePopular;
            case "search": return loadMoreSearch;
            default: return async () => {};
        }
    }, [activeTab, loadMoreTrending, loadMorePopular, loadMoreSearch]);

    // Get active hasMore state
    const getHasMore = useCallback(() => {
        switch (activeTab) {
            case "trending": return hasMoreTrending;
            case "popular": return hasMorePopular;
            case "search": return hasMoreSearch;
            default: return false;
        }
    }, [activeTab, hasMoreTrending, hasMorePopular, hasMoreSearch]);

    // Get active loading state
    const getIsLoading = useCallback(() => {
        switch (activeTab) {
            case "trending": return loading.trending;
            case "popular": return loading.popular;
            case "search": return loading.search;
            default: return false;
        }
    }, [activeTab, loading.trending, loading.popular, loading.search]);

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
                return "🔥 Trending This Week";
            case "popular":
                return "🎬 Popular Movies";
            case "search":
                return `🔍 Search Results for "${searchQuery}"`;
            default:
                return "";
        }
    };

    const handleWatchlistChange = () => {
        fetchWatchlist();
    };

    const findWatchlistItem = (mediaId: number, type: string) => {
        return watchlistItems.find(item => 
            item.tmdbId === mediaId && 
            item.type === type
        );
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-4">Discover Movies & TV Shows</h1>
                    <p className="text-slate-400">
                        Explore trending content, popular movies, and search from thousands of titles
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="mb-8">
                    <div className="flex space-x-1 border-b border-slate-700">
                        <button
                            onClick={() => setActiveTab("trending")}
                            className={`px-4 py-3 font-medium text-sm transition ${activeTab === "trending"
                                ? "text-rose-400 border-b-2 border-rose-400"
                                : "text-slate-400 hover:text-slate-300"
                                }`}
                        >
                            🔥 Trending
                        </button>
                        <button
                            onClick={() => setActiveTab("popular")}
                            className={`px-4 py-3 font-medium text-sm transition ${activeTab === "popular"
                                ? "text-rose-400 border-b-2 border-rose-400"
                                : "text-slate-400 hover:text-slate-300"
                                }`}
                        >
                            🎬 Popular
                        </button>
                        {searchQuery && (
                            <button
                                onClick={() => setActiveTab("search")}
                                className={`px-4 py-3 font-medium text-sm transition ${activeTab === "search"
                                    ? "text-rose-400 border-b-2 border-rose-400"
                                    : "text-slate-400 hover:text-slate-300"
                                    }`}
                            >
                                🔍 Search
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
                            {getActiveContent().length} titles
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
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {getActiveContent().map((media, index) => {
                                            const watchlistItem = findWatchlistItem(media.id, media.type);
                                            
                                            return (
                                                <MovieCard
                                                    key={`${media.id}-${media.type}-${index}`}
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
                                                        media_type: media.media_type,
                                                        genre_ids: media.genre_ids || []
                                                    }}
                                                    isInWatchlist={!!watchlistItem}
                                                    watchlistId={watchlistItem?._id}
                                                    watchStatus={watchlistItem?.watchStatus as "planned" | "watching" | "completed" || "planned"}
                                                    onStatusChange={(newStatus) => {
                                                        // Update local state when status changes
                                                        const itemIndex = watchlistItems.findIndex(item => 
                                                            item.tmdbId === media.id && 
                                                            item.type === media.type
                                                        );
                                                        if (itemIndex !== -1) {
                                                            const updatedItems = [...watchlistItems];
                                                            updatedItems[itemIndex] = {
                                                                ...updatedItems[itemIndex],
                                                                watchStatus: newStatus
                                                            };
                                                            setWatchlistItems(updatedItems);
                                                        }
                                                    }}
                                                    onWatchlistChange={handleWatchlistChange}
                                                    showActions={true}
                                                />
                                            );
                                        })}
                                    </div>

                                    {/* Sentinel for infinite scroll */}
                                    <div ref={sentinelRef} className="h-20 flex items-center justify-center">
                                        {(isFetching || (activeTab === "trending" && loading.trending) ||
                                            (activeTab === "popular" && loading.popular) ||
                                            (activeTab === "search" && loading.search)) && (
                                                <div className="flex flex-col items-center space-y-4">
                                                    <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                                                    <p className="text-slate-400 text-sm">Loading more...</p>
                                                </div>
                                            )}
                                    </div>

                                    {/* No more content message */}
                                    {!getHasMore() && getActiveContent().length > 0 && (
                                        <div className="text-center py-8">
                                            <p className="text-slate-400">No more content to load</p>
                                            <p className="text-sm text-slate-500 mt-1">
                                                You've reached the end of {getActiveTitle().toLowerCase()}
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* Empty State */
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">🎬</div>
                                    <h3 className="text-xl font-bold mb-2">No content found</h3>
                                    <p className="text-slate-400">
                                        {activeTab === "search"
                                            ? "Try a different search term"
                                            : "Unable to load content at the moment"}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            <AIChat />
        </div>
    );
}