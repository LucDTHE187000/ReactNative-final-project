import express from "express";
import * as fieldController from "../controllers/fieldController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// 📌 Public routes
router.get("/", fieldController.getAllFields);
router.get("/search", fieldController.searchFields);
router.get("/:id", fieldController.getFieldById);

// 📌 Admin only routes
router.post("/", protect, admin, fieldController.createField);
router.put("/:id", protect, admin, fieldController.updateField);
router.delete("/:id", protect, admin, fieldController.deleteField);

export default router;
