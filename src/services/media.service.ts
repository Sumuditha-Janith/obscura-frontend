import api from "./api";

export interface WatchlistItem {
  _id: string;
  tmdbId: number;
  title: string;
  type: "movie" | "tv";
  posterPath: string;
  releaseDate: string;
  watchStatus: "planned" | "watching" | "completed";
  rating?: number;
  watchTimeMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistResponse {
  data: WatchlistItem[];
  stats: {
    totalWatchTime: number;
    totalItems: number;
  };
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
}

export interface WatchlistStats {
  totalItems: number;
  totalWatchTime: number;
  totalWatchTimeFormatted: string;
  byStatus: Array<{
    status: string;
    count: number;
    time: number;
  }>;
  byType: Array<{
    type: string;
    count: number;
  }>;
}

export const searchMedia = async (query: string, page: number = 1) => {
  const res = await api.get(`/media/search`, {
    params: { query, page }
  });
  return res.data;
};

export const getMediaDetails = async (tmdbId: number, type: "movie" | "tv") => {
  const res = await api.get(`/media/details/${type}/${tmdbId}`);
  return res.data;
};

export const addToWatchlist = async (data: {
  tmdbId: number;
  title: string;
  type: "movie" | "tv";
  posterPath?: string;
  releaseDate?: string;
}) => {
  const res = await api.post("/media/watchlist", data);
  return res.data;
};

export const getWatchlist = async (page: number = 1, status?: string) => {
  const url = status 
    ? `/media/watchlist?page=${page}&status=${status}`
    : `/media/watchlist?page=${page}`;
  const res = await api.get(url);
  return res.data;
};

export const updateWatchStatus = async (mediaId: string, data: {
  watchStatus?: "planned" | "watching" | "completed";
  rating?: number;
}) => {
  const res = await api.put(`/media/watchlist/${mediaId}/status`, data);
  return res.data;
};

export const removeFromWatchlist = async (mediaId: string) => {
  const res = await api.delete(`/media/watchlist/${mediaId}`);
  return res.data;
};

export const getWatchlistStats = async () => {
  const res = await api.get("/media/watchlist/stats");
  return res.data;
};

export const getTrending = async (page: number = 1, timeWindow: "day" | "week" = "week") => {
  const res = await api.get(`/media/trending?page=${page}&timeWindow=${timeWindow}`);
  return res.data;
};

export const getPopularMovies = async (page: number = 1) => {
  const res = await api.get(`/media/popular?page=${page}`);
  return res.data;
};