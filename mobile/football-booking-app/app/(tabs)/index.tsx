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
}

export default function HomeScreen() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchFields();
  }, [token]);

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
      <View style={styles.header}>
        <Text style={styles.title}>🏟️ Danh sách sân bóng</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => router.push("/search")}
          >
            <Text style={styles.searchButtonText}>🔍 Tìm</Text>
          </TouchableOpacity>
          {user?.role === "admin" && (
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => router.push("/admin")}
            >
              <Text style={styles.adminButtonText}>⚙️ Admin</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={fields}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có sân nào</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.type}>{item.type}</Text>
              <Text style={styles.location}>{item.location}</Text>
              <Text style={styles.price}>{item.pricePerHour.toLocaleString()}đ / giờ</Text>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push(`/booking/${item._id}`)}
            >
              <Text style={styles.buttonText}>Đặt sân</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F8",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    flex: 1,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  searchButton: {
    backgroundColor: "#1976D2",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 11,
  },
  adminButton: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  adminButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 11,
  },
  logoutButton: {
    backgroundColor: "#E53935",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  type: {
    fontSize: 13,
    color: "#666",
    marginVertical: 2,
  },
  location: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    color: "#E53935",
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#1976D2",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F6F8",
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
});

 