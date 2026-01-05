import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/authContext";
import TMDBService from "../services/tmdb.service";

interface TVEpisode {
  _id: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeTitle: string;
  airDate: string;
  overview?: string;
  runtime: number;
  stillPath?: string;
  watchStatus: "unwatched" | "watched" | "skipped";
  rating?: number;
  watchedAt?: string;
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

interface TVEpisodeTrackerProps {
  tvShow: TVShowDetails;
  onEpisodeStatusChange?: () => void | Promise<void>;
}

export default function TVEpisodeTracker({ tvShow, onEpisodeStatusChange }: TVEpisodeTrackerProps) {
  const { user } = useAuth();
  const [episodes, setEpisodes] = useState<TVEpisode[]>([]);
  const [seasons, setSeasons] = useState<number[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({
    watched: 0,
    total: 0,
    percentage: 0
  });

  useEffect(() => {
    if (tvShow.tmdbId) {
      fetchEpisodes(selectedSeason);
    }
  }, [tvShow.tmdbId, selectedSeason]);

  const fetchEpisodes = async (season: number) => {
    try {
      setLoading(true);
      
      const response = await api.get(`/media/tv/${tvShow.tmdbId}/episodes?season=${season}`);
      
      if (response.data.data.episodesBySeason) {
        const seasonEpisodes = response.data.data.episodesBySeason[season] || [];
        
        setEpisodes(seasonEpisodes);
        
        // Update progress
        const watchedEpisodes = seasonEpisodes.filter((ep: TVEpisode) => ep.watchStatus === "watched").length;
        setProgress({
          watched: watchedEpisodes,
          total: seasonEpisodes.length,
          percentage: seasonEpisodes.length > 0 ? (watchedEpisodes / seasonEpisodes.length) * 100 : 0
        });
        
        // Fetch seasons if not loaded
        if (seasons.length === 0) {
          const totalSeasons = tvShow.seasonCount || 1;
          const seasonsArray = Array.from(
            { length: totalSeasons }, 
            (_, i) => i + 1
          );
          setSeasons(seasonsArray);
        }
        
      } else {
        // No episodes found
        setEpisodes([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch episodes:", error);
      setEpisodes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEpisodeStatusUpdate = async (episodeId: string, newStatus: "unwatched" | "watched" | "skipped") => {
    try {
      const response = await api.put(`/media/episodes/${episodeId}/status`, {
        watchStatus: newStatus
      });
      
      if (response.status === 200) {
        // Update local state
        setEpisodes(prevEpisodes =>
          prevEpisodes.map(ep =>
            ep._id === episodeId
              ? { ...ep, 
                  watchStatus: newStatus, 
                  watchedAt: newStatus === "watched" ? new Date().toISOString() : undefined 
                }
              : ep
          )
        );
        
        // Update progress
        const updatedEpisodes = episodes.map(ep =>
          ep._id === episodeId ? { ...ep, watchStatus: newStatus } : ep
        );
        const watchedEpisodes = updatedEpisodes.filter(ep => ep.watchStatus === "watched").length;
        setProgress({
          watched: watchedEpisodes,
          total: updatedEpisodes.length,
          percentage: updatedEpisodes.length > 0 ? (watchedEpisodes / updatedEpisodes.length) * 100 : 0
        });
        
        // Call the callback to refresh stats
        if (onEpisodeStatusChange) {
          const result = onEpisodeStatusChange();
          if (result && typeof result.then === 'function') {
            await result;
          }
        }
      }
    } catch (error) {
      console.error("Failed to update episode status:", error);
    }
  };

  const markSeasonAsWatched = async () => {
    try {
      const promises = episodes.map(episode => 
        handleEpisodeStatusUpdate(episode._id, "watched")
      );
      await Promise.all(promises);
    } catch (error) {
      console.error("Failed to mark season as watched:", error);
    }
  };

  const markSeasonAsUnwatched = async () => {
    try {
      const promises = episodes.map(episode => 
        handleEpisodeStatusUpdate(episode._id, "unwatched")
      );
      await Promise.all(promises);
    } catch (error) {
      console.error("Failed to mark season as unwatched:", error);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "watched": return "bg-green-600 text-green-100";
      case "unwatched": return "bg-slate-600 text-slate-300";
      case "skipped": return "bg-yellow-600 text-yellow-100";
      default: return "bg-slate-600 text-slate-300";
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading episodes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-50">Episode Tracker</h3>
          <p className="text-slate-400 text-sm">
            Season {selectedSeason} • {episodes.length} episodes
          </p>
        </div>
        
        {/* Progress Bar */}
        <div className="w-48">
          <div className="flex justify-between text-sm text-slate-400 mb-1">
            <span>{progress.watched} / {progress.total} watched</span>
            <span>{Math.round(progress.percentage)}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Season Selector */}
      <div className="mb-4">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {seasons.map(season => (
            <button
              key={season}
              onClick={() => setSelectedSeason(season)}
              className={`px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap ${selectedSeason === season
                  ? "bg-rose-600 text-slate-50"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
            >
              Season {season}
            </button>
          ))}
        </div>
      </div>

      {/* Season Actions */}
      {episodes.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            onClick={markSeasonAsWatched}
            className="bg-green-600 hover:bg-green-700 text-slate-50 py-2 px-4 rounded-lg text-sm font-medium transition"
          >
            Mark All as Watched
          </button>
          <button
            onClick={markSeasonAsUnwatched}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 px-4 rounded-lg text-sm font-medium transition"
          >
            Mark All as Unwatched
          </button>
        </div>
      )}

      {/* Episodes List */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {episodes.map(episode => (
          <div
            key={episode._id}
            className="bg-slate-900/50 rounded-lg p-3 border border-slate-700 hover:border-slate-600 transition"
          >
            <div className="flex items-start space-x-3">
              {/* Episode Number */}
              <div className="flex-shrink-0 w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                <span className="font-bold text-slate-50">E{episode.episodeNumber}</span>
              </div>
              
              {/* Episode Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-slate-50 truncate">
                    {episode.episodeTitle}
                  </h4>
                  <span className="text-xs text-slate-500 ml-2">
                    {formatDate(episode.airDate)}
                  </span>
                </div>
                
                <p className="text-sm text-slate-400 mt-1 line-clamp-1">
                  {episode.overview || "No description available"}
                </p>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-500">
                    {episode.runtime} min
                  </span>
                  
                  {/* Status Buttons - Simplified */}
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEpisodeStatusUpdate(episode._id, "unwatched")}
                      className={`px-2 py-1 rounded text-xs font-medium transition ${episode.watchStatus === "unwatched"
                          ? "bg-slate-600 text-slate-300"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                      title="Mark as Unwatched"
                    >
                      ○
                    </button>
                    <button
                      onClick={() => handleEpisodeStatusUpdate(episode._id, "watched")}
                      className={`px-2 py-1 rounded text-xs font-medium transition ${episode.watchStatus === "watched"
                          ? "bg-green-600 text-green-100"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                      title="Mark as Watched"
                    >
                      ✓
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {episodes.length === 0 && !loading && (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">📺</div>
            <h4 className="text-lg font-medium text-slate-50 mb-2">No Episodes Found</h4>
            <p className="text-slate-400">
              This TV show might not have episode data available yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}