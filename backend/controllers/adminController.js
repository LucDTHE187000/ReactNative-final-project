import Booking from "../models/Booking.js";
import Field from "../models/Field.js";
import User from "../models/User.js";
import Review from "../models/Review.js";

/**
 * Author: Dương Trọng Lực - mssv: HE187000
 * Param: none
 * Description: Trả về tổng quan thống kê hệ thống cho admin: doanh thu, booking, sân, user
 */
export const getOverviewStats = async (req, res) => {
  try {
    const [totalBookings, totalFields, totalUsers, totalReviews] = await Promise.all([
      Booking.countDocuments(),
      Field.countDocuments(),
      User.countDocuments({ role: "user" }),
      Review.countDocuments(),
    ]);

    const revenueAgg = await Booking.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    const pendingBookings = await Booking.countDocuments({ status: "pending" });
    const confirmedBookings = await Booking.countDocuments({ status: "confirmed" });
    const cancelledBookings = await Booking.countDocuments({ status: "cancelled" });

    res.json({
      totalRevenue,
      totalBookings,
      totalFields,
      totalUsers,
      totalReviews,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Author: Dương Trọng Lực - mssv: HE187000
 * Param: query.days - số ngày nhìn lại (mặc định 30)
 * Description: Thống kê doanh thu và số booking theo từng ngày trong N ngày gần nhất
 */
export const getRevenueByDay = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const result = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().substring(0, 10); // "YYYY-MM-DD"

      const [revenueAgg, count] = await Promise.all([
        Booking.aggregate([
          { $match: { date: dateStr, paymentStatus: "paid" } },
          { $group: { _id: null, total: { $sum: "$totalPrice" } } },
        ]),
        Booking.countDocuments({ date: dateStr }),
      ]);

      result.push({
        date: dateStr,
        revenue: revenueAgg[0]?.total || 0,
        bookings: count,
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Author: Dương Trọng Lực - mssv: HE187000
 * Param: query.limit - số sân top (mặc định 5)
 * Description: Thống kê top sân được đặt nhiều nhất và doanh thu cao nhất
 */
export const getTopFields = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const topByBookings = await Booking.aggregate([
      { $group: { _id: "$field", bookingCount: { $sum: 1 }, revenue: { $sum: "$totalPrice" } } },
      { $sort: { bookingCount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "fields",
          localField: "_id",
          foreignField: "_id",
          as: "fieldInfo",
        },
      },
      {
        $project: {
          bookingCount: 1,
          revenue: 1,
          name: { $arrayElemAt: ["$fieldInfo.name", 0] },
          location: { $arrayElemAt: ["$fieldInfo.location", 0] },
          type: { $arrayElemAt: ["$fieldInfo.type", 0] },
        },
      },
    ]);

    res.json(topByBookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Author: Dương Trọng Lực - mssv: HE187000
 * Param: none
 * Description: Thống kê doanh thu theo từng tháng trong năm hiện tại
 */
export const getRevenueByMonth = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const result = [];

    for (let month = 1; month <= 12; month++) {
      const m = month.toString().padStart(2, "0");
      const prefix = `${year}-${m}`;

      const [revenueAgg, count] = await Promise.all([
        Booking.aggregate([
          { $match: { date: { $regex: `^${prefix}` }, paymentStatus: "paid" } },
          { $group: { _id: null, total: { $sum: "$totalPrice" } } },
        ]),
        Booking.countDocuments({ date: { $regex: `^${prefix}` } }),
      ]);

      result.push({
        month: `T${month}`,
        revenue: revenueAgg[0]?.total || 0,
        bookings: count,
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Author: Dương Trọng Lực - mssv: HE187000
 * Param: none
 * Description: Trả về danh sách tất cả người dùng (không bao gồm password) cho admin
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Author: Dương Trọng Lực - mssv: HE187000
 * Param: req.params.id - ID người dùng cần xóa
 * Description: Xóa người dùng khỏi hệ thống, không cho phép xóa admin
 */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role === "admin") {
      return res.status(403).json({ message: "Cannot delete admin account" });
    }
    await user.deleteOne();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Author: Dương Trọng Lực - mssv: HE187000
 * Param: req.params.id - bookingId; req.body.status - trạng thái mới
 * Description: Admin cập nhật trạng thái booking (confirmed/cancelled/pending)
 */
export const adminUpdateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    booking.status = status;
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Author: Dương Trọng Lực - mssv: HE187000
 * Param: none
 * Description: Admin lấy tất cả bookings với thông tin user và field đầy đủ, sắp xếp mới nhất trước
 */
export const getAllBookingsAdmin = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email role")
      .populate("field", "name location type pricePerHour")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
