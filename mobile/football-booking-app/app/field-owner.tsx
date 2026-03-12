import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  RefreshControl,
  Image,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import API, { getImageUrl } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { router, useFocusEffect } from "expo-router";
import { colors, fonts, spacing, radius, shadows } from "@/constants/theme";

interface Field {
  _id: string;
  name: string;
  location: string;
  type: string;
  pricePerHour: number;
  isActive: boolean;
  owner: string;
}

interface FieldBooking {
  _id: string;
  orderCode?: string;
  user?: { name: string; email: string };
  field?: { name: string; location: string };
  date: string;
  startHour: number;
  endHour: number;
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled";
  paymentStatus: string;
}

export default function FieldOwnerPanel() {
  const [activeTab, setActiveTab] = useState<"fields" | "bookings">("fields");
  const [fields, setFields] = useState<Field[]>([]);
  const [fieldBookings, setFieldBookings] = useState<FieldBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [processingBooking, setProcessingBooking] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    type: "Sân 5",
    pricePerHour: "0",
  });
  const [selectedImage, setSelectedImage] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  const { token, logout, user } = useAuth();

  const fetchFields = async () => {
    try {
      // Get all fields, then filter by owner
      const response = await API.get("/fields");
      const allFields = response.data;
      const ownerFields = allFields.filter((field: Field) => field.owner === user?.id);
      setFields(ownerFields);
    } catch (error: any) {
      console.log("Fetch fields error:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách sân");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Author: Dương Trọng Lực - mssv: HE187000
   * Param: none
   * Description: Lấy tất cả booking của các sân mà field owner đang quản lý
   */
  const fetchFieldBookings = async () => {
    try {
      const res = await API.get("/bookings/field-owner-bookings");
      setFieldBookings(res.data);
    } catch (error: any) {
      console.log("Fetch field bookings error:", error);
    }
  };

  /**
   * Author: Dương Trọng Lực - mssv: HE187000
   * Param: bookingId - ID booking cần duyệt/từ chối
   * Description: Approve hoặc reject booking từ field owner panel
   */
  const handleBookingAction = async (bookingId: string, action: "approve" | "reject") => {
    setProcessingBooking(bookingId);
    try {
      await API.put(`/bookings/${bookingId}/${action}`);
      Alert.alert(
        "Thành công",
        action === "approve" ? "Đã xác nhận booking" : "Đã từ chối booking"
      );
      fetchFieldBookings();
    } catch (error: any) {
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể thực hiện");
    } finally {
      setProcessingBooking(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!token || (user?.role !== "fieldOwner" && user?.role !== "admin")) {
        Alert.alert("Lỗi", "Bạn không có quyền truy cập");
        router.replace("/(tabs)");
        return;
      }
      fetchFields();
      fetchFieldBookings();
    }, [token, user])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFields();
  };

  const openModal = (field?: Field) => {
    if (field) {
      setEditingField(field);
      setFormData({
        name: field.name,
        location: field.location,
        type: field.type,
        pricePerHour: field.pricePerHour.toString(),
      });
    } else {
      setEditingField(null);
      setFormData({
        name: "",
        location: "",
        type: "Sân 5",
        pricePerHour: "0",
      });
    }
    setSelectedImage(null);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingField(null);
    setSelectedImage(null);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setSelectedImage({
          uri: asset.uri,
          name: asset.fileName || "image.jpg",
          type: asset.type === "image" ? "image/jpeg" : "image/png",
        });
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể chọn ảnh");
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.location || !formData.pricePerHour) {
      Alert.alert("Lỗi", "Vui lòng điền tất cả thông tin");
      return;
    }

    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("location", formData.location);
      formDataToSend.append("type", formData.type);
      formDataToSend.append("pricePerHour", formData.pricePerHour);

      if (selectedImage) {
        if (Platform.OS === "web") {
          const imgResponse = await fetch(selectedImage.uri);
          const blob = await imgResponse.blob();
          formDataToSend.append("image", blob, selectedImage.name || "image.jpg");
        } else {
          formDataToSend.append("image", {
            uri: selectedImage.uri,
            type: selectedImage.type || "image/jpeg",
            name: selectedImage.name || "image.jpg",
          } as any);
        }
      }

      const endpoint = editingField ? `/api/fields/${editingField._id}` : "/api/fields";
      const method = editingField ? "PUT" : "POST";

      const tokenStr = await AsyncStorage.getItem("token");
      const serverURL = (API.defaults.baseURL || "http://localhost:5000/api").replace("/api", "");

      const response = await fetch(`${serverURL}${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${tokenStr}`,
        },
        body: formDataToSend as any,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      Alert.alert(
        "Thành công",
        editingField ? "Sân bóng đã được cập nhật" : "Sân bóng mới đã được tạo"
      );
      closeModal();
      fetchFields();
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const performDelete = (fieldId: string) => {
    console.log("🗑️ FieldOwner deleting field:", fieldId);
    API.delete(`/fields/${fieldId}`)
      .then(() => {
        console.log("✅ Delete success");
        Alert.alert("Thành công", "Sân bóng đã được xóa");
        fetchFields();
      })
      .catch((error: any) => {
        console.error("❌ Delete error status:", error.response?.status);
        console.error("❌ Delete error data:", JSON.stringify(error.response?.data));
        const errorMsg = error.response?.data?.message || error.message || "Không thể xóa";
        Alert.alert("Lỗi", errorMsg);
      });
  };

  const handleDelete = (fieldId: string) => {
    if (Platform.OS === "web") {
      if (window.confirm("Bạn chắc chắn muốn xóa sân này?")) {
        performDelete(fieldId);
      }
      return;
    }
    Alert.alert(
      "Xác nhận xóa",
      "Bạn chắc chắn muốn xóa sân này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => { performDelete(fieldId); },
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🏆 Sân Của Tôi</Text>
          <Text style={styles.subtitle}>Quản lý sân bóng của bạn</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          disabled={isLoggingOut}
          onPress={async () => {
            setIsLoggingOut(true);
            try {
              await logout();
              router.replace("/login");
            } catch (error: any) {
              console.error("Logout error:", error);
              Alert.alert("Lỗi", "Đăng xuất thất bại. Vui lòng thử lại");
              setIsLoggingOut(false);
            }
          }}
        >
          <Text style={styles.logoutText}>
            {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "fields" && styles.tabBtnActive]}
          onPress={() => setActiveTab("fields")}
        >
          <Text style={[styles.tabBtnText, activeTab === "fields" && styles.tabBtnTextActive]}>
            🏟️ Sân Của Tôi
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "bookings" && styles.tabBtnActive]}
          onPress={() => setActiveTab("bookings")}
        >
          <Text style={[styles.tabBtnText, activeTab === "bookings" && styles.tabBtnTextActive]}>
            📋 Đơn Đặt Sân {fieldBookings.filter((b) => b.status === "pending").length > 0
              ? `(${fieldBookings.filter((b) => b.status === "pending").length})`
              : ""}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab: Fields */}
      {activeTab === "fields" && (
        <>
          {/* Add Button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => openModal()}
          >
            <Text style={styles.addButtonText}>+ Thêm Sân Mới</Text>
          </TouchableOpacity>

          {/* Fields List */}
          {fields.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Bạn chưa có sân bóng nào</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => openModal()}
              >
                <Text style={styles.emptyButtonText}>Tạo sân đầu tiên</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={fields}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ paddingBottom: 20 }}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
              renderItem={({ item }) => (
                <View style={styles.card}>
                  {item.image && (
                    <Image
                      source={{ uri: getImageUrl(item.image) || undefined }}
                      style={styles.cardImage}
                    />
                  )}
                  <View style={styles.cardContent}>
                    <Text style={styles.fieldName}>{item.name}</Text>
                    <Text style={styles.fieldInfo}>📍 {item.location}</Text>
                    <Text style={styles.fieldInfo}>🏅 {item.type}</Text>
                    <Text style={styles.priceInfo}>
                      💰 {item.pricePerHour.toLocaleString()}đ / giờ
                    </Text>
                    <View style={styles.statusContainer}>
                      <Text style={styles.statusText}>
                        {item.isActive ? "✅ Đang hoạt động" : "⛔ Tạm dừng"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openModal(item)}
                    >
                      <Text style={styles.editText}>Sửa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(item._id)}
                    >
                      <Text style={styles.deleteText}>Xóa</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </>
      )}

      {/* Tab: Bookings */}
      {activeTab === "bookings" && (
        <FlatList
          data={fieldBookings}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFieldBookings().finally(() => setRefreshing(false)); }} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có đơn đặt sân nào</Text>
            </View>
          }
          renderItem={({ item }) => {
            const statusColor = item.status === "confirmed" ? "#4CAF50" : item.status === "cancelled" ? "#EF5350" : "#FFA726";
            const parts = item.date?.substring(0, 10).split("-") ?? [];
            const dateStr = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : item.date;
            return (
              <View style={[styles.bookingCard, { borderLeftColor: statusColor }]}>
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingField}>{item.field?.name || "—"}</Text>
                  <View style={[styles.bookingBadge, { backgroundColor: statusColor }]}>
                    <Text style={styles.bookingBadgeText}>
                      {item.status === "confirmed" ? "Đã xác nhận" : item.status === "cancelled" ? "Đã hủy" : "Chờ duyệt"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.bookingInfo}>👤 {item.user?.name || "—"} • {item.user?.email || ""}</Text>
                <Text style={styles.bookingInfo}>📅 {dateStr} • {item.startHour}:00 - {item.endHour}:00</Text>
                <Text style={styles.bookingPrice}>💰 {item.totalPrice?.toLocaleString()}đ</Text>
                <Text style={styles.bookingCode}>#{item.orderCode || item._id}</Text>

                {item.status === "pending" && (
                  <View style={styles.bookingActions}>
                    <TouchableOpacity
                      style={[styles.approveBtn, processingBooking === item._id && { opacity: 0.6 }]}
                      disabled={processingBooking === item._id}
                      onPress={() => handleBookingAction(item._id, "approve")}
                    >
                      {processingBooking === item._id
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={styles.actionBtnText}>✅ Xác nhận</Text>
                      }
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.rejectBtn, processingBooking === item._id && { opacity: 0.6 }]}
                      disabled={processingBooking === item._id}
                      onPress={() => handleBookingAction(item._id, "reject")}
                    >
                      <Text style={styles.actionBtnText}>❌ Từ chối</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingField ? "Sửa Sân Bóng" : "Thêm Sân Bóng Mới"}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>Tên Sân:</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên sân"
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
                editable={!submitting}
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.label}>Địa Chỉ:</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập địa chỉ"
                value={formData.location}
                onChangeText={(text) =>
                  setFormData({ ...formData, location: text })
                }
                editable={!submitting}
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.label}>Loại Sân:</Text>
              <View style={styles.typeButtons}>
                {["Sân 5", "Sân 7", "Sân 11"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      formData.type === type && styles.typeButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, type })}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        formData.type === type && styles.typeButtonTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Giá (đ/giờ):</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập giá"
                value={formData.pricePerHour}
                onChangeText={(text) =>
                  setFormData({ ...formData, pricePerHour: text })
                }
                keyboardType="numeric"
                editable={!submitting}
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.label}>Ảnh Sân:</Text>
              {selectedImage && (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: selectedImage.uri }}
                    style={styles.imagePreview}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setSelectedImage(null)}
                  >
                    <Text style={styles.removeImageText}>✕ Xóa ảnh</Text>
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity
                style={styles.imagePicker}
                onPress={pickImage}
                disabled={submitting}
              >
                <Text style={styles.imagePickerText}>📷 Chọn ảnh</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {editingField ? "Cập Nhật" : "Tạo Mới"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.darkBg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    fontSize: fonts.sizes.lg,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  emptyButtonText: {
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold,
    fontSize: fonts.sizes.md,
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
  title: {
    fontSize: fonts.sizes["2xl"],
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.sm,
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
  addButton: {
    backgroundColor: colors.success,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: "center",
    ...shadows.md,
  },
  addButtonText: {
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold,
    fontSize: fonts.sizes.md,
  },
  card: {
    backgroundColor: colors.cardBg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  cardImage: {
    width: "100%",
    height: 180,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.darkBg,
  },
  cardContent: {
    marginBottom: spacing.md,
  },
  fieldName: {
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  fieldInfo: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  priceInfo: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.semibold,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  statusContainer: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.darkBg,
    borderRadius: radius.md,
  },
  statusText: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    fontWeight: fonts.weights.semibold,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  editText: {
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  deleteText: {
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.lg,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
  },
  closeButton: {
    fontSize: fonts.sizes.xl,
    color: colors.textSecondary,
  },
  form: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  label: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.semibold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.darkBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  typeButtons: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  typeButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    color: colors.textSecondary,
    fontWeight: fonts.weights.semibold,
  },
  typeButtonTextActive: {
    color: colors.textPrimary,
  },
  imagePreviewContainer: {
    marginBottom: spacing.md,
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    backgroundColor: colors.darkBg,
  },
  removeImageButton: {
    backgroundColor: colors.error,
    padding: spacing.sm,
    alignItems: "center",
  },
  removeImageText: {
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold,
    fontSize: fonts.sizes.xs,
  },
  imagePicker: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  imagePickerText: {
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
  },
  cancelButtonText: {
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold,
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold,
  },
  // --- Booking Tab Styles ---
  tabRow: {
    flexDirection: "row",
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabBtnText: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.semibold,
  },
  tabBtnTextActive: {
    color: "#fff",
  },
  bookingCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  bookingField: {
    color: colors.textPrimary,
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.bold,
    flex: 1,
    marginRight: 8,
  },
  bookingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  bookingBadgeText: {
    color: "#fff",
    fontSize: fonts.sizes.xs,
    fontWeight: fonts.weights.bold,
  },
  bookingInfo: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.sm,
    marginTop: 2,
  },
  bookingPrice: {
    color: colors.primary,
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.bold,
    marginTop: 4,
  },
  bookingCode: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.xs,
    marginTop: 2,
  },
  bookingActions: {
    flexDirection: "row",
    marginTop: spacing.sm,
    gap: 8,
  },
  approveBtn: {
    flex: 1,
    backgroundColor: colors.success,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: colors.error,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: fonts.weights.bold,
    fontSize: fonts.sizes.sm,
  },
});
