import express from "express";
import { PayOS } from "@payos/node";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Lazy init — tránh lỗi "env missing" do ES module hoisting chạy trước dotenv.config()
let _payOS = null;
const getPayOS = () => {
  if (!_payOS) {
    _payOS = new PayOS(
      process.env.PAYOS_CLIENT_ID,
      process.env.PAYOS_API_KEY,
      process.env.PAYOS_CHECKSUM_KEY
    );
  }
  return _payOS;
};

// 📌 QR Payment page
router.get("/qr", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/qr.html"));
});

// 📌 ATM Payment page
router.get("/atm", (req, res) => {
  const { amount, order } = req.query;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>ATM Payment</title>
      <style>
        body { font-family: Arial; text-align: center; padding: 40px; }
        .container { max-width: 400px; margin: 0 auto; }
        button { padding: 10px 20px; margin: 10px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Thanh Toán Thẻ ATM</h1>
        <p>Số tiền: <strong>${amount} đ</strong></p>
        <p>Mã đơn hàng: <strong>${order}</strong></p>
        <p>Vui lòng nhập PIN để xác nhận thanh toán</p>
        <button onclick="confirmPayment()">✅ Đã thanh toán</button>
        <button onclick="goBack()">← Quay lại</button>
      </div>
      <script>
        async function confirmPayment() {
          const bookingData = JSON.parse(sessionStorage.getItem('bookingData'));
          const token = localStorage.getItem('token');
          
          try {
            const res = await fetch(\`/api/bookings/\${bookingData.bookingId}/confirm\`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
              },
              body: JSON.stringify({ paymentMethod: 'atm' })
            });
            
            if (res.ok) {
              alert('✅ Thanh toán thành công!');
              window.location.href = '/fields.html';
            } else {
              alert('❌ Lỗi xác nhận thanh toán');
            }
          } catch (err) {
            alert('❌ Lỗi: ' + err.message);
          }
        }
        
        function goBack() {
          window.location.href = '/payment.html';
        }
      </script>
    </body>
    </html>
  `);
});

// 📌 International Payment page
router.get("/international", (req, res) => {
  const { amount, order } = req.query;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>International Payment</title>
      <style>
        body { font-family: Arial; text-align: center; padding: 40px; }
        .container { max-width: 400px; margin: 0 auto; }
        button { padding: 10px 20px; margin: 10px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Thanh Toán Visa/MasterCard</h1>
        <p>Số tiền: <strong>${amount} đ</strong></p>
        <p>Mã đơn hàng: <strong>${order}</strong></p>
        <p>Vui lòng nhập thông tin thẻ để xác nhận thanh toán</p>
        <button onclick="confirmPayment()">✅ Đã thanh toán</button>
        <button onclick="goBack()">← Quay lại</button>
      </div>
      <script>
        async function confirmPayment() {
          const bookingData = JSON.parse(sessionStorage.getItem('bookingData'));
          const token = localStorage.getItem('token');
          
          try {
            const res = await fetch(\`/api/bookings/\${bookingData.bookingId}/confirm\`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
              },
              body: JSON.stringify({ paymentMethod: 'international' })
            });
            
            if (res.ok) {
              alert('✅ Thanh toán thành công!');
              window.location.href = '/fields.html';
            } else {
              alert('❌ Lỗi xác nhận thanh toán');
            }
          } catch (err) {
            alert('❌ Lỗi: ' + err.message);
          }
        }
        
        function goBack() {
          window.location.href = '/payment.html';
        }
      </script>
    </body>
    </html>
  `);
});

// 📌 Confirm payment (xác nhận thanh toán - legacy web)
router.put("/:id/confirm", async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = "confirmed";
    await booking.save();

    res.json({ message: "Payment confirmed successfully", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Author: Lê Trần Trọng Đạt - mssv: HE194235
 * Param: bookingId, amount, description (body)
 * Description: Tạo link thanh toán PayOS, lưu Payment record, trả về checkoutUrl cho mobile mở trong browser
 */
router.post("/create-link", protect, async (req, res) => {
  try {
    const { bookingId, amount, description } = req.body;

    if (!bookingId || !amount || !description) {
      return res.status(400).json({ message: "Thiếu thông tin tạo link thanh toán" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking không tồn tại" });
    }

    // PayOS yêu cầu orderCode là số nguyên dương
    const numericOrderCode = Number(String(Date.now()).slice(-8));

    const paymentData = {
      orderCode: numericOrderCode,
      amount: Math.round(amount),
      description: description.substring(0, 25),
      returnUrl: `${process.env.BASE_URL}/payment-result?bookingId=${bookingId}`,
      cancelUrl: `${process.env.BASE_URL}/payment-result?bookingId=${bookingId}`,
    };

    const paymentLink = await getPayOS().paymentRequests.create(paymentData);

    // Lưu payosOrderCode riêng — không ghi đè orderCode hiển thị của user
    booking.payosOrderCode = numericOrderCode;
    await booking.save();

    // Tạo Payment record
    await Payment.create({
      booking: bookingId,
      user: req.user._id,
      amount: Math.round(amount),
      payosOrderCode: numericOrderCode,
      payosCheckoutUrl: paymentLink.checkoutUrl,
      status: "pending",
    });

    res.json({
      checkoutUrl: paymentLink.checkoutUrl,
      orderCode: numericOrderCode,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Author: Lê Trần Trọng Đạt - mssv: HE194235
 * Param: PayOS webhook payload (body)
 * Description: Nhận callback từ PayOS sau khi thanh toán, cập nhật Payment record và Booking status
 */
router.post("/webhook", async (req, res) => {
  try {
    const webhookData = getPayOS().webhooks.verify(req.body);
    const numericCode = Number(webhookData.orderCode);
    const isSuccess = webhookData.code === "00";
    const now = new Date();

    if (isSuccess) {
      // Cập nhật Booking
      await Booking.findOneAndUpdate(
        { payosOrderCode: numericCode },
        {
          status: "confirmed",
          paymentStatus: "paid",
          paymentMethod: "qr",
          paidAt: now,
        }
      );

      // Cập nhật Payment record
      await Payment.findOneAndUpdate(
        { payosOrderCode: numericCode },
        { status: "paid", paidAt: now }
      );
    } else {
      // Thanh toán bị huỷ
      await Payment.findOneAndUpdate(
        { payosOrderCode: numericCode },
        { status: "cancelled" }
      );
    }

    res.json({ message: "Webhook received" });
  } catch (err) {
    // Trả 200 để PayOS không retry liên tục
    console.error("PayOS webhook error:", err.message);
    res.json({ message: "Webhook ignored" });
  }
});

/**
 * Author: Lê Trần Trọng Đạt - mssv: HE194235
 * Param: bookingId (params)
 * Description: Kiểm tra trạng thái payment — ưu tiên check DB trước (payment-result đã update),
 *              fallback sang PayOS API nếu DB chưa có kết quả. Tránh race condition khi browser
 *              đóng trước khi payment-result redirect hoàn thành.
 */
router.get("/verify/:bookingId", protect, async (req, res) => {
  try {
    // Bước 1: Check DB của mình trước — payment-result có thể đã update rồi
    const booking = await Booking.findById(req.params.bookingId).select("paymentStatus status");
    if (booking && booking.paymentStatus === "paid") {
      return res.json({ status: "paid" });
    }

    const payment = await Payment.findOne({ booking: req.params.bookingId })
      .sort({ createdAt: -1 });

    if (!payment || !payment.payosOrderCode) {
      return res.json({ status: "not_found" });
    }

    // Bước 2: Payment record đã "paid" chưa?
    if (payment.status === "paid") {
      // Đồng bộ sang Booking nếu chưa
      await Booking.findByIdAndUpdate(req.params.bookingId, {
        status: "confirmed",
        paymentStatus: "paid",
        paymentMethod: "qr",
        paidAt: payment.paidAt || new Date(),
      });
      return res.json({ status: "paid" });
    }

    // Bước 3: Query trực tiếp từ PayOS
    const payosResult = await getPayOS().paymentRequests.get(payment.payosOrderCode);
    const payosStatus = payosResult.status; // "PAID" | "PENDING" | "CANCELLED" | "EXPIRED"

    if (payosStatus === "PAID") {
      const now = new Date();
      await Payment.findByIdAndUpdate(payment._id, { status: "paid", paidAt: now });
      await Booking.findByIdAndUpdate(req.params.bookingId, {
        status: "confirmed",
        paymentStatus: "paid",
        paymentMethod: "qr",
        paidAt: now,
      });
      return res.json({ status: "paid" });
    }

    if (payosStatus === "CANCELLED" || payosStatus === "EXPIRED") {
      await Payment.findByIdAndUpdate(payment._id, { status: "cancelled" });
      return res.json({ status: "cancelled" });
    }

    res.json({ status: "pending" });
  } catch (error) {
    // Fallback: nếu PayOS API lỗi, trả về trạng thái từ DB của mình
    try {
      const fallbackBooking = await Booking.findById(req.params.bookingId).select("paymentStatus");
      if (fallbackBooking?.paymentStatus === "paid") {
        return res.json({ status: "paid" });
      }
    } catch (_) { /* ignore */ }
    res.status(500).json({ message: error.message });
  }
});

/**
 * Author: Lê Trần Trọng Đạt - mssv: HE194235
 * Param: bookingId (params)
 * Description: Lấy danh sách Payment records của một booking (lịch sử giao dịch)
 */
router.get("/booking/:bookingId", protect, async (req, res) => {
  try {
    const payments = await Payment.find({ booking: req.params.bookingId })
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 📌 Trang kết quả thanh toán — PayOS redirect về đây sau khi user trả tiền hoặc huỷ
router.get("/payment-result", async (req, res) => {
  // PayOS gửi: status=PAID|CANCELLED, code=00, cancel=true|false, orderCode, bookingId (do ta đặt)
  const { bookingId, orderCode, code, cancel } = req.query;
  const isSuccess = code === "00" && cancel !== "true";

  // Cập nhật DB ngay tại đây để không phụ thuộc webhook
  if (isSuccess && bookingId && orderCode) {
    try {
      const now = new Date();
      await Payment.findOneAndUpdate(
        { payosOrderCode: Number(orderCode) },
        { status: "paid", paidAt: now }
      );
      await Booking.findByIdAndUpdate(bookingId, {
        status: "confirmed",
        paymentStatus: "paid",
        paymentMethod: "qr",
        paidAt: now,
      });
    } catch (err) {
      console.error("payment-result DB update error:", err.message);
    }
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${isSuccess ? "Thanh toán thành công" : "Đã huỷ thanh toán"}</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 60px 20px; background: #0F1419; color: #fff; }
        .icon { font-size: 64px; margin-bottom: 20px; }
        h1 { font-size: 24px; margin-bottom: 12px; }
        p { color: #B0BEC5; }
      </style>
    </head>
    <body>
      <div class="icon">${isSuccess ? "✅" : "❌"}</div>
      <h1>${isSuccess ? "Thanh toán thành công!" : "Đã huỷ thanh toán"}</h1>
      <p>${isSuccess ? "Đơn đặt sân đã được xác nhận. Bạn có thể đóng trang này." : "Giao dịch đã bị huỷ. Bạn có thể đóng trang này."}</p>
    </body>
    </html>
  `);
});

export default router;