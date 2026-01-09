import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getMediaDetails, addToWatchlist, removeFromWatchlist, updateWatchStatus } from "../services/media.service";
import { getWatchlist } from "../services/media.service";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/authContext";
import api from "../services/api";
import { confirmDialog, errorAlert, infoAlert, successAlert, warningAlert } from "../utils/swal";

interface MediaDetails {
    id: number;
    title: string;
    name?: string;
    overview: string;
    poster_path: string;
    backdrop_path: string;
    release_date: string;
    vote_average: number;
    vote_count: number;
    runtime?: number;
    genres: { id: number; name: string }[];
    tagline?: string;
    status: string;
    budget?: number;
    revenue?: number;
    homepage?: string;
    imdb_id?: string;
    type: "movie" | "tv";
    watchTimeMinutes?: number;
    credits?: {
        cast: Array<{
            id: number;
            name: string;
            character: string;
            profile_path: string;
        }>;
        crew: Array<{
            id: number;
            name: string;
            job: string;
            profile_path: string;
        }>;
    };
    videos?: {
        results: Array<{
            id: string;
            key: string;
            name: string;
            site: string;
            type: string;
        }>;
    };
    similar?: {
        results: Array<{
            id: number;
            title?: string;
            name?: string;
            poster_path: string;
            vote_average: number;
        }>;
    };
    first_air_date?: string;
    number_of_seasons?: number;
    number_of_episodes?: number;
    episode_run_time?: number[];
    seasons?: Array<{
        season_number: number;
        episode_count: number;
        name: string;
        air_date?: string;
        poster_path?: string;
        overview?: string;
    }>;
}

interface WatchlistItem {
    _id: string;
    tmdbId: number;
    watchStatus: "planned" | "watching" | "completed";
}

interface Episode {
    id: number;
    episode_number: number;
    name: string;
    overview: string;
    still_path: string;
    air_date: string;
    runtime: number;
    vote_average: number;
    vote_count: number;
    crew: Array<any>;
    guest_stars: Array<any>;
}

interface Season {
    season_number: number;
    name: string;
    episode_count: number;
    poster_path: string;
    air_date: string;
    overview: string;
    episodes: Episode[];
}

