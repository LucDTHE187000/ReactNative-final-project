import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import API from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { colors, fonts, spacing, radius, shadows } from "@/constants/theme";

const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];
const DAY_HEADERS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/**
 * Author: Lê Trần Trọng Đạt - mssv: HE194235
 * Param: none
 * Description: Danh sách dịch vụ bổ sung có thể chọn khi đặt sân (đồng nhất với web app)
 */
const ADDON_SERVICES = [
  { name: "Nước uống", desc: "Nước suối, nước ngọt các loại", price: 20000 },
  { name: "Trọng tài", desc: "Thuê trọng tài chuyên nghiệp", price: 100000 },
  { name: "Khăn lạnh", desc: "Khăn lạnh bảo vệ sức khỏe", price: 10000 },
  { name: "Bóng đá", desc: "Cho thuê bóng đá", price: 50000 },
];

interface Field {
  _id: string;
  name: string;
  type: string;
  pricePerHour: number;
  location: string;
  priceSchedule?: {
    name: string;
    startHour: number;
    endHour: number;
    price: number;
  }[];
}

export default function BookingDetail() {
  const params = useLocalSearchParams();
  const fieldId = String(params.id);
  const { token } = useAuth();

  const [field, setField] = useState<Field | null>(null);
  const [fieldLoading, setFieldLoading] = useState(true);

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Time state — null = not yet selected
  const [startHour, setStartHour] = useState<number | null>(null);
  const [endHour, setEndHour] = useState<number | null>(null);
  const [bookedHours, setBookedHours] = useState<number[]>([]);

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);

  /**
   * Author: Lê Trần Trọng Đạt - mssv: HE194235
   * Param: name - tên dịch vụ
   * Description: Toggle chọn/bỏ chọn dịch vụ bổ sung
   */
  const toggleService = (name: string) => {
    setSelectedServices((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const formatDateDisplay = (date: Date) => {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}/${date.getFullYear()}`;
  };

  const formatDateISO = (date: Date) => date.toISOString().split("T")[0];

  /**
   * Author: Lê Trần Trọng Đạt - mssv: HE194235
   * Param: hour - giờ cần tra giá
   * Description: Trả về giá tiền của giờ cụ thể dựa trên priceSchedule của sân
   */
  const getPriceForHour = (hour: number): number => {
    if (!field?.priceSchedule || field.priceSchedule.length === 0)
      return field?.pricePerHour ?? 0;
    const slot = field.priceSchedule.find(
      (s) => hour >= s.startHour && hour < s.endHour
    );
    return slot ? slot.price : (field?.pricePerHour ?? 0);
  };

  // Computed summary values (live update)
  const duration =
    startHour !== null && endHour !== null ? endHour - startHour : 0;
  let fieldTotal = 0;
  if (startHour !== null && endHour !== null) {
    for (let h = startHour; h < endHour; h++) fieldTotal += getPriceForHour(h);
  }
  const serviceItems = ADDON_SERVICES.filter((s) =>
    selectedServices.includes(s.name)
  );
  const serviceTotal = serviceItems.reduce((sum, s) => sum + s.price, 0);
  const grandTotal = fieldTotal + serviceTotal;

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

  useEffect(() => {
    if (!field || !selectedDate) return;
    const fetchBooked = async () => {
      try {
        const res = await API.get(
          `/bookings/by-date?date=${formatDateISO(selectedDate)}&field=${field._id}`
        );
        const hours: number[] = [];
        res.data.forEach((b: any) => {
          for (let h = b.startHour; h < b.endHour; h++) hours.push(h);
        });
        setBookedHours(hours);
        setStartHour(null);
        setEndHour(null);
      } catch (err) {
        console.log("Fetch bookings error:", err);
      }
    };
    fetchBooked();
  }, [selectedDate, field]);

  const isHourBooked = (hour: number) => bookedHours.includes(hour);

  /**
   * Author: Lê Trần Trọng Đạt - mssv: HE194235
   * Param: hour - giờ người dùng bấm
   * Description: Xử lý chọn giờ — click 1 = giờ bắt đầu, click 2 = giờ kết thúc (validate range), click 3+ = reset
   */
  const selectTime = (hour: number) => {
    if (isHourBooked(hour)) {
      Alert.alert("Thông báo", "Khung giờ này đã được đặt");
      return;
    }
    if (endHour !== null || startHour === null) {
      setStartHour(hour);
      setEndHour(null);
    } else {
      if (hour <= startHour) {
        Alert.alert("Lỗi", "Giờ kết thúc phải lớn hơn giờ bắt đầu");
        return;
      }
      for (let h = startHour; h < hour; h++) {
        if (isHourBooked(h)) {
          Alert.alert("Lỗi", "Khoảng giờ chứa slot đã được đặt");
          setStartHour(null);
          setEndHour(null);
          return;
        }
      }
      setEndHour(hour);
    }
  };

  /**
   * Author: Lê Trần Trọng Đạt - mssv: HE194235
   * Param: date - ngày được chọn từ lịch
   * Description: Xử lý chọn ngày, fetch lại booked slots và reset giờ đã chọn
   */
  const selectCalendarDate = (date: Date) => {
    setSelectedDate(date);
  };

  const previousMonth = () => {
    const d = new Date(calendarMonth);
    d.setMonth(d.getMonth() - 1);
    setCalendarMonth(d);
  };

  const nextMonth = () => {
    const d = new Date(calendarMonth);
    d.setMonth(d.getMonth() + 1);
    setCalendarMonth(d);
  };

  /**
   * Author: Lê Trần Trọng Đạt - mssv: HE194235
   * Param: none
   * Description: Render lịch tháng — header ngày tuần, ô ngày, highlight today và ngày đã chọn, disable ngày quá khứ
   */
  const renderCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cells: any[] = [];

    DAY_HEADERS.forEach((d) =>
      cells.push(
        <View key={d} style={styles.calendarDayHeader}>
          <Text style={styles.calendarDayHeaderText}>{d}</Text>
        </View>
      )
    );

    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<View key={`empty-${year}-${month}-${i}`} style={styles.calendarDayEmpty} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      dateObj.setHours(0, 0, 0, 0);
      const isPast = dateObj < today;
      const isToday = dateObj.getTime() === today.getTime();
      const isSelected = selectedDate
        ? dateObj.toDateString() === selectedDate.toDateString()
        : false;

      cells.push(
        <TouchableOpacity
          key={`d-${day}`}
          style={[
            styles.calendarDay,
            isPast && styles.calendarDayDisabled,
            isToday && !isSelected && styles.calendarDayToday,
            isSelected && styles.calendarDaySelected,
          ]}
          onPress={() => !isPast && selectCalendarDate(dateObj)}
          disabled={isPast}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.calendarDayText,
              isPast && styles.calendarDayTextDisabled,
              isToday && !isSelected && styles.calendarDayTextToday,
              isSelected && styles.calendarDayTextSelected,
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return <View style={styles.calendarGrid}>{cells}</View>;
  };

  /**
   * Author: Lê Trần Trọng Đạt - mssv: HE194235
   * Param: none
   * Description: Render grid chọn giờ từ 06:00 đến 22:00 — booked (xám/gạch), selected range (xanh)
   */
  const renderTimeGrid = () => {
    const buttons: any[] = [];
    for (let h = 6; h < 23; h++) {
      const isBooked = isHourBooked(h);
      const isInRange =
        startHour !== null && endHour !== null && h >= startHour && h < endHour;
      const isStart = h === startHour && endHour === null;
      const isHighlighted = isInRange || isStart;

      buttons.push(
        <TouchableOpacity
          key={h}
          style={[
            styles.timeBtn,
            isBooked && styles.timeBtnBooked,
            isHighlighted && styles.timeBtnSelected,
          ]}
          onPress={() => selectTime(h)}
          disabled={isBooked || !selectedDate}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.timeBtnText,
              isBooked && styles.timeBtnTextBooked,
              isHighlighted && styles.timeBtnTextSelected,
            ]}
          >
            {String(h).padStart(2, "0")}:00
          </Text>
        </TouchableOpacity>
      );
    }
    return <View style={styles.timeGrid}>{buttons}</View>;
  };

  /**
   * Author: Lê Trần Trọng Đạt - mssv: HE194235
   * Param: none
   * Description: Validate input, gọi API tạo booking, chuyển sang màn hình thanh toán
   */
  const handleConfirm = async () => {
    if (!field) return;

    if (!selectedDate) {
      Alert.alert("Lỗi", "Vui lòng chọn ngày");
      return;
    }

    if (startHour === null || endHour === null) {
      Alert.alert("Lỗi", "Vui lòng chọn giờ bắt đầu và giờ kết thúc");
      return;
    }

    const services = serviceItems.map((s) => ({ name: s.name, price: s.price }));
    setBookingLoading(true);
    try {
      const res = await API.post("/bookings", {
        field: field._id,
        fieldName: field.name,
        date: formatDateISO(selectedDate),
        startHour,
        endHour,
        totalPrice: grandTotal,
        services,
      });

      const bookingData = res.data.booking || res.data;
      const orderCode = res.data.orderCode || bookingData.orderCode;
      router.push({
        pathname: "/payment",
        params: {
          booking: JSON.stringify({
            ...bookingData,
            orderCode,
            fieldName: field.name,
            fieldPrice: fieldTotal,
            services,
            totalPrice: grandTotal,
          }),
        },
      });
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

  const isConfirmDisabled =
    bookingLoading || !selectedDate || startHour === null || endHour === null;

  return (
    <ScrollView style={styles.container}>
      {/* Thông tin sân */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{field.name}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Loại sân:</Text>
          <Text style={styles.value}>{field.type}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Địa chỉ:</Text>
          <Text style={styles.value}>{field.location}</Text>
        </View>
      </View>

      {/* Bảng giá theo khung giờ */}
      {field.priceSchedule && field.priceSchedule.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Giá Sân Theo Khung Giờ</Text>
          {field.priceSchedule.map((s) => (
            <View key={s.startHour} style={styles.priceRow}>
              <Text style={styles.priceTime}>
                {s.startHour}:00 — {s.endHour}:00
              </Text>
              <Text style={styles.priceAmount}>
                {s.price.toLocaleString("vi-VN")} đ/giờ
              </Text>
            </View>
          ))}
          <Text style={styles.priceNote}>
            💡 Giá cao điểm có mức giá cao hơn giờ thường
          </Text>
        </View>
      )}

      {/* Chọn ngày — Calendar Grid */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📅 Chọn ngày</Text>

        <View style={styles.calendarNavRow}>
          <TouchableOpacity style={styles.calendarNavBtn} onPress={previousMonth}>
            <Text style={styles.calendarNavBtnText}>◀</Text>
          </TouchableOpacity>
          <Text style={styles.calendarMonthTitle}>
            {MONTH_NAMES[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
          </Text>
          <TouchableOpacity style={styles.calendarNavBtn} onPress={nextMonth}>
            <Text style={styles.calendarNavBtnText}>▶</Text>
          </TouchableOpacity>
        </View>

        {renderCalendar()}

        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>Đã chọn</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#E53935" }]} />
            <Text style={styles.legendText}>Hôm nay</Text>
          </View>
        </View>

        {selectedDate && (
          <Text style={styles.selectedDateText}>
            📅 Ngày đã chọn: {formatDateDisplay(selectedDate)}
          </Text>
        )}
      </View>

      {/* Chọn giờ — Time Grid */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⏰ Chọn giờ</Text>
        {!selectedDate && (
          <Text style={styles.hintText}>Vui lòng chọn ngày trước</Text>
        )}

        {renderTimeGrid()}

        {startHour !== null && (
          <View style={styles.timeRangeDisplay}>
            <Text style={styles.timeRangeText}>
              {endHour === null
                ? `Bắt đầu: ${String(startHour).padStart(2, "0")}:00 — Chọn giờ kết thúc`
                : `${String(startHour).padStart(2, "0")}:00 → ${String(endHour).padStart(2, "0")}:00  (${duration} giờ)`}
            </Text>
          </View>
        )}

        <Text style={styles.priceNote}>
          💡 Giờ cao điểm có mức giá cao hơn giờ thường
        </Text>
      </View>

      {/* Dịch vụ bổ sung */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🛍️ Dịch vụ thêm</Text>
        {ADDON_SERVICES.map((service) => {
          const isSelected = selectedServices.includes(service.name);
          return (
            <TouchableOpacity
              key={service.name}
              style={[styles.serviceItem, isSelected && styles.serviceItemSelected]}
              onPress={() => toggleService(service.name)}
              activeOpacity={0.7}
            >
              <View style={[styles.serviceCheckbox, isSelected && styles.serviceCheckboxSelected]}>
                {isSelected && <Text style={styles.serviceCheckmark}>✓</Text>}
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDesc}>{service.desc}</Text>
              </View>
              <Text style={styles.servicePrice}>
                {service.price.toLocaleString("vi-VN")} đ
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tóm tắt đặt sân */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tóm tắt đặt sân</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Sân bóng</Text>
          <Text style={styles.summaryValue}>{field.name}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Ngày</Text>
          <Text style={styles.summaryValue}>
            {selectedDate ? formatDateDisplay(selectedDate) : "Chưa chọn"}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Giờ</Text>
          <Text style={styles.summaryValue}>
            {startHour !== null && endHour !== null
              ? `${String(startHour).padStart(2, "0")}:00 - ${String(endHour).padStart(2, "0")}:00`
              : "Chưa chọn"}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Thời lượng</Text>
          <Text style={styles.summaryValue}>
            {duration > 0 ? `${duration} giờ` : "—"}
          </Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Giá sân ({duration > 0 ? duration : 1} giờ)
          </Text>
          <Text style={styles.summaryValue}>
            {startHour !== null && endHour !== null
              ? fieldTotal.toLocaleString("vi-VN") + " đ"
              : "Chưa chọn"}
          </Text>
        </View>

        {serviceItems.map((s) => (
          <View key={s.name} style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{s.name}</Text>
            <Text style={styles.summaryValue}>
              {s.price.toLocaleString("vi-VN")} đ
            </Text>
          </View>
        ))}

        <View style={styles.summaryDivider} />

        <View style={styles.summaryTotalRow}>
          <Text style={styles.summaryTotalLabel}>Tổng tiền</Text>
          <Text style={styles.summaryTotalValue}>
            {grandTotal.toLocaleString("vi-VN")} đ
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, isConfirmDisabled && styles.buttonDisabled]}
        onPress={handleConfirm}
        disabled={isConfirmDisabled}
      >
        {bookingLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Đặt sân và thanh toán →</Text>
        )}
      </TouchableOpacity>

      <View style={styles.footer} />
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.darkBg,
  },
  errorText: {
    fontSize: fonts.sizes.base,
    color: colors.error,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingLeft: spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.semibold,
    color: colors.textSecondary,
  },
  value: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
    ...shadows.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: fonts.sizes.base,
    fontWeight: fonts.weights.bold,
  },
  footer: {
    paddingBottom: spacing.xl,
  },

  // Price schedule
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  priceTime: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
  },
  priceAmount: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.bold,
    color: colors.accentOrange,
  },
  priceNote: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.md,
    fontStyle: "italic",
  },

  // Calendar
  calendarNavRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  calendarNavBtn: {
    padding: spacing.md,
    backgroundColor: colors.lightBg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 40,
    alignItems: "center",
  },
  calendarNavBtnText: {
    color: colors.textPrimary,
    fontSize: fonts.sizes.base,
    fontWeight: fonts.weights.bold,
  },
  calendarMonthTitle: {
    fontSize: fonts.sizes.base,
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDayHeader: {
    width: "14.285%",
    alignItems: "center",
    paddingVertical: 6,
  },
  calendarDayHeaderText: {
    fontSize: fonts.sizes.xs,
    fontWeight: fonts.weights.bold,
    color: colors.textSecondary,
  },
  calendarDayEmpty: {
    width: "14.285%",
    aspectRatio: 1,
  },
  calendarDay: {
    width: "14.285%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    padding: 2,
  },
  calendarDayDisabled: {
    opacity: 0.3,
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: "#E53935",
  },
  calendarDaySelected: {
    backgroundColor: colors.primary,
  },
  calendarDayText: {
    fontSize: fonts.sizes.sm,
    color: colors.textPrimary,
  },
  calendarDayTextDisabled: {
    color: colors.textSecondary,
  },
  calendarDayTextToday: {
    color: "#E53935",
    fontWeight: fonts.weights.bold,
  },
  calendarDayTextSelected: {
    color: "#fff",
    fontWeight: fonts.weights.bold,
  },
  calendarLegend: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
  },
  selectedDateText: {
    marginTop: spacing.lg,
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.semibold,
    color: colors.primary,
    textAlign: "center",
  },

  // Time grid
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: spacing.lg,
  },
  timeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
    minWidth: 72,
    alignItems: "center",
  },
  timeBtnBooked: {
    backgroundColor: colors.lightBg,
    borderColor: colors.border,
    opacity: 0.5,
  },
  timeBtnSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeBtnText: {
    fontSize: fonts.sizes.sm,
    color: colors.textPrimary,
    fontWeight: fonts.weights.semibold,
  },
  timeBtnTextBooked: {
    color: colors.textSecondary,
    textDecorationLine: "line-through",
  },
  timeBtnTextSelected: {
    color: "#fff",
    fontWeight: fonts.weights.bold,
  },
  hintText: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginBottom: spacing.md,
  },
  timeRangeDisplay: {
    backgroundColor: colors.accentOrangeLight,
    borderWidth: 1,
    borderColor: `${colors.accentOrange}40`,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  timeRangeText: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.bold,
    color: colors.accentOrange,
  },

  // Services
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceItemSelected: {
    backgroundColor: `${colors.primary}10`,
    borderColor: colors.primary,
  },
  serviceCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: colors.cardBg,
  },
  serviceCheckboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  serviceCheckmark: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  serviceDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  servicePrice: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.accentOrange,
    marginLeft: 8,
  },

  // Summary
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  summaryValue: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
    textAlign: "right",
    flex: 1,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  summaryTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  summaryTotalLabel: {
    fontSize: fonts.sizes.base,
    fontWeight: fonts.weights.bold,
    color: colors.textPrimary,
  },
  summaryTotalValue: {
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.bold,
    color: colors.accentOrange,
  },
});
