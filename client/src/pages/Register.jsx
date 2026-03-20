import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiUser, FiMail, FiLock, FiArrowRight, FiCheck } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const INTERESTS = [
  "Photography", "Travel", "Music", "Art", "Gaming", "Fitness",
  "Cooking", "Reading", "Movies", "Technology", "Fashion", "Nature",
  "Sports", "Writing", "Dancing", "Yoga", "Meditation", "Design",
];

const HOBBIES = [
  "Hiking", "Painting", "Coding", "Singing", "Cycling", "Swimming",
  "Gardening", "Chess", "Skateboarding", "Surfing", "Rock Climbing", "Pottery",
  "Journaling", "Baking", "Volunteering", "Astronomy", "Board Games", "Crafting",
];

export default function Register() {
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [interests, setInterests] = useState([]);
  const [hobbies, setHobbies] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugLog, setDebugLog] = useState([]);

  const addLog = (msg) => setDebugLog((prev) => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

  const toggle = (arr, setArr, val) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const handleSubmit = async () => {
    setError("");
    if (interests.length === 0) return setError("Select at least one interest");
    if (hobbies.length === 0) return setError("Select at least one hobby");
    setLoading(true);
    console.log("[REGISTER] Attempting registration for:", email);
    console.log("[REGISTER] Data:", { name, email, interests, hobbies });
    try {
      await register({ name, email, password, interests, hobbies });
      console.log("[REGISTER] Registration successful!");
    } catch (err) {
      console.error("[REGISTER] Registration FAILED:", err.response?.status, err.response?.data, err.message);
      setError(err.response?.data?.message || "Registration failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 gradient-bg items-center justify-center p-12">
        <div className="text-center max-w-md">
          <h1 className="text-5xl font-bold mb-4">Anaya</h1>
          <p className="text-xl text-white/80">
            {step === 1 ? "Create your account and start connecting" : step === 2 ? "Tell us what excites you" : "What do you love doing?"}
          </p>
          <div className="mt-12 flex justify-center gap-3">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-12 h-1.5 rounded-full transition-all ${s <= step ? "bg-white" : "bg-white/30"}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-lg">
          <div className="lg:hidden text-center mb-6">
            <h1 className="text-4xl font-bold gradient-bg bg-clip-text text-transparent">Anaya</h1>
            <div className="flex justify-center gap-2 mt-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`w-8 h-1 rounded-full ${s <= step ? "gradient-bg" : "bg-gray-700"}`} />
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <h2 className="text-3xl font-bold mb-2">Create Account</h2>
              <p className="text-gray-400 mb-6">Let's get you started</p>
              <div className="space-y-4">
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-primary-500/50 placeholder:text-gray-600" required />
                </div>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-primary-500/50 placeholder:text-gray-600" required />
                </div>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-primary-500/50 placeholder:text-gray-600" required />
                </div>
                <button
                  onClick={() => { if (name && email && password) setStep(2); else setError("Fill all fields"); }}
                  className="w-full gradient-bg rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition"
                >
                  Continue <FiArrowRight />
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-3xl font-bold mb-2">Your Interests</h2>
              <p className="text-gray-400 mb-6">Pick what excites you (at least 1)</p>
              <div className="flex flex-wrap gap-3 mb-6">
                {INTERESTS.map((i) => (
                  <button
                    key={i}
                    onClick={() => toggle(interests, setInterests, i)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      interests.includes(i)
                        ? "gradient-bg text-white shadow-lg shadow-primary-500/25"
                        : "bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    {interests.includes(i) && <FiCheck className="inline mr-1" size={14} />}
                    {i}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 bg-white/5 rounded-xl py-3.5 font-semibold hover:bg-white/10 transition">Back</button>
                <button onClick={() => { if (interests.length > 0) setStep(3); else setError("Select at least one"); }}
                  className="flex-1 gradient-bg rounded-xl py-3.5 font-semibold hover:opacity-90 transition flex items-center justify-center gap-2">
                  Continue <FiArrowRight />
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-3xl font-bold mb-2">Your Hobbies</h2>
              <p className="text-gray-400 mb-6">What do you love doing? (at least 1)</p>
              <div className="flex flex-wrap gap-3 mb-6">
                {HOBBIES.map((h) => (
                  <button
                    key={h}
                    onClick={() => toggle(hobbies, setHobbies, h)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      hobbies.includes(h)
                        ? "gradient-bg text-white shadow-lg shadow-primary-500/25"
                        : "bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    {hobbies.includes(h) && <FiCheck className="inline mr-1" size={14} />}
                    {h}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 bg-white/5 rounded-xl py-3.5 font-semibold hover:bg-white/10 transition">Back</button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 gradient-bg rounded-xl py-3.5 font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? "Creating..." : "Join Anaya"} {!loading && <FiArrowRight />}
                </button>
              </div>
            </>
          )}

          <p className="text-center text-gray-400 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
