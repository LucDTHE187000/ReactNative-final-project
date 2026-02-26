import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import API from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { router, useFocusEffect } from "expo-router";

interface Booking {
  _id: string;
  fieldName: string;
  field?: {
    name: string;
    location: string;
    pricePerHour: number;
  };
  date: string;
  startHour: number;
  endHour: number;
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
}

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const { token, logout } = useAuth();

  const fetchBookings = async () => {
    try {
      const response = await API.get("/bookings/my-bookings");
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

  // Fetch on screen focus
  useFocusEffect(
    useCallback(() => {
      if (!token) {
        router.replace("/login");
        return;
      }
      fetchBookings();
    }, [token])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleCancelBooking = async (bookingId: string) => {
    Alert.alert(
      "Xác nhận hủy",
      "Bạn chắc chắn muốn hủy đặt sân này?",
      [
        { text: "Không", onPress: () => {} },
        {
          text: "Có, hủy",
          onPress: async () => {
            setCancelling(bookingId);
            try {
              await API.put(`/bookings/${bookingId}/cancel`);
              Alert.alert("Thành công", "Đặt sân đã được hủy");
              fetchBookings();
            } catch (error: any) {
              Alert.alert(
                "Lỗi",
                error.response?.data?.message || "Không thể hủy đặt sân"
              );
            } finally {
              setCancelling(null);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "#4CAF50";
      case "pending":
        return "#FFA726";
      case "cancelled":
        return "#EF5350";
      default:
        return "#999";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Đã xác nhận";
      case "pending":
        return "Chờ xác nhận";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const isPastDate = (dateStr: string) => {
    const bookingDate = new Date(dateStr);
    const today = new Date();
    return bookingDate < today;
  };

  const canCancel = (booking: Booking) => {
    return booking.status !== "cancelled" && !isPastDate(booking.date);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📅 Lịch Sử Đặt Sân</Text>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Chưa có đặt sân nào</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push("/(tabs)")}
            >
              <Text style={styles.emptyButtonText}>Đi đặt sân</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <Text style={styles.singleName} numberOfLines={1}>
                  {item.field?.name || item.fieldName}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(item.status) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {getStatusText(item.status)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Details */}
            <View style={styles.details}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>📍 Địa điểm:</Text>
                <Text style={styles.detailValue} numberOfLines={1}>
                  {item.field?.location || "N/A"}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>📅 Ngày:</Text>
                <Text style={styles.detailValue}>
                  {new Date(item.date).toLocaleDateString("vi-VN")}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>⏰ Giờ:</Text>
                <Text style={styles.detailValue}>
                  {item.startHour}:00 - {item.endHour}:00
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>💰 Giá:</Text>
                <Text style={styles.priceValue}>
                  {item.totalPrice.toLocaleString()}đ
                </Text>
              </View>
            </View>

            {/* Actions */}
            {canCancel(item) && (
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  cancelling === item._id && styles.cancelButtonDisabled,
                ]}
                onPress={() => handleCancelBooking(item._id)}
                disabled={cancelling === item._id}
              >
                {cancelling === item._id ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.cancelText}>Hủy đặt sân</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {/* Logout button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={async () => {
          await logout();
          router.replace("/login");
        }}
      >
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F8",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F6F8",
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#1976D2",
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  singleName: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  priceValue: {
    fontSize: 14,
    color: "#E53935",
    fontWeight: "bold",
    flex: 1,
    textAlign: "right",
  },
  cancelButton: {
    backgroundColor: "#EF5350",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  cancelButtonDisabled: {
    opacity: 0.6,
  },
  cancelText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: "#1976D2",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#E53935",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
