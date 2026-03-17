import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Message from "../models/Message.js";

/**
 * Author: Dương Trọng Lực - mssv: HE187000
 * Param: io - Socket.IO server instance
 * Description: Khởi tạo chat realtime, xác thực JWT qua handshake, lưu/phát tin nhắn theo room
 */
export function initSocket(io) {
  // Middleware xác thực JWT khi kết nối
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("name role");
      if (!user) return next(new Error("User not found"));

      socket.user = { id: user._id.toString(), name: user.name, role: user.role };
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const { id, name, role } = socket.user;

    // Tham gia phòng (mặc định "general")
    socket.on("join_room", async (room = "general") => {
      socket.join(room);

      // Gửi 50 tin nhắn gần nhất
      try {
        const history = await Message.find({ room })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
        socket.emit("message_history", history.reverse());
      } catch (_) {}

      // Thông báo user vào phòng
      socket.to(room).emit("system_message", {
        text: `${name} đã tham gia phòng chat`,
        timestamp: new Date().toISOString(),
      });
    });

    // Nhận và phát tin nhắn
    socket.on("send_message", async ({ text, room = "general" }) => {
      if (!text || typeof text !== "string") return;
      const safeText = text.trim().substring(0, 1000);
      if (!safeText) return;

      const msg = await Message.create({
        sender: id,
        senderName: name,
        senderRole: role,
        text: safeText,
        room,
      });

      const payload = {
        _id: msg._id.toString(),
        sender: id,
        senderName: name,
        senderRole: role,
        text: safeText,
        room,
        createdAt: msg.createdAt.toISOString(),
      };

      io.to(room).emit("new_message", payload);
    });

    socket.on("disconnect", () => {
      // có thể log nếu cần
    });
  });
}
