import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Discover from "./pages/Discover";
import Chat from "./pages/Chat";
import ChatRoom from "./pages/ChatRoom";
import Navbar from "./components/Navbar";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-primary-400 border-t-transparent rounded-full animate-spin" /></div>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
        <Route path="/" element={<PrivateRoute><Feed /></PrivateRoute>} />
        <Route path="/profile/:id" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/discover" element={<PrivateRoute><Discover /></PrivateRoute>} />
        <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
        <Route path="/chat/:userId" element={<PrivateRoute><ChatRoom /></PrivateRoute>} />
      </Routes>
    </div>
  );
}
