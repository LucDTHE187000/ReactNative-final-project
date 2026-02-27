import { router } from "expo-router";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  ScrollView,
  TextInput,
} from "react-native";
import { useEffect, useState } from "react";
import API from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

interface Field {
  _id: string;
  name: string;
  type: string;
  pricePerHour: number;
  location: string;
  image?: string;
  description?: string;
  capacity?: number;
}

export default function HomeScreen() {
  const [allFields, setAllFields] = useState<Field[]>([]);
  const [filteredFields, setFilteredFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const { token, logout, user } = useAuth();

  const fetchFields = async () => {
    try {
      const response = await API.get("/fields");
      // Filter only football fields (Sân 5, Sân 7, Sân 11)
      const footballFields = response.data.filter(
        (field: Field) =>
          field.type === "Sân 5" || field.type === "Sân 7" || field.type === "Sân 11"
      );
      setAllFields(footballFields);
      setFilteredFields(footballFields);
    } catch (error: any) {
      console.log("Fetch fields error:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách sân");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = () => {
    let filtered = allFields;

    if (searchLocation.trim()) {
      filtered = filtered.filter((field) =>
        field.location.toLowerCase().includes(searchLocation.toLowerCase())
      );
    }

    setFilteredFields(filtered);
  };

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchFields();
  }, [token]);

  useEffect(() => {
    handleSearch();
  }, [searchLocation, selectedDate, selectedTime]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFields();
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
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
          <Text style={styles.greeting}>Xin chào, {user?.name || "Bạn"} 👋</Text>
          <Text style={styles.subtitle}>Tìm sân bóng đá yêu thích</Text>
        </View>
        <View style={styles.headerButtons}>
          {user?.role === "admin" && (
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => router.push("/admin")}
            >
              <Text style={styles.adminButtonText}>⚙️</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="📍 Tìm theo địa điểm..."
          value={searchLocation}
          onChangeText={setSearchLocation}
          placeholderTextColor="#999"
        />
      </View>

      {/* Results count */}
      <Text style={styles.resultsText}>
        Tìm thấy {filteredFields.length} sân bóng
      </Text>

      {/* Fields List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#27AE60" />
        </View>
      ) : (
        <FlatList
          data={filteredFields}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 20 }}
          scrollEnabled={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>😔 Không tìm thấy sân nào</Text>
              <Text style={styles.emptySubtext}>Vui lòng thử lại với địa điểm khác</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/booking/${item._id}`)}
              activeOpacity={0.9}
            >
              {/* Field Image */}
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.fieldImage}
                />
              ) : (
                <View style={[styles.fieldImage, styles.placeholderImage]}>
                  <Text style={styles.placeholderText}>⚽</Text>
                </View>
              )}

              {/* Field Info */}
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldName}>{item.name}</Text>
                    <Text style={styles.fieldType}>
                      {item.type} • {item.capacity || 7} người
                    </Text>
                  </View>
                  <View style={styles.priceTag}>
                    <Text style={styles.priceText}>
                      {(item.pricePerHour / 1000).toFixed(0)}k
                    </Text>
                    <Text style={styles.priceSubtext}>/giờ</Text>
                  </View>
                </View>

                <Text style={styles.fieldLocation}>📍 {item.location}</Text>

                {item.description && (
                  <Text
                    style={styles.fieldDescription}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {item.description}
                  </Text>
                )}

                {/* Book Button */}
                <TouchableOpacity
                  style={styles.bookButton}
                  onPress={() => router.push(`/booking/${item._id}`)}
                >
                  <Text style={styles.bookButtonText}>Chọn sân →</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },

  // Header
  header: {
    backgroundColor: "#27AE60",
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  adminButton: {
    backgroundColor: "rgba(255,255,255,0.25)",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  adminButtonText: {
    fontSize: 20,
  },
  logoutButton: {
    backgroundColor: "rgba(255,255,255,0.25)",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: {
    fontSize: 20,
  },

  // Search
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F8F9FA",
  },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    color: "#333",
  },

  // Results text
  resultsText: {
    paddingHorizontal: 16,
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    fontWeight: "600",
  },

  // Card
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  fieldImage: {
    width: "100%",
    height: 180,
    backgroundColor: "#E0E0E0",
  },
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
  },
  placeholderText: {
    fontSize: 60,
  },

  // Card Content
  cardContent: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  fieldName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  fieldType: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  priceTag: {
    backgroundColor: "#27AE60",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 60,
  },
  priceText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  priceSubtext: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
  },

  fieldLocation: {
    fontSize: 12,
    color: "#755C36",
    marginBottom: 6,
    fontWeight: "500",
  },
  fieldDescription: {
    fontSize: 12,
    color: "#888",
    marginBottom: 10,
    lineHeight: 16,
  },

  // Book Button
  bookButton: {
    backgroundColor: "#27AE60",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  bookButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  // Empty State
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 18,
    color: "#333",
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#999",
  },
});

 