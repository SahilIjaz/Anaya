import { Router } from "express";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = Router();

// Get user profile
router.get("/:id", auth, async (req, res) => {
  console.log("[USERS] GET /:id hit | id:", req.params.id);
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("followers", "name avatar")
      .populate("following", "name avatar");
    if (!user) {
      console.log("[USERS] User not found:", req.params.id);
      return res.status(404).json({ message: "User not found" });
    }
    console.log("[USERS] User found:", user.name);
    res.json(user);
  } catch (err) {
    console.error("[USERS] GET /:id ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// Update profile
router.put("/profile/update", auth, async (req, res) => {
  console.log("[USERS] PUT /profile/update | userId:", req.userId);
  console.log("[USERS] Update fields:", Object.keys(req.body));
  try {
    const { name, bio, interests, hobbies, avatar } = req.body;
    const update = { name, bio, interests, hobbies };
    if (avatar) {
      update.avatar = avatar;
      console.log("[USERS] Avatar update included");
    }
    const user = await User.findByIdAndUpdate(
      req.userId,
      update,
      { new: true }
    ).select("-password");
    console.log("[USERS] Profile updated successfully");
    res.json(user);
  } catch (err) {
    console.error("[USERS] Profile update ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// Follow / unfollow
router.put("/follow/:id", auth, async (req, res) => {
  console.log("[USERS] PUT /follow/:id | target:", req.params.id, "| by:", req.userId);
  try {
    if (req.params.id === req.userId) {
      console.log("[USERS] Cannot follow self");
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const target = await User.findById(req.params.id);
    const me = await User.findById(req.userId);
    if (!target) {
      console.log("[USERS] Follow target not found");
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = me.following.includes(req.params.id);
    if (isFollowing) {
      me.following.pull(req.params.id);
      target.followers.pull(req.userId);
      console.log("[USERS] Unfollowed");
    } else {
      me.following.push(req.params.id);
      target.followers.push(req.userId);
      console.log("[USERS] Followed");
    }
    await me.save();
    await target.save();

    res.json({ following: !isFollowing, user: await User.findById(req.userId).select("-password") });
  } catch (err) {
    console.error("[USERS] Follow ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// Search users
router.get("/", auth, async (req, res) => {
  console.log("[USERS] GET / (search) | query:", req.query.q);
  try {
    const q = req.query.q;
    let users;
    if (q) {
      users = await User.find({
        _id: { $ne: req.userId },
        name: { $regex: q, $options: "i" },
      }).select("-password").limit(20);
    } else {
      users = await User.find({ _id: { $ne: req.userId } }).select("-password").limit(50);
    }
    console.log("[USERS] Search returned", users.length, "users");
    res.json(users);
  } catch (err) {
    console.error("[USERS] Search ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// Suggested users (based on shared interests/hobbies)
router.get("/discover/suggested", auth, async (req, res) => {
  console.log("[USERS] GET /discover/suggested | userId:", req.userId);
  try {
    const me = await User.findById(req.userId);
    console.log("[USERS] My interests:", me.interests, "| hobbies:", me.hobbies);
    const users = await User.find({
      _id: { $ne: req.userId, $nin: me.following },
      $or: [
        { interests: { $in: me.interests } },
        { hobbies: { $in: me.hobbies } },
      ],
    })
      .select("-password")
      .limit(20);
    console.log("[USERS] Suggested users found:", users.length);
    res.json(users);
  } catch (err) {
    console.error("[USERS] Discover ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

export default router;
