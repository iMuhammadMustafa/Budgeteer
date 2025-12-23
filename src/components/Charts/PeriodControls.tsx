import { Text, View } from "react-native";
import Button from "../elements/Button";

export default function PeriodControls({
  label,
  onPrev,
  onNext,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between mt-2 bg-card/30 rounded-lg px-3 py-2">
      <Button leftIcon="ChevronLeft" variant="ghost" size="sm" onPress={onPrev} className="px-2" />
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Button rightIcon="ChevronRight" variant="ghost" size="sm" onPress={onNext} className="px-2" />
    </View>
  );
}
