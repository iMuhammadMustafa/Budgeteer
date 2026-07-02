/**
 * AmountKeypadInput — magnitude-only amount entry with a big signed display.
 * The sign shown/emitted comes from `mode` (a real toggle when `onModeChange`
 * is passed — tap the chip to flip it); the value emitted via `onChange` is
 * always >= 0, matching `GroupedInput`'s split of "magnitude" vs "sign".
 *
 * On wide web (≥640px — the same threshold `usePresentedOverlay` uses for its
 * popover/sheet switch, so every responsive control in a form flips at the
 * same width) it's a plain typable field — a physical keyboard makes an
 * on-screen keypad redundant there. Below that (incl. all native) it shows a
 * non-editable display plus a `NumericKeypad`. Both paths funnel through
 * `parseAmountInput` so digit-cap/decimal rules stay identical either way.
 */
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, TextInput, useWindowDimensions, View } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import { useTheme } from "@/src/providers/ThemeProvider";
import { formatAmountForInput, parseAmountInput, type AmountMode } from "@/src/utils/amount.helper";
import { Calculator } from "./Calculator";
import { NumericKeypad, type NumericKeypadKey } from "./NumericKeypad";
import { Text } from "./Text";
import { cn } from "./utils/cn";
import { triggerHaptic } from "./utils/haptic";

export type AmountKeypadTone = "success" | "danger" | "info";

const TONE_TEXT: Record<AmountKeypadTone, string> = {
  success: "text-success",
  danger: "text-danger",
  info: "text-info",
};
const TONE_BG: Record<AmountKeypadTone, string> = {
  success: "bg-success",
  danger: "bg-danger",
  info: "bg-info",
};

// The auto breakpoint used by usePresentedOverlay (Select/DateTimePicker/QuickPills' "auto").
const WIDE_WEB_MIN_WIDTH = 640;

export interface AmountKeypadInputProps {
  /** Always >= 0; sign is conveyed separately via `mode`. */
  value: number;
  onChange: (value: number) => void;
  mode: Exclude<AmountMode, "transfer">;
  /** When provided, a tappable sign chip lets the user override the sign. */
  onModeChange?: (mode: Exclude<AmountMode, "transfer">) => void;
  /** Defaults to danger/success from `mode` when omitted. */
  tone?: AmountKeypadTone;
  currencySymbol?: string;
  maxValue?: number;
  showCalculator?: boolean;
  label?: string;
  error?: string;
  testID?: string;
}

export function AmountKeypadInput({
  value,
  onChange,
  mode,
  onModeChange,
  tone,
  currencySymbol = "$",
  maxValue = 999999999.99,
  showCalculator = true,
  label,
  error,
  testID = "amount-keypad",
}: AmountKeypadInputProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === "web" && width >= WIDE_WEB_MIN_WIDTH;

  const sign = mode === "minus" ? "-" : "+";
  const resolvedTone = tone ?? (mode === "minus" ? "danger" : "success");

  const [raw, setRaw] = useState(() => formatAmountForInput(value));
  const isFocusedRef = useRef(false);
  const lastEmittedRef = useRef(value);

  useEffect(() => {
    if (isFocusedRef.current) return;
    if (value === lastEmittedRef.current) return;
    setRaw(formatAmountForInput(value));
    lastEmittedRef.current = value;
  }, [value]);

  const commit = (nextRaw: string) => {
    const parsed = parseAmountInput(nextRaw, "plus", { allowNegativeFlip: false });
    const abs = Math.abs(parsed.amount);
    if (abs > maxValue) return;
    setRaw(parsed.rawString);
    lastEmittedRef.current = abs;
    onChange(abs);
  };

  const handleKeypad = (key: NumericKeypadKey) => {
    if (key === "backspace") {
      commit(raw.slice(0, -1));
      return;
    }
    if (key === "." && raw.includes(".")) return;
    commit(raw + key);
  };

  const toggleMode = () => {
    if (!onModeChange) return;
    triggerHaptic("selection");
    onModeChange(mode === "minus" ? "plus" : "minus");
  };

  return (
    <View testID={testID}>
      {label ? (
        <Text variant="label" className="mb-[7px]">
          {label}
        </Text>
      ) : null}
      <View className={cn("rounded-xl border bg-surface p-4", error ? "border-danger" : "border-border")}>
        <View className="flex-row items-center justify-between gap-2">
          <View className="min-w-0 flex-1 flex-row items-center gap-3">
            {onModeChange ? (
              <Pressable
                onPress={toggleMode}
                accessibilityRole="button"
                accessibilityLabel={`Toggle amount sign, currently ${mode}`}
                testID={`${testID}-mode-toggle`}
                className={cn("h-9 w-9 items-center justify-center rounded-full active:opacity-80", TONE_BG[resolvedTone])}
              >
                <MyIcon name={mode === "minus" ? "Minus" : "Plus"} size={16} color="#FFFFFF" />
              </Pressable>
            ) : null}
            <View className="min-w-0 flex-1">
              {isWideWeb ? (
                <View className="flex-row items-center gap-1">
                  <Text className={cn("font-mono-semibold text-h2", TONE_TEXT[resolvedTone])} selectable={false}>
                    {sign}
                    {currencySymbol}
                  </Text>
                  <TextInput
                    value={raw}
                    onChangeText={commit}
                    onFocus={() => {
                      isFocusedRef.current = true;
                    }}
                    onBlur={() => {
                      isFocusedRef.current = false;
                      setRaw(formatAmountForInput(value));
                    }}
                    placeholder="0.00"
                    placeholderTextColor={colors.inkFaint}
                    selectionColor={colors.primary}
                    keyboardType="decimal-pad"
                    testID={`${testID}-input`}
                    className={cn("min-w-0 flex-1 p-0 font-mono-semibold text-h2", TONE_TEXT[resolvedTone])}
                    style={{ outlineStyle: "none" } as object}
                  />
                </View>
              ) : (
                <Text
                  className={cn("font-mono-semibold text-h1", TONE_TEXT[resolvedTone])}
                  numberOfLines={1}
                  selectable={false}
                >
                  {sign}
                  {currencySymbol}
                  {raw || "0"}
                </Text>
              )}
            </View>
          </View>
          {showCalculator ? (
            <Calculator onSubmit={commit} initialValue={value} triggerTestID={`${testID}-calculator`} />
          ) : null}
        </View>
      </View>
      {error ? <Text className="mt-[5px] font-sans text-xs text-danger">{error}</Text> : null}
      {!isWideWeb ? (
        <View className="mt-3">
          <NumericKeypad onPress={handleKeypad} testID={`${testID}-keypad`} />
        </View>
      ) : null}
    </View>
  );
}
