import { View, Text } from "react-native";
import { Picker } from "@react-native-picker/picker";

type Props = {
  start: number;
  end: number;
  onStartChange: (v: number) => void;
  onEndChange: (v: number) => void;
};

export default function TimePicker({
  start,
  end,
  onStartChange,
  onEndChange,
}: Props) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <View style={{ marginVertical: 12 }}>
      <Text>Giờ bắt đầu</Text>
      <Picker selectedValue={start} onValueChange={onStartChange}>
        {hours.map((h) => (
          <Picker.Item key={h} label={`${h}:00`} value={h} />
        ))}
      </Picker>

      <Text>Giờ kết thúc</Text>
      <Picker selectedValue={end} onValueChange={onEndChange}>
        {hours.map((h) => (
          <Picker.Item key={h} label={`${h}:00`} value={h} />
        ))}
      </Picker>
    </View>
  );
}
