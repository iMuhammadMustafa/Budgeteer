import { Pressable } from "react-native";
import MyIcon from "./MyIcon";

export default function ModeIcon({ mode, onPress }: { mode: "plus" | "minus" | "transfer"; onPress: () => void }) {
  return (
    <Pressable
      className={`${
        mode === "transfer" ? "bg-info-400" : mode === "plus" ? "bg-success-400" : "bg-danger-400"
      } border border-muted rounded-lg p-1.5`}
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Toggle amount sign, currently ${mode}`}
    >
      {mode === "minus" ? (
        <MyIcon name="Minus" size={24} className="text-gray-100" />
      ) : (
        <MyIcon name="Plus" size={24} className="text-gray-100" />
      )}
    </Pressable>
  );
}
