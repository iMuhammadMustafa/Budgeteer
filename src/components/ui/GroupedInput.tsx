/**
 * GroupedInput — the signed amount field. A colored mode chip (plus / minus /
 * transfer) and a numeric input share one rounded border; typing a leading "-"
 * flips the mode to minus. A trailing calculator button opens the §10
 * CalculatorModal and writes its result back through the same parse path.
 *
 *   <GroupedInput amount={amount} onChange={setAmount} mode={mode} onModeChange={setMode} />
 *
 * Ports the legacy `elements/AmountInput` 1:1 onto the new ui primitives + tokens,
 * adding the calculator trigger. Sign/parse logic stays in `utils/amount.helper`.
 */
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, TextInput, View } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import { useTheme } from "@/src/providers/ThemeProvider";
import {
  AmountMode,
  formatAmountForInput,
  getAmountMode,
  parseAmountInput,
} from "@/src/utils/amount.helper";
import { Calculator } from "./Calculator";
import { Text } from "./Text";
import { cn } from "./utils/cn";
import { triggerHaptic } from "./utils/haptic";

export interface GroupedInputProps {
  amount: number;
  onChange: (amount: number) => void;
  /** Optional explicit mode. Falls back to deriving from the sign of `amount`. */
  mode?: AmountMode;
  onModeChange?: (mode: AmountMode) => void;
  /**
   * When false (e.g. Income / Transfer), typing a leading `-` will not flip mode
   * and the chip toggle is disabled.
   */
  allowNegativeFlip?: boolean;
  /** Show the calculator trigger (default true). */
  showCalculator?: boolean;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  testID?: string;
  /** TextInput test id (kept separate so E2E selectors stay stable). */
  inputTestID?: string;
}

export function GroupedInput({
  amount,
  onChange,
  mode,
  onModeChange,
  allowNegativeFlip = true,
  showCalculator = true,
  label,
  placeholder = "0.00",
  error,
  disabled = false,
  className,
  testID = "grouped-input",
  inputTestID = "amount-input",
}: GroupedInputProps) {
  const { colors } = useTheme();
  const resolvedMode: AmountMode = mode ?? getAmountMode(amount);
  const isMinus = resolvedMode === "minus";
  const isTransfer = resolvedMode === "transfer";

  const chipColor = isTransfer ? colors.info : isMinus ? colors.danger : colors.success;
  const chipIcon = isMinus ? "Minus" : isTransfer ? "ArrowRightLeft" : "Plus";
  const toggleDisabled = disabled || !allowNegativeFlip || isTransfer;

  // Keep the display string local so partial input ("0.") isn't wiped each keystroke.
  // Re-sync from props on blur or when the upstream amount changes to something we didn't type.
  const [displayValue, setDisplayValue] = useState<string>(formatAmountForInput(amount));
  const isFocusedRef = useRef(false);
  const lastEmittedRef = useRef<number>(amount);

  useEffect(() => {
    if (isFocusedRef.current) return;
    if (amount === lastEmittedRef.current) return;
    setDisplayValue(formatAmountForInput(amount));
    lastEmittedRef.current = amount;
  }, [amount]);

  const emit = (next: number, nextMode?: AmountMode) => {
    if (nextMode && nextMode !== resolvedMode) onModeChange?.(nextMode);
    lastEmittedRef.current = next;
    onChange(next);
  };

  const handleToggle = () => {
    if (toggleDisabled) return;
    triggerHaptic("selection");
    const nextMode: AmountMode = isMinus ? "plus" : "minus";
    const abs = Math.abs(amount ?? 0);
    const next = nextMode === "minus" ? (abs === 0 ? -0 : -abs) : abs;
    emit(next, nextMode);
  };

  const handleTextChange = (val: string) => {
    const parsed = parseAmountInput(val, resolvedMode, { allowNegativeFlip });
    setDisplayValue(parsed.rawString);
    emit(parsed.amount, parsed.mode);
  };

  // Calculator returns a result string; route it through the same parse path so the
  // mode chip and sign stay consistent (a negative result flips to minus when allowed).
  const handleCalculatorSubmit = (value: string) => {
    const parsed = parseAmountInput(value, resolvedMode, { allowNegativeFlip });
    setDisplayValue(parsed.rawString);
    emit(parsed.amount, parsed.mode);
  };

  return (
    <View className={cn("w-full", className)} testID={testID}>
      {label ? (
        <Text variant="label" className="mb-[7px]">
          {label}
        </Text>
      ) : null}
      <View className="flex-row items-center gap-2">
        <View
          className={cn(
            "flex-1 flex-row items-stretch overflow-hidden rounded-lg border bg-surface",
            error ? "border-danger" : "border-border",
            disabled && "opacity-50",
          )}
        >
          <Pressable
            onPress={handleToggle}
            disabled={toggleDisabled}
            accessibilityRole="button"
            accessibilityLabel={`Toggle amount sign, currently ${resolvedMode}`}
            testID="btn-amount-mode-toggle"
            className="items-center justify-center px-3.5 active:opacity-80"
            style={{ backgroundColor: chipColor }}
          >
            <MyIcon name={chipIcon} size={16} color="#FFFFFF" />
          </Pressable>
          <TextInput
            value={displayValue}
            onChangeText={handleTextChange}
            onFocus={() => {
              isFocusedRef.current = true;
            }}
            onBlur={() => {
              isFocusedRef.current = false;
              setDisplayValue(formatAmountForInput(amount));
            }}
            placeholder={placeholder}
            placeholderTextColor={colors.inkFaint}
            selectionColor={colors.primary}
            keyboardType="decimal-pad"
            editable={!disabled}
            testID={inputTestID}
            className="flex-1 px-3 py-3 font-mono text-body text-ink"
            style={Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : undefined}
          />
        </View>
        {showCalculator ? (
          <Calculator
            onSubmit={handleCalculatorSubmit}
            initialValue={Math.abs(amount ?? 0)}
            triggerTestID="btn-amount-calculator"
          />
        ) : null}
      </View>
      {error ? <Text className="mt-[5px] font-sans text-xs text-danger">{error}</Text> : null}
    </View>
  );
}
