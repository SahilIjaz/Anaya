import { Router } from "express";
import mongoose from "mongoose";
import Message from "../models/Message.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = Router();

// Get conversations list (people I've chatted with)
router.get("/conversations", auth, async (req, res) => {
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

    const populated = await User.populate(messages, {
      path: "_id",
      select: "name avatar online",
    });

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get messages with a specific user
router.get("/:userId", auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.userId, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.userId },
      ],
    }).sort({ createdAt: 1 });

    // Mark as read
    await Message.updateMany(
      { sender: req.params.userId, receiver: req.userId, read: false },
      { read: true }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send message (REST fallback)
router.post("/", auth, async (req, res) => {
  try {
    const { receiver, text } = req.body;
    const msg = await Message.create({ sender: req.userId, receiver, text });
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
