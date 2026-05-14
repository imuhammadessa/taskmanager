const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

/**
 * Middleware to protect routes and ensure the user is authenticated
 * Usage: Add protect middleware to routes that require authentication
 * Example: router.get("/profile", protect, profileController);
 */
const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

/**
 * Middleware to restrict access to admin users only
 * Usage: Add adminOnly middleware after protect middleware in routes that require admin access
 * Example: router.get("/admin", protect, adminOnly, adminController);
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(401).json({ message: "Not authorized, admin required" });
  }
};

module.exports = { protect, adminOnly };
