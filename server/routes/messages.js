import { Router } from "express";
import mongoose from "mongoose";
import Message from "../models/Message.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = Router();

// Get conversations list
router.get("/conversations", auth, async (req, res) => {
  console.log("[MESSAGES] GET /conversations | userId:", req.userId);
  try {
    const uid = new mongoose.Types.ObjectId(req.userId);
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: uid }, { receiver: uid }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$sender", uid] }, "$receiver", "$sender"],
          },
          lastMessage: { $first: "$text" },
          lastDate: { $first: "$createdAt" },
          unread: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$receiver", uid] }, { $eq: ["$read", false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { lastDate: -1 } },
    ]);

    console.log("[MESSAGES] Conversations found:", messages.length);
    const populated = await User.populate(messages, {
      path: "_id",
      select: "name avatar online",
    });

    res.json(populated);
  } catch (err) {
    console.error("[MESSAGES] Conversations ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// Get messages with a specific user
router.get("/:userId", auth, async (req, res) => {
  console.log("[MESSAGES] GET /:userId | me:", req.userId, "| other:", req.params.userId);
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.userId, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.userId },
      ],
    }).sort({ createdAt: 1 });

    console.log("[MESSAGES] Messages found:", messages.length);

    await Message.updateMany(
      { sender: req.params.userId, receiver: req.userId, read: false },
      { read: true }
    );
    console.log("[MESSAGES] Marked as read");

    res.json(messages);
  } catch (err) {
    console.error("[MESSAGES] Get messages ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// Send message (REST fallback)
router.post("/", auth, async (req, res) => {
  console.log("[MESSAGES] POST / (send) | from:", req.userId, "| to:", req.body.receiver);
  try {
    const { receiver, text } = req.body;
    const msg = await Message.create({ sender: req.userId, receiver, text });
    console.log("[MESSAGES] Message sent:", msg._id);
    res.status(201).json(msg);
  } catch (err) {
    console.error("[MESSAGES] Send ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

export default router;
