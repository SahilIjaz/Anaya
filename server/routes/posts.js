import { Router } from "express";
import Post from "../models/Post.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = Router();

// Create post
//fAdgo-rDMnjyJmbFwF3_Qvajs2o
router.post("/", auth, async (req, res) => {
  try {
    const { content, image, tags } = req.body;
    const post = await Post.create({ author: req.userId, content, image, tags });
    const populated = await post.populate("author", "name avatar");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Custom feed: posts from followed users + posts matching interests/hobbies, sorted by relevance
router.get("/feed", auth, async (req, res) => {
  try {
    const me = await User.findById(req.userId);
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    // Get posts from people I follow
    const followingPosts = await Post.find({ author: { $in: me.following } })
      .populate("author", "name avatar")
      .populate("comments.user", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get posts matching my interests/hobbies (discovery)
    const discoveryPosts = await Post.find({
      author: { $nin: [...me.following, me._id] },
      tags: { $in: [...me.interests, ...me.hobbies] },
    })
      .populate("author", "name avatar")
      .populate("comments.user", "name avatar")
      .sort({ createdAt: -1 })
      .limit(10);

    // Merge and deduplicate
    const seen = new Set();
    const feed = [];
    for (const p of [...followingPosts, ...discoveryPosts]) {
      const id = p._id.toString();
      if (!seen.has(id)) {
        seen.add(id);
        feed.push(p);
      }
    }

    // Score: recency + likes + interest match
    feed.sort((a, b) => {
      const scoreA = a.likes.length * 2 + (a.tags.some((t) => me.interests.includes(t)) ? 5 : 0);
      const scoreB = b.likes.length * 2 + (b.tags.some((t) => me.interests.includes(t)) ? 5 : 0);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return b.createdAt - a.createdAt;
    });

    res.json(feed);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's posts
router.get("/user/:userId", auth, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .populate("author", "name avatar")
      .populate("comments.user", "name avatar")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Like / unlike
router.put("/:id/like", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const liked = post.likes.includes(req.userId);
    if (liked) post.likes.pull(req.userId);
    else post.likes.push(req.userId);
    await post.save();

    const populated = await post.populate([
      { path: "author", select: "name avatar" },
      { path: "comments.user", select: "name avatar" },
    ]);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Comment
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ user: req.userId, text: req.body.text });
    await post.save();

    const populated = await post.populate([
      { path: "author", select: "name avatar" },
      { path: "comments.user", select: "name avatar" },
    ]);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete post
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== req.userId)
      return res.status(403).json({ message: "Not authorized" });
    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
