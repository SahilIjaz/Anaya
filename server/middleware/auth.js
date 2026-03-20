import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
  console.log("[AUTH-MW] Checking auth for:", req.method, req.originalUrl);
  const header = req.headers.authorization;
  if (!header) {
    console.log("[AUTH-MW] No authorization header");
    return res.status(401).json({ message: "No token provided" });
  }

  const token = header.split(" ")[1];
  if (!token) {
    console.log("[AUTH-MW] No token in header");
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    console.log("[AUTH-MW] JWT_SECRET exists:", !!process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    console.log("[AUTH-MW] Token valid, userId:", decoded.id);
    next();
  } catch (err) {
    console.error("[AUTH-MW] Token verification FAILED:", err.message);
    res.status(401).json({ message: "Invalid token" });
  }
};

export default auth;
