import { useAuth } from "../context/authContext";
import Navbar from "../components/Navbar";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-50">
            Welcome back, {user?.firstname}! 👋
          </h1>
          <p className="text-slate-400 mt-2">
            Track your movies, discover new ones, and manage your watchlist
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-slate-50 flex items-center">
              <span className="mr-2">👤</span> Profile
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-slate-400 text-sm">Full Name</p>
                <p className="text-slate-50 font-medium">
                  {user?.firstname} {user?.lastname}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Email</p>
                <p className="text-slate-50 font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Role</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-rose-900/30 text-rose-300 border border-rose-700/30">
                  {user?.roles?.join(", ")}
                </span>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Status</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  user?.approved === "APPROVED"
                    ? "bg-green-900/30 text-green-300 border border-green-700/30"
                    : "bg-yellow-900/30 text-yellow-300 border border-yellow-700/30"
                }`}>
                  {user?.approved}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-slate-50 flex items-center">
              <span className="mr-2">📊</span> Your Stats
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/50 rounded-xl">
                <p className="text-slate-400 text-sm">Movies Watched</p>
                <p className="text-3xl font-bold text-slate-50 mt-1">0</p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-xl">
                <p className="text-slate-400 text-sm">Watchlist</p>
                <p className="text-3xl font-bold text-slate-50 mt-1">0</p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-xl">
                <p className="text-slate-400 text-sm">Total Watch Time</p>
                <p className="text-3xl font-bold text-slate-50 mt-1">0h 0m</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-slate-50 flex items-center">
              <span className="mr-2">⚡</span> Quick Actions
            </h2>
            <div className="space-y-3">
              <button className="w-full bg-slate-700 hover:bg-slate-600 text-slate-50 font-medium py-3 px-4 rounded-lg transition duration-200 border border-slate-600 flex items-center justify-center">
                <span className="mr-2">🔍</span>
                Search Movies
              </button>
              <button className="w-full bg-slate-700 hover:bg-slate-600 text-slate-50 font-medium py-3 px-4 rounded-lg transition duration-200 border border-slate-600 flex items-center justify-center">
                <span className="mr-2">➕</span>
                Add to Watchlist
              </button>
              <button className="w-full bg-rose-600 hover:bg-rose-700 text-slate-50 font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center">
                <span className="mr-2">🎬</span>
                Browse Movies
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-slate-50">📅 Recent Activity</h2>
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/30 rounded-xl">
                <p className="text-slate-400 text-sm">Today</p>
                <p className="text-slate-300">You joined CINETIME! 🎉</p>
              </div>
              <div className="p-4 bg-slate-900/30 rounded-xl">
                <p className="text-slate-400 text-sm">Coming Soon</p>
                <p className="text-slate-300">Start tracking your first movie</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-slate-50">🚀 Coming Soon</h2>
            <ul className="space-y-3">
              {[
                "TMDB Movie Search & Discovery",
                "Personal Watchlist Management",
                "AI-Powered Movie Summaries",
                "Watch Time Analytics",
                "Social Features & Reviews",
                "Recommendation Engine"
              ].map((feature, index) => (
                <li key={index} className="flex items-center text-slate-300">
                  <span className="text-rose-400 mr-3">•</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 p-6 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl border border-slate-700">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-green-900/30 rounded-lg mr-3">
              <span className="text-green-400">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-50">
              Phase 2 Complete
            </h2>
          </div>
          <p className="text-slate-300">
            <span className="text-rose-400 font-medium">Authentication System:</span> Fully implemented with email verification, JWT tokens, and role-based access control.
            <br /><br />
            <span className="text-rose-400 font-medium">Next Phase:</span> Movie tracking features, TMDB integration, and AI-powered insights.
          </p>
        </div>
      </div>
    </div>
  );
}