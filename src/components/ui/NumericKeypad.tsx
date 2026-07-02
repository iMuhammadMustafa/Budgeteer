/**
 * NumericKeypad — plain digit-entry grid (1-9, ., 0, backspace). Does no
 * arithmetic; callers interpret each key press. Used by `AmountKeypadInput`
 * for on-screen magnitude entry where a physical keyboard isn't guaranteed
 * (native, or narrow web).
 */
import { Pressable, View } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import { useTheme } from "@/src/providers/ThemeProvider";
import { Text } from "./Text";
import { cn } from "./utils/cn";
import { triggerHaptic } from "./utils/haptic";

export type NumericKeypadKey = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "." | "backspace";

const ROWS: NumericKeypadKey[][] = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "backspace"],
];

export interface NumericKeypadProps {
  onPress: (key: NumericKeypadKey) => void;
  disabled?: boolean;
  testID?: string;
}

export function NumericKeypad({ onPress, disabled = false, testID = "keypad" }: NumericKeypadProps) {
  const { colors } = useTheme();
  return (
    <View testID={testID} className="gap-2">
      {ROWS.map((row, i) => (
        <View key={i} className="flex-row gap-2">
          {row.map(key => (
            <Pressable
              key={key}
              disabled={disabled}
              onPress={() => {
                triggerHaptic("selection");
                onPress(key);
              }}
              accessibilityRole="button"
              accessibilityLabel={key === "backspace" ? "Delete last digit" : key === "." ? "Decimal point" : key}
              testID={`${testID}-${key === "." ? "dot" : key}`}
              className={cn(
                "h-14 flex-1 items-center justify-center rounded-xl bg-surface-alt active:opacity-70",
                disabled && "opacity-40",
              )}
            >
              {key === "backspace" ? (
                <MyIcon name="Delete" size={20} color={colors.inkMute} />
              ) : (
                <Text className="text-h3 text-ink" selectable={false}>
                  {key}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}
