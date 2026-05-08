import Button from "./Button";
import MyIcon from "./MyIcon";

export default function ModeIcon({ mode, onPress }: { mode: "plus" | "minus" | "transfer"; onPress: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      hapticFeedback="selection"
      className={`${
        mode === "transfer" ? "bg-info-400" : mode === "plus" ? "bg-success-400" : "bg-danger-400"
      } border border-muted rounded-lg p-1.5`}
      onPress={onPress}
      accessibilityLabel={`Toggle amount sign, currently ${mode}`}
      testID="btn-mode-toggle"
    >
      {mode === "minus" ? (
        <MyIcon name="Minus" size={24} className="text-gray-100" />
      ) : (
        <MyIcon name="Plus" size={24} className="text-gray-100" />
      )}
    </Button>
  );
}
