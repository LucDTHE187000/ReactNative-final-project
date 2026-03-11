import express from "express";
import * as fieldController from "../controllers/fieldController.js";
import { protect, fieldOwner } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// 📌 Public routes
router.get("/", fieldController.getAllFields);
router.get("/search", fieldController.searchFields);
router.get("/:id", fieldController.getFieldById);

// 📌 Field Owner & Admin routes
router.post("/", protect, fieldOwner, upload.single("image"), fieldController.createField);
router.put("/:id", protect, fieldOwner, upload.single("image"), fieldController.updateField);
router.delete("/:id", protect, fieldOwner, fieldController.deleteField);

export default router;
