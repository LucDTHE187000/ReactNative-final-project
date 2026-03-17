import Review from "../models/Review.js";
import Booking from "../models/Booking.js";
import Field from "../models/Field.js";
import User from "../models/User.js";
import { createNotification } from "../utils/notificationHelper.js";

/**
 * Author: Dương Trọng Lực - mssv: HE187000
 * Param: req.body { bookingId, rating, comment }
 * Description: Tạo đánh giá cho sân sau booking confirmed, cập nhật avgRating & reviewCount của Field
 */
export const createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    const booking = await Booking.findById(bookingId).populate("field");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    // Cho phép đánh giá khi booking đã được xác nhận (confirmed) hoặc đã thanh toán
    if (booking.status !== "confirmed" && booking.paymentStatus !== "paid") {
      return res.status(400).json({ message: "Chỉ đánh giá được booking đã được xác nhận" });
    }

    if (!booking.field) {
      return res.status(400).json({ message: "Sân không còn tồn tại, không thể đánh giá" });
    }

    const existing = await Review.findOne({ booking: bookingId });
    if (existing) return res.status(400).json({ message: "Booking này đã được đánh giá" });

    const review = await Review.create({
      user: req.user._id,
      field: booking.field._id,
      booking: bookingId,
      rating: Number(rating),
      comment: comment || "",
    });

    // Cập nhật avgRating và reviewCount của Field
    const allReviews = await Review.find({ field: booking.field._id });
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await Field.findByIdAndUpdate(booking.field._id, {
      avgRating: Math.round(avg * 10) / 10,
      reviewCount: allReviews.length,
    });

    // Thông báo cho người dùng
    await createNotification(
      req.user._id,
      "Đánh giá thành công",
      `Cảm ơn bạn đã đánh giá sân ${booking.field.name}!`,
      "review",
      bookingId
    );

    // Thông báo cho chủ sân (nếu có)
    if (booking.field.owner) {
      await createNotification(
        booking.field.owner,
        "Sân vừa nhận đánh giá mới ⭐",
        `Sân "${booking.field.name}" nhận được đánh giá ${rating}★ từ khách hàng. ${comment ? `"${comment}"` : ""}`,
        "review",
        bookingId
      );
    }

    // Thông báo cho tất cả admin
    const admins = await User.find({ role: "admin" }).select("_id");
    for (const admin of admins) {
      await createNotification(
        admin._id,
        "Đánh giá sân mới",
        `Sân "${booking.field.name}" vừa nhận ${rating}★ từ khách hàng.`,
        "review",
        bookingId
      );
    }

    res.status(201).json({ message: "Đánh giá thành công", review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Booking này đã được đánh giá" });
    }
    res.status(500).json({ message: error.message });
  }
};

/**
 * Author: Dương Trọng Lực - mssv: HE187000
 * Param: req.params.fieldId
 * Description: Lấy tất cả đánh giá của một sân, kèm tên user
 */
export const getFieldReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ field: req.params.fieldId })
      .populate("user", "name")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Author: Dương Trọng Lực - mssv: HE187000
 * Param: none (lấy từ req.user)
 * Description: Lấy tất cả review của user hiện tại — dùng để check booking nào đã được đánh giá
 */
export const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
