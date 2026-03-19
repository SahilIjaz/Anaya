import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiHeart, FiMessageCircle, FiTrash2, FiSend } from "react-icons/fi";
import api from "../utils/api";

export default function PostCard({ post, onUpdate, onDelete }) {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const liked = post.likes.includes(user._id);

  const handleLike = async () => {
    const res = await api.put(`/posts/${post._id}/like`);
    onUpdate(res.data);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    const res = await api.post(`/posts/${post._id}/comment`, { text: comment });
    onUpdate(res.data);
    setComment("");
  };

  const handleDelete = async () => {
    await api.delete(`/posts/${post._id}`);
    onDelete(post._id);
  };

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  };

  return (
    <div className="glass rounded-2xl p-5 mb-4">
      <div className="flex items-center gap-3 mb-4">
        <Link to={`/profile/${post.author._id}`}>
          <img
            src={post.author.avatar}
            alt=""
            className="w-11 h-11 rounded-full object-cover border-2 border-primary-500/30"
          />
        </Link>
        <div className="flex-1">
          <Link to={`/profile/${post.author._id}`} className="font-semibold hover:text-primary-400 transition">
            {post.author.name}
          </Link>
          <p className="text-xs text-gray-500">{timeAgo(post.createdAt)}</p>
        </div>
        {post.author._id === user._id && (
          <button onClick={handleDelete} className="text-gray-500 hover:text-red-400 transition p-2">
            <FiTrash2 size={16} />
          </button>
        )}
      </div>

      <p className="text-gray-200 mb-3 leading-relaxed">{post.content}</p>

      {post.image && (
        <img src={post.image} alt="" className="w-full rounded-xl mb-3 max-h-96 object-cover" />
      )}

      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {post.tags.map((tag) => (
            <span key={tag} className="text-xs px-3 py-1 rounded-full bg-accent-500/15 text-accent-300">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-6 pt-3 border-t border-white/5">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 transition ${liked ? "text-pink-500" : "text-gray-400 hover:text-pink-400"}`}
        >
          <FiHeart size={18} className={liked ? "fill-current" : ""} />
          <span className="text-sm">{post.likes.length}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-gray-400 hover:text-accent-400 transition"
        >
          <FiMessageCircle size={18} />
          <span className="text-sm">{post.comments.length}</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-4 space-y-3">
          {post.comments.map((c, i) => (
            <div key={i} className="flex gap-3">
              <img src={c.user?.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
              <div className="flex-1 glass-light rounded-xl p-3">
                <Link to={`/profile/${c.user?._id}`} className="text-sm font-semibold hover:text-primary-400">
                  {c.user?.name}
                </Link>
                <p className="text-sm text-gray-300 mt-1">{c.text}</p>
              </div>
            </div>
          ))}
          <form onSubmit={handleComment} className="flex gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-white/5 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary-500/50 placeholder:text-gray-600"
            />
            <button type="submit" className="p-2 text-primary-400 hover:text-primary-300">
              <FiSend size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
