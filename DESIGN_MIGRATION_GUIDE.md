# Hướng Dẫn Chuyển Đổi Giao Diện Backend → Mobile (100% Design Match)

## ✅ Hoàn Thành
- ✅ `theme.ts` - Color constants, fonts, spacing, shadows
- ✅ `login.tsx` - đã chuyển đổi (dark theme)
- ✅ `register.tsx` - đã chuyển đổi (dark theme)

## 📋 Danh Sách Công Việc Còn Lại

### 1. **Cập nhật Root Layout** (_layout.tsx)
File này cần update để sử dụng dark theme thay vì light theme.

**Thay đổi:**
```tsx
// OLD
<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F6F8' }}>
  <ActivityIndicator size="large" color="#1976D2" />
</View>

// NEW
<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.darkBg }}>
  <ActivityIndicator size="large" color={colors.primary} />
</View>
```

Thêm import:
```tsx
import { colors } from '@/constants/theme';
```

---

### 2. **HomeScreen / Index Page** (app/(tabs)/index.tsx)
Tạo hero section, stats cards, features grid giống `index.html` backend.

**Thành phần cần có:**
- Hero Banner với gradient background
- Stats cards (10+ sân, 10K+ khách, 5K+ đánh giá)
- Features grid (Đặt nhanh, Nhiều địa điểm, Thanh toán online)
- CTA section
- Fields by type section

**Design Details:**
- Background: darkBg with gradient
- Cards: cardBg with border
- Text: textPrimary/textSecondary
- Buttons: primary/secondary gradient

---

### 3. **FieldsScreen** (app/search.tsx hoặc new screen)
Chuyển từ `fields.html`.

**Thành phần:**
- Search input + type filter dropdown
- Field cards grid:
  - Image (blue gradient placeholder)
  - Field type badge (cyan)
  - Field name
  - Location (with pin emoji)
  - Rating & stars
  - Price
  - "Đặt Sân" button

**CSS → React Native:**
```css
.field-card {
  background: var(--card-bg);        → colors.cardBg
  border: 1px solid var(--border);   → borderColor: colors.border
  border-radius: 12px;               → borderRadius: radius.lg
  box-shadow: 0 15px 40px ...        → shadows.lg
  transform: translateY(-8px);       → transform on press
}
```

---

### 4. **BookingScreen** (app/booking/[id].tsx)
Chuyển từ `booking.html`.

**Thành phần:**
- Header: Tên sân, back button
- Price schedule (giờ cao điểm vs thường)
- Calendar selector (date picker)
- Time slots grid (1 giờ)
- Services add-ons (nước, trọng tài, khăn lạnh, bóng)
- Summary sidebar (fixed bottom on mobile):
  - Sân, Ngày, Giờ, Thời lượng
  - Giá sân
  - Services price
  - Tổng tiền
  - "Đặt sân & thanh toán" button

**Mobile Layout:**
- Danh sách chính: ScrollView
- Summary: sticky bottom hoặc modal

---

### 5. **PaymentScreen** (app/payment.tsx)
Chuyển từ `payment.html`.

**Nếu dùng WebView cho VNPAY:**
```tsx
import { WebView } from 'react-native-webview';
<WebView source={{ uri: paymentUrl }} />
```

**Hoặc Mobile Payment:**
- Hiển thị tóm tắt booking
- Lựa chọn phương thức thanh toán
- Button "Tiếp tục thanh toán"

---

### 6. **Cập nhật Tabs Navigation** (app/(tabs)/_layout.tsx)
Update để match dark theme.

---

## 🎨 CSS → React Native Mapping

### Colors
```
--primary-color: #00BCD4        → colors.primary
--secondary-color: #1E88E5      → colors.secondary
--dark-bg: #0F1419              → colors.darkBg
--card-bg: #1A1F2E              → colors.cardBg
--text-primary: #FFFFFF         → colors.textPrimary
--text-secondary: #B0BEC5       → colors.textSecondary
--border-color: #2C3E50         → colors.border
```

