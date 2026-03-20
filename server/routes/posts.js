import { Router } from "express";
import Post from "../models/Post.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = Router();

// Create post
router.post("/", auth, async (req, res) => {
  console.log("[POSTS] POST / (create) | userId:", req.userId);
  console.log("[POSTS] Content length:", req.body.content?.length, "| has image:", !!req.body.image, "| tags:", req.body.tags);
  try {
    const { content, image, tags } = req.body;
    const post = await Post.create({ author: req.userId, content, image, tags });
    const populated = await post.populate("author", "name avatar");
    console.log("[POSTS] Post created:", post._id);
    res.status(201).json(populated);
  } catch (err) {
    console.error("[POSTS] Create ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// Custom feed
router.get("/feed", auth, async (req, res) => {
  console.log("[POSTS] GET /feed | userId:", req.userId, "| page:", req.query.page);
  try {
    const me = await User.findById(req.userId);
    console.log("[POSTS] Following count:", me.following.length, "| interests:", me.interests, "| hobbies:", me.hobbies);
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const followingPosts = await Post.find({ author: { $in: me.following } })
      .populate("author", "name avatar")
      .populate("comments.user", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    console.log("[POSTS] Following posts found:", followingPosts.length);

    const discoveryPosts = await Post.find({
      author: { $nin: [...me.following, me._id] },
      tags: { $in: [...me.interests, ...me.hobbies] },
    })
      .populate("author", "name avatar")
      .populate("comments.user", "name avatar")
      .sort({ createdAt: -1 })
      .limit(10);
    console.log("[POSTS] Discovery posts found:", discoveryPosts.length);

    const seen = new Set();
    const feed = [];
    for (const p of [...followingPosts, ...discoveryPosts]) {
      const id = p._id.toString();
      if (!seen.has(id)) {
        seen.add(id);
        feed.push(p);
      }
    }

    feed.sort((a, b) => {
      const scoreA = a.likes.length * 2 + (a.tags.some((t) => me.interests.includes(t)) ? 5 : 0);
      const scoreB = b.likes.length * 2 + (b.tags.some((t) => me.interests.includes(t)) ? 5 : 0);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return b.createdAt - a.createdAt;
    });

    console.log("[POSTS] Feed total:", feed.length);
    res.json(feed);
  } catch (err) {
    console.error("[POSTS] Feed ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// Get user's posts
router.get("/user/:userId", auth, async (req, res) => {
  console.log("[POSTS] GET /user/:userId | userId:", req.params.userId);
  try {
    const posts = await Post.find({ author: req.params.userId })
      .populate("author", "name avatar")
      .populate("comments.user", "name avatar")
      .sort({ createdAt: -1 });
    console.log("[POSTS] User posts found:", posts.length);
    res.json(posts);
  } catch (err) {
    console.error("[POSTS] User posts ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// Like / unlike
router.put("/:id/like", auth, async (req, res) => {
  console.log("[POSTS] PUT /:id/like | postId:", req.params.id, "| userId:", req.userId);
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      console.log("[POSTS] Post not found for like");
      return res.status(404).json({ message: "Post not found" });
    }

    const liked = post.likes.includes(req.userId);
    if (liked) post.likes.pull(req.userId);
    else post.likes.push(req.userId);
    await post.save();
    console.log("[POSTS] Post", liked ? "unliked" : "liked");

    const populated = await post.populate([
      { path: "author", select: "name avatar" },
      { path: "comments.user", select: "name avatar" },
    ]);
    res.json(populated);
  } catch (err) {
    console.error("[POSTS] Like ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// Comment
router.post("/:id/comment", auth, async (req, res) => {
  console.log("[POSTS] POST /:id/comment | postId:", req.params.id, "| userId:", req.userId);
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      console.log("[POSTS] Post not found for comment");
      return res.status(404).json({ message: "Post not found" });
    }

    post.comments.push({ user: req.userId, text: req.body.text });
    await post.save();
    console.log("[POSTS] Comment added");

    const populated = await post.populate([
      { path: "author", select: "name avatar" },
      { path: "comments.user", select: "name avatar" },
    ]);
    res.json(populated);
  } catch (err) {
    console.error("[POSTS] Comment ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// Delete post
router.delete("/:id", auth, async (req, res) => {
  console.log("[POSTS] DELETE /:id | postId:", req.params.id, "| userId:", req.userId);
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      console.log("[POSTS] Post not found for delete");
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.author.toString() !== req.userId) {
      console.log("[POSTS] Not authorized to delete");
      return res.status(403).json({ message: "Not authorized" });
    }
    await post.deleteOne();
    console.log("[POSTS] Post deleted");
    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error("[POSTS] Delete ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

export default router;
