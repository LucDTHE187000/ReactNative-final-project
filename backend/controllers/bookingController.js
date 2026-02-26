const Booking = require("../models/Booking");

// 📌 Create booking (user must be logged in)
exports.createBooking = async (req, res) => {
  try {
    let { fieldName, field, date, startHour, endHour, totalPrice } = req.body;

    const start = Number(startHour);
    const end = Number(endHour);

    if (end <= start) {
      return res.status(400).json({ message: "Giờ không hợp lệ" });
    }

    // Check if time slot already booked
    const conflict = await Booking.findOne({
      fieldName: fieldName.trim(),
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

    const booking = new Booking({
      user: req.user._id,
      fieldName: fieldName.trim(),
      field,
      date,
      startHour: start,
      endHour: end,
      totalPrice: Number(totalPrice),
      status: "confirmed",
    });

    const saved = await booking.save();
    res.status(201).json(saved);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

// 📌 Get user's bookings
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).populate(
      "field",
      "name location type pricePerHour"
    );

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Get all bookings (admin only)
exports.getAllBookings = async (req, res) => {
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
exports.getBookingsByDate = async (req, res) => {
  try {
    const { date, fieldName } = req.query;

    const bookings = await Booking.find({
      date,
      fieldName,
      status: { $ne: "cancelled" },
    });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({ message: "Booking cancelled", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Update booking status (admin only)
exports.updateBookingStatus = async (req, res) => {
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
