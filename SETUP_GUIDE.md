# 🚀 Hướng Dẫn Chạy Ứng Dụng

## 📋 Yêu Cầu

- Node.js v18+ (https://nodejs.org)
- MongoDB đang chạy (cục bộ hoặc cloud)
- Expo CLI (sẽ cài qua npm install)

---

## 🔧 Bước 1: Chuẩn Bị Backend

### 1.1 Cài đặt dependencies
```bash
cd backend
npm install
```

### 1.2 Tạo file `.env`
File `.env` đã có sẵn, kiểm tra:
```env
MONGO_URI=mongodb://127.0.0.1:27017/football-booking
JWT_SECRET=football_secret_key_2026
```

**Nếu dùng MongoDB Atlas (cloud):**
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/football-booking
JWT_SECRET=football_secret_key_2026
```

### 1.3 Tạo dữ liệu test (Seed Data)
```bash
npm run seed
```

**Kết quả sẽ hiển thị:**
```
✅ 10 fields
✅ 1 admin user
🔑 Tài khoản Admin test:
📧 Email: admin@example.com
🔒 Password: admin123
```

### 1.4 Khởi động Backend
```bash
npm run dev
```

**Nếu thành công, bạn sẽ thấy:**
```
✅ MongoDB Connected
🚀 Server running on port 5000
```

---

## 📱 Bước 2: Chuẩn Bị Frontend

### 2.1 Cài đặt dependencies
```bash
cd mobile/football-booking-app
npm install
```

### 2.2 Khởi động Expo
```bash
npm start
```

**Sau đó:**
- Nhấn `i` để chạy iOS simulator
- Nhấn `a` để chạy Android emulator  
- Nhấn `w` để chạy trên web
- Scan QR code bằng Expo Go app

---

## 🧪 Bước 3: Test Ứng Dụng

### Test 1: Đăng ký tài khoản mới
1. Mở app
2. Chọn "Đăng Ký"
3. Nhập: 
   - Tên: `John Doe`
   - Email: `john@example.com`
   - Password: `123456`
4. Nhấn "Đăng Ký"

### Test 2: Đăng nhập
1. Nhấn "Đăng Nhập"
2. Nhập email và password vừa tạo
3. Xem danh sách 10 sân bóng

### Test 3: Đặt sân
1. Chọn một sân
2. Chọn ngày trong tương lai
3. Chọn giờ (ví dụ: 9:00 - 11:00)
4. Nhấn "Xác Nhận Đặt Sân"

### Test 4: Xem lịch sử đặt sân
1. Chuyển sang tab "Lịch Sử"
2. Xem danh sách bookings
3. Nhấn "Hủy đặt sân" để hủy

### Test 5: Admin Panel
1. Đăng nhập bằng tài khoản Admin:
   - Email: `admin@example.com`
   - Password: `admin123`
2. Nhấn button "⚙️ Admin"
3. Quản lý sân (thêm, sửa, xóa)

---

## 🔌 API Endpoints

### Auth
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập

### Fields (Sân)
- `GET /api/fields` - Danh sách sân
- `GET /api/fields/:id` - Chi tiết sân
- `POST /api/fields` - Tạo sân (admin)
- `PUT /api/fields/:id` - Cập nhật sân (admin)
- `DELETE /api/fields/:id` - Xóa sân (admin)

### Bookings (Đặt sân)
- `POST /api/bookings` - Tạo booking
- `GET /api/bookings/my-bookings` - Lịch sử user
- `GET /api/bookings/by-date?date=2026-02-28&fieldName=Sân%205` - Bookings theo ngày
- `PUT /api/bookings/:id/cancel` - Hủy booking
- `GET /api/bookings` - Tất cả bookings (admin)
- `PUT /api/bookings/:id/status` - Cập nhật status (admin)

---

## 🐛 Troubleshooting

### Backend: "Cannot connect to MongoDB"
- Kiểm tra MongoDB có chạy: `mongosh`
- Hoặc kiểm tra MONGO_URI trong `.env`

### Frontend: "Cannot reach http://localhost:5000"
- Kiểm tra backend đã start
- Trong Android: Có thể phải dùng IP thực của máy thay vì `localhost`

### Frontend: "No fields showing"
- Kiểm tra backend đã chạy `seed` chưa
- Refresh app (pull down to refresh)

---

## 📁 Project Structure

```
ReactNative-final-project/
├── backend/
│   ├── controllers/
│   │   ├── bookingController.js
│   │   └── fieldController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Field.js
│   │   └── Booking.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── field.js
│   │   └── booking.js
│   ├── seed.js (Tạo dữ liệu test)
│   └── server.js
└── mobile/football-booking-app/
    ├── app/
    │   ├── (tabs)/
    │   │   ├── index.tsx (Home)
    │   │   ├── bookings.tsx (Lịch sử)
    │   │   └── _layout.tsx
    │   ├── booking/[id].tsx (Chi tiết booking)
    │   ├── admin.tsx (Admin panel)
    │   ├── login.tsx
    │   ├── register.tsx
    │   └── _layout.tsx (Root layout)
    ├── contexts/
    │   └── AuthContext.tsx (Auth state)
    └── services/
        └── api.js (API client)
```

---

## ✅ Checklist Hoàn Thành

- [x] Priority 1: Core Features
  - [x] Field Model & Routes
  - [x] Auth Context & AsyncStorage
  - [x] Login/Register Screens
  - [x] Fetch Fields from Backend
  - [x] Booking Functionality
  
- [x] Priority 2: Enhancements
  - [x] Bookings History Screen
  - [x] Cancel Booking Feature
  - [x] Admin Panel (Manage Fields)
  - [x] Seed Data Script

---

## 🎯 Next Steps (Priority 3)

- [ ] User Profile Screen
- [ ] Booking Analytics for Admin
- [ ] Payment Integration
- [ ] Review & Rating System
- [ ] Email Notifications
- [ ] Push Notifications
- [ ] Better Error Handling
- [ ] Input Validation
- [ ] Refactor & Code Cleanup

---

**Happy Coding! 🚀**
