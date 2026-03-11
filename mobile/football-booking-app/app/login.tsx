import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import { colors, fonts, spacing, radius, shadows } from "@/constants/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg("Vui lòng nhập email và password");
      return;
    }

    setErrorMsg("");
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/(tabs)");
    } catch (error: any) {
      setErrorMsg(error || "Đăng nhập thất bại");
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
          <Text style={styles.title}>Đăng Nhập</Text>
          <Text style={styles.subtitle}>Truy cập tài khoản của bạn</Text>

          {/* Form */}
          <View style={styles.form}>
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

            {/* Remember Me */}
            <View style={styles.formGroup}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
                disabled={loading}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Ghi nhớ đăng nhập</Text>
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {errorMsg ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.textPrimary} />
              ) : (
                <Text style={styles.submitButtonText}>Đăng Nhập</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Links */}
          <View style={styles.footer}>
            <View style={styles.footerLink}>
              <Text style={styles.footerText}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.push("/register")} disabled={loading}>
                <Text style={styles.footerLinkText}>Đăng ký ngay</Text>
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
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing["2xl"],
  },
  brandSection: {
    alignItems: "center",
    marginBottom: spacing["4xl"],
  },
  logo: {
    fontSize: fonts.sizes["7xl"],
    marginBottom: spacing.lg,
  },
  brandName: {
    fontSize: fonts.sizes["3xl"],
    fontWeight: fonts.weights.bold,
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    paddingHorizontal: spacing["4xl"] * 0.8, // 40px
    paddingVertical: spacing["4xl"],
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.lg,
  },
  title: {
    fontSize: fonts.sizes["3xl"],
    fontWeight: fonts.weights.bold,
    textAlign: "center",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fonts.sizes.sm,
    textAlign: "center",
    color: colors.textSecondary,
    marginBottom: spacing["3xl"],
  },
  form: {
    marginBottom: spacing["3xl"],
  },
  formGroup: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.semibold,
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },
  input: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.cardOverlay,
    color: colors.textPrimary,
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.semibold,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.darkBg,
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.bold,
  },
  checkboxLabel: {
    fontSize: fonts.sizes.sm,
    color: colors.textPrimary,
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: "rgba(244, 67, 54, 0.3)",
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
  },
  errorText: {
    color: colors.error,
    fontSize: fonts.sizes.sm,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.textPrimary,
    fontSize: fonts.sizes.base,
    fontWeight: fonts.weights.bold,
  },
  footer: {
    marginTop: spacing["3xl"],
    alignItems: "center",
    gap: spacing.lg,
  },
  footerLink: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
  },
  footerLinkText: {
    fontSize: fonts.sizes.sm,
    color: colors.primary,
    fontWeight: fonts.weights.semibold,
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
