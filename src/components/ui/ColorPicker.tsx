/**
 * ColorPicker — swatch-grid picker for a category/account accent color. The
 * selected color is a raw hex (stored on the DB record). Defaults to the design
 * system's category palette; pass `colors` to override. Presentation follows the
 * responsive overlay rule (popover on wide screens, sheet on narrow).
 *
 *   <ColorPicker label="Color" value={hex} onChange={setHex} />
 */
import { Pressable, ScrollView, View } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import { useTheme } from "@/src/providers/ThemeProvider";
import { usePresentedOverlay, type OverlayPresent } from "./overlay/usePresentedOverlay";
import { Text } from "./Text";
import { categoryColors } from "./theme/tokens";
import { cn } from "./utils/cn";

/** Default palette = the design system's category accent colors (deduped). */
const DEFAULT_PALETTE = Array.from(new Set(Object.values(categoryColors).map(c => c.fg)));

/** Pick a check-mark color that stays legible on the swatch (WCAG-ish luminance). */
function checkColorOn(hex: string): string {
  const h = hex.replace("#", "");
  const f =
    h.length === 3
      ? h
          .split("")
          .map(c => c + c)
          .join("")
      : h.slice(0, 6);
  const ch = (i: number) => parseInt(f.slice(i, i + 2), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const L = 0.2126 * lin(ch(0)) + 0.7152 * lin(ch(2)) + 0.0722 * lin(ch(4));
  // White check only on dark swatches; dark check on light/mid swatches (mid-tones fail white).
  return L < 0.18 || Number.isNaN(L) ? "#FFFFFF" : "#1A1A1A";
}

export interface ColorPickerProps {
  value?: string | null;
  onChange: (hex: string) => void;
  colors?: string[]; /** Hex swatches to offer. Defaults to the category palette. */
  label?: string;
  present?: OverlayPresent;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  testID?: string;
}

export function ColorPicker({
  value,
  onChange,
  colors: palette = DEFAULT_PALETTE,
  label,
  present,
  placeholder = "Pick a color",
  disabled = false,
  className,
  testID = "color-picker",
}: ColorPickerProps) {
  const { colors } = useTheme();

  const { triggerRef, openOverlay } = usePresentedOverlay({
    present,
    title: label ?? "Choose a color",
    renderContent: (close, contentMaxHeight) => (
      <ScrollView showsVerticalScrollIndicator style={{ maxHeight: contentMaxHeight }}>
        <View className="flex-row flex-wrap gap-2.5 p-4">
          {palette.map(c => {
            const selected = !!value && c.toLowerCase() === value.toLowerCase();
            return (
              <Pressable
                key={c}
                onPress={() => {
                  onChange(c);
                  close();
                }}
                accessibilityRole="button"
                accessibilityLabel={c}
                accessibilityState={{ selected }}
                testID={`${testID}-swatch-${c}`}
                className={cn(
                  "h-10 w-10 items-center justify-center rounded-full active:opacity-80",
                  selected && "border-2 border-ink",
                )}
                style={{ backgroundColor: c }}
              >
                {selected ? <MyIcon name="Check" size={18} color={checkColorOn(c)} /> : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    ),
  });

  return (
    <View className={cn("w-full", className)}>
      {label ? (
        <Text variant="label" className="mb-[7px]">
          {label}
        </Text>
      ) : null}
      <Pressable
        ref={triggerRef}
        onPress={() => !disabled && openOverlay()}
        disabled={disabled}
        accessibilityRole="button"
        testID={testID}
        className={cn(
          "flex-row items-center gap-3 rounded-lg border border-border bg-surface px-3 py-3 active:opacity-90",
          disabled && "opacity-50",
        )}
      >
        <View
          className="h-6 w-6 rounded-full border border-border"
          style={{ backgroundColor: value ?? colors.surfaceAlt }}
        />
        <Text
          className={cn("min-w-0 flex-1 font-mono text-body", value ? "text-ink" : "text-ink-faint")}
          numberOfLines={1}
        >
          {value ?? placeholder}
        </Text>
        <MyIcon name="ChevronDown" size={18} color={colors.inkFaint} />
      </Pressable>
    </View>
  );
}
