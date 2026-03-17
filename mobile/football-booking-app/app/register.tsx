import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import { colors, fonts, spacing, radius, shadows } from "@/constants/theme";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedRole, setSelectedRole] = useState<"user" | "fieldOwner" | null>(null);
  const { register } = useAuth();

  const handleRegister = async (role: "user" | "fieldOwner") => {
    if (!name || !email || !password || !confirmPassword) {
      setErrorMsg("Vui lòng điền tất cả các trường");
      return;
    }

    if (!agree) {
      setErrorMsg("Vui lòng đồng ý với điều khoản sử dụng");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Mật khẩu không trùng khớp");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setErrorMsg("");
    setLoading(true);
    try {
      await register(name, email, password, role);
      router.replace("/login");
    } catch (error: any) {
      setErrorMsg(error || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Brand Section */}
        <View style={styles.brandSection}>
          <Text style={styles.logo}>⚽</Text>
          <Text style={styles.brandName}>LucHTSportBooking</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Title Section */}
          <Text style={styles.title}>Đăng Ký</Text>
          <Text style={styles.subtitle}>Tạo tài khoản mới</Text>

          {/* Form */}
          <View style={styles.form}>
            {/* Name Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tên</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên..."
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
                editable={!loading}
              />
            </View>

            {/* Email Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập email..."
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Mật khẩu</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu..."
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            {/* Confirm Password Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Xác nhận mật khẩu</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập lại mật khẩu..."
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            {/* Agree Terms */}
            <View style={styles.formGroup}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setAgree(!agree)}
                disabled={loading}
              >
                <View style={[styles.checkbox, agree && styles.checkboxChecked]}>
                  {agree && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Tôi đồng ý với điều khoản sử dụng</Text>
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {errorMsg ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Role Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Bạn muốn đăng ký là?</Text>
              <Text style={styles.roleHint}>Chọn một trong hai lựa chọn bên dưới</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    selectedRole === "user" && styles.roleButtonActive,
                  ]}
                  onPress={() => setSelectedRole("user")}
                  disabled={loading}
                >
                  <Text style={styles.roleIcon}>👤</Text>
                  <Text
                    style={[
                      styles.roleButtonText,
                      selectedRole === "user" && styles.roleButtonTextActive,
                    ]}
                  >
                    Người Dùng
                  </Text>
                  <Text style={styles.roleDesc}>Đặt sân bóng</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    selectedRole === "fieldOwner" && styles.roleButtonActive,
                  ]}
                  onPress={() => setSelectedRole("fieldOwner")}
                  disabled={loading}
                >
                  <Text style={styles.roleIcon}>🏆</Text>
                  <Text
                    style={[
                      styles.roleButtonText,
                      selectedRole === "fieldOwner" && styles.roleButtonTextActive,
                    ]}
                  >
                    Chủ Sân
                  </Text>
                  <Text style={styles.roleDesc}>Quản lý sân</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Buttons */}
            <View style={styles.submitButtonsContainer}>
              {selectedRole === "user" && (
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={() => handleRegister("user")}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.textPrimary} />
                  ) : (
                    <Text style={styles.submitButtonText}>Đăng Ký Người Dùng</Text>
                  )}
                </TouchableOpacity>
              )}

              {selectedRole === "fieldOwner" && (
                <TouchableOpacity
                  style={[styles.submitButton, styles.submitButtonFieldOwner, loading && styles.submitButtonDisabled]}
                  onPress={() => handleRegister("fieldOwner")}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.textPrimary} />
                  ) : (
                    <Text style={styles.submitButtonText}>Đăng Ký Chủ Sân</Text>
                  )}
                </TouchableOpacity>
              )}

              {!selectedRole && (
                <TouchableOpacity
                  style={[styles.submitButton, styles.submitButtonDisabled]}
                  disabled
                >
                  <Text style={styles.submitButtonText}>Vui lòng chọn vai trò</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Footer Links */}
          <View style={styles.footer}>
            <View style={styles.footerLink}>
              <Text style={styles.footerText}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.push("/login")} disabled={loading}>
                <Text style={styles.footerLinkText}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => router.push("/")} disabled={loading}>
              <Text style={styles.backLink}>← Quay lại trang chủ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing["3xl"],
  },
  brandSection: {
    alignItems: "center",
    backgroundColor: colors.headerBg,
    marginHorizontal: -spacing.lg,
    marginTop: -spacing["3xl"],
    paddingTop: 50,
    paddingBottom: 32,
    marginBottom: spacing["2xl"],
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logo: {
    fontSize: 56,
    marginBottom: spacing.sm,
  },
  brandName: {
    fontSize: fonts.sizes.xl,
    fontWeight: fonts.weights.extrabold,
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing["2xl"],
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.lg,
  },
  title: {
    fontSize: fonts.sizes["2xl"],
    fontWeight: fonts.weights.extrabold,
    textAlign: "center",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fonts.sizes.sm,
    textAlign: "center",
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  form: {
    marginBottom: spacing.xl,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.semibold,
    marginBottom: spacing.sm,
    color: colors.textPrimary,
  },
  input: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.inputBg,
    color: colors.textPrimary,
    fontSize: fonts.sizes.base,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.cardBg,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: fonts.weights.bold,
  },
  checkboxLabel: {
    fontSize: fonts.sizes.sm,
    color: colors.textPrimary,
    flex: 1,
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.3)",
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: fonts.sizes.sm,
    textAlign: "center",
    fontWeight: fonts.weights.semibold,
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  submitButtonDisabled: {
    opacity: 0.55,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.bold,
    letterSpacing: 0.4,
  },
  submitButtonFieldOwner: {
    backgroundColor: "#E8613C",
  },
  submitButtonsContainer: {
    marginTop: spacing.md,
  },
  roleHint: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  roleButtons: {
    flexDirection: "row",
    gap: spacing.md,
  },
  roleButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardBg,
  },
  roleButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.lightBg,
  },
  roleIcon: {
    fontSize: fonts.sizes["3xl"],
    marginBottom: spacing.sm,
  },
  roleButtonText: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  roleButtonTextActive: {
    color: colors.primary,
  },
  roleDesc: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    textAlign: "center",
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  footerLink: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
  },
  footerLinkText: {
    fontSize: fonts.sizes.sm,
    color: colors.primary,
    fontWeight: fonts.weights.bold,
  },
  footerText: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
  },
  backLink: {
    fontSize: fonts.sizes.sm,
    color: colors.primary,
    fontWeight: fonts.weights.semibold,
  },
});
