/**
 * DatePicker — calendar date picker hosted in the overlay (popover on wide
 * screens, sheet on narrow). Built on react-native-calendars, themed to Sage
 * Paper. Value + onChange use ISO date strings ("YYYY-MM-DD").
 *
 *   <DatePicker label="Date" value={iso} onChange={setIso} />
 *
 * Time-of-day selection is a planned follow-up (date only for now).
 */
import dayjs from "dayjs";
import { Pressable, ScrollView, View } from "react-native";
import { Calendar } from "react-native-calendars";

import MyIcon from "@/src/components/elements/MyIcon";
import { useTheme } from "@/src/providers/ThemeProvider";
import { usePresentedOverlay, type OverlayPresent } from "./overlay/usePresentedOverlay";
import { Text } from "./Text";
import { cn } from "./utils/cn";

export interface DatePickerProps {
  /** ISO date "YYYY-MM-DD". */
  value?: string | null;
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  present?: OverlayPresent;
  minDate?: string;
  maxDate?: string;
  /** dayjs format for the trigger text (default "MMM D, YYYY"). */
  displayFormat?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  testID?: string;
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = "Select a date",
  present,
  minDate,
  maxDate,
  displayFormat = "MMM D, YYYY",
  error,
  disabled = false,
  className,
  testID = "date-picker",
}: DatePickerProps) {
  const { colors } = useTheme();

  const calendarTheme = {
    calendarBackground: colors.surface,
    monthTextColor: colors.ink,
    textSectionTitleColor: colors.inkMute,
    dayTextColor: colors.ink,
    textDisabledColor: colors.inkFaint,
    todayTextColor: colors.primary,
    selectedDayBackgroundColor: colors.primary,
    selectedDayTextColor: "#FFFFFF",
    arrowColor: colors.ink,
  };

  const { triggerRef, openOverlay } = usePresentedOverlay({
    present,
    title: label ?? "Select a date",
    renderContent: (close, contentMaxHeight) => (
      <ScrollView showsVerticalScrollIndicator style={{ maxHeight: contentMaxHeight }}>
        {/* Reserve 6-week height (header + weekdays + 6 rows) so months never resize the overlay. */}
        <View className="max-w-full p-1" style={{ minHeight: 366 }}>
          <Calendar
            current={value ?? minDate ?? undefined}
            minDate={minDate}
            maxDate={maxDate}
            onDayPress={d => {
              onChange(d.dateString);
              close();
            }}
            markedDates={value ? { [value]: { selected: true, selectedColor: colors.primary } } : undefined}
            enableSwipeMonths
            theme={calendarTheme}
          />
        </View>
      </ScrollView>
    ),
  });

  const display = value ? dayjs(value).format(displayFormat) : placeholder;

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
          "flex-row items-center gap-3 rounded-lg border bg-surface px-3 py-3 active:opacity-90",
          error ? "border-danger" : "border-border",
          disabled && "opacity-50",
        )}
      >
        <MyIcon name="Calendar" size={16} color={colors.inkFaint} />
        <Text className={cn("min-w-0 flex-1 text-body", value ? "text-ink" : "text-ink-faint")} numberOfLines={1}>
          {display}
        </Text>
        <MyIcon name="ChevronDown" size={18} color={colors.inkFaint} />
      </Pressable>
      {error ? <Text className="mt-[5px] font-sans text-xs text-danger">{error}</Text> : null}
    </View>
  );
}
