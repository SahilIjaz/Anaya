import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../utils/api";
import { FiMessageCircle, FiSearch } from "react-icons/fi";





export default function Chat() {
  const { user: me } = useAuth();
  const { onlineUsers } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [mutualFollowers, setMutualFollowers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/messages/conversations"),
      api.get(`/users/${me._id}`),
    ]).then(([convRes, userRes]) => {
      setConversations(convRes.data);
      // Mutual followers: people I follow who follow me back
      const myFollowing = userRes.data.following?.map((f) => f._id || f) || [];
      const myFollowers = userRes.data.followers?.map((f) => f._id || f) || [];
      const mutual = myFollowing.filter((id) => myFollowers.includes(id));
      // Get mutual users details
      if (mutual.length > 0) {
        Promise.all(mutual.map((id) => api.get(`/users/${id}`))).then((results) => {
          setMutualFollowers(results.map((r) => r.data));
        });
      }
      setLoading(false);
    });
  }, [me._id]);

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return "now";
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-primary-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="md:ml-20 pb-20 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>

        {/* Online mutual followers */}
        {mutualFollowers.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-3">People you can message</p>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {mutualFollowers.map((u) => (
                <Link key={u._id} to={`/chat/${u._id}`} className="flex flex-col items-center gap-1.5 min-w-[60px]">
                  <div className="relative">
                    <img src={u.avatar} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-primary-500/30" />
                    {onlineUsers.includes(u._id) && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-dark-900" />
                    )}
                  </div>
                  <span className="text-xs text-gray-400 truncate max-w-[60px]">{u.name.split(" ")[0]}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Conversations */}
        <div className="space-y-2">
          {conversations.length === 0 ? (
            <div className="text-center py-16">
              <FiMessageCircle size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-500">No conversations yet</p>
              <p className="text-gray-600 text-sm mt-2">Follow someone and have them follow you back to start chatting!</p>
            </div>
          ) : (
            conversations.map((c) => (
              <Link
                key={c._id?._id}
                to={`/chat/${c._id?._id}`}
                className="glass rounded-xl p-4 flex items-center gap-4 hover:bg-white/5 transition block"
              >
                <div className="relative">
                  <img src={c._id?.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                  {onlineUsers.includes(c._id?._id) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-900" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{c._id?.name}</span>
                    <span className="text-xs text-gray-500">{timeAgo(c.lastDate)}</span>
                  </div>
                  <p className="text-sm text-gray-400 truncate">{c.lastMessage}</p>
                </div>
                {c.unread > 0 && (
                  <div className="w-5 h-5 rounded-full gradient-bg flex items-center justify-center text-xs font-bold">
                    {c.unread}
                  </div>
                )}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
