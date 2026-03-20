import { v2 as cloudinary } from "cloudinary";

console.log("[CLOUDINARY] Configuring...");
console.log("[CLOUDINARY] CLOUD_NAME exists:", !!process.env.CLOUDINARY_CLOUD_NAME);
console.log("[CLOUDINARY] API_KEY exists:", !!process.env.CLOUDINARY_API_KEY);
console.log("[CLOUDINARY] API_SECRET exists:", !!process.env.CLOUDINARY_API_SECRET);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("[CLOUDINARY] Configured successfully");

export default cloudinary;