export default function MediaDetails() {
    const { type, id } = useParams<{ type: string; id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [media, setMedia] = useState<MediaDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [inWatchlist, setInWatchlist] = useState(false);
    const [watchlistId, setWatchlistId] = useState("");
    const [watchStatus, setWatchStatus] = useState<"planned" | "watching" | "completed">("planned");
    const [isAdding, setIsAdding] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "cast" | "similar" | "episodes">("overview");

    // New state for episodes
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [loadingEpisodes, setLoadingEpisodes] = useState(false);
    const [selectedSeason, setSelectedSeason] = useState<number>(1);
    const [episodes, setEpisodes] = useState<Episode[]>([]);

    const getValidType = (): "movie" | "tv" => {
        if (type === "movie" || type === "tv") {
            return type;
        }
        if (media?.type) {
            return media.type;
        }
        return "movie";
    };

    const mediaType = getValidType();

    useEffect(() => {
        if (type && id) {
            fetchMediaDetails();
            checkWatchlist();
        }
    }, [type, id, user]);

    useEffect(() => {
        if (mediaType === "tv" && media?.id && selectedSeason) {
            fetchTVShowEpisodes();
        }
    }, [mediaType, media?.id, selectedSeason]);

    const fetchMediaDetails = async () => {
        try {
            setLoading(true);

            const response = await getMediaDetails(parseInt(id!), mediaType);

            if (response.data) {
                const mediaData = {
                    ...response.data,
                    type: mediaType,
                    title: response.data.title || response.data.name || "Unknown Title"
                };
                setMedia(mediaData);

                // Initialize seasons array
                if (mediaType === "tv" && response.data.seasons) {
                    setSeasons(response.data.seasons || []);
                }
            } else {
                throw new Error("No data received");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Failed to fetch media details");
        } finally {
            setLoading(false);
        }
    };

    const fetchTVShowEpisodes = async () => {
        if (!media?.id) return;

        setLoadingEpisodes(true);
        try {
            // Fetch season details from TMDB API
            const response = await api.get(
                `https://api.themoviedb.org/3/tv/${media.id}/season/${selectedSeason}`,
                {
                    params: {
                        api_key: import.meta.env.VITE_TMDB_API_KEY,
                        language: 'en-US'
                    }
                }
            );

            setEpisodes(response.data.episodes || []);
        } catch (err: any) {
            console.error("Error fetching TV show episodes:", err);
            setEpisodes([]);
        } finally {
            setLoadingEpisodes(false);
        }
    };

    const checkWatchlist = async () => {
        if (!user) return;

        try {
            const response = await getWatchlist(1);
            const watchlistItem = response.data.find(
                (item: WatchlistItem) => item.tmdbId === parseInt(id!)
            );

            if (watchlistItem) {
                setInWatchlist(true);
                setWatchlistId(watchlistItem._id);
                setWatchStatus(watchlistItem.watchStatus);
            }
        } catch (err) {
            console.error("Error checking watchlist:", err);
        }
    };

    const handleAddToWatchlist = async () => {
        if (!user) {
            warningAlert("Login Required", "Please login to add to watchlist");
            return;
        }

        if (!media) return;

        setIsAdding(true);
        try {
            console.log("Adding to watchlist, media data:", {
                tmdbId: media.id,
                title: media.title,
                type: mediaType,
                posterPath: media.poster_path,
                backdrop_path: media.backdrop_path,
                releaseDate: media.release_date || media.first_air_date || ""
            });

            if (mediaType === "movie") {
                const response = await addToWatchlist({
                    tmdbId: media.id,
                    title: media.title,
                    type: "movie",
                    posterPath: media.poster_path,
                    releaseDate: media.release_date,
                });

                setInWatchlist(true);
                setWatchlistId(response.data._id);
                setWatchStatus("planned");
            } else {
                const tvShowData = {
                    tmdbId: media.id,
                    title: media.title,
                    type: "tv" as const,
                    posterPath: media.poster_path,
                    backdrop_path: media.backdrop_path,
                    releaseDate: media.first_air_date || media.release_date || ""
                };

                console.log("Sending TV show data:", tvShowData);

                const response = await api.post("/media/watchlist/tv", tvShowData);

                setInWatchlist(true);
                setWatchlistId(response.data.data._id);
                setWatchStatus("planned");
            }

            successAlert(
                `Added to ${mediaType === "movie" ? "Movies" : "TV Shows"} Watchlist`,
                `"${media.title}" has been added to your watchlist successfully!`
            );
        } catch (err: any) {
            console.error("Error adding to watchlist:", err);
            const errorMessage = err.response?.data?.message || "Failed to add to watchlist";
            alert(errorMessage);

            if (errorMessage.includes("already in your watchlist")) {
                infoAlert(
                    "Already in Watchlist",
                    "This item is already in your watchlist!"
                );
                setInWatchlist(true);
                await checkWatchlist();
            } else {
                errorAlert(
                    `Failed to Add ${mediaType === "movie" ? "Movie" : "TV Show"}`,
                    errorMessage
                );
            }
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveFromWatchlist = async () => {
        if (!watchlistId) return;

        const confirmed = await confirmDialog(
            "Remove from Watchlist",
            `Are you sure you want to remove "${media?.title}" from your watchlist?`,
            "Yes, Remove",
            "Cancel"
        );

        if (!confirmed) return;

        setIsAdding(true);
        try {
            await removeFromWatchlist(watchlistId);
            setInWatchlist(false);
            setWatchlistId("");

            successAlert(
                "Removed from Watchlist",
                `"${media?.title}" has been removed from your watchlist.`
            );
        } catch (err: any) {
            errorAlert(
                "Failed to Remove",
                err.response?.data?.message || "Failed to remove from watchlist"
            );
        } finally {
            setIsAdding(false);
        }
    };

    const handleStatusChange = async (newStatus: "planned" | "watching" | "completed") => {
        if (!watchlistId) return;

        try {
            await updateWatchStatus(watchlistId, { watchStatus: newStatus });
            setWatchStatus(newStatus);

            // Show status change notification
            successAlert(
                "Status Updated",
                `Status changed to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`
            );
        } catch (err: any) {
            errorAlert(
                "Failed to Update Status",
                err.response?.data?.message || "Failed to update status"
            );
        }
    };

    const handleGoToWatchlist = () => {
        navigate("/watchlist");
    };

    const formatCurrency = (amount: number): string => {
        if (amount >= 1_000_000_000) {
            return `$${(amount / 1_000_000_000).toFixed(1)}B`;
        }
        if (amount >= 1_000_000) {
            return `$${(amount / 1_000_000).toFixed(1)}M`;
        }
        if (amount >= 1_000) {
            return `$${(amount / 1_000).toFixed(1)}K`;
        }
        return `$${amount}`;
    };

    const formatRuntime = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const getYearFromDate = (dateString: string): string => {
        if (!dateString) return "Unknown";
        return new Date(dateString).getFullYear().toString();
    };

    const getDisplayDate = () => {
        if (mediaType === "movie") {
            return media?.release_date || "";
        } else {
            return media?.first_air_date || media?.release_date || "";
        }
    };

    const getDisplayTitle = () => {
        if (media) {
            return media.title || media.name || "Unknown Title";
        }
        return "Unknown Title";
    };

    const formatEpisodeDate = (dateString: string) => {
        if (!dateString) return "Unknown date";
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 text-slate-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-slate-800 rounded w-1/3 mb-4"></div>
                        <div className="h-96 bg-slate-800 rounded-xl mb-6"></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="h-64 bg-slate-800 rounded-xl"></div>
                            <div className="h-64 bg-slate-800 rounded-xl"></div>
                            <div className="h-64 bg-slate-800 rounded-xl"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !media) {
        return (
            <div className="min-h-screen bg-slate-900 text-slate-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">😔</div>
                        <h1 className="text-2xl font-bold mb-2">Media Not Found</h1>
                        <p className="text-slate-400 mb-4">{error || "The requested media could not be found."}</p>
                        <p className="text-sm text-slate-500 mb-6">
                            Type: {type}, ID: {id}, Media Type: {mediaType}
                        </p>
                        <button
                            onClick={() => navigate(-1)}
                            className="bg-rose-600 hover:bg-rose-700 text-slate-50 font-medium py-2 px-6 rounded-lg transition"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const backdropUrl = media.backdrop_path ? `https://image.tmdb.org/t/p/original${media.backdrop_path}` : "/placeholder-backdrop.jpg";
    const posterUrl = media.poster_path ? `https://image.tmdb.org/t/p/w500${media.poster_path}` : "/placeholder-poster.jpg";
    const displayTitle = getDisplayTitle();
    const displayDate = getDisplayDate();

    return (
        <div className="min-h-screen bg-slate-900 text-slate-50">
            <Navbar />

            {/* Backdrop Image */}
            <div className="relative h-96 overflow-hidden">
                <img
                    src={backdropUrl}
                    alt={displayTitle}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="max-w-7xl mx-auto">
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
                {/* Main Content */}
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                    {/* Poster */}
                    <div className="md:w-1/3">
                        <div className="bg-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                            <img
                                src={posterUrl}
                                alt={displayTitle}
                                className="w-full h-auto"
                            />
                        </div>
                    </div>

                    {/* Details */}
                    <div className="md:w-2/3">
                        <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
                            {/* Title and Basic Info */}
                            <div className="mb-6">
                                <h1 className="text-4xl font-bold mb-2">{displayTitle}</h1>
                                <div className="flex items-center space-x-4 mb-4">
                                    <span className="text-rose-400 font-bold text-lg">
                                        ⭐ {media.vote_average?.toFixed(1) || "N/A"}
                                    </span>
                                    <span className="text-slate-400">
                                        {getYearFromDate(displayDate)}
                                    </span>
                                    {mediaType === "movie" && media.runtime && (
                                        <span className="text-slate-400">
                                            {formatRuntime(media.runtime)}
                                        </span>
                                    )}
                                    {mediaType === "tv" && (
                                        <>
                                            <span className="text-slate-400">
                                                {media.number_of_seasons || 1} season{media.number_of_seasons !== 1 ? 's' : ''}
                                            </span>
                                            <span className="text-slate-400">
                                                {media.number_of_episodes || 1} episode{media.number_of_episodes !== 1 ? 's' : ''}
                                            </span>
                                        </>
                                    )}
                                    <span className="px-2 py-1 bg-slate-700 rounded text-sm">
                                        {mediaType === "movie" ? "🎬 Movie" : "📺 TV Show"}
                                    </span>
                                </div>

                                {/* Tagline */}
                                {media.tagline && (
                                    <p className="text-xl italic text-slate-300 mb-4">"{media.tagline}"</p>
                                )}

                                {/* Genres */}
                                {media.genres && media.genres.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {media.genres.map((genre) => (
                                            <span
                                                key={genre.id}
                                                className="px-3 py-1 bg-slate-700 rounded-full text-sm"
                                            >
                                                {genre.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Watchlist Actions */}
                            <div className="mb-8">
                                {!inWatchlist ? (
                                    <button
                                        onClick={handleAddToWatchlist}
                                        disabled={isAdding || !user}
                                        className="bg-rose-600 hover:bg-rose-700 text-slate-50 font-bold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 flex items-center"
                                    >
                                        {isAdding ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-slate-50 border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Adding...
                                            </>
                                        ) : (
                                            <>
                                                <span className="mr-2">➕</span>
                                                Add to Watchlist
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-4">
                                            <button
                                                onClick={handleRemoveFromWatchlist}
                                                disabled={isAdding}
                                                className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
                                            >
                                                {isAdding ? "Removing..." : "Remove from Watchlist"}
                                            </button>

                                            {/* Show "Go to Watchlist" button for TV shows */}
                                            {mediaType === "tv" && (
                                                <button
                                                    onClick={handleGoToWatchlist}
                                                    className="bg-blue-600 hover:bg-blue-700 text-slate-50 font-medium py-2 px-4 rounded-lg transition duration-200"
                                                >
                                                    📺 Go to Watchlist
                                                </button>
                                            )}
                                        </div>

                                        {/* Status Selector - Only show for movies */}
                                        {mediaType === "movie" && (
                                            <div>
                                                <p className="text-sm text-slate-400 mb-2">Update Status:</p>
                                                <div className="flex space-x-2">
                                                    {(["planned", "completed"] as const).map((status) => (
                                                        <button
                                                            key={status}
                                                            onClick={() => handleStatusChange(status)}
                                                            disabled={isAdding || watchStatus === status}
                                                            className={`px-4 py-2 rounded-lg font-medium transition ${watchStatus === status
                                                                ? status === "planned"
                                                                    ? "bg-slate-600 text-slate-300"
                                                                    : "bg-green-600 text-green-100"
                                                                : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-300"
                                                            }`}
                                                        >
                                                            {status === "planned" && "📋 Planned"}
                                                            {status === "completed" && "✅ Completed"}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!user && (
                                    <p className="text-sm text-slate-400 mt-2">
                                        <Link to="/login" className="text-rose-400 hover:underline">
                                            Login
                                        </Link>{" "}
                                        to add to your watchlist
                                    </p>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-slate-900/50 p-4 rounded-xl">
                                    <p className="text-sm text-slate-400">Votes</p>
                                    <p className="text-xl font-bold">{media.vote_count?.toLocaleString() || "N/A"}</p>
                                </div>
                                <div className="bg-slate-900/50 p-4 rounded-xl">
                                    <p className="text-sm text-slate-400">Status</p>
                                    <p className="text-xl font-bold">{media.status || "N/A"}</p>
                                </div>
                                {mediaType === "movie" && media.budget && media.budget > 0 && (
                                    <div className="bg-slate-900/50 p-4 rounded-xl">
                                        <p className="text-sm text-slate-400">Budget</p>
                                        <p className="text-xl font-bold">{formatCurrency(media.budget)}</p>
                                    </div>
                                )}
                                {mediaType === "movie" && media.revenue && media.revenue > 0 && (
                                    <div className="bg-slate-900/50 p-4 rounded-xl">
                                        <p className="text-sm text-slate-400">Revenue</p>
                                        <p className="text-xl font-bold">{formatCurrency(media.revenue)}</p>
                                    </div>
                                )}
                                {mediaType === "tv" && media.number_of_seasons && (
                                    <div className="bg-slate-900/50 p-4 rounded-xl">
                                        <p className="text-sm text-slate-400">Seasons</p>
                                        <p className="text-xl font-bold">{media.number_of_seasons}</p>
                                    </div>
                                )}
                                {mediaType === "tv" && media.number_of_episodes && (
                                    <div className="bg-slate-900/50 p-4 rounded-xl">
                                        <p className="text-sm text-slate-400">Episodes</p>
                                        <p className="text-xl font-bold">{media.number_of_episodes}</p>
                                    </div>
                                )}
                            </div>

                            {/* External Links */}
                            <div className="flex space-x-4">
                                {media.imdb_id && (
                                    <a
                                        href={`https://www.imdb.com/title/${media.imdb_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center text-amber-400 hover:text-amber-300"
                                    >
                                        <span className="mr-2">IMDb</span>
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.562 8h-2.25v8h2.25v-8zm-5.25 0h-2.25v8h2.25v-8zm-5.25 0h-2.25v8h2.25v-8z"/>
                                        </svg>
                                    </a>
                                )}
                                {media.homepage && (
                                    <a
                                        href={media.homepage}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300"
                                    >
                                        Official Website
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-8">
                    <div className="flex space-x-1 border-b border-slate-700 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab("overview")}
                            className={`px-6 py-3 font-medium transition whitespace-nowrap ${activeTab === "overview"
                                ? "text-rose-400 border-b-2 border-rose-400"
                                : "text-slate-400 hover:text-slate-300"
                            }`}
                        >
                            Overview
                        </button>
                        {media.credits?.cast && media.credits.cast.length > 0 && (
                            <button
                                onClick={() => setActiveTab("cast")}
                                className={`px-6 py-3 font-medium transition whitespace-nowrap ${activeTab === "cast"
                                    ? "text-rose-400 border-b-2 border-rose-400"
                                    : "text-slate-400 hover:text-slate-300"
                                }`}
                            >
                                Cast & Crew
                            </button>
                        )}
                        {media.similar?.results && media.similar.results.length > 0 && (
                            <button
                                onClick={() => setActiveTab("similar")}
                                className={`px-6 py-3 font-medium transition whitespace-nowrap ${activeTab === "similar"
                                    ? "text-rose-400 border-b-2 border-rose-400"
                                    : "text-slate-400 hover:text-slate-300"
                                }`}
                            >
                                Similar
                            </button>
                        )}
                        {/* Add Episodes tab for TV shows */}
                        {mediaType === "tv" && (
                            <button
                                onClick={() => setActiveTab("episodes")}
                                className={`px-6 py-3 font-medium transition whitespace-nowrap ${activeTab === "episodes"
                                    ? "text-rose-400 border-b-2 border-rose-400"
                                    : "text-slate-400 hover:text-slate-300"
                                }`}
                            >
                                Episodes
                            </button>
                        )}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="mb-12">
                    {activeTab === "overview" && (
                        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
                            <h2 className="text-2xl font-bold mb-4">Overview</h2>
                            <p className="text-lg text-slate-300 leading-relaxed">{media.overview}</p>

                            {/* Videos */}
                            {media.videos?.results && media.videos.results.length > 0 && (
                                <div className="mt-8">
                                    <h3 className="text-xl font-bold mb-4">Videos</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {media.videos.results.slice(0, 2).map((video) => (
                                            video.site === "YouTube" && (
                                                <div key={video.id} className="relative pb-[56.25%] h-0 rounded-lg overflow-hidden">
                                                    <iframe
                                                        src={`https://www.youtube.com/embed/${video.key}`}
                                                        title={video.name}
                                                        className="absolute top-0 left-0 w-full h-full"
                                                        allowFullScreen
                                                    />
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "cast" && media.credits?.cast && (
                        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
                            <h2 className="text-2xl font-bold mb-6">Cast & Crew</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {media.credits.cast.slice(0, 10).map((person) => (
                                    <div key={person.id} className="text-center">
                                        <div className="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden bg-slate-700">
                                            {person.profile_path ? (
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                                                    alt={person.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="text-2xl">👤</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="font-medium text-slate-50">{person.name}</p>
                                        <p className="text-sm text-slate-400">{person.character}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "similar" && media.similar?.results && (
                        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
                            <h2 className="text-2xl font-bold mb-6">Similar Titles</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                {media.similar.results.slice(0, 10).map((item) => {
                                    const similarTitle = item.title || item.name || "Unknown";
                                    const similarType = item.title ? "movie" : "tv";

                                    return (
                                        <Link
                                            key={item.id}
                                            to={`/media/${similarType}/${item.id}`}
                                            className="group"
                                        >
                                            <div className="bg-slate-900 rounded-xl overflow-hidden transition transform group-hover:scale-105">
                                                {item.poster_path ? (
                                                    <img
                                                        src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                                                        alt={similarTitle}
                                                        className="w-full h-48 object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-48 bg-slate-800 flex items-center justify-center">
                                                        <span className="text-3xl">🎬</span>
                                                    </div>
                                                )}
                                                <div className="p-3">
                                                    <p className="font-medium text-slate-50 truncate">
                                                        {similarTitle}
                                                    </p>
                                                    <p className="text-sm text-rose-400">
                                                        ⭐ {item.vote_average?.toFixed(1) || "N/A"}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Episodes Tab for TV shows */}
                    {activeTab === "episodes" && mediaType === "tv" && (
                        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
                            <h2 className="text-2xl font-bold mb-6">Episodes</h2>

                            {/* Season Selector */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-slate-50">Seasons</h3>
                                    <span className="text-sm text-slate-400">
                                        {seasons.length} seasons available
                                    </span>
                                </div>
                                <div className="flex space-x-2 overflow-x-auto pb-2">
                                    {seasons.map((season) => (
                                        <button
                                            key={season.season_number}
                                            onClick={() => setSelectedSeason(season.season_number)}
                                            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                                                selectedSeason === season.season_number
                                                    ? "bg-rose-600 text-slate-50"
                                                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                            }`}
                                        >
                                            {season.season_number === 0 ? "Specials" : `Season ${season.season_number}`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Current Season Info */}
                            <div className="mb-6 p-4 bg-slate-900/50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-lg font-medium text-slate-50">
                                            {selectedSeason === 0 ? "Specials" : `Season ${selectedSeason}`}
                                        </h4>
                                        <p className="text-sm text-slate-400">
                                            {episodes.length} episodes
                                        </p>
                                    </div>
                                    {seasons.find(s => s.season_number === selectedSeason)?.air_date && (
                                        <span className="text-sm text-slate-400">
                                            First aired: {formatEpisodeDate(seasons.find(s => s.season_number === selectedSeason)?.air_date || "")}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Episodes List */}
                            {loadingEpisodes ? (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-slate-400">Loading episodes...</p>
                                </div>
                            ) : episodes.length > 0 ? (
                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4">
                                    {episodes.map((episode) => (
                                        <div
                                            key={episode.id}
                                            className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition"
                                        >
                                            <div className="flex space-x-4">
                                                {/* Episode Image */}
                                                <div className="flex-shrink-0">
                                                    {episode.still_path ? (
                                                        <img
                                                            src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                                                            alt={episode.name}
                                                            className="w-40 h-24 object-cover rounded-lg"
                                                        />
                                                    ) : (
                                                        <div className="w-40 h-24 bg-slate-700 rounded-lg flex items-center justify-center">
                                                            <span className="text-2xl">📺</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Episode Details */}
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h4 className="text-lg font-medium text-slate-50">
                                                                Episode {episode.episode_number}: {episode.name}
                                                            </h4>
                                                            <div className="flex items-center space-x-3 mt-1">
                                                                <span className="text-sm text-slate-400">
                                                                    {formatEpisodeDate(episode.air_date)}
                                                                </span>
                                                                {episode.runtime > 0 && (
                                                                    <span className="text-sm text-slate-400">
                                                                        {episode.runtime} min
                                                                    </span>
                                                                )}
                                                                <span className="text-sm text-rose-400">
                                                                    ⭐ {episode.vote_average?.toFixed(1) || "N/A"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <p className="text-sm text-slate-300 line-clamp-2">
                                                        {episode.overview || "No description available."}
                                                    </p>

                                                    <div className="mt-3 pt-3 border-t border-slate-700">
                                                        <p className="text-xs text-slate-500">
                                                            {episode.guest_stars?.length > 0 && (
                                                                <>Guest stars: {episode.guest_stars.slice(0, 3).map(star => star.name).join(", ")}</>
                                                            )}
                                                            {episode.guest_stars?.length > 3 && "..."}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-4xl mb-4">📺</div>
                                    <h4 className="text-xl font-medium text-slate-50 mb-2">No Episodes Found</h4>
                                    <p className="text-slate-400">
                                        Episode information is not available for this season.
                                    </p>
                                </div>
                            )}

                            {/* Note about tracking episodes */}
                            <div className="mt-8 p-4 bg-slate-900/30 rounded-lg border border-slate-600">
                                <div className="flex items-start space-x-3">
                                    <div className="text-2xl">💡</div>
                                    <div>
                                        <h5 className="font-medium text-slate-50 mb-1">Want to track episodes?</h5>
                                        <p className="text-sm text-slate-400">
                                            Add this TV show to your watchlist to track which episodes you've watched
                                            and get personalized statistics.
                                        </p>
                                        {!inWatchlist && user && (
                                            <button
                                                onClick={handleAddToWatchlist}
                                                className="mt-2 bg-rose-600 hover:bg-rose-700 text-slate-50 text-sm font-medium py-2 px-4 rounded-lg transition"
                                            >
                                                + Add to Watchlist to Track Episodes
                                            </button>
                                        )}
                                        {inWatchlist && (
                                            <button
                                                onClick={handleGoToWatchlist}
                                                className="mt-2 bg-blue-600 hover:bg-blue-700 text-slate-50 text-sm font-medium py-2 px-4 rounded-lg transition"
                                            >
                                                📺 Go to Watchlist to Track Episodes
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Watch Time Info */}
                {media.watchTimeMinutes && (
                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold mb-2">Watch Time</h3>
                                <p className="text-slate-400">
                                    This {mediaType === "movie" ? "movie" : "TV show"} will add{" "}
                                    <span className="text-rose-400 font-bold">
                                        {media.watchTimeMinutes} minutes
                                    </span>{" "}
                                    to your total watch time.
                                </p>
                                {mediaType === "tv" && (
                                    <p className="text-sm text-slate-500 mt-2">
                                        Note: This is an estimated total for all episodes.
                                    </p>
                                )}
                            </div>
                            <div className="text-4xl">⏱️</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}