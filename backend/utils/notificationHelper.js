import Notification from "../models/Notification.js";

/**
 * Author: Dương Trọng Lực - mssv: HE187000
 * Param: userId, title, message, type, bookingId
 * Description: Helper tạo notification trong DB — gọi từ các controller khác
 */
export const createNotification = async (userId, title, message, type = "system", bookingId = null) => {
  try {
    await Notification.create({ user: userId, title, message, type, bookingId });
  } catch (err) {
    console.error("Create notification error:", err.message);
  }
};
