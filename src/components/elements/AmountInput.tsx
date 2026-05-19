import * as Haptics from "expo-haptics";
import { Platform, Pressable, TextInput, View } from "react-native";
import { AmountMode, formatAmountForInput, getAmountMode, parseAmountInput } from "@/src/utils/amount.helper";
import MyIcon from "./MyIcon";

interface AmountInputProps {
  amount: number;
  onChange: (amount: number) => void;
  /** Optional explicit mode. Falls back to deriving from the sign of `amount`. */
  mode?: AmountMode;
  onModeChange?: (mode: AmountMode) => void;
  /**
   * When false (e.g. Income / Transfer), typing a leading `-` will not flip mode and the
   * toggle button is disabled.
   */
  allowNegativeFlip?: boolean;
  placeholder?: string;
  testID?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * A single-unit amount field: a colored mode chip on the left and a numeric input on the right
 * sharing one border. Typing a leading `-` flips the mode to minus.
 */
export default function AmountInput({
  amount,
  onChange,
  mode,
  onModeChange,
  allowNegativeFlip = true,
  placeholder = "0.00",
  testID,
  className,
  disabled = false,
}: AmountInputProps) {
  const resolvedMode: AmountMode = mode ?? getAmountMode(amount);
  const isMinus = resolvedMode === "minus";
  const isTransfer = resolvedMode === "transfer";

  const chipBg = isTransfer ? "bg-info-400" : isMinus ? "bg-danger-400" : "bg-success-400";

  const handleToggle = () => {
    if (disabled || !allowNegativeFlip || isTransfer) return;
    if (Platform.OS !== "web") Haptics.selectionAsync();
    const nextMode: AmountMode = isMinus ? "plus" : "minus";
    onModeChange?.(nextMode);
    const abs = Math.abs(amount ?? 0);
    onChange(nextMode === "minus" ? (abs === 0 ? -0 : -abs) : abs);
  };

  const handleTextChange = (val: string) => {
    const parsed = parseAmountInput(val, resolvedMode, { allowNegativeFlip });
    if (parsed.mode !== resolvedMode) onModeChange?.(parsed.mode);
    onChange(parsed.amount);
  };

  return (
    <View
      className={`flex-row items-stretch border border-input-border rounded-md overflow-hidden bg-input-bg ${className ?? ""}`}
    >
      <Pressable
        onPress={handleToggle}
        disabled={disabled || !allowNegativeFlip || isTransfer}
        accessibilityLabel={`Toggle amount sign, currently ${resolvedMode}`}
        testID="btn-amount-mode-toggle"
        className={`${chipBg} justify-center items-center px-3`}
      >
        <MyIcon name={isMinus ? "Minus" : isTransfer ? "ArrowRightLeft" : "Plus"} size={18} className="text-white" />
      </Pressable>
      <TextInput
        className="flex-1 px-3 py-2 text-foreground"
        placeholder={placeholder}
        value={formatAmountForInput(amount)}
        onChangeText={handleTextChange}
        keyboardType="decimal-pad"
        editable={!disabled}
        testID={testID}
      />
    </View>
  );
}
