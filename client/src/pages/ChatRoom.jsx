import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../utils/api";
import { FiArrowLeft, FiSend } from "react-icons/fi";

export default function ChatRoom() {
  const { userId } = useParams();
  const { user: me } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [partner, setPartner] = useState(null);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    api.get(`/users/${userId}`).then((res) => setPartner(res.data));
    api.get(`/messages/${userId}`).then((res) => setMessages(res.data));
  }, [userId]);

  useEffect(() => {
    if (!socket) return;

    const handleReceive = (msg) => {
      if (msg.sender === userId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const handleSent = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    const handleTyping = ({ sender }) => {
      if (sender === userId) setTyping(true);
    };

    const handleStopTyping = ({ sender }) => {
      if (sender === userId) setTyping(false);
    };

    socket.on("receive-message", handleReceive);
    socket.on("message-sent", handleSent);
    socket.on("user-typing", handleTyping);
    socket.on("user-stop-typing", handleStopTyping);

    return () => {
      socket.off("receive-message", handleReceive);
      socket.off("message-sent", handleSent);
      socket.off("user-typing", handleTyping);
      socket.off("user-stop-typing", handleStopTyping);
    };
  }, [socket, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;
    socket.emit("send-message", { sender: me._id, receiver: userId, text });
    socket.emit("stop-typing", { sender: me._id, receiver: userId });
    setText("");
  };

  const handleTypingInput = (e) => {
    setText(e.target.value);
    if (!socket) return;
    socket.emit("typing", { sender: me._id, receiver: userId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("stop-typing", { sender: me._id, receiver: userId });
    }, 1500);
  };

  const isOnline = onlineUsers.includes(userId);

  return (
    <div className="md:ml-20 flex flex-col h-screen">
      {/* Header */}
      <div className="glass px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link to="/chat" className="p-2 hover:bg-white/5 rounded-lg transition">
          <FiArrowLeft size={20} />
        </Link>
        {partner && (
          <>
            <div className="relative">
              <img src={partner.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
              {isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-900" />}
            </div>
            <div>
              <p className="font-semibold text-sm">{partner.name}</p>
              <p className="text-xs text-gray-500">{isOnline ? "Online" : "Offline"}</p>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {messages.map((msg, i) => {
          const isMine = msg.sender === me._id;
          return (
            <div key={msg._id || i} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-4 py-2.5 text-sm ${isMine ? "chat-bubble-sent" : "chat-bubble-received"}`}>
                {msg.text}
                <div className={`text-[10px] mt-1 ${isMine ? "text-white/60 text-right" : "text-gray-500"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        {typing && (
          <div className="flex justify-start">
            <div className="chat-bubble-received px-4 py-3 text-sm text-gray-400 flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="glass px-4 py-3 mb-14 md:mb-0">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            value={text}
            onChange={handleTypingInput}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary-500/50 placeholder:text-gray-600 text-sm"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="w-11 h-11 gradient-bg rounded-xl flex items-center justify-center hover:opacity-90 transition disabled:opacity-30"
          >
            <FiSend size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
