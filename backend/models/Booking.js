import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    field: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Field",
      required: true,
    },
    fieldName: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    startHour: {
      type: Number,
      required: true,
    },
    endHour: {
      type: Number,
      required: true,
    },
    services: [
      {
        name: String,
        price: Number,
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
    },
    // Mã đơn hiển thị cho user (ví dụ: BOOKING1773062509827)
    orderCode: {
      type: String,
      required: true,
    },
    // Booking status
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
    // Trạng thái thanh toán
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "failed"],
      default: "unpaid",
    },
    // Phương thức thanh toán
    paymentMethod: {
      type: String,
      enum: ["qr", "atm", "international", "cash", null],
      default: null,
    },
    // Mã đơn số nguyên gửi cho PayOS (dùng để tra cứu webhook)
    payosOrderCode: {
      type: Number,
      default: null,
    },
    // Thời điểm thanh toán thành công
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);