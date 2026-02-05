import { View, Text } from "react-native";

type Props = {
  pricePerHour: number;
  start: number;
  end: number;
};

export default function PriceSummary({
  pricePerHour,
  start,
  end,
}: Props) {
  const hours = Math.max(0, end - start);
  const total = hours * pricePerHour;

  return (
    <View style={{ padding: 12, backgroundColor: "#f2f2f2", borderRadius: 8 }}>
      <Text>Số giờ: {hours}</Text>
      <Text>Giá / giờ: {pricePerHour.toLocaleString()} đ</Text>
      <Text style={{ fontWeight: "bold", marginTop: 6 }}>
        Tổng tiền: {total.toLocaleString()} đ
      </Text>
    </View>
  );
}
