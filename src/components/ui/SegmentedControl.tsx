/**
 * SegmentedControl — the Expense / Income / Transfer (success/danger/info) style
 * switcher, and the Summary period switcher. Active segment fills with its tone
 * color + white text; changing selection fires a selection haptic.
 *
 * Uses Pressable (not Button): segments are a custom toggle with an active fill,
 * not labeled-action buttons, so Button's variants/haptics don't apply per-item.
 *
 *   <SegmentedControl
 *     options={[{ key: "expense", label: "Expense", tone: "danger" }, …]}
 *     value={type} onChange={setType}
 *   />
 */
import { Pressable, View } from "react-native";

import { cn } from "./utils/cn";
import { Text } from "./Text";
import { triggerHaptic } from "./utils/haptic";

type Tone = "primary" | "success" | "danger" | "info";
export type Segment = { key: string; label: string; tone?: Tone };

const ACTIVE_BG: Record<Tone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  danger: "bg-danger",
  info: "bg-info",
};

export interface SegmentedControlProps {
  options: Segment[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
  testID?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  className = "",
  testID = "segmented-control",
}: SegmentedControlProps) {
  return (
    <View testID={testID} className={cn("flex-row rounded-xl border border-border bg-surface-alt p-1", className)}>
      {options.map(opt => {
        const active = opt.key === value;
        const tone = opt.tone ?? "primary";
        return (
          <Pressable
            key={opt.key}
            testID={`${testID}-${opt.key}`}
            onPress={() => {
              if (active) return;
              triggerHaptic("selection");
              onChange(opt.key);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            className={cn("flex-1 items-center rounded-lg py-2.5", active ? ACTIVE_BG[tone] : "bg-transparent")}
          >
            <Text selectable={false} className={cn("font-sans-bold text-sm", active ? "text-white" : "text-ink-mute")}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
