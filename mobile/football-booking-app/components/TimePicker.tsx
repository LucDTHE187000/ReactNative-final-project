import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  start: number;
  end: number;
  onStartChange: (v: number) => void;
  onEndChange: (v: number) => void;
  isHourBooked: (hour: number) => boolean;
}

export default function TimePicker({
  start,
  end,
  onStartChange,
  onEndChange,
  isHourBooked,
}: Props) {

  // ví dụ mở từ 6h đến 23h
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

  return (
    <ScrollView style={{ maxHeight: 300 }}>
      {hours.map((hour) => {
        const booked = isHourBooked(hour);

        return (
          <TouchableOpacity
            key={hour}
            disabled={booked}
            style={[
              styles.hour,
              booked && styles.booked,
              start === hour && styles.selected,
            ]}
            onPress={() => onStartChange(hour)}
          >
            <Text style={booked && { color: "#999" }}>
              {hour}:00
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hour: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  booked: {
    backgroundColor: "#ddd",
  },
  selected: {
    backgroundColor: "#4CAF50",
  },
});