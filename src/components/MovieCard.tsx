import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { addToWatchlist, addTVShowToWatchlist, removeFromWatchlist, updateWatchStatus } from "../services/media.service";
import TMDBService from "../services/tmdb.service";
import { useAuth } from "../context/authContext";

interface MovieCardProps {
    media: {
        id: number;
        title: string;
        overview: string;
        poster_path: string;
        backdrop_path?: string;
        release_date: string;
        vote_average: number;
        vote_count?: number;
        type?: "movie" | "tv";
        media_type?: "movie" | "tv";
        genre_ids?: number[];
    };
    isInWatchlist?: boolean;
    watchlistId?: string;
    watchStatus?: "planned" | "watching" | "completed";
    onStatusChange?: (newStatus: "planned" | "watching" | "completed") => void;
    onWatchlistChange?: () => void;
    showActions?: boolean;
}

export default function MovieCard({
                                      media,
                                      isInWatchlist = false,
                                      watchlistId,
                                      watchStatus,
                                      onStatusChange,
                                      onWatchlistChange,
                                      showActions = true
                                  }: MovieCardProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [inWatchlist, setInWatchlist] = useState(isInWatchlist);
    const [currentStatus, setCurrentStatus] = useState<"planned" | "watching" | "completed">(watchStatus || "planned");

    // Sync local state with props
    useEffect(() => {
        setInWatchlist(isInWatchlist);
        if (watchStatus) {
            setCurrentStatus(watchStatus);
        }
    }, [isInWatchlist, watchStatus, watchlistId, media.title]);

    const getMediaType = (): "movie" | "tv" => {
        // Check media.type first
        if (media.type && (media.type === "movie" || media.type === "tv")) {
            return media.type;
        }

        // Then check media.media_type
        if (media.media_type && (media.media_type === "movie" || media.media_type === "tv")) {
            return media.media_type;
        }

        // Default to movie
        return "movie";
    };

    const posterUrl = TMDBService.getImageUrl(media.poster_path, "w342");
    const releaseYear = TMDBService.getReleaseYear(media.release_date);
    const formattedRating = TMDBService.formatRating(media.vote_average);
    const truncatedOverview = TMDBService.truncateOverview(media.overview);
    const mediaType = getMediaType();

const handleAddToWatchlist = async () => {
    if (!user) {
        alert("Please login to add to watchlist");
        return;
    }

    setLoading(true);
    try {
        if (mediaType === "movie") {
            // Add movie to watchlist
            await addToWatchlist({
                tmdbId: media.id,
                title: media.title,
                type: "movie",
                posterPath: media.poster_path,
                releaseDate: media.release_date,
            });
        } else {
            // Add TV show to watchlist
            await addTVShowToWatchlist({
                tmdbId: media.id,
                title: media.title,
                type: "tv",
                posterPath: media.poster_path,
                backdrop_path: media.backdrop_path,
                releaseDate: media.release_date,
            });
        }

        setInWatchlist(true);
        setCurrentStatus("planned");
        if (onStatusChange) {
            onStatusChange("planned");
        }
        if (onWatchlistChange) {
            onWatchlistChange();
        }
        alert(`Added to ${mediaType === "movie" ? "movies" : "TV shows"} watchlist successfully!`);
    } catch (error: any) {
        if (error.response?.status === 400 && error.response?.data?.message?.includes("already in your watchlist")) {
            alert("This item is already in your watchlist!");
            setInWatchlist(true);
        } else {
            alert(error.response?.data?.message || `Failed to add to ${mediaType} watchlist`);
        }
    } finally {
        setLoading(false);
    }
};

    const handleRemoveFromWatchlist = async () => {
        if (!watchlistId) return;

        setLoading(true);
        try {
            await removeFromWatchlist(watchlistId);
            setInWatchlist(false);
            if (onStatusChange) {
                onStatusChange("planned");
            }
            if (onWatchlistChange) {
                onWatchlistChange();
            }
            alert("Removed from watchlist!");
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to remove from watchlist");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus: "planned" | "watching" | "completed") => {
        if (!watchlistId) return;

        setLoading(true);
        try {
            await updateWatchStatus(watchlistId, { watchStatus: newStatus });

            setCurrentStatus(newStatus);

            if (onStatusChange) {
                onStatusChange(newStatus);
            }
            if (onWatchlistChange) {
                onWatchlistChange();
            }
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to update status");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "planned": return "bg-slate-600 text-slate-300";
            case "watching": return "bg-blue-600 text-blue-100";
            case "completed": return "bg-green-600 text-green-100";
            default: return "bg-slate-600 text-slate-300";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "planned": return "📋";
            case "watching": return "👀";
            case "completed": return "✅";
            default: return "📋";
        }
    };

    const getAddButtonText = () => {
        if (mediaType === "movie") {
            return loading ? "Adding..." : "Add Movie";
        } else {
            return loading ? "Adding TV Show..." : "Add TV Show";
        }
    };

    return (
        <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-slate-600 transition-all duration-300 hover:scale-[1.02] group">
            {/* Poster Image */}
            <div className="relative overflow-hidden h-64">
                <img
                    src={posterUrl || "/placeholder-poster.jpg"}
                    alt={media.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Rating Badge */}
                <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded-full">
                    <span className="text-sm font-bold text-rose-400">⭐ {formattedRating}</span>
                </div>

                {/* Type Badge */}
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded-full">
                    <span className="text-xs font-medium text-slate-300">
                        {mediaType === "movie" ? "🎬 Movie" : "📺 TV Show"}
                    </span>
                </div>

                {/* Action Buttons Overlay */}
                {showActions && (
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <div className="w-full space-y-2">
                            {!inWatchlist ? (
                                <button
                                    onClick={handleAddToWatchlist}
                                    disabled={loading || !user}
                                    className="w-full bg-rose-600 hover:bg-rose-700 text-slate-50 font-bold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50 flex items-center justify-center"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-slate-50 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span className="mr-2">➕</span>
                                            {getAddButtonText()}
                                        </>
                                    )}
                                </button>
                            ) : (
                                <div className="space-y-2">
                                    <button
                                        onClick={handleRemoveFromWatchlist}
                                        disabled={loading}
                                        className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
                                    >
                                        {loading ? "Removing..." : "Remove from Watchlist"}
                                    </button>

                                    {/* For TV shows, show "Go to Watchlist" button instead of status selector */}
                                    {mediaType === "tv" ? (
                                        <Link
                                            to="/watchlist"
                                            className="block w-full bg-blue-600 hover:bg-blue-700 text-slate-50 font-medium py-2 px-4 rounded-lg transition duration-200 text-center"
                                        >
                                            📺 Go to Watchlist
                                        </Link>
                                    ) : (
                                        // For movies, keep the status selector
                                        <div className="grid grid-cols-2 gap-1">
                                            {(["planned", "completed"] as const).map((status) => (
                                                <button
                                                    key={status}
                                                    onClick={() => handleStatusChange(status)}
                                                    disabled={loading || currentStatus === status}
                                                    className={`py-1 px-2 rounded text-xs font-medium transition ${currentStatus === status
                                                            ? getStatusColor(status)
                                                            : "bg-slate-900/70 text-slate-400 hover:bg-slate-800"
                                                        }`}
                                                >
                                                    {getStatusIcon(status)} {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <Link
                                        to={`/media/${getMediaType()}/${media.id}`}
                                        className="block w-full bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 hover:text-slate-50 font-medium py-2 px-4 rounded-lg transition duration-200 text-center"
                                    >
                                        View Details
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-slate-50 line-clamp-1">{media.title}</h3>
                    <span className="text-sm text-slate-400">{releaseYear}</span>
                </div>

                <p className="text-sm text-slate-400 mb-3 line-clamp-2">{truncatedOverview}</p>

                {/* Quick Stats */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
                    <span className="text-xs text-slate-500">
                        {(media.vote_count || 0).toLocaleString()} votes
                    </span>

                    {/* Watch Status Badge */}
                    {inWatchlist && mediaType === "movie" && (
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentStatus)}`}>
                            <span className="mr-1">{getStatusIcon(currentStatus)}</span>
                            {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                        </div>
                    )}
                    {inWatchlist && mediaType === "tv" && (
                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-blue-100">
                            <span className="mr-1">📺</span>
                            In Watchlist
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}