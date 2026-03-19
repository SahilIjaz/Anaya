import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import authMw from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, interests, hobbies } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });
    if (!interests?.length || !hobbies?.length)
      return res.status(400).json({ message: "Select at least one interest and hobby" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashed,
      interests,
      hobbies,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=200`,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.status(201).json({ token, user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar, interests: user.interests, hobbies: user.hobbies, bio: user.bio, followers: user.followers, following: user.following } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar, interests: user.interests, hobbies: user.hobbies, bio: user.bio, followers: user.followers, following: user.following } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/me", authMw, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