### Fonts
```
font-size: 56px                 → fonts.sizes['8xl'] (56)
font-weight: 800                → fonts.weights.extrabold ('800')
font-weight: 700                → fonts.weights.bold ('700')
font-weight: 600                → fonts.weights.semibold ('600')
font-size: 14px                 → fonts.sizes.sm (14)
```

### Spacing
```
padding: 80px 20px              → paddingVertical: spacing['5xl'], paddingHorizontal: spacing.lg
margin-bottom: 40px             → marginBottom: spacing['4xl']
gap: 20px                        → gap: spacing.xl
```

### Border Radius
```
border-radius: 16px             → borderRadius: radius.lg (16)
border-radius: 12px             → borderRadius: radius.lg (12)
border-radius: 8px              → borderRadius: radius.md (8)
border-radius: 6px              → borderRadius: radius.sm (6)
```

### Shadows
```
box-shadow: 0 20px 60px rgba(0,0,0,0.3)  → ...shadows.lg
box-shadow: 0 8px 20px                   → ...shadows.md
```

---

## 📱 Mobile-Specific Adjustments

### Responsive Layout
- Trên web: grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))
- Trên mobile: FlatList với numColumns: 2 hoặc 1

### Fixed Bottom Summary
```tsx
// Booking page summary
<View style={styles.floatingBottom}>
  <View style={styles.summary}>
    {/* Summary items */}
  </View>
  <TouchableOpacity style={styles.checkoutBtn}>
    <Text>Đặt sân & thanh toán</Text>
  </TouchableOpacity>
</View>
```

### Keyboard Handling
```tsx
import { KeyboardAvoidingView, Platform } from 'react-native';

<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
>
  {/* Content */}
</KeyboardAvoidingView>
```

---

## 🔄 Chuyển Logic JS → TypeScript

### auth.js → contexts/AuthContext.ts (already exists)
- handleLogin ✅
- handleRegister ✅

### fields.js → hooks/useFields.ts (create)
```tsx
export function useFields() {
  const [fields, setFields] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const fetchFields = async () => {
    // Call API
  };

  const filterFields = (search, type) => {
    // Filter logic
  };

  return { fields, filtered, fetchFields, filterFields };
}
```

### booking.js → hooks/useBooking.ts (create)
```tsx
export function useBooking(fieldId) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [services, setServices] = useState([]);
  const [total, setTotal] = useState(0);

  const calculateTotal = () => {
    // Total calculation
  };

  return { selectedDate, selectedTime, services, total, calculateTotal };
}
```

### payment.js → services/payment.ts (update)
```tsx
export async function initPayment(bookingData) {
  // Call backend payment API
}
```

---

## 🚀 Step-by-Step Implementation Guide

### Phase 1: Foundation (Complete ✅)
- [x] Update theme.ts
- [x] Update login.tsx
- [x] Update register.tsx

### Phase 2: Home & Listings
- [ ] Update _layout.tsx (dark theme)
- [ ] Create/Update HomeScreen (hero, stats, features)
- [ ] Create/Update FieldsScreen (cards, filter, search)

### Phase 3: Booking & Payment
- [ ] Update BookingScreen (calendar, time, services, summary)
- [ ] Update PaymentScreen (payment methods)

### Phase 4: Finalization
- [ ] Create useFields hook
- [ ] Create useBooking hook
- [ ] Update Tabs navigation styling
- [ ] Test all screens
- [ ] Remove old styling code

---

## 📝 Template Component Structure

### Screen Template
```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, fonts, spacing, radius, shadows } from '@/constants/theme';

export default function MyScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Content */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBg,
  },
  section: {
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    padding: spacing['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.lg,
  },
});
```

---

## ❓ Notes

1. **Animations**: CSS keyframes (slideUp, fadeIn) có thể dùng `react-native-reanimated`
2. **SVG Gradients**: Dùng `expo-linear-gradient` nếu cần gradient complex
3. **Images**: Placeholder là gradient (blue), thực tế sẽ fetch từ API
4. **TypeScript**: Định nghĩa types cho Field, Booking, Payment data

---

## 📞 Support

Nếu cần chi tiết hơn về component cụ thể, hãy yêu cầu!
