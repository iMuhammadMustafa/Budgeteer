/**
 * CalendarHeatmap — month grid with per-day activity dots (e.g. daily spending).
 * Themed react-native-calendars (kept per the charts decision). Reserves 6-week
 * height so paging months doesn't resize; has a pulsing loading skeleton.
 *
 *   <CalendarHeatmap markedDates={byDay} selectedDate={sel} onDayPress={setSel} />
 */
import { View } from "react-native";
import { Calendar } from "react-native-calendars";

import { useTheme } from "@/src/providers/ThemeProvider";
import { Pulse } from "../Pulse";
import { cn } from "../utils/cn";

export interface HeatmapMarking {
  dots?: { key?: string; color: string; selectedDotColor?: string }[];
  selected?: boolean;
  marked?: boolean;
  selectedColor?: string;
}
export type HeatmapMarkedDates = Record<string, HeatmapMarking>;

export interface CalendarHeatmapProps {
  markedDates?: HeatmapMarkedDates;
  currentDate?: string;
  selectedDate?: string | null;
  onDayPress?: (dateString: string) => void;
  /** Fires when the visible month changes (the calendar's own arrows/swipe). */
  onMonthChange?: (dateString: string) => void;
  minDate?: string;
  maxDate?: string;
  loading?: boolean;
  className?: string;
  testID?: string;
}

export function CalendarHeatmap({
  markedDates,
  currentDate,
  selectedDate,
  onDayPress,
  onMonthChange,
  minDate,
  maxDate,
  loading = false,
  className,
  testID = "calendar-heatmap",
}: CalendarHeatmapProps) {
  const { colors } = useTheme();

  if (loading) {
    return (
      <Pulse>
        <View testID={testID} className={cn("gap-2", className)} style={{ minHeight: 366 }}>
          {Array.from({ length: 6 }).map((_, r) => (
            <View key={r} className="flex-row gap-2">
              {Array.from({ length: 7 }).map((_, c) => (
                <View key={c} style={{ backgroundColor: colors.surfaceAlt }} className="h-9 flex-1 rounded-md" />
              ))}
            </View>
          ))}
        </View>
      </Pulse>
    );
  }

  const marked: HeatmapMarkedDates = {
    ...markedDates,
    ...(selectedDate
      ? { [selectedDate]: { ...(markedDates?.[selectedDate] ?? {}), selected: true, selectedColor: colors.primary } }
      : {}),
  };

  return (
    <View testID={testID} className={cn("w-full", className)} style={{ minHeight: 366 }}>
      <Calendar
        current={selectedDate ?? currentDate}
        minDate={minDate}
        maxDate={maxDate}
        markingType="multi-dot"
        markedDates={marked as never}
        onDayPress={d => onDayPress?.(d.dateString)}
        onMonthChange={m => onMonthChange?.(m.dateString)}
        enableSwipeMonths
        theme={{
          calendarBackground: colors.surface,
          monthTextColor: colors.ink,
          textSectionTitleColor: colors.inkMute,
          dayTextColor: colors.ink,
          textDisabledColor: colors.inkFaint,
          todayTextColor: colors.primary,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: "#FFFFFF",
          arrowColor: colors.ink,
        }}
      />
    </View>
  );
}
