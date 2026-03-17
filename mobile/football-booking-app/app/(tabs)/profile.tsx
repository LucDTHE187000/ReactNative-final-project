import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
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
  totalUsers?: number;
  totalFieldOwners?: number;
}

export default function ProfileScreen() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCurrentPassword, setEditCurrentPassword] = useState("");
  const [editNewPassword, setEditNewPassword] = useState("");
  const [editConfirmPassword, setEditConfirmPassword] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const { user, logout, token, updateUser } = useAuth();

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
        // Chỉ cộng những booking đã thanh toán thành công
        totalSpent: bookings
          .filter((b: any) => b.paymentStatus === "paid")
          .reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0),
      };

      // Fetch admin-only stats
      if (user?.role === "admin") {
        try {
          const [fieldsRes, usersRes] = await Promise.all([
            API.get("/fields"),
            API.get("/admin/users"),
          ]);
          stats.totalFields = fieldsRes.data.length;
          const allUsers: any[] = usersRes.data;
          stats.totalUsers = allUsers.filter((u) => u.role === "user").length;
          stats.totalFieldOwners = allUsers.filter((u) => u.role === "fieldOwner").length;
        } catch {
          stats.totalFields = 0;
          stats.totalUsers = 0;
          stats.totalFieldOwners = 0;
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

  const fetchUnreadCount = async () => {
    try {
      const res = await API.get("/notifications/unread-count");
      setUnreadCount(res.data.count || 0);
    } catch {
      // ignore notification errors
    }
  };

  /**
   * Author: Dương Trọng Lực - mssv: HE187000
   * Param: none
   * Description: Gửi yêu cầu cập nhật tên và/hoặc mật khẩu cho tài khoản hiện tại
   */
  const handleEditProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Lỗi", "Tên không được để trống");
      return;
    }
    if (editNewPassword && editNewPassword !== editConfirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu mới không khớp");
      return;
    }
    if (editNewPassword && editNewPassword.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (editNewPassword && !editCurrentPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    setEditSubmitting(true);
    try {
      const payload: any = { name: editName.trim() };
      if (editNewPassword) {
        payload.currentPassword = editCurrentPassword;
        payload.newPassword = editNewPassword;
      }
      const res = await API.put("/auth/profile", payload);
      await updateUser(res.data.user);
      setEditModalVisible(false);
      setEditCurrentPassword("");
      setEditNewPassword("");
      setEditConfirmPassword("");
      Alert.alert("Thành công", "Hồ sơ đã được cập nhật");
    } catch (error: any) {
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể cập nhật hồ sơ");
    } finally {
      setEditSubmitting(false);
    }
  };

  const openEditModal = () => {
    setEditName(user?.name || "");
    setEditCurrentPassword("");
    setEditNewPassword("");
    setEditConfirmPassword("");
    setEditModalVisible(true);
  };

  useFocusEffect(
    useCallback(() => {
      if (!token) return; // Guest — không fetch, hiển thị màn hình mời đăng nhập
      fetchStats();
      fetchUnreadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token])
  );

  // Guest chưa đăng nhập
  if (!token) {
    return (
      <View style={styles.guestContainer}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.border }]}>
            <Text style={[styles.avatarText, { color: colors.textSecondary }]}>?</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Khách</Text>
            <Text style={styles.userEmail}>Chưa đăng nhập</Text>
          </View>
        </View>
        <View style={styles.guestContent}>
          <Text style={styles.guestIcon}>👤</Text>
          <Text style={styles.guestTitle}>Chào mừng bạn!</Text>
          <Text style={styles.guestSubtitle}>
            Đăng nhập để xem hồ sơ, theo dõi lịch sử đặt sân và nhiều tính năng hơn.
          </Text>
          <TouchableOpacity style={styles.guestLoginBtn} onPress={() => router.push("/login")}>
            <Text style={styles.guestLoginBtnText}>Đăng nhập</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.guestRegisterBtn} onPress={() => router.push("/register")}>
            <Text style={styles.guestRegisterBtnText}>Tạo tài khoản mới</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
          onPress: () => {
            void (async () => {
              await logout();
              router.replace("/login");
            })();
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
          <TouchableOpacity style={styles.editProfileBtn} onPress={openEditModal}>
            <Text style={styles.editProfileBtnText}>✏️ Sửa hồ sơ</Text>
          </TouchableOpacity>
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
          {user?.role === "admin" && stats.totalUsers !== undefined && (
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: "#4CAF50" }]}>
                {stats.totalUsers}
              </Text>
              <Text style={styles.statLabel}>Người Dùng</Text>
            </View>
          )}
          {user?.role === "admin" && stats.totalFieldOwners !== undefined && (
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: "#FF9800" }]}>
                {stats.totalFieldOwners}
              </Text>
              <Text style={styles.statLabel}>Chủ Sân</Text>
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

        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => router.push("/notifications" as any)}
        >
          <Text style={styles.actionIcon}>🔔</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Thông Báo</Text>
            <Text style={styles.actionDesc}>Xem các thông báo của bạn</Text>
          </View>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
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

        {user?.role === "admin" && (
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push("/admin-users" as any)}
          >
            <Text style={styles.actionIcon}>👥</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Quản Lý Tài Khoản</Text>
              <Text style={styles.actionDesc}>Quản lý user và chủ sân</Text>
            </View>
            {stats && (stats.totalUsers ?? 0) + (stats.totalFieldOwners ?? 0) > 0 && (
              <View style={styles.userCountBadge}>
                <Text style={styles.userCountBadgeText}>
                  {(stats?.totalUsers ?? 0) + (stats?.totalFieldOwners ?? 0)}
                </Text>
              </View>
            )}
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
            {(() => {
              if (user?.role === "admin") return "Admin";
              if (user?.role === "fieldOwner") return "Chủ Sân";
              return "Người Dùng";
            })()}
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

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✏️ Sửa Hồ Sơ</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Tên hiển thị</Text>
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Nhập tên của bạn"
                placeholderTextColor={colors.textSecondary}
                editable={!editSubmitting}
              />

              <Text style={[styles.inputLabel, { marginTop: spacing.lg }]}>
                Đổi mật khẩu (bỏ trống nếu không muốn đổi)
              </Text>
              <TextInput
                style={styles.editInput}
                value={editCurrentPassword}
                onChangeText={setEditCurrentPassword}
                placeholder="Mật khẩu hiện tại"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                editable={!editSubmitting}
              />
              <TextInput
                style={styles.editInput}
                value={editNewPassword}
                onChangeText={setEditNewPassword}
                placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                editable={!editSubmitting}
              />
              <TextInput
                style={styles.editInput}
                value={editConfirmPassword}
                onChangeText={setEditConfirmPassword}
                placeholder="Xác nhận mật khẩu mới"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                editable={!editSubmitting}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}
                disabled={editSubmitting}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, editSubmitting && { opacity: 0.6 }]}
                onPress={handleEditProfile}
                disabled={editSubmitting}
              >
                {editSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Lưu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  guestContainer: {
    flex: 1,
    backgroundColor: colors.lightBg,
  },
  guestContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  guestIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  guestTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  guestSubtitle: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  guestLoginBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    width: "100%",
    alignItems: "center",
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  guestLoginBtnText: {
    color: "#fff",
    fontSize: fonts.sizes.base,
    fontWeight: fonts.weights.bold,
  },
  guestRegisterBtn: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  guestRegisterBtnText: {
    color: colors.primary,
    fontSize: fonts.sizes.base,
    fontWeight: fonts.weights.semibold,
  },
  profileHeader: {
    backgroundColor: colors.headerBg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + 4,
    flexDirection: "row",
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...shadows.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.lg,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  avatarText: {
    fontSize: fonts.sizes["4xl"],
    fontWeight: fonts.weights.bold,
    color: "#FFFFFF",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: fonts.sizes.xl,
    fontWeight: fonts.weights.bold,
    color: "#FFFFFF",
    marginBottom: spacing.sm,
  },
  userEmail: {
    fontSize: fonts.sizes.xs,
    color: "rgba(255,255,255,0.75)",
    marginBottom: spacing.md,
  },
  adminBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  adminBadgeText: {
    color: "#FFFFFF",
    fontSize: fonts.sizes.xs,
    fontWeight: fonts.weights.bold,
  },
  fieldOwnerBadge: {
    backgroundColor: colors.accentOrange,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  fieldOwnerBadgeText: {
    color: "#FFFFFF",
    fontSize: fonts.sizes.xs,
    fontWeight: fonts.weights.bold,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    backgroundColor: colors.lightBg,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.cardBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: "center",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  statValue: {
    fontSize: fonts.sizes["2xl"],
    fontWeight: fonts.weights.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    fontWeight: fonts.weights.semibold,
    textAlign: "center",
  },
  section: {
    marginTop: spacing.lg,
    backgroundColor: colors.cardBg,
    marginHorizontal: spacing.lg,
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.bold,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    backgroundColor: colors.lightBg,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.cardBg,
  },
  actionIcon: {
    fontSize: fonts.sizes["2xl"],
    marginRight: spacing.md,
    width: 36,
    textAlign: "center",
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
  },
  actionArrow: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.lg,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.cardBg,
  },
  settingLabel: {
    fontSize: fonts.sizes.sm,
    color: colors.textPrimary,
    fontWeight: fonts.weights.semibold,
  },
  settingValue: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
  },
  logoutButton: {
    backgroundColor: "#C62828",
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
    ...shadows.md,
  },
  logoutText: {
    color: "#FFFFFF",
    fontWeight: fonts.weights.bold,
    fontSize: fonts.sizes.base,
  },
  footer: {
    paddingBottom: spacing.xl,
  },
  editProfileBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    marginBottom: spacing.xs,
  },
  editProfileBtnText: {
    color: "#FFFFFF",
    fontSize: fonts.sizes.xs,
    fontWeight: fonts.weights.semibold,
  },
  unreadBadge: {
    backgroundColor: colors.error,
    borderRadius: radius.full,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    marginRight: spacing.xs,
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: fonts.sizes.xs,
    fontWeight: fonts.weights.bold,
  },
  userCountBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginRight: spacing.xs,
  },
  userCountBadgeText: {
    color: "#fff",
    fontSize: fonts.sizes.xs,
    fontWeight: fonts.weights.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.lightBg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.bold,
  },
  modalClose: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.xl,
    padding: spacing.xs,
  },
  modalBody: {
    padding: spacing.lg,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.semibold,
    marginBottom: spacing.xs,
  },
  editInput: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.textPrimary,
    fontSize: fonts.sizes.sm,
    marginBottom: spacing.sm,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.cardBg,
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontWeight: fonts.weights.bold,
  },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  modalSaveText: {
    color: "#fff",
    fontWeight: fonts.weights.bold,
  },
});
