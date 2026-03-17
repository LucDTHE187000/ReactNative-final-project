import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from "react-native";
import API from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { router, useFocusEffect } from "expo-router";
import { colors, fonts, spacing, radius, shadows } from "@/constants/theme";

interface SystemUser {
  _id: string;
  name: string;
  email: string;
  role: "user" | "fieldOwner" | "admin";
  createdAt: string;
}

type FilterTab = "all" | "user" | "fieldOwner" | "admin";

/**
 * Author: Dương Trọng Lực - mssv: HE187000
 * Param: none
 * Description: Màn hình quản lý tài khoản người dùng dành cho admin.
 *              Hiển thị danh sách user/fieldOwner/admin, cho phép xóa bất kỳ tài khoản nào (trừ admin).
 */
export default function AdminUsersScreen() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const { token, user } = useAuth();

  const fetchUsers = async () => {
    try {
      const res = await API.get("/admin/users");
      setUsers(res.data);
    } catch (e: any) {
      console.error("Fetch users error:", e?.message);
      Alert.alert("Lỗi", "Không thể tải danh sách tài khoản");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!token || user?.role !== "admin") {
        Alert.alert("Lỗi", "Bạn không có quyền truy cập");
        router.replace("/(tabs)");
        return;
      }
      fetchUsers();
    }, [token, user])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  /**
   * Author: Dương Trọng Lực - mssv: HE187000
   * Param: userId - ID tài khoản cần xóa, userName - tên hiển thị trong confirm
   * Description: Gọi API DELETE /admin/users/:id để xóa tài khoản khỏi hệ thống
   */
  const doDeleteUser = async (userId: string) => {
    setDeleting(userId);
    try {
      await API.delete(`/admin/users/${userId}`);
      Alert.alert("Thành công", "Tài khoản đã được xóa khỏi hệ thống");
      fetchUsers();
    } catch (error: any) {
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể xóa tài khoản");
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteUser = (userId: string, userName: string, role: string) => {
    if (role === "admin") {
      Alert.alert("Không thể xóa", "Không thể xóa tài khoản admin.");
      return;
    }
    if (Platform.OS === "web") {
      if (globalThis.confirm(`Xóa tài khoản "${userName}"? Thao tác không thể hoàn tác.`)) {
        void doDeleteUser(userId);
      }
      return;
    }
    Alert.alert(
      "Xác nhận xóa",
      `Xóa tài khoản "${userName}"?\nThao tác này không thể hoàn tác.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => { void doDeleteUser(userId); },
        },
      ]
    );
  };

  const totalUsers = users.filter((u) => u.role === "user").length;
  const totalFieldOwners = users.filter((u) => u.role === "fieldOwner").length;
  const totalAdmins = users.filter((u) => u.role === "admin").length;

  const filteredUsers =
    activeTab === "all" ? users : users.filter((u) => u.role === activeTab);

  const getRoleBadgeColor = (role: string) => {
    if (role === "admin") return "#7B1FA2";
    if (role === "fieldOwner") return "#1565C0";
    return "#2E7D32";
  };

  const getRoleLabel = (role: string) => {
    if (role === "admin") return "Admin";
    if (role === "fieldOwner") return "Chủ Sân";
    return "User";
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Quay lại</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>👥 Quản Lý Tài Khoản</Text>
          <Text style={styles.headerSub}>Tổng: {users.length} tài khoản</Text>
        </View>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { borderLeftColor: "#2E7D32" }]}>
          <Text style={[styles.statNum, { color: "#4CAF50" }]}>{totalUsers}</Text>
          <Text style={styles.statLbl}>Người Dùng</Text>
        </View>
        <View style={[styles.statBox, { borderLeftColor: "#1565C0" }]}>
          <Text style={[styles.statNum, { color: "#42A5F5" }]}>{totalFieldOwners}</Text>
          <Text style={styles.statLbl}>Chủ Sân</Text>
        </View>
        <View style={[styles.statBox, { borderLeftColor: "#7B1FA2" }]}>
          <Text style={[styles.statNum, { color: "#AB47BC" }]}>{totalAdmins}</Text>
          <Text style={styles.statLbl}>Admin</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabRow}>
        {(["all", "user", "fieldOwner", "admin"] as FilterTab[]).map((tab) => {
          const labels: Record<FilterTab, string> = {
            all: "Tất Cả",
            user: "User",
            fieldOwner: "Chủ Sân",
            admin: "Admin",
          };
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                {labels[tab]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* User List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 30, paddingHorizontal: spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có tài khoản nào</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            {/* Avatar + Info */}
            <View style={styles.userCardLeft}>
              <View style={[styles.avatar, { backgroundColor: getRoleBadgeColor(item.role) }]}>
                <Text style={styles.avatarText}>
                  {item.name?.charAt(0).toUpperCase() || "?"}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
                <Text style={styles.userDate}>🗓 Tham gia: {formatDate(item.createdAt)}</Text>
              </View>
            </View>

            {/* Role badge + Delete */}
            <View style={styles.userCardRight}>
              <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(item.role) }]}>
                <Text style={styles.roleBadgeText}>{getRoleLabel(item.role)}</Text>
              </View>
              {item.role !== "admin" && (
                <TouchableOpacity
                  style={[styles.deleteBtn, deleting === item._id && { opacity: 0.5 }]}
                  disabled={deleting === item._id}
                  onPress={() => handleDeleteUser(item._id, item.name, item.role)}
                >
                  {deleting === item._id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.deleteBtnText}>🗑️ Xóa</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </View>
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
  header: {
    backgroundColor: colors.headerBg,
    paddingTop: 50,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...shadows.lg,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  backBtnText: {
    color: "#FFFFFF",
    fontSize: fonts.sizes.sm,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: fonts.sizes.sm,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.lightBg,
    marginBottom: 2,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: "center",
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  statNum: {
    fontSize: fonts.sizes.xl,
    fontWeight: "bold",
  },
  statLbl: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: colors.cardBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.sm,
    alignItems: "center",
    backgroundColor: colors.lightBg,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabBtnText: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  tabBtnTextActive: {
    color: "#fff",
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.base,
  },
  userCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginHorizontal: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  userCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: fonts.sizes.base,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: fonts.sizes.base,
  },
  userEmail: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.sm,
    marginTop: 2,
  },
  userDate: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.xs,
    marginTop: 2,
  },
  userCardRight: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  roleBadgeText: {
    color: "#fff",
    fontSize: fonts.sizes.xs,
    fontWeight: "700",
  },
  deleteBtn: {
    backgroundColor: "#C62828",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    minWidth: 68,
    alignItems: "center",
  },
  deleteBtnText: {
    color: "#fff",
    fontSize: fonts.sizes.xs,
    fontWeight: "600",
  },
});
