import { router } from "expo-router";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
const FIELDS = [
  { id: "1", name: "Sân Bao Cấp", price: "450k / giờ", type: "Sân 7" },
  { id: "2", name: "Sân 5 Cửa Ô", price: "420k / giờ", type: "Sân 5" },
  { id: "3", name: "Sân Thống Nhất", price: "500k / giờ", type: "Sân 11" },
  { id: "4", name: "Sân Quận 1", price: "400k / giờ", type: "Sân 7" },
  { id: "5", name: "Sân Phú Nhuận", price: "350k / giờ", type: "Sân 5" },
  { id: "6", name: "Sân Gò Vấp", price: "300k / giờ", type: "Sân 7" },
  { id: "7", name: "Sân Tân Bình", price: "380k / giờ", type: "Sân 5" },
  { id: "8", name: "Sân Bình Thạnh", price: "360k / giờ", type: "Sân 7" },
  { id: "9", name: "Sân Quận 3", price: "410k / giờ", type: "Sân 11" },
  { id: "10", name: "Sân Quận 10", price: "390k / giờ", type: "Sân 5" },
];

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>🏟️ Danh sách sân bóng</Text>

      <FlatList
        data={FIELDS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.type}>{item.type}</Text>
              <Text style={styles.price}>{item.price}</Text>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push(`/booking/${item.id}`)}
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
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
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
    fontWeight: "600",
  },
});
