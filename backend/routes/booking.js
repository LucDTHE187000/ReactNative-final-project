import express from "express";
import * as bookingController from "../controllers/bookingController.js";
import { protect, admin, fieldOwner } from "../middleware/authMiddleware.js";

const router = express.Router();

// 📌 Create booking (user must be logged in)
router.post("/", protect, bookingController.createBooking);

// 📌 Get user's bookings
router.get("/my-bookings", protect, bookingController.getUserBookings);

// 📌 Get bookings by date (public)
router.get("/by-date", bookingController.getBookingsByDate);

// 📌 Get bookings for field owner's fields
router.get("/field-owner-bookings", protect, fieldOwner, bookingController.getFieldOwnerBookings);

// 📌 Get single booking by ID (owner or admin)
router.get("/:id", protect, bookingController.getBookingById);

// 📌 Cancel booking (user)
router.put("/:id/cancel", protect, bookingController.cancelBooking);

// 📌 Field owner approve booking
router.put("/:id/approve", protect, fieldOwner, bookingController.approveBooking);

// 📌 Field owner reject booking
router.put("/:id/reject", protect, fieldOwner, bookingController.rejectBooking);

// 📌 Get all bookings (admin only)
router.get("/", protect, admin, bookingController.getAllBookings);

// 📌 Update booking status (admin only)
router.put("/:id/status", protect, admin, bookingController.updateBookingStatus);

// 📌 Delete booking (admin only)
router.delete("/:id", protect, admin, bookingController.deleteBooking);

// 📌 Confirm payment
router.put("/:id/confirm", protect, bookingController.confirmPayment);

export default router;
