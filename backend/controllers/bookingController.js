import Booking from "../models/Booking.js";
import Field from "../models/Field.js";
import { createNotification } from "../utils/notificationHelper.js";

// 📌 Create booking (user must be logged in)
export const createBooking = async (req, res) => {
  try {
    let {
      fieldName,
      field,
      date,
      startHour,
      endHour,
      totalPrice,
      services, // 🔥 nhận services từ frontend
    } = req.body;

    const start = Number(startHour);
    const end = Number(endHour);

    if (end <= start) {
      return res.status(400).json({ message: "Giờ không hợp lệ" });
    }

    // Check if time slot already booked
    const conflict = await Booking.findOne({
      field: field,
      date,
      startHour: { $lt: end },
      endHour: { $gt: start },
      status: { $ne: "cancelled" },
    });

    if (conflict) {
      return res.status(400).json({
        message: "Khung giờ này đã được đặt",
      });
    }

    // 🔥 tạo mã đơn thanh toán
    const orderCode = "BOOKING" + Date.now();

    const booking = new Booking({
      user: req.user._id,
      fieldName: fieldName.trim(),
      field,
      date,
      startHour: start,
      endHour: end,
      totalPrice: Number(totalPrice),
      services: services || [], // 🔥 lưu services
      orderCode,
      status: "pending",
    });

    const saved = await booking.save();

    // Thông báo cho chủ sân
    try {
      const fieldDoc = await Field.findById(field);
      if (fieldDoc?.owner) {
        await createNotification(
          fieldDoc.owner,
          "Đơn đặt sân mới",
          `${req.user.name} vừa đặt sân ${fieldDoc.name} ngày ${date} (${start}:00 - ${end}:00)`,
          "booking",
          saved._id
        );
      }
    } catch (_) {}

    // Thông báo xác nhận cho user
    await createNotification(
      req.user._id,
      "Đặt sân thành công",
      `Đơn ${orderCode} đang chờ xác nhận. Vui lòng thanh toán để hoàn tất.`,
      "booking",
      saved._id
    );

    res.status(201).json({
      booking: saved.toObject(),
      orderCode: orderCode,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

// 📌 Get user's bookings
export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user._id,
    }).populate("field", "name location type pricePerHour");

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Get all bookings (admin only)
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate("field", "name location type pricePerHour");

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Get bookings by date and field
export const getBookingsByDate = async (req, res) => {
  try {
    const { date, field } = req.query;

    const bookings = await Booking.find({
      date,
      ...(field && { field }),
      status: { $ne: "cancelled" },
    });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Get single booking by ID
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    // Chỉ cho phép owner hoặc admin
    if (
      booking.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Cancel booking
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user owns this booking hoặc là admin
    if (
      booking.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    booking.status = "cancelled";
    await booking.save();

    // Thông báo cho user (nếu admin/field-owner hủy)
    if (req.user._id.toString() !== booking.user.toString()) {
      await createNotification(
        booking.user,
        "Booking bị hủy",
        `Đơn ${booking.orderCode} đã bị hủy bởi quản trị viên.`,
        "booking",
        booking._id
      );
    }

    res.json({
      message: "✅ Booking cancelled",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Update booking status (admin only)
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Delete booking (admin/fieldOwner xóa hẳn booking)
export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Confirm payment
export const confirmPayment = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({ message: "Booking already processed" });
    }

    booking.status = "confirmed";
    booking.paymentStatus = "paid";
    booking.paidAt = new Date();

    await booking.save();

    // Thông báo thanh toán thành công
    await createNotification(
      booking.user,
      "Thanh toán thành công ✅",
      `Đơn ${booking.orderCode} đã được xác nhận. Chúc bạn thi đấu vui vẻ!`,
      "payment",
      booking._id
    );

    res.json({
      message: "✅ Payment confirmed",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Get bookings for field owner's fields
export const getFieldOwnerBookings = async (req, res) => {
  try {
    const ownerFields = await Field.find({ owner: req.user._id }).select("_id");
    const fieldIds = ownerFields.map((f) => f._id);

    const bookings = await Booking.find({ field: { $in: fieldIds } })
      .populate("user", "name email")
      .populate("field", "name location type pricePerHour")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Approve booking (field owner confirms the slot)
export const approveBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("field");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Kiểm tra field owner có quyền không
    if (
      booking.field?.owner?.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    booking.status = "confirmed";
    await booking.save();

    await createNotification(
      booking.user,
      "Booking đã được xác nhận ✅",
      `Đơn ${booking.orderCode} đã được chủ sân xác nhận. Nhớ đến đúng giờ nhé!`,
      "booking",
      booking._id
    );

    res.json({ message: "Booking approved", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Reject booking (field owner rejects)
export const rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("field");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (
      booking.field?.owner?.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    booking.status = "cancelled";
    await booking.save();

    await createNotification(
      booking.user,
      "Booking bị từ chối ❌",
      `Đơn ${booking.orderCode} đã bị chủ sân từ chối. Vui lòng chọn khung giờ khác.`,
      "booking",
      booking._id
    );

    res.json({ message: "Booking rejected", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};