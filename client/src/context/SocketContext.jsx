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
      console.log("[SOCKET-CTX] Connecting to:", SOCKET_URL, "| userId:", user._id);
      const s = io(SOCKET_URL, { withCredentials: true });

      s.on("connect", () => {
        console.log("[SOCKET-CTX] Connected! socketId:", s.id);
      });

      s.on("connect_error", (err) => {
        console.error("[SOCKET-CTX] Connection ERROR:", err.message);
      });

      setSocket(s);

      s.emit("user-online", user._id);
      console.log("[SOCKET-CTX] Emitted user-online");

      s.on("online-users", (users) => {
        console.log("[SOCKET-CTX] Online users:", users.length);
        setOnlineUsers(users);
      });

      return () => {
        console.log("[SOCKET-CTX] Disconnecting...");
        s.disconnect();
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}
