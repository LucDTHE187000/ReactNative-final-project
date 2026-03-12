import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
  Platform,
  TextInput,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import API from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { router, useFocusEffect } from "expo-router";
import { colors, fonts, spacing, radius, shadows } from "@/constants/theme";

interface Booking {
  _id: string;
  fieldName: string;
  orderCode?: string;
  field?: {
    _id: string;
    name: string;
    location: string;
    pricePerHour: number;
  };
  date: string;
  startHour: number;
  endHour: number;
  totalPrice: number;
  services?: { name: string; price: number }[];
  status: "pending" | "confirmed" | "cancelled";
  paymentStatus: "unpaid" | "paid" | "failed";
  createdAt: string;
}

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  // Rating state
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingBookingId, setRatingBookingId] = useState<string | null>(null);
  const [ratingFieldName, setRatingFieldName] = useState("");
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const { token, logout, user } = useAuth();
  const isAdmin = user?.role === "admin";

  const fetchBookings = async () => {
    try {
      const endpoint = isAdmin ? "/bookings" : "/bookings/my-bookings";
      const response = await API.get(endpoint);
      setBookings(response.data);
    } catch (error: any) {
      console.log("Fetch bookings error:", error);
      if (error.response?.status === 401) {
        await logout();
        router.replace("/login");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMyReviews = async () => {
    if (isAdmin) return;
    try {
      const res = await API.get("/reviews/my");
      const ids = new Set<string>(res.data.map((r: any) => r.booking));
      setReviewedBookingIds(ids);
    } catch (_) {}
  };

  useFocusEffect(
    useCallback(() => {
      if (!token) {
        router.replace("/login");
        return;
      }
      fetchBookings();
      fetchMyReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, isAdmin])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  /**
   * Author: Lê Trần Trọng Đạt - mssv: HE194235
   * Param: bookingId - ID booking cần hủy
   * Description: Gọi API hủy booking, đóng modal, cập nhật lại danh sách
   */
  const doCancelBooking = async (bookingId: string) => {
    setCancelling(bookingId);
    try {
      await API.put(`/bookings/${bookingId}/cancel`);
      setSelectedBooking(null);
      Alert.alert("Thành công", "Đặt sân đã được hủy");
      fetchBookings();
    } catch (error: any) {
      console.error("Cancel booking error:", error.response?.data ?? error.message);
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể hủy đặt sân");
    } finally {
      setCancelling(null);
    }
  };

  /**
   * Author: Dương Trọng Lực - mssv: HE187000
   * Param: bookingId - ID booking cần xóa
   * Description: Gọi API DELETE xóa hẳn booking khỏi DB, chỉ admin có quyền
   */
  const doDeleteBooking = async (bookingId: string) => {
    setDeleting(bookingId);
    try {
      await API.delete(`/bookings/${bookingId}`);
      setSelectedBooking(null);
      Alert.alert("Thành công", "Booking đã được xóa");
      fetchBookings();
    } catch (error: any) {
      console.error("Delete booking error:", error.response?.data ?? error.message);
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể xóa booking");
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteBooking = (bookingId: string) => {
    if (Platform.OS === "web") {
      if (window.confirm("Bạn chắc chắn muốn xóa booking này? Thao tác này không thể hoàn tác.")) {
        doDeleteBooking(bookingId);
      }
      return;
    }
    Alert.alert(
      "Xác nhận xóa",
      "Bạn chắc chắn muốn xóa booking này? Thao tác này không thể hoàn tác.",
      [
        { text: "Hủy" },
        { text: "Xóa", style: "destructive", onPress: () => { doDeleteBooking(bookingId); } },
      ]
    );
  };

  const handleCancelBooking = (bookingId: string) => {
    if (Platform.OS === "web") {
      if (window.confirm("Bạn chắc chắn muốn hủy đặt sân này?")) {
        doCancelBooking(bookingId);
      }
      return;
    }
    Alert.alert(
      "Xác nhận hủy",
      "Bạn chắc chắn muốn hủy đặt sân này?",
      [
        { text: "Không" },
        { text: "Có, hủy", onPress: () => { doCancelBooking(bookingId); } },
      ]
    );
  };

  /**
   * Author: Dương Trọng Lực - mssv: HE187000
   * Param: bookingId, fieldName - thông tin booking cần đánh giá
   * Description: Mở modal đánh giá sao cho booking confirmed
   */
  const openRatingModal = (bookingId: string, fieldName: string) => {
    setRatingBookingId(bookingId);
    setRatingFieldName(fieldName);
    setRatingStars(5);
    setRatingComment("");
    setRatingModalVisible(true);
  };

  /**
   * Author: Dương Trọng Lực - mssv: HE187000
   * Param: none (dùng state)
   * Description: Gọi API POST /reviews để gửi đánh giá, cập nhật danh sách booking đã review
   */
  const submitReview = async () => {
    if (!ratingBookingId) return;
    setSubmittingReview(true);
    try {
      await API.post("/reviews", { bookingId: ratingBookingId, rating: ratingStars, comment: ratingComment });
      setReviewedBookingIds((prev) => new Set([...prev, ratingBookingId]));
      setRatingModalVisible(false);
      Alert.alert("Cảm ơn!", "Đánh giá của bạn đã được ghi nhận ⭐");
    } catch (error: any) {
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể gửi đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "#4CAF50";
      case "pending":   return "#FFA726";
      case "cancelled": return "#EF5350";
      default:          return "#999";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed": return "Đã xác nhận";
      case "pending":   return "Chờ xác nhận";
      case "cancelled": return "Đã hủy";
      default:          return status;
    }
  };

  const getPaymentStatusText = (ps: string) => {
    switch (ps) {
      case "paid":   return "✅ Đã thanh toán";
      case "unpaid": return "⏳ Chưa thanh toán";
      case "failed": return "❌ Thất bại";
      default:       return "";
    }
  };

  const getPaymentStatusColor = (ps: string) => {
    switch (ps) {
      case "paid":   return "#4CAF50";
      case "unpaid": return "#FFA726";
      case "failed": return "#EF5350";
      default:       return "#999";
    }
  };

  const isPastDate = (dateStr: string) => {
    const bookingDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate < today;
  };

  const canCancel = (booking: Booking) => {
    if (booking.status === "cancelled") return false;
    return isAdmin ? true : !isPastDate(booking.date);
  };

  /**
   * Author: Lê Trần Trọng Đạt - mssv: HE194235
   * Param: dateStr - chuỗi ngày ISO hoặc YYYY-MM-DD
   * Description: Format ngày sang dd/MM/yyyy tránh lỗi timezone
   */
  const formatDate = (dateStr: string) => {
    const parts = dateStr.substring(0, 10).split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const formatCreatedAt = (iso: string) =>
    new Date(iso).toLocaleString("vi-VN");

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {isAdmin ? "📋 Tất Cả Đặt Sân" : "📅 Lịch Sử Đặt Sân"}
        </Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => { await logout(); router.replace("/login"); }}
        >
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {/* ── Booking list ── */}
      <FlatList
        data={bookings}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Chưa có đặt sân nào</Text>
            {!isAdmin && (
              <TouchableOpacity style={styles.emptyButton} onPress={() => router.push("/(tabs)")}>
                <Text style={styles.emptyButtonText}>Đi đặt sân</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Card header */}
            <View style={styles.cardHeader}>
              <Text style={styles.singleName} numberOfLines={1}>
                {item.field?.name || item.fieldName}
              </Text>
              <View style={styles.badgeRow}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                </View>
                {item.paymentStatus && (
                  <View style={[styles.statusBadge, { backgroundColor: getPaymentStatusColor(item.paymentStatus) }]}>
                    <Text style={styles.statusText}>{getPaymentStatusText(item.paymentStatus)}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Card body */}
            <View style={styles.details}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>📍 Địa điểm:</Text>
                <Text style={styles.detailValue} numberOfLines={1}>{item.field?.location || "N/A"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>📅 Ngày:</Text>
                <Text style={styles.detailValue}>{formatDate(item.date)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>⏰ Giờ:</Text>
                <Text style={styles.detailValue}>{item.startHour}:00 - {item.endHour}:00</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>💰 Giá:</Text>
                <Text style={styles.priceValue}>{item.totalPrice.toLocaleString()}đ</Text>
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.detailButton}
                onPress={() => setSelectedBooking(item)}
              >
                <Text style={styles.detailButtonText}>🔍 Xem chi tiết</Text>
              </TouchableOpacity>

              {!isAdmin && item.paymentStatus === "paid" && !reviewedBookingIds.has(item._id) && (
                <TouchableOpacity
                  style={styles.reviewButton}
                  onPress={() => openRatingModal(item._id, item.field?.name || item.fieldName)}
                >
                  <Text style={styles.reviewButtonText}>⭐ Đánh giá</Text>
                </TouchableOpacity>
              )}
              {!isAdmin && item.paymentStatus === "paid" && reviewedBookingIds.has(item._id) && (
                <View style={styles.reviewedBadge}>
                  <Text style={styles.reviewedText}>✅ Đã đánh giá</Text>
                </View>
              )}
            </View>
          </View>
        )}
      />

      {/* ── Detail Modal ── */}
      <Modal
        visible={selectedBooking !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedBooking(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chi Tiết Đặt Sân</Text>
                <TouchableOpacity onPress={() => setSelectedBooking(null)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              {selectedBooking && (
                <>
                  {/* Field name + badges */}
                  <Text style={styles.modalFieldName}>
                    {selectedBooking.field?.name || selectedBooking.fieldName}
                  </Text>
                  <View style={styles.badgeRow}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedBooking.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(selectedBooking.status)}</Text>
                    </View>
                    {selectedBooking.paymentStatus && (
                      <View style={[styles.statusBadge, { backgroundColor: getPaymentStatusColor(selectedBooking.paymentStatus) }]}>
                        <Text style={styles.statusText}>{getPaymentStatusText(selectedBooking.paymentStatus)}</Text>
                      </View>
                    )}
                  </View>

                  {/* Info rows */}
                  <View style={styles.modalInfoCard}>
                    {[
                      { label: "Mã đơn",    value: selectedBooking.orderCode || selectedBooking._id },
                      { label: "Địa điểm",  value: selectedBooking.field?.location || "N/A" },
                      { label: "Ngày",      value: formatDate(selectedBooking.date) },
                      { label: "Giờ",       value: `${selectedBooking.startHour}:00 - ${selectedBooking.endHour}:00` },
                      { label: "Số giờ",    value: `${selectedBooking.endHour - selectedBooking.startHour} giờ` },
                      { label: "Tổng tiền", value: `${selectedBooking.totalPrice.toLocaleString()}đ`, highlight: true },
                      { label: "Ngày tạo",  value: formatCreatedAt(selectedBooking.createdAt) },
                    ].map((row) => (
                      <View key={row.label} style={styles.modalRow}>
                        <Text style={styles.modalLabel}>{row.label}</Text>
                        <Text style={[styles.modalValue, row.highlight && { color: colors.primary }]}>
                          {row.value}
                        </Text>
                      </View>
                    ))}

                    {/* Services */}
                    {selectedBooking.services && selectedBooking.services.length > 0 && (
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Dịch vụ</Text>
                        <Text style={styles.modalValue}>
                          {selectedBooking.services.map((s) => s.name).join(", ")}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* User actions (non-admin only) */}
                  {!isAdmin && (
                    <View style={styles.modalActions}>
                      {/* QR Ticket khi đã thanh toán */}
                      {selectedBooking.paymentStatus === "paid" && (
                        <View style={styles.qrContainer}>
                          <Text style={styles.qrTitle}>🎟️ Vé Vào Sân</Text>
                          <View style={styles.qrBox}>
                            <QRCode
                              value={JSON.stringify({
                                code: selectedBooking.orderCode || selectedBooking._id,
                                field: selectedBooking.field?.name || selectedBooking.fieldName,
                                date: selectedBooking.date,
                                time: `${selectedBooking.startHour}:00-${selectedBooking.endHour}:00`,
                              })}
                              size={160}
                              backgroundColor="white"
                            />
                          </View>
                          <Text style={styles.qrHint}>Xuất trình mã này khi đến sân</Text>
                        </View>
                      )}

                      {/* Đánh giá sau khi đã thanh toán */}
                      {selectedBooking.paymentStatus === "paid" &&
                        !reviewedBookingIds.has(selectedBooking._id) && (
                          <TouchableOpacity
                            style={styles.reviewButton}
                            onPress={() => {
                              setSelectedBooking(null);
                              openRatingModal(
                                selectedBooking._id,
                                selectedBooking.field?.name || selectedBooking.fieldName
                              );
                            }}
                          >
                            <Text style={styles.reviewButtonText}>⭐ Đánh giá sân</Text>
                          </TouchableOpacity>
                        )}

                      {selectedBooking.paymentStatus === "paid" &&
                        reviewedBookingIds.has(selectedBooking._id) && (
                          <View style={styles.reviewedBadge}>
                            <Text style={styles.reviewedText}>✅ Đã đánh giá</Text>
                          </View>
                        )}

                      {/* Cập nhật */}
                      {selectedBooking.status !== "cancelled" && !isPastDate(selectedBooking.date) && (
                        <TouchableOpacity
                          style={styles.updateButton}
                          onPress={() => {
                            setSelectedBooking(null);
                            router.push({
                              pathname: "/booking/[id]",
                              params: { id: selectedBooking.field?._id || "" },
                            });
                          }}
                        >
                          <Text style={styles.updateButtonText}>✏️ Cập nhật</Text>
                        </TouchableOpacity>
                      )}

                      {/* Xóa đơn */}
                      {canCancel(selectedBooking) && (
                        <TouchableOpacity
                          style={[styles.cancelButton, cancelling === selectedBooking._id && styles.cancelButtonDisabled]}
                          disabled={cancelling === selectedBooking._id}
                          onPress={() => handleCancelBooking(selectedBooking._id)}
                        >
                          {cancelling === selectedBooking._id
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={styles.cancelText}>🗑️ Xóa đơn</Text>
                          }
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Admin actions */}
                  {isAdmin && (
                    <View style={styles.modalActions}>
                      {canCancel(selectedBooking) && (
                        <TouchableOpacity
                          style={[styles.cancelButton, cancelling === selectedBooking._id && styles.cancelButtonDisabled]}
                          disabled={cancelling === selectedBooking._id}
                          onPress={() => handleCancelBooking(selectedBooking._id)}
                        >
                          {cancelling === selectedBooking._id
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={styles.cancelText}>❌ Hủy đơn này</Text>
                          }
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.deleteButton, deleting === selectedBooking._id && styles.cancelButtonDisabled]}
                        disabled={deleting === selectedBooking._id}
                        onPress={() => handleDeleteBooking(selectedBooking._id)}
                      >
                        {deleting === selectedBooking._id
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text style={styles.cancelText}>🗑️ Xóa booking</Text>
                        }
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Rating Modal ── */}
      <Modal
        visible={ratingModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: "80%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⭐ Đánh Giá Sân</Text>
              <TouchableOpacity onPress={() => setRatingModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              contentContainerStyle={{ padding: spacing.lg }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.modalFieldName, { marginBottom: spacing.lg }]}>{ratingFieldName}</Text>

              {/* Star selector */}
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity key={s} onPress={() => setRatingStars(s)}>
                    <Text style={[styles.star, s <= ratingStars && styles.starActive]}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.starLabel}>{ratingStars} / 5 sao</Text>

              <TextInput
                style={styles.commentInput}
                placeholder="Nhận xét của bạn (tuỳ chọn)..."
                placeholderTextColor={colors.textSecondary}
                value={ratingComment}
                onChangeText={setRatingComment}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[styles.submitReviewBtn, submittingReview && styles.cancelButtonDisabled]}
                disabled={submittingReview}
                onPress={submitReview}
              >
                {submittingReview
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.submitReviewText}>Gửi đánh giá</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.darkBg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fonts.sizes["2xl"],
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  logoutButton: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  logoutText: {
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold,
    fontSize: fonts.sizes.xs,
  },
  // ── Card ──
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.lg,
  },
  cardHeader: {
    marginBottom: spacing.lg,
  },
  singleName: {
    fontSize: fonts.sizes.base,
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  statusText: {
    color: colors.textPrimary,
    fontSize: fonts.sizes.xs,
    fontWeight: fonts.weights.bold,
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    fontWeight: fonts.weights.semibold,
    flex: 1,
  },
  detailValue: {
    fontSize: fonts.sizes.xs,
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold,
    flex: 1,
    textAlign: "right",
  },
  priceValue: {
    fontSize: fonts.sizes.sm,
    color: colors.primary,
    fontWeight: fonts.weights.bold,
    flex: 1,
    textAlign: "right",
  },
  detailButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  cardActions: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  detailButtonText: {
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold,
    fontSize: fonts.sizes.xs,
  },
  // ── Empty ──
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing["5xl"],
  },
  emptyText: {
    fontSize: fonts.sizes.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
  },
  emptyButtonText: {
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold,
  },
  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing["5xl"],
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: fonts.weights.extrabold,
    color: colors.textPrimary,
  },
  modalClose: {
    fontSize: fonts.sizes.xl,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
  },
  modalFieldName: {
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  modalInfoCard: {
    backgroundColor: colors.lightBg,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalLabel: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  modalValue: {
    fontSize: fonts.sizes.sm,
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold,
    flex: 1.5,
    textAlign: "right",
  },
  modalActions: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  updateButton: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
  },
  updateButtonText: {
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold,
    fontSize: fonts.sizes.sm,
  },
  cancelButton: {
    backgroundColor: colors.error,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#B71C1C",
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  cancelButtonDisabled: {
    opacity: 0.6,
  },
  cancelText: {
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold,
    fontSize: fonts.sizes.sm,
  },
  submitReviewBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  submitReviewText: {
    color: "#fff",
    fontWeight: fonts.weights.bold,
    fontSize: fonts.sizes.base,
  },
  // ── QR Ticket ──
  qrContainer: {
    alignItems: "center",
    backgroundColor: colors.lightBg,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  qrTitle: {
    fontSize: fonts.sizes.base,
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  qrBox: {
    padding: spacing.md,
    backgroundColor: "#fff",
    borderRadius: radius.md,
  },
  qrHint: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: "center",
  },
  // ── Review / Rating ──
  reviewButton: {
    flex: 1,
    backgroundColor: "#FF9800",
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  reviewButtonText: {
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold,
    fontSize: fonts.sizes.xs,
  },
  reviewedBadge: {
    backgroundColor: "#1B5E20",
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  reviewedText: {
    color: "#A5D6A7",
    fontWeight: fonts.weights.bold,
    fontSize: fonts.sizes.sm,
  },
  starRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  star: {
    fontSize: 40,
    color: colors.border,
  },
  starActive: {
    color: "#FFD700",
  },
  starLabel: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: fonts.sizes.sm,
    marginBottom: spacing.lg,
  },
  commentInput: {
    backgroundColor: colors.lightBg,
    borderRadius: radius.md,
    padding: spacing.lg,
    color: colors.textPrimary,
    fontSize: fonts.sizes.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    minHeight: 80,
    textAlignVertical: "top",
  },
});
