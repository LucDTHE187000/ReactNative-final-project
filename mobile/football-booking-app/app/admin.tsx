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
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
}

export default function AdminPanel() {
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
      const response = await API.get("/fields");
      setFields(response.data);
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
      if (!token || (user?.role !== "admin")) {
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
        mediaTypes: ["images"],
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.error("Image picker error:", error);
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

      // Append image if selected
      if (selectedImage) {
        console.log("📸 Appending image:", selectedImage);
        formDataToSend.append("image", {
          uri: selectedImage.uri,
          type: selectedImage.type || "image/jpeg",
          name: selectedImage.name || "image.jpg",
        } as any);
      }

      const endpoint = editingField ? `/fields/${editingField._id}` : "/fields";
      const method = editingField ? "PUT" : "POST";

      console.log(`🚀 Uploading via ${method} to ${endpoint}`);

      // Get token từ AsyncStorage để dùng với fetch API
      const token = await AsyncStorage.getItem("token");
      
      // Get API base URL
      const apiBaseURL = (API.defaults.baseURL || "http://localhost:5000/api").replace("/api", "");
      
      const response = await fetch(`${apiBaseURL}${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          // NOT setting Content-Type - let native set it with boundary
        },
        body: formDataToSend as any,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Upload success:", result);

      Alert.alert(
        "Thành công",
        editingField ? "Sân bóng đã được cập nhật" : "Sân bóng mới đã được tạo"
      );
      closeModal();
      fetchFields();
    } catch (error: any) {
      console.error("❌ Upload error:", error.message);
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
          <Text style={styles.title}>⚙️ Quản Lý Sân Bóng</Text>
          <Text style={styles.subtitle}>Admin Panel</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          disabled={isLoggingOut}
          onPress={async () => {
            setIsLoggingOut(true);
            try {
              await logout();
              // Navigation sẽ được handle bởi AuthContext
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
    marginVertical: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
  },
  addButtonText: {
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold,
    fontSize: fonts.sizes.base,
  },
  card: {
    backgroundColor: colors.cardBg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.lg,
  },
  cardImage: {
    width: "100%",
    height: 180,
    backgroundColor: colors.darkBg,
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  fieldName: {
    fontSize: fonts.sizes.base,
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  fieldInfo: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  priceInfo: {
    fontSize: fonts.sizes.sm,
    color: colors.primary,
    fontWeight: fonts.weights.bold,
    marginTop: spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  editText: {
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold,
    fontSize: fonts.sizes.sm,
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
    fontSize: fonts.sizes.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "90%",
    paddingBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
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
    fontSize: fonts.sizes["2xl"],
    color: colors.textSecondary,
  },
  form: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  label: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fonts.sizes.base,
    backgroundColor: colors.cardOverlay,
    color: colors.textPrimary,
  },
  typeButtons: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  typeButtonActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  typeButtonText: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.bold,
    color: colors.textSecondary,
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
    backgroundColor: colors.secondary,
    paddingVertical: spacing.lg,
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
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
  },
  cancelButtonText: {
    fontWeight: fonts.weights.semibold,
    color: colors.textSecondary,
    fontSize: fonts.sizes.sm,
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.secondary,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
    fontSize: fonts.sizes.sm,
  },
});
