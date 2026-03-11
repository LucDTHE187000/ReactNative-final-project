import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  // Kiểm tra header có Authorization không
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Lấy token từ header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Lấy user từ DB (không lấy password)
      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Admin only" });
  }
};

export const fieldOwner = (req, res, next) => {
  if (req.user && (req.user.role === "fieldOwner" || req.user.role === "admin")) {
    next();
  } else {
    res.status(403).json({ message: "Field owner access required" });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ message: `Access denied. Required role: ${roles.join(" or ")}` });
    }
  };
};