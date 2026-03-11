import Booking from "../models/Booking.js";

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

    res.json({
      message: "✅ Payment confirmed",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};