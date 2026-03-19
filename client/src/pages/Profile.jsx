import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";
import api from "../utils/api";
import Cropper from "react-easy-crop";
import { FiEdit3, FiMessageCircle, FiUserPlus, FiUserCheck, FiCamera, FiX, FiCheck, FiZoomIn, FiZoomOut, FiRotateCw } from "react-icons/fi";

// Helper: get cropped image as a Blob
function getCroppedImg(imageSrc, crop, rotation = 0) {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const radians = (rotation * Math.PI) / 180;
      const sin = Math.abs(Math.sin(radians));
      const cos = Math.abs(Math.cos(radians));
      const rW = image.width * cos + image.height * sin;
      const rH = image.width * sin + image.height * cos;

      canvas.width = crop.width;
      canvas.height = crop.height;

      ctx.translate(-crop.x, -crop.y);
      ctx.translate(rW / 2, rH / 2);
      ctx.rotate(radians);
      ctx.translate(-image.width / 2, -image.height / 2);
      ctx.drawImage(image, 0, 0);

      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
    };
    image.src = imageSrc;
  });
}

export default function Profile() {
  const { id } = useParams();
  const { user: me, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ name: "", bio: "" });
  const [tab, setTab] = useState("posts");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Crop state
  const [cropImage, setCropImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const isMe = id === me?._id;
  const isFollowing = me?.following?.includes(id);

  useEffect(() => {
    api.get(`/users/${id}`).then((res) => {
      setProfile(res.data);
      setEditData({ name: res.data.name, bio: res.data.bio || "" });
    });
    api.get(`/posts/user/${id}`).then((res) => setPosts(res.data));
  }, [id]);

  const handleFollow = async () => {
    const res = await api.put(`/users/follow/${id}`);
    updateUser(res.data.user);
    setProfile((prev) => ({
      ...prev,
      followers: res.data.following
        ? [...prev.followers, { _id: me._id, name: me.name, avatar: me.avatar }]
        : prev.followers.filter((f) => f._id !== me._id),
    }));
  };

  // Step 1: Pick file -> open cropper
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropImage(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  // Step 2: Crop confirmed -> upload cropped blob
  const handleCropConfirm = async () => {
    if (!cropImage || !croppedAreaPixels) return;
    setUploadingAvatar(true);
    try {
      const blob = await getCroppedImg(cropImage, croppedAreaPixels, rotation);
      const formData = new FormData();
      formData.append("image", blob, "avatar.jpg");
      const uploadRes = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const res = await api.put("/users/profile/update", { ...editData, avatar: uploadRes.data.url });
      setProfile(res.data);
      updateUser(res.data);
    } catch (err) {
      alert("Upload failed: " + (err.response?.data?.message || err.message));
    }
    setCropImage(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setUploadingAvatar(false);
  };

  const handleCropCancel = () => {
    setCropImage(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const handleSave = async () => {
    const res = await api.put("/users/profile/update", editData);
    setProfile(res.data);
    updateUser(res.data);
    setEditing(false);
  };

  if (!profile) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-primary-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="md:ml-20 pb-20 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-6">

        {/* Crop Modal */}
        {cropImage && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4">
              <button onClick={handleCropCancel} className="text-white/70 hover:text-white transition flex items-center gap-2 text-sm">
                <FiX size={20} /> Cancel
              </button>
              <h3 className="text-white font-semibold">Adjust Profile Photo</h3>
              <button
                onClick={handleCropConfirm}
                disabled={uploadingAvatar}
                className="gradient-bg px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50"
              >
                {uploadingAvatar ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiCheck size={16} />
                )}
                {uploadingAvatar ? "Uploading..." : "Save"}
              </button>
            </div>

            {/* Cropper area */}
            <div className="flex-1 relative">
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Controls */}
            <div className="px-6 py-5 flex flex-col gap-4">
              {/* Zoom slider */}
              <div className="flex items-center gap-4">
                <FiZoomOut size={18} className="text-gray-400" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-pink-500 h-1.5"
                />
                <FiZoomIn size={18} className="text-gray-400" />
              </div>

              {/* Rotate button */}
              <div className="flex justify-center">
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="flex items-center gap-2 text-sm text-gray-300 hover:text-white bg-white/10 hover:bg-white/15 px-4 py-2 rounded-xl transition"
                >
                  <FiRotateCw size={16} /> Rotate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <img src={profile.avatar} alt="" className="w-24 h-24 rounded-full border-4 border-primary-500/30 object-cover" />
              {isMe && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {uploadingAvatar ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiCamera size={22} className="text-white" />
                  )}
                  <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" disabled={uploadingAvatar} />
                </label>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              {editing ? (
                <div className="space-y-3">
                  <input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full bg-white/5 rounded-xl px-4 py-2 outline-none focus:ring-1 focus:ring-primary-500/50 text-lg font-semibold" />
                  <textarea value={editData.bio} onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    placeholder="Write something about yourself..."
                    className="w-full bg-white/5 rounded-xl px-4 py-2 outline-none focus:ring-1 focus:ring-primary-500/50 text-sm resize-none" rows={3} />
                  <div className="flex gap-2">
                    <button onClick={handleSave} className="gradient-bg px-4 py-2 rounded-xl text-sm font-semibold">Save</button>
                    <button onClick={() => setEditing(false)} className="bg-white/5 px-4 py-2 rounded-xl text-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold">{profile.name}</h2>
                  {profile.bio && <p className="text-gray-400 mt-1">{profile.bio}</p>}
                </>
              )}

              <div className="flex items-center justify-center sm:justify-start gap-6 mt-4 text-sm">
                <div><span className="font-bold">{posts.length}</span> <span className="text-gray-500">posts</span></div>
                <div><span className="font-bold">{profile.followers?.length || 0}</span> <span className="text-gray-500">followers</span></div>
                <div><span className="font-bold">{profile.following?.length || 0}</span> <span className="text-gray-500">following</span></div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {profile.interests?.map((i) => (
                  <span key={i} className="text-xs px-3 py-1 rounded-full bg-primary-500/15 text-primary-300">{i}</span>
                ))}
                {profile.hobbies?.map((h) => (
                  <span key={h} className="text-xs px-3 py-1 rounded-full bg-accent-500/15 text-accent-300">{h}</span>
                ))}
              </div>
            </div>
          </div>

          {!editing && (
            <div className="flex gap-3 mt-6">
              {isMe ? (
                <button onClick={() => setEditing(true)}
                  className="flex-1 bg-white/5 rounded-xl py-2.5 font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition text-sm">
                  <FiEdit3 size={16} /> Edit Profile
                </button>
              ) : (
                <>
                  <button onClick={handleFollow}
                    className={`flex-1 rounded-xl py-2.5 font-medium flex items-center justify-center gap-2 transition text-sm ${
                      isFollowing ? "bg-white/5 hover:bg-white/10" : "gradient-bg hover:opacity-90"
                    }`}>
                    {isFollowing ? <><FiUserCheck size={16} /> Following</> : <><FiUserPlus size={16} /> Follow</>}
                  </button>
                  {isFollowing && me?.followers?.includes(id) && (
                    <Link to={`/chat/${id}`}
                      className="flex-1 bg-white/5 rounded-xl py-2.5 font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition text-sm">
                      <FiMessageCircle size={16} /> Message
                    </Link>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/5 pb-3">
          {["posts", "followers", "following"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-sm font-medium capitalize transition ${tab === t ? "text-primary-400" : "text-gray-500 hover:text-gray-300"}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === "posts" && (
          posts.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No posts yet</p>
          ) : (
            posts.map((p) => (
              <PostCard key={p._id} post={p}
                onUpdate={(u) => setPosts(posts.map((pp) => (pp._id === u._id ? u : pp)))}
                onDelete={(id) => setPosts(posts.filter((pp) => pp._id !== id))} />
            ))
          )
        )}

        {tab === "followers" && (
          <div className="space-y-3">
            {profile.followers?.map((f) => (
              <Link key={f._id} to={`/profile/${f._id}`} className="glass rounded-xl p-4 flex items-center gap-3 hover:bg-white/5 transition block">
                <img src={f.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                <span className="font-medium">{f.name}</span>
              </Link>
            ))}
            {!profile.followers?.length && <p className="text-gray-500 text-center py-8">No followers yet</p>}
          </div>
        )}

        {tab === "following" && (
          <div className="space-y-3">
            {profile.following?.map((f) => (
              <Link key={f._id} to={`/profile/${f._id}`} className="glass rounded-xl p-4 flex items-center gap-3 hover:bg-white/5 transition block">
                <img src={f.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                <span className="font-medium">{f.name}</span>
              </Link>
            ))}
            {!profile.following?.length && <p className="text-gray-500 text-center py-8">Not following anyone</p>}
          </div>
        )}
      </div>
    </div>
  );
}
