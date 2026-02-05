import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import PriceSummary from "../../components/PriceSummary";
import TimePicker from "../../components/TimePicker";
import {Alert} from "react-native"; 
export default function BookingDetail() {
  const { id } = useLocalSearchParams();

  const field = {
    type: "Sân 7",
    pricePerHour: 450000,
  };
  const handleConfirm = () => {
  console.log(" Xác nhận đặt sân!");
    Alert.alert(
      "Xác nhận đặt sân",
      "Bạn chắc chắn muốn đặt sân này?",
      [
        { text: "Hủy", style: "cancel" },
        {
        text: "Xác nhận",
        onPress: () => {
            console.log("Đã xác nhận đặt sân!");
          Alert.alert("✅ Thành công", "Đặt sân thành công!");
        },
      },
    ]
  );
};

  const [start, setStart] = useState(19);
  const [end, setEnd] = useState(21);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>🏟️ Thông tin sân</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Mã sân:</Text>
          <Text style={styles.value}>#{id}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Loại sân:</Text>
          <Text style={styles.value}>{field.type}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Giá:</Text>
          <Text style={styles.price}>
            {field.pricePerHour.toLocaleString()}đ / giờ
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>⏰ Thời gian</Text>
        <TimePicker
          start={start}
          end={end}
          onStartChange={setStart}
          onEndChange={setEnd}
        />
      </View>

      <PriceSummary pricePerHour={field.pricePerHour} start={start} end={end} />

      <TouchableOpacity style={styles.button} onPress={handleConfirm}>
        <Text style={styles.buttonText}>Xác nhận đặt sân</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F8",
    padding: 16,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  label: {
    fontSize: 14,
    color: "#555",
  },

  value: {
    fontSize: 14,
    fontWeight: "600",
  },

  price: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#E53935",
  },

  time: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
  },

  button: {
    backgroundColor: "#1976D2",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
