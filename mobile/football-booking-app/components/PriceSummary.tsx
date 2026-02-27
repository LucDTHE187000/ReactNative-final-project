import { View, Text, StyleSheet } from "react-native";

type PriceSlot = {
  name: string;
  startHour: number;
  endHour: number;
  price: number;
};

type Props = {
  pricePerHour?: number;
  start: number;
  end: number;
  priceSchedule?: PriceSlot[];
};

export default function PriceSummary({
  pricePerHour = 0,
  start,
  end,
  priceSchedule,
}: Props) {
  const hours = Math.max(0, end - start);

  // Hàm tính giá dựa trên priceSchedule
  const calculateDynamicPrice = () => {
    if (!priceSchedule || priceSchedule.length === 0) {
      return hours * pricePerHour;
    }

    let total = 0;

    for (let hour = start; hour < end; hour++) {
      const slot = priceSchedule.find(
        (s) => hour >= s.startHour && hour < s.endHour
      );
      if (slot) {
        total += slot.price;
      }
    }

    return total;
  };

  const total = calculateDynamicPrice();

  // Nếu có priceSchedule, hiển thị chi tiết
  if (priceSchedule && priceSchedule.length > 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Tính giá theo khung giờ</Text>

        {/* Chi tiết từng khung giờ */}
        <View style={styles.detailsContainer}>
          {priceSchedule.map((slot) => {
            const hoursInSlot = Math.min(end, slot.endHour) - Math.max(start, slot.startHour);
            if (hoursInSlot <= 0) return null;

            return (
              <View key={slot.name} style={styles.slotRow}>
                <Text style={styles.slotName}>
                  🕐 {slot.name} ({slot.startHour}h-{slot.endHour}h)
                </Text>
                <View style={styles.slotPrice}>
                  <Text style={styles.slotHours}>{hoursInSlot}h ×</Text>
                  <Text style={styles.slotAmount}>
                    {slot.price.toLocaleString()}đ
                  </Text>
                </View>
                <Text style={styles.slotTotal}>
                  {(hoursInSlot * slot.price).toLocaleString()}đ
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.divider} />

        {/* Tổng tiền */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng tiền:</Text>
          <Text style={styles.totalAmount}>
            {total.toLocaleString()}đ
          </Text>
        </View>
      </View>
    );
  }

  // Nếu không có priceSchedule, hiển thị đơn giản
  return (
    <View style={styles.simpleContainer}>
      <View style={styles.row}>
        <Text style={styles.label}>Số giờ:</Text>
        <Text style={styles.value}>{hours}h</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Giá/giờ:</Text>
        <Text style={styles.value}>{pricePerHour.toLocaleString()}đ</Text>
      </View>
      <View style={[styles.row, styles.totalRow]}>
        <Text style={[styles.label, styles.totalLabel]}>Tổng tiền:</Text>
        <Text style={[styles.value, styles.totalAmount]}>
          {total.toLocaleString()}đ
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#E8F5E9",
    padding: 14,
    borderRadius: 12,
    marginVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#27AE60",
  },
  simpleContainer: {
    padding: 12,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#1976D2",
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#27AE60",
    marginBottom: 10,
  },
  detailsContainer: {
    gap: 8,
    marginBottom: 8,
  },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.7)",
    padding: 10,
    borderRadius: 8,
  },
  slotName: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  slotPrice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  slotHours: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
  },
  slotAmount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#27AE60",
  },
  slotTotal: {
    minWidth: 90,
    fontSize: 12,
    fontWeight: "700",
    color: "#27AE60",
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(39, 174, 96, 0.3)",
    marginVertical: 8,
  },
  totalRow: {
    backgroundColor: "#C8E6C9",
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1B5E20",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1B5E20",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: "#555",
    fontWeight: "500",
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
});
