import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    field: { type: mongoose.Schema.Types.ObjectId, ref: "Field", required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
  },
  { timestamps: true }
);

// Mỗi booking chỉ đánh giá được 1 lần
reviewSchema.index({ booking: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);
