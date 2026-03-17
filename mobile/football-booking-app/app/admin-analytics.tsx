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
import { Svg, Circle, Path } from "react-native-svg";
import { router } from "expo-router";
import API from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { colors, fonts, spacing, radius, shadows } from "@/constants/theme";

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

      const total = allBookings.length;
      const confirmed = allBookings.filter((b: Booking) => b.status === "confirmed").length;
      const pending = allBookings.filter((b: Booking) => b.status === "pending").length;
      const cancelled = allBookings.filter((b: Booking) => b.status === "cancelled").length;
      // Chỉ tính doanh thu từ booking đã xác nhận (tránh tính đơn chưa thanh toán hoặc đã hủy)
      const paidBookings = allBookings.filter((b: Booking) => b.status === "confirmed");
      const revenue = paidBookings.reduce((sum: number, b: Booking) => sum + (b.totalPrice || 0), 0);
      const avgPrice = paidBookings.length > 0 ? revenue / paidBookings.length : 0;

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

  const bookingStatusData = [
    {
      label: "Xác nhận",
      value: stats.confirmedBookings,
      color: "#4CAF50",
      percentage:
        stats.totalBookings > 0
          ? ((stats.confirmedBookings / stats.totalBookings) * 100).toFixed(1)
          : "0",
    },
    {
      label: "Chờ xác nhận",
      value: stats.pendingBookings,
      color: "#FFC107",
      percentage:
        stats.totalBookings > 0
          ? ((stats.pendingBookings / stats.totalBookings) * 100).toFixed(1)
          : "0",
    },
    {
      label: "Hủy",
      value: stats.cancelledBookings,
      color: "#F44336",
      percentage:
        stats.totalBookings > 0
          ? ((stats.cancelledBookings / stats.totalBookings) * 100).toFixed(1)
          : "0",
    },
  ];

  const fieldBookings: { [key: string]: number } = {};
  bookings.forEach((booking) => {
    const fieldName = booking.fieldName || "Unknown";
    fieldBookings[fieldName] = (fieldBookings[fieldName] || 0) + 1;
  });

  const topFields = Object.entries(fieldBookings)
    .map(([field, count]) => ({ field, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maxFieldBookings = topFields.length > 0 ? Math.max(...topFields.map((f) => f.count)) : 1;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>📊 Analytics</Text>
          <Text style={styles.headerSubtitle}>Thống kê hoạt động</Text>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Quay lại</Text>
        </TouchableOpacity>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsContainer}>
        <MetricCard label="Tổng đơn" value={stats.totalBookings.toString()} icon="📅" color="#1976D2" />
        <MetricCard label="Doanh Thu" value={`${(stats.totalRevenue / 1000000).toFixed(1)}M`} icon="💰" color="#4CAF50" />
        <MetricCard label="TB/Đơn" value={`${(stats.avgPricePerBooking / 1000).toFixed(0)}K`} icon="📈" color="#FF9800" />
        <MetricCard label="Xác Nhận" value={stats.confirmedBookings.toString()} icon="✓" color="#4CAF50" />
      </View>

      {/* Pie Chart - Booking Status */}
      {stats.totalBookings > 0 && (
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>📊 Phân bố trạng thái</Text>
          <View style={styles.pieChartContainer}>
            <PieChart data={bookingStatusData} size={160} />
            <View style={styles.legendContainer}>
              {bookingStatusData.map((item) => (
                <View key={item.label} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                  <View style={styles.legendText}>
                    <Text style={styles.legendLabel}>{item.label}</Text>
                    <Text style={styles.legendValue}>{item.value} ({item.percentage}%)</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Bar Chart - Top Fields */}
      {topFields.length > 0 && (
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>🏆 Top sân được đặt</Text>
          <View style={styles.barChartContainer}>
            {topFields.map((item, index) => {
              const getBarColor = (idx: number) => {
                if (idx === 0) return "#4CAF50";
                if (idx === 1) return "#2196F3";
                if (idx === 2) return "#FF9800";
                return "#F44336";
              };
              return (
                <View key={item.field} style={styles.barChartItem}>
                  <View style={styles.barChartLabel}>
                    <Text style={styles.barChartRank}>#{index + 1}</Text>
                    <Text style={styles.barChartName} numberOfLines={1}>
                      {item.field}
                    </Text>
                  </View>
                  <View style={styles.barChartBar}>
                    <View
                      style={[
                        styles.barChartProgress,
                        {
                          width: `${(item.count / maxFieldBookings) * 100}%`,
                          backgroundColor: getBarColor(index),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barChartValue}>{item.count}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Summary Cards */}
      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>📈 Tóm tắt</Text>
        <View style={styles.summaryGrid}>
          <SummaryCard label="Chờ Xác Nhận" value={stats.pendingBookings.toString()} color="#FFC107" icon="⏳" />
          <SummaryCard label="Đã Hủy" value={stats.cancelledBookings.toString()} color="#F44336" icon="❌" />
          <SummaryCard
            label="Tỉ Lệ Xác Nhận"
            value={
              stats.totalBookings > 0
                ? ((stats.confirmedBookings / stats.totalBookings) * 100).toFixed(0) + "%"
                : "0%"
            }
            color="#4CAF50"
            icon="✅"
          />
        </View>
      </View>

      {/* No Data State */}
      {stats.totalBookings === 0 && (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataIcon}>📭</Text>
          <Text style={styles.noDataText}>Chưa có dữ liệu đặt sân</Text>
          <Text style={styles.noDataSubtext}>Hãy chờ người dùng đặt sân để xem thống kê</Text>
        </View>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

// ======== Pie Chart Component ========
interface PieChartProps {
  data: { label: string; value: number; color: string; percentage: string }[];
  size: number;
}

const PieChart: React.FC<PieChartProps> = ({ data, size }) => {
  const radius = size / 2 - 10;
  let currentAngle = -Math.PI / 2;
  const center = size / 2;

  const slices = data.map((item) => {
    const sliceAngle = (item.value / data.reduce((sum, d) => sum + d.value, 0)) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;

    const startX = center + radius * Math.cos(startAngle);
    const startY = center + radius * Math.sin(startAngle);
    const endX = center + radius * Math.cos(endAngle);
    const endY = center + radius * Math.sin(endAngle);

    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    const pathData = [
      `M ${center} ${center}`,
      `L ${startX} ${startY}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`,
      "Z",
    ].join(" ");

    currentAngle = endAngle;

    return { pathData, color: item.color, label: item.label };
  });

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((slice) => (
        <Path key={slice.label} d={slice.pathData} fill={slice.color} strokeWidth={1.5} stroke="#fff" />
      ))}
      <Circle cx={center} cy={center} r={radius * 0.45} fill={colors.cardBg} />
    </Svg>
  );
};

// ======== Components ========
interface MetricCardProps {
  label: string;
  value: string;
  icon: string;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon, color }) => (
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
  value: string;
  color: string;
  icon: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, color, icon }) => (
  <View style={styles.summaryCard}>
    <Text style={styles.summaryIcon}>{icon}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={[styles.summaryValue, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.darkBg,
  },
  header: {
    backgroundColor: colors.cardBg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingTop: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.lg,
  },
  headerTitle: {
    fontSize: fonts.sizes["2xl"],
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  backButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
  },
  backButtonText: {
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold,
    fontSize: fonts.sizes.xs,
  },
  metricsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  metricCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 4,
    ...shadows.md,
  },
  metricIcon: {
    fontSize: fonts.sizes["2xl"],
    marginRight: spacing.md,
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  metricValue: {
    fontSize: fonts.sizes.xl,
    fontWeight: fonts.weights.bold,
  },
  chartSection: {
    backgroundColor: colors.cardBg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    ...shadows.md,
  },
  sectionTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  pieChartContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: spacing.md,
  },
  legendContainer: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.md,
  },
  legendText: {
    flex: 1,
  },
  legendLabel: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
  },
  legendValue: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
  },
  barChartContainer: {
    marginTop: spacing.md,
  },
  barChartItem: {
    marginBottom: spacing.lg,
  },
  barChartLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  barChartRank: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.bold,
    color: colors.primary,
    marginRight: spacing.md,
    width: 30,
  },
  barChartName: {
    flex: 1,
    fontSize: fonts.sizes.sm,
    color: colors.textPrimary,
    fontWeight: fonts.weights.semibold,
  },
  barChartBar: {
    height: 24,
    backgroundColor: colors.darkBg,
    borderRadius: radius.md,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  barChartProgress: {
    height: "100%",
    borderRadius: radius.md,
  },
  barChartValue: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    fontWeight: fonts.weights.bold,
  },
  summarySection: {
    backgroundColor: colors.cardBg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    ...shadows.md,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.darkBg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryIcon: {
    fontSize: fonts.sizes["2xl"],
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  summaryValue: {
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.bold,
  },
  noDataContainer: {
    alignItems: "center",
    marginVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  noDataIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  noDataText: {
    fontSize: fonts.sizes.base,
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  noDataSubtext: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
