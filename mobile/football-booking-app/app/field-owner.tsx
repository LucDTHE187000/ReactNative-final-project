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

export default function FieldOwnerPanel() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  useFocusEffect(
    useCallback(() => {
      if (!token || (user?.role !== "fieldOwner" && user?.role !== "admin")) {
        Alert.alert("Lỗi", "Bạn không có quyền truy cập");
        router.replace("/(tabs)");
        return;
      }
      fetchFields();
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
        formDataToSend.append("image", {
          uri: selectedImage.uri,
          type: selectedImage.type || "image/jpeg",
          name: selectedImage.name || "image.jpg",
        } as any);
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
    API.delete(`/fields/${fieldId}`)
      .then(() => {
        Alert.alert("Thành công", "Sân bóng đã được xóa");
        fetchFields();
      })
      .catch((error: any) => {
        console.error("Delete error:", error);
        const errorMsg = error.response?.data?.message || error.message || "Không thể xóa";
        Alert.alert("Lỗi", errorMsg);
      });
  };

  const handleDelete = (fieldId: string) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn chắc chắn muốn xóa sân này?",
      [
        { text: "Hủy", onPress: () => {} },
        {
          text: "Xóa",
          onPress: () => performDelete(fieldId),
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
});
