import mongoose from "mongoose";

const fieldSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["Sân 5", "Sân 7", "Sân 11"],
      required: true,
    },
    pricePerHour: {
      type: Number,
      required: true,
      default: 0,
    },
    // Giá theo khung giờ
    priceSchedule: [
      {
        name: String, // "Sáng", "Cao điểm", "VIP"
        startHour: Number, // 6
        endHour: Number, // 14
        price: Number, // 400000
      },
    ],
    capacity: {
      type: Number,
      default: 1,
    },
    image: {
      type: String,
      default: null,
    },
    avgRating: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Field", fieldSchema);
