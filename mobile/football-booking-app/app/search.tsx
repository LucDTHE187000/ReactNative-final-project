import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import API from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

interface Field {
  _id: string;
  name: string;
  type: string;
  pricePerHour: number;
  location: string;
}

const FIELD_TYPES = ["Tất cả", "Sân 5", "Sân 7", "Sân 11"];

export default function SearchFieldsScreen() {
  const [fields, setFields] = useState<Field[]>([]);
  const [filteredFields, setFilteredFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState("Tất cả");
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchAllFields();
  }, [token]);

  const fetchAllFields = async () => {
    try {
      const response = await API.get("/fields");
      setFields(response.data);
      setFilteredFields(response.data);
    } catch (error: any) {
      console.log("Fetch error:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách sân");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (search: string, type: string) => {
    let result = fields;

    // Filter by type
    if (type !== "Tất cả") {
      result = result.filter((f) => f.type === type);
    }

    // Filter by search text (name or location)
    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(lowerSearch) ||
          f.location.toLowerCase().includes(lowerSearch)
      );
    }

    setFilteredFields(result);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    applyFilters(text, selectedType);
  };

  const handleTypeFilter = (type: string) => {
    setSelectedType(type);
    applyFilters(searchText, type);
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
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm sân theo tên hoặc địa chỉ..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={handleSearch}
        />
      </View>

      {/* Filter Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {FIELD_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterButton,
              selectedType === type && styles.filterButtonActive,
            ]}
            onPress={() => handleTypeFilter(type)}
          >
            <Text
              style={[
                styles.filterText,
                selectedType === type && styles.filterTextActive,
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <FlatList
        data={filteredFields}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchText || selectedType !== "Tất cả"
                ? "Không tìm thấy sân nào"
                : "Không có sân"}
            </Text>
            {(searchText || selectedType !== "Tất cả") && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                  setSearchText("");
                  setSelectedType("Tất cả");
                  setFilteredFields(fields);
                }}
              >
                <Text style={styles.resetButtonText}>Xóa bộ lọc</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.fieldName}>{item.name}</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>📍</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {item.location}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>🏅</Text>
                <Text style={styles.infoValue}>{item.type}</Text>
              </View>

              <Text style={styles.price}>
                {item.pricePerHour.toLocaleString()}đ / giờ
              </Text>
            </View>

            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => router.push(`/booking/${item._id}`)}
            >
              <Text style={styles.bookButtonText}>Đặt</Text>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F6F8",
  },
  searchSection: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#f5f5f5",
  },
  filterContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    marginHorizontal: 4,
  },
  filterButtonActive: {
    backgroundColor: "#1976D2",
    borderColor: "#1976D2",
  },
  filterText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    padding: 14,
    elevation: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardContent: {
    flex: 1,
    marginRight: 8,
  },
  fieldName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 12,
    marginRight: 6,
  },
  infoValue: {
    fontSize: 12,
    color: "#666",
    flex: 1,
  },
  price: {
    fontSize: 14,
    color: "#E53935",
    fontWeight: "bold",
    marginTop: 6,
  },
  bookButton: {
    backgroundColor: "#1976D2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: "center",
  },
  bookButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: "#1976D2",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  resetButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
});
