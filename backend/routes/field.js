const express = require("express");
const router = express.Router();
const fieldController = require("../controllers/fieldController");
const { protect, admin } = require("../middleware/authMiddleware");

// 📌 Public routes
router.get("/", fieldController.getAllFields);
router.get("/search", fieldController.searchFields);
router.get("/:id", fieldController.getFieldById);

// 📌 Admin only routes
router.post("/", protect, admin, fieldController.createField);
router.put("/:id", protect, admin, fieldController.updateField);
router.delete("/:id", protect, admin, fieldController.deleteField);

module.exports = router;
