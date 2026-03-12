import express from "express";
import * as notifController from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, notifController.getMyNotifications);
router.get("/unread-count", protect, notifController.getUnreadCount);
router.put("/mark-all-read", protect, notifController.markAllRead);
router.put("/:id/read", protect, notifController.markRead);

export default router;
