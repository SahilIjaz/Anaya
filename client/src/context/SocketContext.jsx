import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (user) {
      const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";
      const s = io(SOCKET_URL, { withCredentials: true });
      setSocket(s);

      s.emit("user-online", user._id);

      s.on("online-users", (users) => setOnlineUsers(users));

      return () => s.disconnect();
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}
