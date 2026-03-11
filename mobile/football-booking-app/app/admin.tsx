import React, { useState, useEffect } from "react";
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
} from "react-native";
import API from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
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

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    type: "Sân 5",
    pricePerHour: "0",
  });

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
      if (!token || user?.role !== "admin") {
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
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingField(null);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.location || !formData.pricePerHour) {
      Alert.alert("Lỗi", "Vui lòng điền tất cả thông tin");
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        name: formData.name,
        location: formData.location,
        type: formData.type,
        pricePerHour: parseInt(formData.pricePerHour),
      };

      if (editingField) {
        // Update
        await API.put(`/fields/${editingField._id}`, data);
        Alert.alert("Thành công", "Sân bóng đã được cập nhật");
      } else {
        // Create
        await API.post("/fields", data);
        Alert.alert("Thành công", "Sân bóng mới đã được tạo");
      }

      closeModal();
      fetchFields();
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Có lỗi xảy ra"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (fieldId: string) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn chắc chắn muốn xóa sân này?",
      [
        { text: "Hủy", onPress: () => {} },
        {
          text: "Xóa",
          onPress: async () => {
            try {
              await API.delete(`/fields/${fieldId}`);
              Alert.alert("Thành công", "Sân bóng đã được xóa");
              fetchFields();
            } catch (error: any) {
              Alert.alert("Lỗi", error.response?.data?.message || "Không thể xóa");
            }
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>⚙️ Quản Lý Sân Bóng</Text>
          <Text style={styles.subtitle}>Admin Panel</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            await logout();
            router.replace("/login");
          }}
        >
          <Text style={styles.logoutText}>Đăng xuất</Text>
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
              />
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    ...shadows.lg,
  },
  cardContent: {
    flex: 1,
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
  },
  editButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  editText: {
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold,
    fontSize: fonts.sizes.xs,
  },
  deleteButton: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  deleteText: {
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold,
    fontSize: fonts.sizes.xs,
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
