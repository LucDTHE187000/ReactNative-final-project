import Notification from "../models/Notification.js";

/**
 * Author: Dương Trọng Lực - mssv: HE187000
 * Param: none (dùng req.user)
 * Description: Lấy 50 notification mới nhất của user hiện tại
 */
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Author: Dương Trọng Lực - mssv: HE187000
 * Param: none
 * Description: Đếm số notification chưa đọc của user — dùng để hiện badge
 */
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user._id, isRead: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Author: Dương Trọng Lực - mssv: HE187000
 * Param: none
 * Description: Đánh dấu tất cả notification của user là đã đọc
 */
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: "Đã đọc tất cả" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Author: Dương Trọng Lực - mssv: HE187000
 * Param: req.params.id - notification ID
 * Description: Đánh dấu một notification đơn lẻ là đã đọc
 */
export const markRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: "OK" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
