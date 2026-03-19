import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../utils/api";
import { FiSearch, FiUserPlus, FiUserCheck } from "react-icons/fi";

export default function Discover() {
  const { user: me, updateUser } = useAuth();
  const { onlineUsers } = useSocket();
  const [suggested, setSuggested] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/users/discover/suggested").then((res) => { setSuggested(res.data); setLoading(false); });
  }, []);

  useEffect(() => {
    if (query.trim()) {
      const t = setTimeout(() => {
        api.get(`/users?q=${query}`).then((res) => setSearchResults(res.data));
      }, 300);
      return () => clearTimeout(t);
    } else {
      setSearchResults([]);
    }
  }, [query]);

  const handleFollow = async (id) => {
    const res = await api.put(`/users/follow/${id}`);
    updateUser(res.data.user);
  };

  const isFollowing = (id) => me?.following?.includes(id);
  const displayUsers = query.trim() ? searchResults : suggested;

  const sharedTags = (u) => {
    const shared = [];
    u.interests?.forEach((i) => { if (me.interests.includes(i)) shared.push(i); });
    u.hobbies?.forEach((h) => { if (me.hobbies.includes(h)) shared.push(h); });
    return shared;
  };

  return (
    <div className="md:ml-20 pb-20 md:pb-8">
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <h1 className="text-2xl font-bold mb-6">Discover People</h1>

        {/* Search */}
        <div className="relative mb-8">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people..."
            className="w-full bg-white/5 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-primary-500/50 placeholder:text-gray-600 transition"
          />
        </div>

        {!query.trim() && <p className="text-gray-400 text-sm mb-4">People who share your interests & hobbies</p>}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayUsers.length === 0 ? (
          <p className="text-gray-500 text-center py-12">{query ? "No users found" : "No suggestions yet"}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displayUsers.map((u) => (
              <div key={u._id} className="glass rounded-2xl p-5 hover:border-primary-500/30 transition group">
                <div className="flex items-start gap-4">
                  <Link to={`/profile/${u._id}`} className="relative">
                    <img src={u.avatar} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-primary-500/20 group-hover:border-primary-500/50 transition" />
                    {onlineUsers.includes(u._id) && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-dark-900" />
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/profile/${u._id}`} className="font-semibold hover:text-primary-400 transition block truncate">
                      {u.name}
                    </Link>
                    {u.bio && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{u.bio}</p>}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {sharedTags(u).slice(0, 3).map((t) => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-accent-500/15 text-accent-300">{t}</span>
                      ))}
                      {sharedTags(u).length > 3 && (
                        <span className="text-xs text-gray-500">+{sharedTags(u).length - 3}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleFollow(u._id)}
                  className={`w-full mt-4 rounded-xl py-2 text-sm font-medium transition flex items-center justify-center gap-2 ${
                    isFollowing(u._id)
                      ? "bg-white/5 text-gray-300 hover:bg-white/10"
                      : "gradient-bg text-white hover:opacity-90"
                  }`}
                >
                  {isFollowing(u._id) ? <><FiUserCheck size={14} /> Following</> : <><FiUserPlus size={14} /> Follow</>}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
