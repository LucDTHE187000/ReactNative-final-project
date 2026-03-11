import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    // Booking tương ứng
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    // User thực hiện thanh toán
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Số tiền (VND)
    amount: {
      type: Number,
      required: true,
    },
    // Mã số nguyên gửi cho PayOS — dùng để match webhook
    payosOrderCode: {
      type: Number,
      default: null,
      index: true,
    },
    // URL thanh toán trả về từ PayOS (mobile mở WebView)
    payosCheckoutUrl: {
      type: String,
      default: null,
    },
    // Trạng thái giao dịch
    status: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending",
    },
    // Thời điểm thanh toán thành công
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
