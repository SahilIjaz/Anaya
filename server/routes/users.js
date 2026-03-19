import { Router } from "express";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = Router();

// Get user profile
router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("followers", "name avatar")
      .populate("following", "name avatar");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update profile
router.put("/profile/update", auth, async (req, res) => {
  try {
    const { name, bio, interests, hobbies, avatar } = req.body;
    const update = { name, bio, interests, hobbies };
    if (avatar) update.avatar = avatar;
    const user = await User.findByIdAndUpdate(
      req.userId,
      update,
      { new: true }
    ).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Follow / unfollow
router.put("/follow/:id", auth, async (req, res) => {
  try {
    if (req.params.id === req.userId)
      return res.status(400).json({ message: "Cannot follow yourself" });

    const target = await User.findById(req.params.id);
    const me = await User.findById(req.userId);
    if (!target) return res.status(404).json({ message: "User not found" });

    const isFollowing = me.following.includes(req.params.id);
    if (isFollowing) {
      me.following.pull(req.params.id);
      target.followers.pull(req.userId);
    } else {
      me.following.push(req.params.id);
      target.followers.push(req.userId);
    }
    await me.save();
    await target.save();

    res.json({ following: !isFollowing, user: await User.findById(req.userId).select("-password") });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search users
router.get("/", auth, async (req, res) => {
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
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Suggested users (based on shared interests/hobbies)
router.get("/discover/suggested", auth, async (req, res) => {
  try {
    const me = await User.findById(req.userId);
    const users = await User.find({
      _id: { $ne: req.userId, $nin: me.following },
      $or: [
        { interests: { $in: me.interests } },
        { hobbies: { $in: me.hobbies } },
      ],
    })
      .select("-password")
      .limit(20);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
