const mongoose = require("mongoose");
require("dotenv").config();

const Field = require("./models/Field");
const User = require("./models/User");
const bcrypt = require("bcryptjs");

const seedData = async () => {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected for seeding");

    // ✅ Xóa dữ liệu cũ
    await Field.deleteMany({});
    await User.deleteMany({});
    console.log("🗑️ Dữ liệu cũ đã xóa");

    // ✅ Tạo admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    const adminUser = new User({
      name: "Admin",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
    });
    await adminUser.save();
    console.log("✅ Admin user created");

    // ✅ Tạo các sân bóng
    const fields = [
      {
        name: "Sân Bao Cấp",
        location: "Quận 1, TP.HCM",
        description: "Sân bóng 7 người, tường cao, sân cỏ tươi",
        type: "Sân 7",
        pricePerHour: 450000,
        capacity: 14,
        owner: adminUser._id,
        isActive: true,
      },
      {
        name: "Sân 5 Cửa Ô",
        location: "Quận 3, TP.HCM",
        description: "Sân bóng 5 người, điều hòa, sân sạch",
        type: "Sân 5",
        pricePerHour: 420000,
        capacity: 10,
        owner: adminUser._id,
        isActive: true,
      },
      {
        name: "Sân Thống Nhất",
        location: "Quận 10, TP.HCM",
        description: "Sân bóng 11 người chuẩn, ánh sáng tốt",
        type: "Sân 11",
        pricePerHour: 700000,
        capacity: 22,
        owner: adminUser._id,
        isActive: true,
      },
      {
        name: "Sân Quận 1",
        location: "Quận 1, TP.HCM",
        description: "Sân bóng 7 người, vị trí trung tâm",
        type: "Sân 7",
        pricePerHour: 400000,
        capacity: 14,
        owner: adminUser._id,
        isActive: true,
      },
      {
        name: "Sân Phú Nhuận",
        location: "Quận Phú Nhuận, TP.HCM",
        description: "Sân bóng 5 người, giá rẻ",
        type: "Sân 5",
        pricePerHour: 350000,
        capacity: 10,
        owner: adminUser._id,
        isActive: true,
      },
      {
        name: "Sân Gò Vấp",
        location: "Quận Gò Vấp, TP.HCM",
        description: "Sân bóng 7 người, mặt sân tốt",
        type: "Sân 7",
        pricePerHour: 380000,
        capacity: 14,
        owner: adminUser._id,
        isActive: true,
      },
      {
        name: "Sân Tân Bình",
        location: "Quận Tân Bình, TP.HCM",
        description: "Sân bóng 5 người, tiện lợi",
        type: "Sân 5",
        pricePerHour: 380000,
        capacity: 10,
        owner: adminUser._id,
        isActive: true,
      },
      {
        name: "Sân Bình Thạnh",
        location: "Quận Bình Thạnh, TP.HCM",
        description: "Sân bóng 7 người, sân mới",
        type: "Sân 7",
        pricePerHour: 360000,
        capacity: 14,
        owner: adminUser._id,
        isActive: true,
      },
      {
        name: "Sân Quận 3",
        location: "Quận 3, TP.HCM",
        description: "Sân bóng 11 người, ánh sáng chuyên nghiệp",
        type: "Sân 11",
        pricePerHour: 650000,
        capacity: 22,
        owner: adminUser._id,
        isActive: true,
      },
      {
        name: "Sân Quận 10",
        location: "Quận 10, TP.HCM",
        description: "Sân bóng 5 người, sân thoáng mái",
        type: "Sân 5",
        pricePerHour: 390000,
        capacity: 10,
        owner: adminUser._id,
        isActive: true,
      },
    ];

    const savedFields = await Field.insertMany(fields);
    console.log(`✅ ${savedFields.length} sân bóng đã được tạo`);

    console.log("\n=========================");
    console.log("📊 SEED DATA THÀNH CÔNG");
    console.log("=========================");
    console.log(`✅ ${savedFields.length} fields`);
    console.log("✅ 1 admin user");
    console.log("\n🔑 Tài khoản Admin test:");
    console.log("📧 Email: admin@example.com");
    console.log("🔒 Password: admin123");
    console.log("=========================\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi seed data:", error);
    process.exit(1);
  }
};

seedData();
