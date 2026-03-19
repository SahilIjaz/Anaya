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

const app = express();
const server = http.createServer(app);
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL, "http://localhost:5173", "http://localhost:5174"]
  : ["http://localhost:5173", "http://localhost:5174"];

const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);

// Socket.io
const onlineUsers = new Map(); // userId -> socketId

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("user-online", async (userId) => {
    onlineUsers.set(userId, socket.id);
    await User.findByIdAndUpdate(userId, { online: true });
    io.emit("online-users", Array.from(onlineUsers.keys()));
  });

  socket.on("send-message", async ({ sender, receiver, text }) => {
    try {
      const msg = await Message.create({ sender, receiver, text });
      const receiverSocket = onlineUsers.get(receiver);
      if (receiverSocket) {
        io.to(receiverSocket).emit("receive-message", msg);
      }
      socket.emit("message-sent", msg);
    } catch (err) {
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
    let disconnectedUser = null;
    for (const [userId, sId] of onlineUsers.entries()) {
      if (sId === socket.id) {
        disconnectedUser = userId;
        break;
      }
    }
    if (disconnectedUser) {
      onlineUsers.delete(disconnectedUser);
      await User.findByIdAndUpdate(disconnectedUser, { online: false });
      io.emit("online-users", Array.from(onlineUsers.keys()));
    }
  });
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
