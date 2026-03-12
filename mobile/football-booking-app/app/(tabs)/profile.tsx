import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  RefreshControl,
} from "react-native";
import API from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { router, useFocusEffect } from "expo-router";
import { colors, fonts, spacing, radius, shadows } from "@/constants/theme";

interface UserStats {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalSpent: number;
  totalFields?: number;
}

export default function ProfileScreen() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, logout, token } = useAuth();

  const fetchStats = async () => {
    try {
      // Fetch all user bookings để tính statistics
      const response = await API.get("/bookings/my-bookings");
      const bookings = response.data;

      const stats: UserStats = {
        totalBookings: bookings.length,
        confirmedBookings: bookings.filter(
          (b: any) => b.status === "confirmed"
        ).length,
        cancelledBookings: bookings.filter(
          (b: any) => b.status === "cancelled"
        ).length,
        totalSpent: bookings.reduce(
          (sum: number, b: any) => sum + (b.totalPrice || 0),
          0
        ),
      };

      // Fetch field count for admin
      if (user?.role === "admin") {
        try {
          const fieldsRes = await API.get("/fields");
          stats.totalFields = fieldsRes.data.length;
        } catch {
          stats.totalFields = 0;
        }
      }

      setStats(stats);
    } catch (error: any) {
      console.log("Fetch stats error:", error);
      if (error.response?.status === 401) {
        await logout();
        router.replace("/login");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!token) {
        router.replace("/login");
        return;
      }
      fetchStats();
    }, [token])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleLogout = async () => {
    Alert.alert(
      "Xác nhận đăng xuất",
      "Bạn chắc chắn muốn đăng xuất?",
      [
        { text: "Hủy", onPress: () => {} },
        {
          text: "Đăng xuất",
          onPress: async () => {
            await logout();
            router.replace("/login");
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name || "User"}</Text>
          <Text style={styles.userEmail}>{user?.email || ""}</Text>
          {user?.role === "admin" && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>⚙️ Admin</Text>
            </View>
          )}
          {user?.role === "fieldOwner" && (
            <View style={styles.fieldOwnerBadge}>
              <Text style={styles.fieldOwnerBadgeText}>🏆 Chủ Sân</Text>
            </View>
          )}
        </View>
      </View>

      {/* Statistics */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalBookings}</Text>
            <Text style={styles.statLabel}>Tổng Đặt Sân</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#4CAF50" }]}>
              {stats.confirmedBookings}
            </Text>
            <Text style={styles.statLabel}>Đã Xác Nhận</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#E53935" }]}>
              {stats.cancelledBookings}
            </Text>
            <Text style={styles.statLabel}>Đã Hủy</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#FF9800" }]}>
              {(stats.totalSpent / 1000000).toFixed(1)}M
            </Text>
            <Text style={styles.statLabel}>Tiền Đã Chi</Text>
          </View>
          {user?.role === "admin" && stats.totalFields !== undefined && (
            <View style={[styles.statCard, { width: "100%" }]}>
              <Text style={[styles.statValue, { color: "#2196F3" }]}>
                {stats.totalFields}
              </Text>
              <Text style={styles.statLabel}>Tổng Sân Hiện Tại</Text>
            </View>
          )}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hành Động Nhanh</Text>

        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => router.push("/(tabs)")}
        >
          <Text style={styles.actionIcon}>🏟️</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Đặt Sân Mới</Text>
            <Text style={styles.actionDesc}>Đặt một sân bóng</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => router.push("/(tabs)/bookings")}
        >
          <Text style={styles.actionIcon}>📅</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Lịch Sử Đặt Sân</Text>
            <Text style={styles.actionDesc}>Xem tất cả đơn đặt sân</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        {user?.role === "admin" && (
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push("/admin")}
          >
            <Text style={styles.actionIcon}>⚙️</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Quản Lý Sân</Text>
              <Text style={styles.actionDesc}>Admin panel</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        )}

        {user?.role === "fieldOwner" && (
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push("/field-owner")}
          >
            <Text style={styles.actionIcon}>🏆</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Quản Lý Sân Của Tôi</Text>
              <Text style={styles.actionDesc}>Sửa, xóa, thêm sân</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        )}

        {user?.role === "admin" && (
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push("/admin-analytics")}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Thống Kê Doanh Thu</Text>
              <Text style={styles.actionDesc}>Analytics dashboard</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Account Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông Tin Tài Khoản</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Vai Trò</Text>
          <Text style={styles.settingValue}>
            {user?.role === "admin" ? "Admin" : user?.role === "fieldOwner" ? "Chủ Sân" : "Người Dùng"}
          </Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Email</Text>
          <Text style={styles.settingValue}>{user?.email}</Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>ID Tài Khoản</Text>
          <Text style={styles.settingValue}>{user?.id?.slice(0, 8)}...</Text>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Đăng Xuất</Text>
      </TouchableOpacity>

      <View style={styles.footer} />
    </ScrollView>
  );
}

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
  profileHeader: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.textPrimary}20`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.lg,
  },
  avatarText: {
    fontSize: fonts.sizes["4xl"],
    fontWeight: fonts.weights.bold,
    color: colors.darkBg,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: fonts.sizes.xl,
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  userEmail: {
    fontSize: fonts.sizes.xs,
    color: `${colors.textPrimary}CC`,
    marginBottom: spacing.md,
  },
  adminBadge: {
    backgroundColor: `${colors.textPrimary}20`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  adminBadgeText: {
    color: colors.textPrimary,
    fontSize: fonts.sizes.xs,
    fontWeight: fonts.weights.bold,
  },
  fieldOwnerBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  fieldOwnerBadgeText: {
    color: colors.textPrimary,
    fontSize: fonts.sizes.xs,
    fontWeight: fonts.weights.bold,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    backgroundColor: colors.cardBg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  statCard: {
    width: "50%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  statValue: {
    fontSize: fonts.sizes["2xl"],
    fontWeight: fonts.weights.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  statLabel: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    fontWeight: fonts.weights.semibold,
  },
  section: {
    marginTop: spacing.lg,
    backgroundColor: colors.cardBg,
    marginHorizontal: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  sectionTitle: {
    fontSize: fonts.sizes.base,
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionIcon: {
    fontSize: fonts.sizes["3xl"],
    marginRight: spacing.lg,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  actionDesc: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
  },
  actionArrow: {
    color: colors.border,
    fontSize: fonts.sizes.xl,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLabel: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    fontWeight: fonts.weights.semibold,
  },
  settingValue: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
  },
  logoutButton: {
    backgroundColor: colors.error,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
  },
  logoutText: {
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold,
    fontSize: fonts.sizes.base,
  },
  footer: {
    paddingBottom: spacing.xl,
  },
});
