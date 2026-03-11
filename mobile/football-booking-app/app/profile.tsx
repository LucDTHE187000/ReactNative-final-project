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

interface UserStats {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalSpent: number;
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

      const stats = {
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
        <Text style={styles.sectionTitle}>Cài Đặt Tài Khoản</Text>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Số Điện Thoại</Text>
          <Text style={styles.settingValue}>Chưa cập nhật</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Địa Chỉ</Text>
          <Text style={styles.settingValue}>Chưa cập nhật</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Thích Nhất Được Tạo</Text>
          <Text style={styles.settingValue}>
            {new Date(user?.email || "").toLocaleDateString("vi-VN")}
          </Text>
        </TouchableOpacity>
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
    backgroundColor: "#F4F6F8",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F6F8",
  },
  profileHeader: {
    backgroundColor: "#1976D2",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 8,
  },
  adminBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  adminBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  statCard: {
    width: "50%",
    paddingHorizontal: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1976D2",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
  },
  section: {
    marginTop: 16,
    backgroundColor: "#fff",
    marginHorizontal: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  actionIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 12,
    color: "#999",
  },
  actionArrow: {
    color: "#ccc",
    fontSize: 20,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  settingValue: {
    fontSize: 12,
    color: "#999",
  },
  logoutButton: {
    backgroundColor: "#E53935",
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  footer: {
    paddingBottom: 20,
  },
});
