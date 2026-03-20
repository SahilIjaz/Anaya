import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import authMw from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  console.log("[AUTH] POST /register hit");
  console.log("[AUTH] Body keys:", Object.keys(req.body));
  try {
    const { name, email, password, interests, hobbies } = req.body;
    console.log("[AUTH] Register attempt for:", email, "| name:", name);
    console.log("[AUTH] Interests:", interests?.length, "| Hobbies:", hobbies?.length);

    if (!name || !email || !password) {
      console.log("[AUTH] Missing required fields");
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!interests?.length || !hobbies?.length) {
      console.log("[AUTH] Missing interests or hobbies");
      return res.status(400).json({ message: "Select at least one interest and hobby" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      console.log("[AUTH] Email already registered:", email);
      return res.status(400).json({ message: "Email already registered" });
    }

    console.log("[AUTH] Hashing password...");
    const hashed = await bcrypt.hash(password, 12);
    console.log("[AUTH] Creating user in DB...");
    const user = await User.create({
      name,
      email,
      password: hashed,
      interests,
      hobbies,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=200`,
    });
    console.log("[AUTH] User created:", user._id);

    console.log("[AUTH] Signing JWT...");
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    console.log("[AUTH] Registration successful for:", email);
    res.status(201).json({ token, user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar, interests: user.interests, hobbies: user.hobbies, bio: user.bio, followers: user.followers, following: user.following } });
  } catch (err) {
    console.error("[AUTH] Register ERROR:", err.message, err.stack);
    res.status(500).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  console.log("[AUTH] POST /login hit");
  console.log("[AUTH] Body keys:", Object.keys(req.body));
  try {
    const { email, password } = req.body;
    console.log("[AUTH] Login attempt for:", email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log("[AUTH] User not found for email:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }
    console.log("[AUTH] User found:", user._id);

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log("[AUTH] Password mismatch for:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }
    console.log("[AUTH] Password matched");

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    console.log("[AUTH] Login successful for:", email);
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar, interests: user.interests, hobbies: user.hobbies, bio: user.bio, followers: user.followers, following: user.following } });
  } catch (err) {
    console.error("[AUTH] Login ERROR:", err.message, err.stack);
    res.status(500).json({ message: err.message });
  }
});

router.get("/me", authMw, async (req, res) => {
  console.log("[AUTH] GET /me hit | userId:", req.userId);
  try {
    const user = await User.findById(req.userId).select("-password");
    console.log("[AUTH] /me user found:", !!user);
    res.json(user);
  } catch (err) {
    console.error("[AUTH] /me ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

export default router;
