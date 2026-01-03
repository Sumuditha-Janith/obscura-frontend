import { useState } from "react";
import { Link } from "react-router-dom";
import { addToWatchlist, removeFromWatchlist, updateWatchStatus } from "../services/media.service";
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
    type: "movie" | "tv";
    genre_ids?: number[];
  };
  isInWatchlist?: boolean;
  watchlistId?: string;
  watchStatus?: "planned" | "watching" | "completed";
  onStatusChange?: () => void;
  showActions?: boolean;
}

export default function MovieCard({ 
  media, 
  isInWatchlist = false, 
  watchlistId, 
  watchStatus, 
  onStatusChange,
  showActions = true 
}: MovieCardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(isInWatchlist);
  const [currentStatus, setCurrentStatus] = useState(watchStatus || "planned");

  const posterUrl = TMDBService.getImageUrl(media.poster_path, "w342");
  const releaseYear = TMDBService.getReleaseYear(media.release_date);
  const formattedRating = TMDBService.formatRating(media.vote_average);
  const truncatedOverview = TMDBService.truncateOverview(media.overview);

  const handleAddToWatchlist = async () => {
    if (!user) {
      alert("Please login to add to watchlist");
      return;
    }

    setLoading(true);
    try {
      await addToWatchlist({
        tmdbId: media.id,
        title: media.title,
        type: media.type,
        posterPath: media.poster_path,
        releaseDate: media.release_date,
      });
      setInWatchlist(true);
      setCurrentStatus("planned");
      if (onStatusChange) onStatusChange();
    } catch (error) {
      console.error("Failed to add to watchlist:", error);
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
      if (onStatusChange) onStatusChange();
    } catch (error) {
      console.error("Failed to remove from watchlist:", error);
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
      if (onStatusChange) onStatusChange();
    } catch (error) {
      console.error("Failed to update status:", error);
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

  return (
    <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-slate-600 transition-all duration-300 hover:scale-[1.02] group">
      {/* Poster Image */}
      <div className="relative overflow-hidden h-64">
        <img
          src={posterUrl}
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
            {media.type === "movie" ? "🎬 Movie" : "📺 TV Show"}
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
                      Add to Watchlist
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
                  
                  {/* Status Selector */}
                  <div className="grid grid-cols-3 gap-1">
                    {(["planned", "watching", "completed"] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        disabled={loading || currentStatus === status}
                        className={`py-1 px-2 rounded text-xs font-medium transition ${
                          currentStatus === status 
                            ? getStatusColor(status)
                            : "bg-slate-900/70 text-slate-400 hover:bg-slate-800"
                        }`}
                      >
                        {getStatusIcon(status)} {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <Link
                to={`/media/${media.type}/${media.id}`}
                className="block w-full bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 hover:text-slate-50 font-medium py-2 px-4 rounded-lg transition duration-200 text-center"
              >
                View Details
              </Link>
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

        {/* Watch Status Badge */}
        {inWatchlist && (
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentStatus)}`}>
            <span className="mr-1">{getStatusIcon(currentStatus)}</span>
            {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
          </div>
        )}

        {/* Quick Stats */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
          <span className="text-xs text-slate-500">
            {(media.vote_count || 0).toLocaleString()} votes {/* Add default value */}
          </span>
          {inWatchlist && (
            <Link
              to={`/watchlist`}
              className="text-xs text-rose-400 hover:text-rose-300 hover:underline"
            >
              View in Watchlist
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}