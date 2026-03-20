import { Router } from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import auth from "../middleware/auth.js";

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/", auth, upload.single("image"), async (req, res) => {
  console.log("[UPLOAD] POST / hit | userId:", req.userId);
  console.log("[UPLOAD] File present:", !!req.file);
  if (req.file) {
    console.log("[UPLOAD] File size:", req.file.size, "| mimetype:", req.file.mimetype);
  }
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    console.log("[UPLOAD] Converting to base64...");
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    console.log("[UPLOAD] Uploading to Cloudinary...");
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "anaya",
      resource_type: "image",
    });

    console.log("[UPLOAD] Cloudinary upload success:", result.secure_url);
    res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (err) {
    console.error("[UPLOAD] ERROR:", err.message, err.stack);
    res.status(500).json({ message: err.message });
  }
});

export default router;
