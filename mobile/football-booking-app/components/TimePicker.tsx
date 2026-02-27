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
  // Giờ mở: 6h - 23h
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);
  // Duration: 1-12 giờ
  const durations = Array.from({ length: 12 }, (_, i) => i + 1);

  // Handle start change
  const handleStartChange = (hour: number) => {
    onStartChange(hour);
    // Auto set end = start + 1 giờ
    if (hour + 1 <= 23) {
      onEndChange(hour + 1);
    }
  };

  // Handle duration change
  const handleDurationChange = (duration: number) => {
    const newEnd = start + duration;
    if (newEnd <= 24) {
      onEndChange(newEnd);
    }
  };

  const currentDuration = Math.max(1, end - start);

  return (
    <View style={styles.container}>
      {/* START TIME */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Giờ bắt đầu</Text>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {hours.map((hour) => {
            const booked = isHourBooked(hour);
            const isSelected = start === hour;

            return (
              <TouchableOpacity
                key={`start-${hour}`}
                disabled={booked}
                style={[
                  styles.timeButton,
                  booked && styles.booked,
                  isSelected && styles.selected,
                ]}
                onPress={() => handleStartChange(hour)}
              >
                <Text
                  style={[
                    styles.timeButtonText,
                    booked && styles.bookedText,
                    isSelected && styles.selectedText,
                  ]}
                >
                  {hour}:00
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* DURATION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thời lượng</Text>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {durations.map((duration) => {
            const endTime = start + duration;
            const isValid = endTime <= 24;
            const isSelected = currentDuration === duration;

            return (
              <TouchableOpacity
                key={`duration-${duration}`}
                disabled={!isValid}
                style={[
                  styles.timeButton,
                  !isValid && styles.booked,
                  isSelected && styles.selected,
                ]}
                onPress={() => handleDurationChange(duration)}
              >
                <Text
                  style={[
                    styles.timeButtonText,
                    !isValid && styles.bookedText,
                    isSelected && styles.selectedText,
                  ]}
                >
                  {duration}h ({start}:00 → {endTime}:00)
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  section: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  scrollView: {
    maxHeight: 250,
  },
  timeButton: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 6,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  timeButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  booked: {
    backgroundColor: "#F5F5F5",
    borderColor: "#CCC",
    opacity: 0.5,
  },
  bookedText: {
    color: "#999",
  },
  selected: {
    backgroundColor: "#27AE60",
    borderColor: "#27AE60",
  },
  selectedText: {
    color: "#fff",
  },
});