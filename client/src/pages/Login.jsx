import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiMail, FiLock, FiArrowRight } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugLog, setDebugLog] = useState([]);

  const addLog = (msg) => setDebugLog((prev) => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setDebugLog([]);
    setLoading(true);
    addLog(`API URL: ${API_URL}`);
    addLog(`Attempting login for: ${email}`);
    console.log("[LOGIN] Attempting login for:", email);
    console.log("[LOGIN] API URL:", API_URL);
    try {
      addLog("Sending POST /auth/login...");
      await login(email, password);
      addLog("Login successful!");
      console.log("[LOGIN] Login successful!");
    } catch (err) {
      const status = err.response?.status || "NO RESPONSE";
      const msg = err.response?.data?.message || err.message;
      addLog(`FAILED! Status: ${status} | Error: ${msg}`);
      addLog(`Full error: ${JSON.stringify(err.response?.data || err.message)}`);
      console.error("[LOGIN] Login FAILED:", status, err.response?.data, err.message);
      setError(err.response?.data?.message || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 gradient-bg items-center justify-center p-12">
        <div className="text-center max-w-md">
          <h1 className="text-5xl font-bold mb-4">Anaya</h1>
          <p className="text-xl text-white/80">Connect with people who share your vibe. Share stories, discover content, and build meaningful connections.</p>
          <div className="mt-12 flex justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur animate-float" />
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur animate-float" style={{ animationDelay: "0.5s" }} />
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur animate-float" style={{ animationDelay: "1s" }} />
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-4xl font-bold gradient-bg bg-clip-text text-transparent">Anaya</h1>
          </div>
          <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
          <p className="text-gray-400 mb-8">Sign in to continue your journey</p>

          {/* DEBUG BANNER - remove after fixing */}
          <div className="bg-blue-500/10 border border-blue-500/30 text-blue-300 px-4 py-3 rounded-xl mb-4 text-xs font-mono">
            <p className="font-bold mb-1">DEBUG INFO:</p>
            <p>API URL: {API_URL}</p>
            <p>VITE_API_URL: {import.meta.env.VITE_API_URL || "NOT SET"}</p>
            <p>MODE: {import.meta.env.MODE}</p>
            {debugLog.map((log, i) => (
              <p key={i} className="text-yellow-300">{log}</p>
            ))}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-primary-500/50 placeholder:text-gray-600 transition"
                required
              />
            </div>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-primary-500/50 placeholder:text-gray-600 transition"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-bg rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <FiArrowRight />}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-semibold">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
