const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 📁 Serve static files (images)
const path = require("path");
app.use("/images", express.static(path.join(__dirname, "uploads/images")));

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log(err));

// Route test
app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

// 🔥 Import routes
const authRoutes = require("./routes/auth");
const bookingRoutes = require("./routes/booking");
const fieldRoutes = require("./routes/field");

// 🔥 Sử dụng routes
app.use("/api/auth", authRoutes);
app.use("/api/fields", fieldRoutes);
app.use("/api/bookings", bookingRoutes);

// Port
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});