const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { protect, admin } = require("../middleware/authMiddleware");

// 📌 Create booking (user must be logged in)
router.post("/", protect, bookingController.createBooking);

// 📌 Get user's bookings
router.get("/my-bookings", protect, bookingController.getUserBookings);

// 📌 Get bookings by date (public)
router.get("/by-date", bookingController.getBookingsByDate);

// 📌 Cancel booking (user)
router.put("/:id/cancel", protect, bookingController.cancelBooking);

// 📌 Get all bookings (admin only)
router.get("/", protect, admin, bookingController.getAllBookings);

// 📌 Update booking status (admin only)
router.put("/:id/status", protect, admin, bookingController.updateBookingStatus);

module.exports = router;
