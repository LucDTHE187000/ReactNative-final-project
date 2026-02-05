import { View, Text, FlatList, StyleSheet } from "react-native";

const FIELDS = [
  { id: "1", name: "Sân Bao Cấp", price: "450k/giờ" },
  { id: "2", name: "Sân 5 Cửa Ô", price: "420k/giờ" },
];

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Danh sách sân bóng</Text>
      <FlatList
        data={FIELDS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>{item.name}</Text>
            <Text>{item.price}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  card: { padding: 12, borderWidth: 1, marginBottom: 8 },
});
