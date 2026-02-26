import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import PriceSummary from "@/components/PriceSummary";
import TimePicker from "@/components/TimePicker";
import API from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

interface Field {
  _id: string;
  name: string;
  type: string;
  pricePerHour: number;
  location: string;
}

export default function BookingDetail() {
  const params = useLocalSearchParams();
  const fieldId = String(params.id);
  const { token } = useAuth();

  // ✅ Field state
  const [field, setField] = useState<Field | null>(null);
  const [fieldLoading, setFieldLoading] = useState(true);

  // ✅ Booking state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [start, setStart] = useState(9);
  const [end, setEnd] = useState(10);
  const [bookedSlots, setBookedSlots] = useState<any[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);

  // ✅ Format ngày cho backend
  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  // ✅ Check if date is in the past
  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // ✅ Fetch field details
  useEffect(() => {
    const fetchField = async () => {
      try {
        if (!token) {
          router.replace("/login");
          return;
        }
        const res = await API.get(`/fields/${fieldId}`);
        setField(res.data);
      } catch (err) {
        console.log("Fetch field error:", err);
        Alert.alert("Lỗi", "Không thể tải thông tin sân");
        router.back();
      } finally {
        setFieldLoading(false);
      }
    };

    fetchField();
  }, [fieldId, token]);

  // ✅ Fetch booking theo ngày
  const fetchBookings = async () => {
    if (!field) return;
    try {
      const res = await API.get(
        `/bookings/by-date?date=${formatDate(selectedDate)}&fieldName=${field.type}`
      );
      setBookedSlots(res.data);
    } catch (err) {
      console.log("Fetch bookings error:", err);
    }
  };

  // ✅ Load bookings when date changes
  useEffect(() => {
    if (field) {
      fetchBookings();
    }
  }, [selectedDate, field]);

  // ✅ Check giờ bị đặt
  const isHourBooked = (hour: number) => {
    return bookedSlots.some((b) => hour >= b.startHour && hour < b.endHour);
  };

  // ✅ Xác nhận đặt
  const handleConfirm = async () => {
    if (!field) return;

    // Validate
    if (isPastDate(selectedDate)) {
      Alert.alert("Lỗi", "Không thể đặt sân trong ngày hôm qua");
      return;
    }

    if (end <= start) {
      Alert.alert("Lỗi", "Giờ kết thúc phải sau giờ bắt đầu");
      return;
    }

    // Check time is booked
    for (let h = start; h < end; h++) {
      if (isHourBooked(h)) {
        Alert.alert("Lỗi", `Giờ ${h}:00 - ${h + 1}:00 đã bị đặt`);
        return;
      }
    }

    const total = field.pricePerHour * (end - start);

    setBookingLoading(true);
    try {
      await API.post("/bookings", {
        field: field._id,
        fieldName: field.type,
        date: formatDate(selectedDate),
        startHour: start,
        endHour: end,
        totalPrice: total,
      });

      Alert.alert("Thành công", "Đặt sân thành công!");
      router.back();
    } catch (err: any) {
      Alert.alert("Lỗi", err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setBookingLoading(false);
    }
  };

  if (fieldLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  if (!field) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Sân không tồn tại</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Thông tin sân */}
      <View style={styles.card}>
        <Text style={styles.title}>{field.name}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Loại sân:</Text>
          <Text style={styles.value}>{field.type}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Địa chỉ:</Text>
          <Text style={styles.value}>{field.location}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Giá:</Text>
          <Text style={styles.price}>
            {field.pricePerHour.toLocaleString()}đ / giờ
          </Text>
        </View>
      </View>

      {/* Chọn ngày */}
      <View style={styles.card}>
        <Text style={styles.title}>Chọn ngày</Text>

        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowPicker(true)}
        >
          <Text style={styles.dateText}>
            {selectedDate.toLocaleDateString("vi-VN")}
          </Text>
        </TouchableOpacity>

        {isPastDate(selectedDate) && (
          <Text
            style={{
              color: "#E53935",
              marginTop: 8,
              fontSize: 12,
              fontWeight: "600",
            }}
          >
            ⚠️ Không thể đặt sân trong ngày hôm qua
          </Text>
        )}

        {showPicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, date) => {
              if (date) setSelectedDate(date);
              setShowPicker(Platform.OS === "ios" ? true : false);
            }}
            minimumDate={new Date()}
          />
        )}

        {Platform.OS === "ios" && showPicker && (
          <TouchableOpacity
            style={[styles.button, { marginTop: 12 }]}
            onPress={() => setShowPicker(false)}
          >
            <Text style={styles.buttonText}>Xong</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Thời gian */}
      <View style={styles.card}>
        <Text style={styles.title}>Chọn giờ</Text>

        <View style={styles.timeContainer}>
          <View style={styles.timeGroup}>
            <Text style={styles.timeLabel}>Từ:</Text>
            <TimePicker
              start={start}
              end={end}
              onStartChange={setStart}
              onEndChange={setEnd}
              isHourBooked={isHourBooked}
            />
          </View>

          <View style={styles.timeGroup}>
            <Text style={styles.timeLabel}>Đến:</Text>
            <Text style={styles.timeValue}>{end}:00</Text>
          </View>
        </View>
      </View>

      <PriceSummary pricePerHour={field.pricePerHour} start={start} end={end} />

      <TouchableOpacity
        style={[styles.button, bookingLoading && styles.buttonDisabled]}
        onPress={handleConfirm}
        disabled={bookingLoading || isPastDate(selectedDate) || end <= start}
      >
        {bookingLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Xác Nhận Đặt Sân</Text>
        )}
      </TouchableOpacity>

      <View style={styles.footer} />
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F8",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F6F8",
  },
  errorText: {
    fontSize: 16,
    color: "#E53935",
    textAlign: "center",
    marginTop: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
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
  button: {
    backgroundColor: "#1976D2",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  dateButton: {
    backgroundColor: "#eee",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeGroup: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#555",
  },
  timeValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
  },
  footer: {
    paddingBottom: 20,
  },
});
