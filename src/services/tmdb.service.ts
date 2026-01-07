import axios from "axios";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = import.meta.env.VITE_TMDB_BASE_URL;
const TMDB_IMAGE_BASE_URL = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

export interface MediaItem {
    id: number;
    title: string;
    overview: string;
    poster_path: string;
    backdrop_path: string;
    release_date: string;
    vote_average: number;
    vote_count: number;
    type: "movie" | "tv";
    genre_ids: number[];
}

export interface SearchResponse {
    data: MediaItem[];
    pagination: {
        page: number;
        total_pages: number;
        total_results: number;
    };
}

class TMDBService {
    // Removed unused axiosInstance

    // Get image URL
    getImageUrl(path: string, size: string = "w500"): string {
        if (!path) return "/placeholder-poster.jpg";
        return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
    }

    // Format release year
    getReleaseYear(releaseDate: string): string {
        if (!releaseDate) return "Unknown";
        return new Date(releaseDate).getFullYear().toString();
    }

    // Format rating with stars
    formatRating(rating: number): string {
        return rating.toFixed(1);
    }

    // Truncate overview
    truncateOverview(text: string, maxLength: number = 150): string {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    }
}

export default new TMDBService();