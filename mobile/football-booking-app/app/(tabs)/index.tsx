import { router } from "expo-router";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
  TextInput,
  RefreshControl,
  Image,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import API, { getImageUrl } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { colors, fonts, spacing, radius, shadows } from "@/constants/theme";

interface Field {
  _id: string;
  name: string;
  type: string;
  pricePerHour: number;
  location: string;
  image?: string;
  description?: string;
  capacity?: number;
  rating?: number;
  reviewCount?: number;
}

export default function HomeScreen() {
  const [allFields, setAllFields] = useState<Field[]>([]);
  const [filteredFields, setFilteredFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchLocation, setSearchLocation] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const { token, logout, user } = useAuth();

  const fetchFields = async () => {
    try {
      const response = await API.get("/fields");
      const footballFields = response.data.filter(
        (field: Field) =>
          field.type === "Sân 5" || field.type === "Sân 7" || field.type === "Sân 11"
      );
      setAllFields(footballFields);
      setFilteredFields(footballFields);
    } catch (error: any) {
      console.log("Fetch fields error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchFields();
  }, [token]);

  useEffect(() => {
    let filtered = allFields;
    if (searchLocation.trim()) {
      filtered = filtered.filter((field) =>
        field.location.toLowerCase().includes(searchLocation.toLowerCase()) ||
        field.name.toLowerCase().includes(searchLocation.toLowerCase())
      );
    }
    if (typeFilter) {
      filtered = filtered.filter((field) => field.type === typeFilter);
    }
    if (priceMin !== "") {
      const min = Number(priceMin);
      filtered = filtered.filter((field) => field.pricePerHour >= min);
    }
    if (priceMax !== "") {
      const max = Number(priceMax);
      filtered = filtered.filter((field) => field.pricePerHour <= max);
    }
    setFilteredFields(filtered);
  }, [searchLocation, typeFilter, priceMin, priceMax, allFields]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFields();
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (error: any) {
      console.error("Logout error:", error);
      Alert.alert("Lỗi", "Đăng xuất thất bại");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Navbar */}
      <View style={styles.navbar}>
        <View>
          <Text style={styles.logo}>⚽ LucHTSportBooking</Text>
        </View>
        <View style={styles.navButtons}>
          {user?.role === "admin" && (
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.push("/admin")}
            >
              <Text style={styles.navButtonText}>⚙️ Admin</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.navButton} onPress={handleLogout}>
            <Text style={styles.navButtonText}>🚪 Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>
          Đặt Sân Bóng <Text style={styles.heroHighlight}>Theo Thời Gian Thực</Text>
        </Text>
        <Text style={styles.heroSubtitle}>Nhanh - Tiện Lợi - Giá Hợp Lý - Thanh Toán Online</Text>

        <View style={styles.heroButtons}>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => {
            // Scroll xuống danh sách sân (native không có document, nên đơn giản focus search)
          }}>
            <Text style={styles.btnText}>🔍 Tìm sân ngay</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={() => router.push("/(tabs)/bookings")}>
            <Text style={styles.btnSecondaryText}>📅 Xem lịch đặt</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>⚽</Text>
          <Text style={styles.statNumber}>10+</Text>
          <Text style={styles.statLabel}>Sân bóng</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>👥</Text>
          <Text style={styles.statNumber}>10K+</Text>
          <Text style={styles.statLabel}>Khách hàng</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>⭐</Text>
          <Text style={styles.statNumber}>5K+</Text>
          <Text style={styles.statLabel}>Bài đánh giá</Text>
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Tại Sao Chọn Chúng Tôi</Text>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>⏱️</Text>
          <Text style={styles.featureTitle}>Đặt sân nhanh chóng</Text>
          <Text style={styles.featureDesc}>Chỉ cần vài click để đặt sân trong vòng 24/7</Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>📍</Text>
          <Text style={styles.featureTitle}>Nhiều địa điểm</Text>
          <Text style={styles.featureDesc}>Hơn 50 sân bóng tại các quận trung tâm TP HCM</Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>💳</Text>
          <Text style={styles.featureTitle}>Thanh toán online</Text>
          <Text style={styles.featureDesc}>Thanh toán VNPAY an toàn, nhanh chóng, tiện lợi</Text>
        </View>
      </View>

      {/* Fields Section */}
      <View style={styles.fieldsSection}>
        <Text style={styles.sectionTitle}>Danh Sách Sân Bóng</Text>

        {/* Search Bar + Type Filter */}
        <View style={styles.filterRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Tìm sân hoặc địa điểm..."
            placeholderTextColor={colors.textSecondary}
            value={searchLocation}
            onChangeText={setSearchLocation}
          />
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={typeFilter}
              onValueChange={(val) => setTypeFilter(val)}
              style={styles.picker}
              dropdownIconColor={colors.textSecondary}
            >
              <Picker.Item label="Tất cả" value="" color="#ed1919" />
              <Picker.Item label="Sân 5" value="Sân 5" color="#0adb3b" />
              <Picker.Item label="Sân 7" value="Sân 7" color="#5ec0e3" />
              <Picker.Item label="Sân 11" value="Sân 11" color="#cadf0c" />
            </Picker>
          </View>
        </View>

        {/* Price Range Filter */}
        <View style={styles.priceFilterRow}>
          <Text style={styles.priceFilterLabel}>💰 Giá (đ/giờ):</Text>
          <TextInput
            style={styles.priceInput}
            placeholder="Tối thiểu"
            placeholderTextColor={colors.textSecondary}
            value={priceMin}
            onChangeText={setPriceMin}
            keyboardType="numeric"
          />
          <Text style={styles.priceSep}>—</Text>
          <TextInput
            style={styles.priceInput}
            placeholder="Tối đa"
            placeholderTextColor={colors.textSecondary}
            value={priceMax}
            onChangeText={setPriceMax}
            keyboardType="numeric"
          />
          {(priceMin !== "" || priceMax !== "") && (
            <TouchableOpacity
              style={styles.priceClearBtn}
              onPress={() => { setPriceMin(""); setPriceMax(""); }}
            >
              <Text style={styles.priceClearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Fields List */}
        {filteredFields.length > 0 ? (
          filteredFields.map((field) => (
            <TouchableOpacity
              key={field._id}
              style={styles.fieldCard}
              onPress={() => router.push(`/booking/${field._id}`)}
              activeOpacity={0.8}
            >
              {/* Field Image */}
              {field.image ? (
                <Image
                  source={{ uri: getImageUrl(field.image) || undefined }}
                  style={styles.fieldImage}
                />
              ) : (
                <View style={[styles.fieldImage, styles.placeholderImage]}>
                  <Text style={styles.placeholderText}>⚽</Text>
                </View>
              )}

              {/* Field Info */}
              <View style={styles.fieldInfo}>
                {/* Type Badge */}
                <View style={styles.fieldType}>
                  <Text style={styles.fieldTypeText}>{field.type}</Text>
                </View>

                {/* Name */}
                <Text style={styles.fieldName}>{field.name}</Text>

                {/* Location */}
                <Text style={styles.fieldLocation}>📍 {field.location}</Text>

                {/* Rating & Price */}
                <View style={styles.fieldFooter}>
                  <View style={styles.ratingContainer}>
                    <Text style={styles.stars}>
                      {"⭐".repeat(Math.floor(field.rating || 5))}
                    </Text>
                    <Text style={styles.ratingCount}>({field.reviewCount || 0})</Text>
                  </View>
                  <View style={styles.priceBox}>
                    <Text style={styles.price}>
                      {(field.pricePerHour / 1000).toFixed(0)}k
                    </Text>
                    <Text style={styles.priceUnit}>/giờ</Text>
                  </View>
                </View>

                {/* Book Button */}
                <TouchableOpacity
                  style={styles.bookBtn}
                  onPress={() => router.push(`/booking/${field._id}`)}
                >
                  <Text style={styles.bookBtnText}>Đặt Sân</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>😔 Không tìm thấy sân nào</Text>
            <Text style={styles.emptySubtext}>Vui lòng thử lại với địa điểm khác</Text>
          </View>
        )}
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Sẵn sàng đặt sân?</Text>
        <Text style={styles.ctaSubtitle}>Tham gia hàng nghìn người dùng hạnh phúc!</Text>
          <TouchableOpacity style={styles.ctaButton} onPress={() => router.push(`/booking/${filteredFields[0]?._id || ""}`)}>
          <Text style={styles.ctaBtnText}>Bắt đầu ngay</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 LucHTSportBooking. All rights reserved.</Text>
      </View>
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

  // Navbar
  navbar: {
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: {
    fontSize: fonts.sizes["2xl"],
    fontWeight: fonts.weights.bold,
    color: colors.primary,
  },
  navButtons: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  navButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.md,
  },
  navButtonText: {
    color: colors.primary,
    fontWeight: fonts.weights.semibold,
    fontSize: fonts.sizes.sm,
  },

  // Hero Section
  hero: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing["5xl"],
    alignItems: "center",
  },
  heroTitle: {
    fontSize: fonts.sizes["5xl"],
    fontWeight: fonts.weights.extrabold,
    textAlign: "center",
    color: colors.textPrimary,
    marginBottom: spacing.xl,
    lineHeight: 48 * 1.2,
  },
  heroHighlight: {
    color: colors.primary,
    fontWeight: fonts.weights.extrabold,
  },
  heroSubtitle: {
    fontSize: fonts.sizes.xl,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing["4xl"],
  },
  heroButtons: {
    flexDirection: "row",
    gap: spacing.xl,
    marginTop: spacing.xl,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
  },
  btnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.primary,
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
  },
  btnText: {
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold,
    fontSize: fonts.sizes.base,
  },
  btnSecondaryText: {
    color: colors.primary,
    fontWeight: fonts.weights.bold,
    fontSize: fonts.sizes.base,
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing["5xl"],
    flexDirection: "row",
    justifyContent: "space-around",
    gap: spacing.lg,
  },
  statCard: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing["3xl"],
    alignItems: "center",
    flex: 1,
    ...shadows.lg,
  },
  statIcon: {
    fontSize: fonts.sizes["7xl"],
    marginBottom: spacing.lg,
  },
  statNumber: {
    fontSize: fonts.sizes["7xl"],
    fontWeight: fonts.weights.extrabold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  statLabel: {
    fontSize: fonts.sizes.base,
    color: colors.textSecondary,
    textAlign: "center",
  },

  // Features Section
  featuresSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing["5xl"],
  },
  sectionTitle: {
    fontSize: fonts.sizes["4xl"],
    fontWeight: fonts.weights.bold,
    textAlign: "center",
    color: colors.textPrimary,
    marginBottom: spacing["4xl"],
  },
  featureCard: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing["3xl"],
    alignItems: "center",
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  featureIcon: {
    fontSize: fonts.sizes["7xl"],
    marginBottom: spacing.lg,
  },
  featureTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  featureDesc: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },

  // Fields Section
  fieldsSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing["4xl"],
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.cardOverlay,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    color: colors.textPrimary,
    fontSize: fonts.sizes.base,
  },
  pickerWrapper: {
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.md,
  backgroundColor: colors.cardBg,
  overflow: "hidden",
  minWidth: 120,
  justifyContent: "center",
},

picker: {
  color: colors.textPrimary,
  height: 48,
  backgroundColor: colors.cardBg,
},
  searchContainer: {
    marginBottom: spacing.xl,
  },
  fieldCard: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  fieldImage: {
    width: "100%",
    height: 200,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderImage: {
    backgroundColor: `${colors.primary}30`,
  },
  placeholderText: {
    fontSize: fonts.sizes["8xl"],
  },
  fieldInfo: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  fieldType: {
    backgroundColor: `${colors.primary}20`,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignSelf: "flex-start",
    marginBottom: spacing.md,
  },
  fieldTypeText: {
    color: colors.primary,
    fontWeight: fonts.weights.bold,
    fontSize: fonts.sizes.xs,
  },
  fieldName: {
    fontSize: fonts.sizes.xl,
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  fieldLocation: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  fieldFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  stars: {
    color: colors.warning,
    fontSize: fonts.sizes.sm,
  },
  ratingCount: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.xs,
  },
  priceBox: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.bold,
    color: colors.primary,
  },
  priceUnit: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
  },
  bookBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  bookBtnText: {
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold,
    fontSize: fonts.sizes.sm,
  },
  emptyContainer: {
    paddingVertical: spacing["5xl"],
    alignItems: "center",
  },
  emptyText: {
    fontSize: fonts.sizes.base,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },

  // CTA Section
  ctaSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing["4xl"],
    alignItems: "center",
  },
  ctaTitle: {
    fontSize: fonts.sizes["4xl"],
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  ctaSubtitle: {
    fontSize: fonts.sizes.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  ctaButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
  },
  ctaBtnText: {
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold,
    fontSize: fonts.sizes.base,
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing["3xl"],
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },
  // --- Price Filter ---
  priceFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  priceFilterLabel: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.xs,
    fontWeight: fonts.weights.semibold,
  },
  priceInput: {
    flex: 1,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    color: colors.textPrimary,
    fontSize: fonts.sizes.xs,
    textAlign: "center",
  },
  priceSep: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.sm,
  },
  priceClearBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.error,
    borderRadius: radius.sm,
  },
  priceClearText: {
    color: "#fff",
    fontSize: fonts.sizes.xs,
    fontWeight: fonts.weights.bold,
  },
});
