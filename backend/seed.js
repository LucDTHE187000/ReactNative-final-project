import mongoose from "mongoose";
import dotenv from "dotenv";
import Field from "./models/Field.js";
import User from "./models/User.js";
import bcrypt from "bcryptjs";

dotenv.config();

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
    // Lưu relative path thay vì full URL để frontend tự build dynamic URL
    const serverUrl = "";
    
    // 📊 Hàm helper tạo priceSchedule
    const createPriceSchedule = (morningPrice, peakPrice, vipPrice) => [
      {
        name: "Sáng",
        startHour: 6,
        endHour: 14,
        price: morningPrice,
      },
      {
        name: "Cao điểm",
        startHour: 14,
        endHour: 18,
        price: peakPrice,
      },
      {
        name: "VIP",
        startHour: 18,
        endHour: 23,
        price: vipPrice,
      },
    ];

    const fields = [
      {
        name: "Sân Bao Cấp",
        location: "Quận 1, TP.HCM",
        description: "Sân bóng 7 người, tường cao, sân cỏ tươi",
        type: "Sân 7",
        pricePerHour: 450000,
        priceSchedule: createPriceSchedule(400000, 500000, 600000),
        capacity: 14,
        image: `${serverUrl}/images/field1.jpg`,
        owner: adminUser._id,
        isActive: true,
      },
      {
        name: "Sân 5 Cửa Ô",
        location: "Quận 3, TP.HCM",
        description: "Sân bóng 5 người, điều hòa, sân sạch",
        type: "Sân 5",
        pricePerHour: 420000,
        priceSchedule: createPriceSchedule(380000, 450000, 520000),
        capacity: 10,
        image: `${serverUrl}/images/field2.jpg`,
        owner: adminUser._id,
        isActive: true,
      },
      {
        name: "Sân Thống Nhất",
        location: "Quận 10, TP.HCM",
        description: "Sân bóng 11 người chuẩn, ánh sáng tốt",
        type: "Sân 11",
        pricePerHour: 700000,
        priceSchedule: createPriceSchedule(600000, 800000, 950000),
        capacity: 22,
        image: `${serverUrl}/images/field3.jpg`,
        owner: adminUser._id,
        isActive: true,
      },
      {
        name: "Sân Quận 1",
        location: "Quận 1, TP.HCM",
        description: "Sân bóng 7 người, vị trí trung tâm",
        type: "Sân 7",
        pricePerHour: 400000,
        priceSchedule: createPriceSchedule(350000, 450000, 550000),
        capacity: 14,
        image: `${serverUrl}/images/field4.jpg`,
        owner: adminUser._id,
        isActive: true,
      },
      {
        name: "Sân Phú Nhuận",
        location: "Quận Phú Nhuận, TP.HCM",
        description: "Sân bóng 5 người, giá rẻ",
        type: "Sân 5",
        pricePerHour: 350000,
        priceSchedule: createPriceSchedule(300000, 380000, 450000),
        capacity: 10,
        image: `${serverUrl}/images/field5.jpg`,
        owner: adminUser._id,
        isActive: true,
      },
      {
        name: "Sân Gò Vấp",
        location: "Quận Gò Vấp, TP.HCM",
        description: "Sân bóng 7 người, mặt sân tốt",
        type: "Sân 7",
        pricePerHour: 380000,
        priceSchedule: createPriceSchedule(330000, 420000, 500000),
        capacity: 14,
        image: `${serverUrl}/images/field6.jpg`,
        owner: adminUser._id,
        isActive: true,
      },
      {
        name: "Sân Tân Bình",
        location: "Quận Tân Bình, TP.HCM",
        description: "Sân bóng 5 người, tiện lợi",
        type: "Sân 5",
        pricePerHour: 380000,
        priceSchedule: createPriceSchedule(330000, 420000, 480000),
        capacity: 10,
        image: `${serverUrl}/images/field7.jpg`,
        owner: adminUser._id,
        isActive: true,
      },
      {
        name: "Sân Bình Thạnh",
        location: "Quận Bình Thạnh, TP.HCM",
        description: "Sân bóng 7 người, sân mới",
        type: "Sân 7",
        pricePerHour: 360000,
        priceSchedule: createPriceSchedule(310000, 400000, 480000),
        capacity: 14,
        image: `${serverUrl}/images/field8.jpg`,
        owner: adminUser._id,
        isActive: true,
      },
      {
        name: "Sân Quận 3",
        location: "Quận 3, TP.HCM",
        description: "Sân bóng 11 người, ánh sáng chuyên nghiệp",
        type: "Sân 11",
        pricePerHour: 650000,
        priceSchedule: createPriceSchedule(550000, 750000, 900000),
        capacity: 22,
        image: `${serverUrl}/images/field9.jpg`,
        owner: adminUser._id,
        isActive: true,
      },
      {
        name: "Sân Quận 10",
        location: "Quận 10, TP.HCM",
        description: "Sân bóng 5 người, sân thoáng mái",
        type: "Sân 5",
        pricePerHour: 390000,
        priceSchedule: createPriceSchedule(340000, 430000, 490000),
        capacity: 10,
        image: `${serverUrl}/images/field10.jpg`,
        owner: adminUser._id,
        isActive: true,
      },
      {
        name: "Sân Hưng Phương",
        location: "Yên Mô, Ninh Bình",
        description: "Sân bóng 7 người, tích hợp quán cafe",
        type: "Sân 7",
        pricePerHour: 200000,
        priceSchedule: createPriceSchedule(150000, 200000, 250000),
        capacity: 14,
        image: `${serverUrl}/images/field11.jpg`,
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
