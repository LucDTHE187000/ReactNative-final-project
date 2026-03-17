import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  getOverviewStats,
  getRevenueByDay,
  getTopFields,
  getRevenueByMonth,
  getAllUsers,
  deleteUser,
  adminUpdateBookingStatus,
  getAllBookingsAdmin,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/stats", protect, admin, getOverviewStats);
router.get("/revenue-by-day", protect, admin, getRevenueByDay);
router.get("/revenue-by-month", protect, admin, getRevenueByMonth);
router.get("/top-fields", protect, admin, getTopFields);

// User management
router.get("/users", protect, admin, getAllUsers);
router.delete("/users/:id", protect, admin, deleteUser);

// Booking management
router.get("/bookings", protect, admin, getAllBookingsAdmin);
router.put("/bookings/:id/status", protect, admin, adminUpdateBookingStatus);

export default router;
