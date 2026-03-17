import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import API from "@/services/api";
import { colors, fonts, spacing, radius, shadows } from "@/constants/theme";

export default function PaymentScreen() {
  const params = useLocalSearchParams();
  const [bookingInfo, setBookingInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const bookingParam = String(params.booking ?? "");

  useEffect(() => {
    if (!bookingParam) return;
    try {
      const decoded = JSON.parse(bookingParam);
      setBookingInfo(decoded);
    } catch (e) {
      console.log("Parse booking params error:", e);
      Alert.alert("Lỗi", "Không thể tải thông tin đặt sân");
      router.back();
    }
  }, [bookingParam]);

  const handlePay = async () => {
    if (!bookingInfo) {
      Alert.alert("Lỗi", "Thông tin booking không đầy đủ");
      return;
    }

    setLoading(true);
    try {
      const fieldName = bookingInfo.fieldName ?? "Đặt sân";
      const description = `${fieldName}`.substring(0, 25);

      const res = await API.post("/payment/create-link", {
        bookingId: bookingInfo._id,
        amount: bookingInfo.totalPrice,
        description,
      });

      const { checkoutUrl } = res.data;
      setLoading(false);

      // Mở in-app browser — promise resolve khi user đóng browser
      await WebBrowser.openBrowserAsync(checkoutUrl);
      setChecking(true);

      // Retry verify tối đa 3 lần (PayOS có thể xử lý chậm vài giây)
      const MAX_RETRY = 3;
      const RETRY_DELAY = 2000;
      let paid = false;

      for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        try {
          const statusRes = await API.get(`/payment/verify/${bookingInfo._id}`);
          const payStatus = statusRes.data?.status;
          if (payStatus === "paid") {
            paid = true;
            break;
          }
          if (payStatus === "cancelled" || payStatus === "expired") break;
          // "pending" hoặc "not_found" → retry
        } catch (_) {
          // lỗi mạng → retry
        }
      }

      if (paid) {
        Alert.alert(
          "✅ Thanh toán thành công",
          "Đơn đặt sân đã được ghi nhận!",
          [{ text: "OK", onPress: () => router.replace("/(tabs)/bookings") }]
        );
      } else {
        Alert.alert(
          "⏳ Đang chờ xác nhận",
          "Nếu bạn đã chuyển tiền, đơn hàng sẽ được cập nhật trong vài phút. Kiểm tra trong Lịch sử.",
          [{ text: "OK", onPress: () => router.replace("/(tabs)/bookings") }]
        );
      }
      setChecking(false);
    } catch (err: any) {
      setLoading(false);
      Alert.alert(
        "Lỗi",
        err.response?.data?.message || "Không thể tạo link thanh toán"
      );
    }
  };

  if (!bookingInfo) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00BCD4" />
      </View>
    );
  }

  if (checking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00BCD4" />
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>
          Đang kiểm tra kết quả thanh toán...
        </Text>
      </View>
    );
  }

  const duration = bookingInfo.endHour - bookingInfo.startHour;
  const startTime = `${String(bookingInfo.startHour).padStart(2, "0")}:00`;
  const endTime = `${String(bookingInfo.endHour).padStart(2, "0")}:00`;

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const parts = dateStr.substring(0, 10).split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };



  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Quay lại</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>💳</Text>
        </View>

        {/* Payment Status */}
        <Text style={styles.paymentStatus}>Thanh Toán</Text>

        {/* Order Code */}
        <View style={styles.orderCode}>
          <Text style={styles.orderCodeLabel}>Mã đơn hàng</Text>
          <Text style={styles.orderCodeValue} selectable>
            {bookingInfo.orderCode || bookingInfo._id}
          </Text>
        </View>

        {/* Booking Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sân bóng</Text>
            <Text style={styles.detailValue}>{bookingInfo.fieldName}</Text>
          </View>

          <View style={[styles.detailRow, { borderBottomColor: "transparent" }]}>
            <Text style={styles.detailLabel}>Ngày</Text>
            <Text style={styles.detailValue}>
              {formatDisplayDate(bookingInfo.date)}
            </Text>
          </View>

          <View style={[styles.detailRow, { borderBottomColor: "transparent" }]}>
            <Text style={styles.detailLabel}>Giờ</Text>
            <Text style={styles.detailValue}>
              {startTime} - {endTime}
            </Text>
          </View>

          <View style={[styles.detailRow, { borderBottomColor: "transparent" }]}>
            <Text style={styles.detailLabel}>Thời lượng</Text>
            <Text style={styles.detailValue}>{duration} giờ</Text>
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Giá sân ({duration} giờ)</Text>
            <Text style={styles.breakdownPrice}>
              {(bookingInfo.fieldPrice ?? bookingInfo.totalPrice ?? 0).toLocaleString("vi-VN")} đ
            </Text>
          </View>

          {/* Services breakdown */}
          {bookingInfo.services && bookingInfo.services.length > 0 && (
            bookingInfo.services.map((s: any) => (
              <View key={s.name} style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>{s.name}</Text>
                <Text style={styles.breakdownPrice}>
                  {Number(s.price).toLocaleString("vi-VN")} đ
                </Text>
              </View>
            ))
          )}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng tiền</Text>
            <Text style={styles.totalAmount}>
              {(bookingInfo.totalPrice ?? 0).toLocaleString("vi-VN")} đ
            </Text>
          </View>
        </View>

        {/* PayOS info card */}
        <View style={styles.payosInfoCard}>
          <Text style={styles.payosInfoTitle}>🔐 Thanh toán qua PayOS</Text>
          <Text style={styles.payosInfoDesc}>
            Hỗ trợ QR Code, thẻ ATM nội địa và Visa/MasterCard. Bạn sẽ được chuyển đến trang thanh toán bảo mật của PayOS.
          </Text>
        </View>

        {/* PayOS Pay Button */}
        <TouchableOpacity
          style={[styles.payButton, loading && styles.buttonDisabled]}
          onPress={handlePay}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.payButtonText}>Thanh toán qua PayOS →</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBg,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.darkBg,
  },
  header: {
    marginBottom: spacing["4xl"],
  },
  backBtn: {
    padding: spacing.md,
  },
  backText: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.bold,
    color: colors.primary,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: spacing["4xl"],
  },
  icon: {
    fontSize: fonts.sizes["8xl"],
  },
  paymentStatus: {
    fontSize: fonts.sizes["5xl"],
    fontWeight: fonts.weights.extrabold,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing["5xl"],
  },
  orderCode: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing["4xl"],
  },
  orderCodeLabel: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  orderCodeValue: {
    fontSize: fonts.sizes.base,
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
  },
  detailsCard: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    fontWeight: fonts.weights.semibold,
  },
  detailValue: {
    fontSize: fonts.sizes.sm,
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold,
  },
  breakdownCard: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  breakdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
  },
  breakdownLabel: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    fontWeight: fonts.weights.semibold,
  },
  breakdownPrice: {
    fontSize: fonts.sizes.sm,
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xl,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
  },
  totalAmount: {
    fontSize: fonts.sizes.xl,
    fontWeight: fonts.weights.bold,
    color: colors.warning,
  },
  payosInfoCard: {
    backgroundColor: `${colors.primary}15`,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing["4xl"],
  },
  payosInfoTitle: {
    fontSize: fonts.sizes.base,
    fontWeight: fonts.weights.bold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  payosInfoDesc: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  payButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xl,
    borderRadius: radius.md,
    alignItems: "center",
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "bold",
  },
});
