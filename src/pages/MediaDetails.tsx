import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getMediaDetails, addToWatchlist, removeFromWatchlist, updateWatchStatus } from "../services/media.service";
import { getWatchlist } from "../services/media.service";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/authContext";

interface MediaDetails {
    id: number;
    title: string;
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
    // TV Show specific fields
    first_air_date?: string;
    number_of_seasons?: number;
    number_of_episodes?: number;
    episode_run_time?: number[];
    seasons?: Array<{
        season_number: number;
        episode_count: number;
        name: string;
    }>;
}

interface WatchlistItem {
    _id: string;
    tmdbId: number;
    watchStatus: "planned" | "watching" | "completed";
}

export default function MediaDetails() {
    const { type, id } = useParams<{ type: string; id: string }>(); // Make type string, not "movie" | "tv"
    const navigate = useNavigate();
    const { user } = useAuth();

    const [media, setMedia] = useState<MediaDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [inWatchlist, setInWatchlist] = useState(false);
    const [watchlistId, setWatchlistId] = useState("");
    const [watchStatus, setWatchStatus] = useState<"planned" | "watching" | "completed">("planned");
    const [isAdding, setIsAdding] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "cast" | "similar">("overview");

    // Validate and normalize type
    const getValidType = (): "movie" | "tv" => {
        if (type === "movie" || type === "tv") {
            return type;
        }
        // Try to infer from the media data if available
        if (media?.type) {
            return media.type;
        }
        // Default to movie
        return "movie";
    };

    const mediaType = getValidType();

    useEffect(() => {
        if (type && id) {
            fetchMediaDetails();
            checkWatchlist();
        }
    }, [type, id, user]);

    const fetchMediaDetails = async () => {
        try {
            setLoading(true);
            console.log(`Fetching ${mediaType} details for ID: ${id}`);

            const response = await getMediaDetails(parseInt(id!), mediaType);
            console.log("Media details response:", response);

            if (response.data) {
                // Ensure the type is set correctly in the media object
                const mediaData = {
                    ...response.data,
                    type: mediaType
                };
                setMedia(mediaData);
            } else {
                throw new Error("No data received");
            }
        } catch (err: any) {
            console.error("Error fetching media details:", err);
            setError(err.response?.data?.message || err.message || "Failed to fetch media details");
        } finally {
            setLoading(false);
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
            alert("Please login to add to watchlist");
            return;
        }

        if (!media) return;

        setIsAdding(true);
        try {
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
                // For TV shows, use a different endpoint
                // We'll need to add this to our media.service
                // For now, let's use the same endpoint
                const response = await addToWatchlist({
                    tmdbId: media.id,
                    title: media.title,
                    type: "tv",
                    posterPath: media.poster_path,
                    releaseDate: media.release_date || media.first_air_date || "",
                });

                setInWatchlist(true);
                setWatchlistId(response.data._id);
                setWatchStatus("planned");
            }
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to add to watchlist");
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveFromWatchlist = async () => {
        if (!watchlistId) return;

        setIsAdding(true);
        try {
            await removeFromWatchlist(watchlistId);
            setInWatchlist(false);
            setWatchlistId("");
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to remove from watchlist");
        } finally {
            setIsAdding(false);
        }
    };

    const handleStatusChange = async (newStatus: "planned" | "watching" | "completed") => {
        if (!watchlistId) return;

        try {
            await updateWatchStatus(watchlistId, { watchStatus: newStatus });
            setWatchStatus(newStatus);
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to update status");
        }
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

    // Get appropriate date for display
    const getDisplayDate = () => {
        if (mediaType === "movie") {
            return media?.release_date || "";
        } else {
            return media?.first_air_date || media?.release_date || "";
        }
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

    const backdropUrl = `https://image.tmdb.org/t/p/original${media.backdrop_path}`;
    const posterUrl = `https://image.tmdb.org/t/p/w500${media.poster_path}`;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-50">
            <Navbar />

            {/* Backdrop Image */}
            <div className="relative h-96 overflow-hidden">
                <img
                    src={backdropUrl}
                    alt={media.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="max-w-7xl mx-auto">
                        <button
                            onClick={() => navigate(-1)}
                            className="mb-4 text-slate-300 hover:text-slate-50 flex items-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back
                        </button>
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
                                alt={media.title}
                                className="w-full h-auto"
                            />
                        </div>
                    </div>

                    {/* Details */}
                    <div className="md:w-2/3">
                        <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
                            {/* Title and Basic Info */}
                            <div className="mb-6">
                                <h1 className="text-4xl font-bold mb-2">{media.title}</h1>
                                <div className="flex items-center space-x-4 mb-4">
                  <span className="text-rose-400 font-bold text-lg">
                    ⭐ {media.vote_average.toFixed(1)}
                  </span>
                                    <span className="text-slate-400">
                    {getYearFromDate(getDisplayDate())}
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
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {media.genres?.map((genre) => (
                                        <span
                                            key={genre.id}
                                            className="px-3 py-1 bg-slate-700 rounded-full text-sm"
                                        >
                      {genre.name}
                    </span>
                                    ))}
                                </div>
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
                                            <span className="text-sm text-slate-400">
                        In your watchlist
                      </span>
                                        </div>

                                        {/* Status Selector - Different for movies and TV shows */}
                                        <div>
                                            <p className="text-sm text-slate-400 mb-2">Update Status:</p>
                                            <div className="flex space-x-2">
                                                {mediaType === "movie" ? (
                                                    (["planned", "completed"] as const).map((status) => (
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
                                                    ))
                                                ) : (
                                                    // TV Shows: All three statuses
                                                    (["planned", "watching", "completed"] as const).map((status) => (
                                                        <button
                                                            key={status}
                                                            onClick={() => handleStatusChange(status)}
                                                            disabled={isAdding || watchStatus === status}
                                                            className={`px-4 py-2 rounded-lg font-medium transition ${watchStatus === status
                                                                    ? status === "planned"
                                                                        ? "bg-slate-600 text-slate-300"
                                                                        : status === "watching"
                                                                            ? "bg-blue-600 text-blue-100"
                                                                            : "bg-green-600 text-green-100"
                                                                    : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-300"
                                                                }`}
                                                        >
                                                            {status === "planned" && "📋 Planned"}
                                                            {status === "watching" && "👀 Watching"}
                                                            {status === "completed" && "✅ Completed"}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>
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
                    <div className="flex space-x-1 border-b border-slate-700">
                        <button
                            onClick={() => setActiveTab("overview")}
                            className={`px-6 py-3 font-medium transition ${activeTab === "overview"
                                ? "text-rose-400 border-b-2 border-rose-400"
                                : "text-slate-400 hover:text-slate-300"
                            }`}
                        >
                            Overview
                        </button>
                        {media.credits?.cast && media.credits.cast.length > 0 && (
                            <button
                                onClick={() => setActiveTab("cast")}
                                className={`px-6 py-3 font-medium transition ${activeTab === "cast"
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
                                className={`px-6 py-3 font-medium transition ${activeTab === "similar"
                                    ? "text-rose-400 border-b-2 border-rose-400"
                                    : "text-slate-400 hover:text-slate-300"
                                }`}
                            >
                                Similar
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
                                {media.similar.results.slice(0, 10).map((item) => (
                                    <Link
                                        key={item.id}
                                        to={`/media/${mediaType}/${item.id}`}
                                        className="group"
                                    >
                                        <div className="bg-slate-900 rounded-xl overflow-hidden transition transform group-hover:scale-105">
                                            {item.poster_path ? (
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                                                    alt={item.title || item.name}
                                                    className="w-full h-48 object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-48 bg-slate-800 flex items-center justify-center">
                                                    <span className="text-3xl">🎬</span>
                                                </div>
                                            )}
                                            <div className="p-3">
                                                <p className="font-medium text-slate-50 truncate">
                                                    {item.title || item.name}
                                                </p>
                                                <p className="text-sm text-rose-400">
                                                    ⭐ {item.vote_average?.toFixed(1) || "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Watch Time Info */}
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold mb-2">Watch Time</h3>
                            <p className="text-slate-400">
                                This {mediaType === "movie" ? "movie" : "TV show"} will add{" "}
                                <span className="text-rose-400 font-bold">
                  {media.watchTimeMinutes || (mediaType === "movie" ? 120 : 45)} minutes
                </span>{" "}
                                to your total watch time.
                            </p>
                        </div>
                        <div className="text-4xl">⏱️</div>
                    </div>
                </div>
            </div>
        </div>
    );
}