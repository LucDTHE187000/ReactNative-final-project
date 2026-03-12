import express from "express";
import * as reviewController from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, reviewController.createReview);
router.get("/my", protect, reviewController.getMyReviews);
router.get("/field/:fieldId", reviewController.getFieldReviews);

export default router;
