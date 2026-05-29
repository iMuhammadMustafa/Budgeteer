import { View } from "react-native";
import Button from "../elements/Button";
import ThemedText from "../elements/ThemedText";

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
    <View className="flex-row items-center justify-center">
      <Button leftIcon="ChevronLeft" variant="ghost" size="sm" onPress={onPrev} />
      <ThemedText variant="caption" className="text-sm text-muted-foreground">
        {label}
      </ThemedText>
      <Button rightIcon="ChevronRight" variant="ghost" size="sm" onPress={onNext} />
    </View>
  );
}
