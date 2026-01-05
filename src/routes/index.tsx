import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

const Welcome = lazy(() => import("../pages/Welcome"));
const Register = lazy(() => import("../pages/Register"));
const VerifyOTP = lazy(() => import("../pages/VerifyOTP"));
const Login = lazy(() => import("../pages/Login"));
const Home = lazy(() => import("../pages/Home"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/ResetPassword"));
const Movies = lazy(() => import("../pages/Movies"));
const TVShows = lazy(() => import("../pages/TVShows")); // Add this line
const Watchlist = lazy(() => import("../pages/Watchlist"));
const MediaDetails = lazy(() => import("../pages/MediaDetails"));
const SearchResults = lazy(() => import("../pages/SearchResults")); // Add this

// Layout component for authenticated pages
const AuthenticatedLayout = lazy(() => import("../components/AuthenticatedLayout"));

export default function Router() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <div className="w-16 h-16 border-4 border-rose-500 border-dashed rounded-full animate-spin"></div>
          </div>
        }
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Welcome />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          <Route
            path="/search-results"
            element={
              <ProtectedRoute>
                <SearchResults />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes with Layout */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/movies"
            element={
              <ProtectedRoute>
                <Movies />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tvshows"
            element={
              <ProtectedRoute>
                <TVShows />
              </ProtectedRoute>
            }
          />
          <Route
            path="/watchlist"
            element={
              <ProtectedRoute>
                <Watchlist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/media/:type/:id"
            element={
              <ProtectedRoute>
                <MediaDetails />
              </ProtectedRoute>
            }
          />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}