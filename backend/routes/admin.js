import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  getOverviewStats,
  getRevenueByDay,
  getTopFields,
  getRevenueByMonth,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/stats", protect, admin, getOverviewStats);
router.get("/revenue-by-day", protect, admin, getRevenueByDay);
router.get("/revenue-by-month", protect, admin, getRevenueByMonth);
router.get("/top-fields", protect, admin, getTopFields);

export default router;
