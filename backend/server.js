import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Routes
import authRoutes from "./routes/auth.js";
import bookingRoutes from "./routes/booking.js";
import fieldRoutes from "./routes/field.js";
import paymentRoutes from "./routes/payment.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 📁 Serve static files (images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// 📁 Alias: /images → uploads/images (backward compat với seed data cũ)
app.use("/images", express.static(path.join(__dirname, "uploads/images")));

// 📁 Serve static HTML/CSS/JS interface
app.use(express.static(path.join(__dirname, "public")));

// 📊 Kết nối MongoDB
try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB Connected");
} catch (err) {
  console.error("❌ MongoDB Connection Error:", err);
}

// Route test
app.get("/", (req, res) => {
  res.json({ message: "🚀 API is running on port 5000" });
});

// 🔥 Routes
app.use("/api/auth", authRoutes);
app.use("/api/fields", fieldRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payment", paymentRoutes);

// 📌 PayOS return/cancel URL shortcut (redirect từ /payment-result về /api/payment/payment-result)
app.get("/payment-result", (req, res) => {
  res.redirect(`/api/payment/payment-result?${new URLSearchParams(req.query).toString()}`);
});

// Port
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});