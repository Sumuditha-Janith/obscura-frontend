import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-slate-800 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <div className="p-2 bg-rose-600 rounded-lg">
                <span className="text-xl">🎬</span>
              </div>
              <span className="text-xl font-bold text-slate-50">CINETIME</span>
            </Link>
            
            {user && (
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <Link
                    to="/dashboard"
                    className="text-slate-300 hover:text-slate-50 hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium transition"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/movies"
                    className="text-slate-300 hover:text-slate-50 hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium transition"
                  >
                    Movies
                  </Link>
                  <Link
                    to="/watchlist"
                    className="text-slate-300 hover:text-slate-50 hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium transition"
                  >
                    Watchlist
                  </Link>
                  {(user.roles?.includes("AUTHOR") || user.roles?.includes("ADMIN")) && (
                    <Link
                      to="/create"
                      className="text-slate-300 hover:text-slate-50 hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium transition"
                    >
                      Create Content
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm text-slate-50 font-medium">
                    {user.firstname} {user.lastname}
                  </span>
                  <span className="text-xs text-slate-400">
                    {user.roles?.join(", ")}
                  </span>
                </div>
                <div className="relative">
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition"
                  >
                    <span>🚪</span>
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-slate-300 hover:text-slate-50 hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-rose-600 hover:bg-rose-700 text-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {user && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/dashboard"
              className="text-slate-300 hover:text-slate-50 hover:bg-slate-700 block px-3 py-2 rounded-md text-base font-medium"
            >
              Dashboard
            </Link>
            <Link
              to="/movies"
              className="text-slate-300 hover:text-slate-50 hover:bg-slate-700 block px-3 py-2 rounded-md text-base font-medium"
            >
              Movies
            </Link>
            <Link
              to="/watchlist"
              className="text-slate-300 hover:text-slate-50 hover:bg-slate-700 block px-3 py-2 rounded-md text-base font-medium"
            >
              Watchlist
            </Link>
            {(user.roles?.includes("AUTHOR") || user.roles?.includes("ADMIN")) && (
              <Link
                to="/create"
                className="text-slate-300 hover:text-slate-50 hover:bg-slate-700 block px-3 py-2 rounded-md text-base font-medium"
              >
                Create Content
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}