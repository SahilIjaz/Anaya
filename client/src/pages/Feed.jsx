import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";
import api from "../utils/api";
import { FiImage, FiSend, FiLoader } from "react-icons/fi";

const TAGS = [
  "Photography", "Travel", "Music", "Art", "Gaming", "Fitness",
  "Cooking", "Reading", "Movies", "Technology", "Fashion", "Nature",
  "Sports", "Writing", "Dancing", "Yoga", "Design", "Hiking",
  "Painting", "Coding", "Singing", "Cycling",
];

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/posts/feed").then((res) => { setPosts(res.data); setLoading(false); });
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    const res = await api.post("/posts", { content, image, tags: selectedTags });
    setPosts([res.data, ...posts]);
    setContent("");
    setImage("");
    setSelectedTags([]);
    setShowTagPicker(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImage(res.data.url);
    } catch (err) {
      alert("Upload failed: " + (err.response?.data?.message || err.message));
    }
    setUploading(false);
  };

  const updatePost = (updated) => setPosts(posts.map((p) => (p._id === updated._id ? updated : p)));
  const deletePost = (id) => setPosts(posts.filter((p) => p._id !== id));

  return (
    <div className="md:ml-20 pb-20 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <h1 className="text-2xl font-bold mb-6">Your Feed</h1>

        {/* Create post */}
        <div className="glass rounded-2xl p-5 mb-6">
          <div className="flex gap-3">
            <img src={user?.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
            <form onSubmit={handlePost} className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                rows={3}
                className="w-full bg-white/5 rounded-xl p-3 outline-none focus:ring-1 focus:ring-primary-500/50 placeholder:text-gray-600 resize-none text-sm"
              />
              {image && (
                <div className="relative mt-2">
                  <img src={image} alt="" className="w-full h-40 object-cover rounded-xl" />
                  <button onClick={() => setImage("")} className="absolute top-2 right-2 bg-black/60 rounded-full w-6 h-6 flex items-center justify-center text-xs">&times;</button>
                </div>
              )}
              {showTagPicker && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {TAGS.map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setSelectedTags(selectedTags.includes(t) ? selectedTags.filter((s) => s !== t) : [...selectedTags, t])}
                      className={`text-xs px-3 py-1 rounded-full transition ${selectedTags.includes(t) ? "gradient-bg text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
                    >
                      #{t}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-2">
                  <label className="p-2 text-gray-400 hover:text-primary-400 transition rounded-lg hover:bg-white/5 cursor-pointer">
                    {uploading ? <FiLoader size={18} className="animate-spin" /> : <FiImage size={18} />}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                  <button type="button" onClick={() => setShowTagPicker(!showTagPicker)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${showTagPicker ? "bg-primary-500/20 text-primary-400" : "text-gray-400 hover:bg-white/5"}`}>
                    # Tags
                  </button>
                </div>
                <button type="submit" disabled={!content.trim()}
                  className="gradient-bg px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition disabled:opacity-30">
                  Post <FiSend size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No posts yet</p>
            <p className="text-gray-600 text-sm mt-2">Follow people or write your first post!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post._id} post={post} onUpdate={updatePost} onDelete={deletePost} />
          ))
        )}
      </div>
    </div>
  );
}
