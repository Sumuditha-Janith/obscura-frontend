import { Link } from "react-router-dom";

export default function Welcome() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col justify-center items-center p-8 animate-fade-in">
      <div className="max-w-4xl text-center">
        <div className="mb-10">
          <h1 className="text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-rose-600 to-rose-500 bg-clip-text text-transparent">
              CINETIME
            </span>
            <span className="ml-3">🎬</span>
          </h1>
          <p className="text-2xl text-slate-400 mb-2">
            Your Personal Movie & TV Show Tracker
          </p>
          <p className="text-slate-500 text-lg">
            Track, Discover, and Engage with Cinema Like Never Before
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <div className="text-3xl mb-4">🔐</div>
            <h3 className="text-xl font-bold mb-2 text-slate-50">Secure Auth</h3>
            <p className="text-slate-400">
              Dual‑factor registration with email OTP and JWT protection.
            </p>
          </div>
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <div className="text-3xl mb-4">🎥</div>
            <h3 className="text-xl font-bold mb-2 text-slate-50">Live TMDB Data</h3>
            <p className="text-slate-400">
              Real‑time movie metadata, posters, ratings, and watchlists.
            </p>
          </div>
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-xl font-bold mb-2 text-slate-50">AI‑Powered Insights</h3>
            <p className="text-slate-400">
              Gemini AI generates summaries, trivia, and personalized content.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link
            to="/login"
            className="px-10 py-4 bg-rose-600 hover:bg-rose-700 text-slate-50 font-bold rounded-2xl text-lg transition duration-300 transform hover:scale-105"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-10 py-4 bg-slate-800 hover:bg-slate-700 text-slate-50 font-bold rounded-2xl text-lg transition duration-300 transform hover:scale-105 border border-slate-700"
          >
            Create Account
          </Link>
        </div>

        <p className="mt-12 text-slate-500 text-sm">
          Built with MERN + TypeScript • TailwindCSS • Redux • JWT • TMDB API • Gemini AI
        </p>
      </div>
    </div>
  );
}