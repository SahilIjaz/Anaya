import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiHome, FiCompass, FiMessageCircle, FiUser, FiLogOut } from "react-icons/fi";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const links = [
    { to: "/", icon: FiHome, label: "Feed" },
    { to: "/discover", icon: FiCompass, label: "Discover" },
    { to: "/chat", icon: FiMessageCircle, label: "Chat" },
    { to: `/profile/${user?._id}`, icon: FiUser, label: "Profile" },
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-20 glass flex-col items-center py-8 z-50 gap-2">
        <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center font-bold text-lg mb-8">
          A
        </div>
        {links.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              pathname === to
                ? "bg-primary-500/20 text-primary-400"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
            title={label}
          >
            <Icon size={22} />
          </Link>
        ))}
        <div className="mt-auto">
          <button
            onClick={logout}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Logout"
          >
            <FiLogOut size={22} />
          </button>
        </div>
      </nav>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass z-50 flex justify-around py-3">
        {links.map(({ to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`p-2 rounded-xl transition-all ${
              pathname === to ? "text-primary-400" : "text-gray-400"
            }`}
          >
            <Icon size={22} />
          </Link>
        ))}
        <button onClick={logout} className="p-2 text-gray-400 hover:text-red-400">
          <FiLogOut size={22} />
        </button>
      </nav>
    </>
  );
}
