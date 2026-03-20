import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("[DB] Connecting to MongoDB...");
    console.log("[DB] MONGO_URI exists:", !!process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[DB] MongoDB connected successfully");
  } catch (err) {
    console.error("[DB] MongoDB connection FAILED:", err.message);
    process.exit(1);
  }
};

export default connectDB;
