import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

const Welcome = lazy(() => import("../pages/Welcome"));
const Register = lazy(() => import("../pages/Register"));
const VerifyOTP = lazy(() => import("../pages/VerifyOTP"));
const Login = lazy(() => import("../pages/Login"));
const Dashboard = lazy(() => import("../pages/Dashboard"));

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
          
          {/* Protected Routes with Layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
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