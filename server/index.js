import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import messageRoutes from "./routes/messages.js";
import uploadRoutes from "./routes/upload.js";
import Message from "./models/Message.js";
import User from "./models/User.js";

console.log("[SERVER] Starting server...");
console.log("[SERVER] NODE_ENV:", process.env.NODE_ENV);
console.log("[SERVER] PORT env:", process.env.PORT);
console.log("[SERVER] CLIENT_URL env:", process.env.CLIENT_URL);
console.log("[SERVER] MONGO_URI exists:", !!process.env.MONGO_URI);
console.log("[SERVER] JWT_SECRET exists:", !!process.env.JWT_SECRET);
console.log("[SERVER] CLOUDINARY_CLOUD_NAME exists:", !!process.env.CLOUDINARY_CLOUD_NAME);

const app = express();
const server = http.createServer(app);

// Temporarily allow all origins to debug CORS issue
console.log("[SERVER] CLIENT_URL from env:", process.env.CLIENT_URL);
console.log("[SERVER] Using open CORS for debugging");

const io = new Server(server, {
  cors: { origin: true, credentials: true },
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url} | Origin: ${req.headers.origin} | IP: ${req.ip}`);
  next();
});

// Health check
app.get("/", (req, res) => {
  console.log("[HEALTH] Health check hit");
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);

// Socket.io
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("[SOCKET] Connected:", socket.id);

  socket.on("user-online", async (userId) => {
    console.log("[SOCKET] User online:", userId);
    onlineUsers.set(userId, socket.id);
    await User.findByIdAndUpdate(userId, { online: true });
    io.emit("online-users", Array.from(onlineUsers.keys()));
  });

  socket.on("send-message", async ({ sender, receiver, text }) => {
    console.log("[SOCKET] Message from", sender, "to", receiver);
    try {
      const msg = await Message.create({ sender, receiver, text });
      const receiverSocket = onlineUsers.get(receiver);
      if (receiverSocket) {
        io.to(receiverSocket).emit("receive-message", msg);
        console.log("[SOCKET] Message delivered to receiver socket");
      } else {
        console.log("[SOCKET] Receiver not online, message saved to DB");
      }
      socket.emit("message-sent", msg);
    } catch (err) {
      console.error("[SOCKET] Message error:", err.message);
      socket.emit("message-error", err.message);
    }
  });

  socket.on("typing", ({ sender, receiver }) => {
    const receiverSocket = onlineUsers.get(receiver);
    if (receiverSocket) {
      io.to(receiverSocket).emit("user-typing", { sender });
    }
  });

  socket.on("stop-typing", ({ sender, receiver }) => {
    const receiverSocket = onlineUsers.get(receiver);
    if (receiverSocket) {
      io.to(receiverSocket).emit("user-stop-typing", { sender });
    }
  });

  socket.on("disconnect", async () => {
    console.log("[SOCKET] Disconnected:", socket.id);
    let disconnectedUser = null;
    for (const [userId, sId] of onlineUsers.entries()) {
      if (sId === socket.id) {
        disconnectedUser = userId;
        break;
      }
    }
    if (disconnectedUser) {
      console.log("[SOCKET] User went offline:", disconnectedUser);
      onlineUsers.delete(disconnectedUser);
      await User.findByIdAndUpdate(disconnectedUser, { online: false });
      io.emit("online-users", Array.from(onlineUsers.keys()));
    }
  });
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  server.listen(PORT, () => console.log(`[SERVER] Running on port ${PORT}`));
});
