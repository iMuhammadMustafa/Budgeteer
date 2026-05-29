import { AmountMode, formatAmountForInput, getAmountMode, parseAmountInput } from "@/src/utils/amount.helper";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Platform, TextInput, View } from "react-native";
import Button from "./Button";

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
  testId?: string;
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
  testId = "amount-input-field",
}: AmountInputProps) {
  const resolvedMode: AmountMode = mode ?? getAmountMode(amount);
  const isMinus = resolvedMode === "minus";
  const isTransfer = resolvedMode === "transfer";

  const chipBg = isTransfer ? "bg-info-400" : isMinus ? "bg-danger-400" : "bg-success-400";

  // The display string is kept locally so that partial input like "0." (which parses to 0)
  // doesn't get wiped on every keystroke. We re-sync from props when the input is blurred
  // or when the upstream amount changes to something we didn't just type.
  const [displayValue, setDisplayValue] = useState<string>(formatAmountForInput(amount));
  const isFocusedRef = useRef(false);
  const lastEmittedRef = useRef<number>(amount);

  useEffect(() => {
    if (isFocusedRef.current) return;
    if (amount === lastEmittedRef.current) return;
    setDisplayValue(formatAmountForInput(amount));
    lastEmittedRef.current = amount;
  }, [amount]);

  const handleToggle = () => {
    if (disabled || !allowNegativeFlip || isTransfer) return;
    if (Platform.OS !== "web") Haptics.selectionAsync();
    const nextMode: AmountMode = isMinus ? "plus" : "minus";
    onModeChange?.(nextMode);
    const abs = Math.abs(amount ?? 0);
    const next = nextMode === "minus" ? (abs === 0 ? -0 : -abs) : abs;
    lastEmittedRef.current = next;
    onChange(next);
  };

  const handleTextChange = (val: string) => {
    const parsed = parseAmountInput(val, resolvedMode, { allowNegativeFlip });
    setDisplayValue(parsed.rawString);
    if (parsed.mode !== resolvedMode) onModeChange?.(parsed.mode);
    lastEmittedRef.current = parsed.amount;
    onChange(parsed.amount);
  };

  return (
    <View
      className={`flex-row items-stretch border border-input-border rounded-md overflow-hidden bg-input-bg ${className ?? ""}`}
      testID={testId}
    >
      <Button
        onPress={handleToggle}
        variant="ghost"
        rightIcon={isMinus ? "Minus" : isTransfer ? "ArrowRightLeft" : "Plus"}
        className={`${chipBg} justify-center items-center px-3 rounded-none`}
        iconSize={15}
        iconColor="white"
        testID="btn-amount-mode-toggle"
        accessibilityLabel={`Toggle amount sign, currently ${resolvedMode}`}
        disabled={disabled || !allowNegativeFlip || isTransfer}
      />
      <TextInput
        className="flex-1 px-3 text-foreground"
        placeholder={placeholder}
        value={displayValue}
        onChangeText={handleTextChange}
        onFocus={() => {
          isFocusedRef.current = true;
        }}
        onBlur={() => {
          isFocusedRef.current = false;
          setDisplayValue(formatAmountForInput(amount));
        }}
        keyboardType="decimal-pad"
        editable={!disabled}
        testID={testID}
      />
    </View>
  );
}
