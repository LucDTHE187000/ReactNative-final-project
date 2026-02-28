import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import API from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

interface Booking {
  _id: string;
  status: string;
  totalPrice: number;
  date: string;
  fieldName?: string;
}

export default function AdminAnalyticsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    avgPricePerBooking: 0,
  });

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }

    if (user?.role !== "admin") {
      Alert.alert("Lỗi", "Chỉ admin mới có quyền xem");
      router.back();
      return;
    }

    fetchAnalytics();
  }, [token, user]);

  const fetchAnalytics = async () => {
    try {
      const response = await API.get("/bookings");
      const allBookings = response.data;
      setBookings(allBookings);

      // Calculate statistics
      const total = allBookings.length;
      const confirmed = allBookings.filter(
        (b: Booking) => b.status === "confirmed"
      ).length;
      const pending = allBookings.filter(
        (b: Booking) => b.status === "pending"
      ).length;
      const cancelled = allBookings.filter(
        (b: Booking) => b.status === "cancelled"
      ).length;
      const revenue = allBookings.reduce(
        (sum: number, b: Booking) => sum + (b.totalPrice || 0),
        0
      );
      const avgPrice = total > 0 ? revenue / total : 0;

      setStats({
        totalBookings: total,
        confirmedBookings: confirmed,
        pendingBookings: pending,
        cancelledBookings: cancelled,
        totalRevenue: revenue,
        avgPricePerBooking: avgPrice,
      });
    } catch (error: any) {
      console.log("Fetch analytics error:", error);
      Alert.alert("Lỗi", "Không thể tải dữ liệu analytics");
    } finally {
      setLoading(false);
    }
  };

  // Calculate booking status distribution
  const bookingStatusData = [
    {
      label: "Xác nhận",
      value: stats.confirmedBookings,
      color: "#4CAF50",
      percentage: (
        (stats.confirmedBookings / stats.totalBookings) *
        100
      ).toFixed(1),
    },
    {
      label: "Chờ xác nhận",
      value: stats.pendingBookings,
      color: "#FFC107",
      percentage:
        ((stats.pendingBookings / stats.totalBookings) * 100).toFixed(1),
    },
    {
      label: "Hủy",
      value: stats.cancelledBookings,
      color: "#F44336",
      percentage:
        ((stats.cancelledBookings / stats.totalBookings) * 100).toFixed(1),
    },
  ];

  // Get top fields by bookings
  const fieldBookings: { [key: string]: number } = {};
  bookings.forEach((booking) => {
    const fieldName = booking.fieldName || "Unknown";
    fieldBookings[fieldName] = (fieldBookings[fieldName] || 0) + 1;
  });

  const topFields = Object.entries(fieldBookings)
    .map(([field, count]) => ({
      field,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Analytics Dashboard</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Quay lại</Text>
        </TouchableOpacity>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsContainer}>
        <MetricCard
          label="Tổng đơn đặt"
          value={stats.totalBookings.toString()}
          icon="📅"
          color="#1976D2"
        />
        <MetricCard
          label="Doanh thu"
          value={stats.totalRevenue.toLocaleString() + "đ"}
          icon="💰"
          color="#4CAF50"
        />
        <MetricCard
          label="TB mỗi đơn"
          value={stats.avgPricePerBooking.toLocaleString().split(".")[0] + "đ"}
          icon="📈"
          color="#FF9800"
        />
        <MetricCard
          label="Xác nhận"
          value={stats.confirmedBookings.toString()}
          icon="✓"
          color="#4CAF50"
        />
      </View>

      {/* Booking Status Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Phân bố trạng thái</Text>
        {bookingStatusData.map((item) => (
          <View key={item.label} style={styles.statusItem}>
            <View style={styles.statusLabel}>
              <View
                style={[styles.statusDot, { backgroundColor: item.color }]}
              />
              <Text style={styles.statusText}>{item.label}</Text>
            </View>
            <View style={styles.statusValue}>
              <Text style={styles.statusCount}>{item.value}</Text>
              <Text style={styles.statusPercent}>({item.percentage}%)</Text>
            </View>
          </View>
        ))}

        {/* Visual Bar */}
        <View style={styles.barContainer}>
          {bookingStatusData.map((item, index) => (
            <View
              key={index}
              style={[
                styles.barSegment,
                {
                  width: `${item.percentage}%`,
                  backgroundColor: item.color,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Top Fields by Bookings */}
      {topFields.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top sân được đặt nhiều</Text>
          {topFields.map((item, index) => (
            <View key={index} style={styles.topFieldItem}>
              <View style={styles.topFieldRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <View style={styles.topFieldName}>
                <Text style={styles.topFieldText}>{item.field}</Text>
              </View>
              <View style={styles.topFieldCount}>
                <Text style={styles.topFieldCountText}>{item.count}đ</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Booking Status Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tóm tắt</Text>
        <View style={styles.summaryGrid}>
          <SummaryCard
            label="Chờ xác nhận"
            value={stats.pendingBookings}
            color="#FFC107"
          />
          <SummaryCard
            label="Hủy"
            value={stats.cancelledBookings}
            color="#F44336"
          />
          <SummaryCard
            label="Tỉ lệ xác nhận"
            value={
              stats.totalBookings > 0
                ? (
                    (stats.confirmedBookings / stats.totalBookings) *
                    100
                  ).toFixed(1) + "%"
                : "0%"
            }
            color="#4CAF50"
          />
        </View>
      </View>

      {/* No Data Warning */}
      {stats.totalBookings === 0 && (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            Chưa có dữ liệu đặt sân. Hãy chờ người dùng đặt sân.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  icon: string;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  color,
}) => (
  <View style={[styles.metricCard, { borderLeftColor: color }]}>
    <Text style={styles.metricIcon}>{icon}</Text>
    <View style={styles.metricContent}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
    </View>
  </View>
);

interface SummaryCardProps {
  label: string;
  value: string | number;
  color: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, color }) => (
  <View style={styles.summaryCard}>
    <View style={[styles.summaryColorBar, { backgroundColor: color }]} />
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={[styles.summaryValue, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F8",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F6F8",
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  metricsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  metricCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 4,
    elevation: 2,
  },
  metricIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  statusItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  statusLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    color: "#666",
  },
  statusValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusCount: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
  },
  statusPercent: {
    fontSize: 11,
    color: "#999",
  },
  barContainer: {
    flexDirection: "row",
    height: 20,
    borderRadius: 10,
    marginTop: 12,
    overflow: "hidden",
  },
  barSegment: {
    height: "100%",
  },
  topFieldItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  topFieldRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#1976D2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  rankNumber: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  topFieldName: {
    flex: 1,
  },
  topFieldText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  topFieldCount: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
  },
  topFieldCountText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1976D2",
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  summaryColorBar: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 11,
    color: "#999",
    marginBottom: 4,
    textAlign: "center",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  noDataContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginVertical: 16,
    borderRadius: 12,
    paddingVertical: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  noDataText: {
    fontSize: 13,
    color: "#999",
    fontStyle: "italic",
  },
});
