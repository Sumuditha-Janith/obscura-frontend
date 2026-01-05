import { useState } from "react";
import type { FormEvent } from "react";
import { login, getMyDetails } from "../services/auth.service";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/authContext";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!email || !password) {
      setMessage("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);

      const userDetails = await getMyDetails();
      setUser(userDetails.data);

      setMessage("Login successful! Redirecting...");
      setTimeout(() => navigate("/home"), 1500);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8 animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 rounded-2xl bg-rose-600 mb-4">
            <span className="text-3xl">🎬</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-slate-50">Welcome Back</h1>
          <p className="text-slate-400">Sign in to your CINETIME account</p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-3 rounded-lg mb-4 ${message.includes("success") 
            ? "bg-green-900/30 border border-green-500/30 text-green-300" 
            : "bg-rose-900/30 border border-rose-500/30 text-rose-300"}`}>
            {message}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-50"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-50"
              placeholder="••••••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-600 hover:bg-rose-700 text-slate-50 font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-slate-50 border-t-transparent rounded-full animate-spin mr-2"></div>
                Signing in...
              </span>
            ) : "Sign In"}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 text-center text-slate-400">
          <p className="mb-2">
            Don't have an account?{" "}
            <Link to="/register" className="text-rose-400 hover:text-rose-300 hover:underline">
              Register here
            </Link>
          </p>
          <p>
            Forgot password?{" "}
            <Link to="/forgot-password" className="text-rose-400 hover:text-rose-300 hover:underline">
              Reset it
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}