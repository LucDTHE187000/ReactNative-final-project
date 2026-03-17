import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import API from "../services/api";
import { colors, fonts, spacing, radius, shadows } from "../constants/theme";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: "booking" | "payment" | "review" | "system";
  isRead: boolean;
  bookingId?: string;
  createdAt: string;
}

const TYPE_ICON: Record<string, string> = {
  booking: "📋",
  payment: "💳",
  review: "⭐",
  system: "🔔",
};

/**
 * Author: Dương Trọng Lực - mssv: HE187000
 * Param: none
 * Description: Màn hình hiển thị danh sách thông báo của người dùng, hỗ trợ đánh dấu đã đọc
 */
export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marking, setMarking] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data);
    } catch (error: any) {
      console.log("Fetch notifications error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Author: Dương Trọng Lực - mssv: HE187000
   * Param: none
   * Description: Đánh dấu tất cả thông báo là đã đọc
   */
  const markAllRead = async () => {
    setMarking(true);
    try {
      await API.put("/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error: any) {
      console.log("Mark all read error:", error);
    } finally {
      setMarking(false);
    }
  };

  /**
   * Author: Dương Trọng Lực - mssv: HE187000
   * Param: id - ID thông báo cần đánh dấu đã đọc
   * Description: Đánh dấu một thông báo cụ thể là đã đọc khi người dùng nhấn vào
   */
  const markOneRead = async (id: string) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (error: any) {
      console.log("Mark read error:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchNotifications();
    }, [])
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${d.getFullYear()} ${d.getHours().toString().padStart(2, "0")}:${d
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
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
        <View style={styles.headerCenter}>
          <Text style={styles.title}>🔔 Thông Báo</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={markAllRead}
            disabled={marking}
          >
            <Text style={styles.markAllText}>
              {marking ? "..." : "Đọc tất cả"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchNotifications();
            }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔕</Text>
            <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
            onPress={() => !item.isRead && markOneRead(item._id)}
            activeOpacity={0.7}
          >
            <View style={styles.notifIcon}>
              <Text style={styles.notifIconText}>
                {TYPE_ICON[item.type] || "🔔"}
              </Text>
            </View>
            <View style={styles.notifContent}>
              <View style={styles.notifRow}>
                <Text
                  style={[
                    styles.notifTitle,
                    !item.isRead && styles.notifTitleUnread,
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                {!item.isRead && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.notifMessage} numberOfLines={2}>
                {item.message}
              </Text>
              <Text style={styles.notifDate}>{formatDate(item.createdAt)}</Text>
            </View>
          </TouchableOpacity>
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
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.headerBg,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: spacing.sm,
    ...shadows.lg,
  },
  backBtn: {
    marginRight: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  backBtnText: {
    color: "#FFFFFF",
    fontSize: fonts.sizes.sm,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    color: "#FFFFFF",
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.bold,
  },
  badge: {
    backgroundColor: colors.error,
    borderRadius: radius.full,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.xs,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: fonts.sizes.xs,
    fontWeight: fonts.weights.bold,
  },
  markAllBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  markAllText: {
    color: "#fff",
    fontSize: fonts.sizes.xs,
    fontWeight: fonts.weights.bold,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.base,
  },
  notifCard: {
    flexDirection: "row",
    backgroundColor: colors.cardBg,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  notifCardUnread: {
    borderLeftColor: colors.primary,
    backgroundColor: "#F0F9F3",
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.lightBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notifIconText: {
    fontSize: 18,
  },
  notifContent: {
    flex: 1,
  },
  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  notifTitle: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.bold,
    flex: 1,
  },
  notifTitleUnread: {
    color: colors.textPrimary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    marginLeft: spacing.xs,
  },
  notifMessage: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.sm,
    lineHeight: 18,
  },
  notifDate: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.xs,
    marginTop: 4,
    opacity: 0.7,
  },
});
