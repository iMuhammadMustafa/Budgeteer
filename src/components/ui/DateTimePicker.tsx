/**
 * DateTimePicker — calendar + optional time-of-day, hosted in the overlay
 * (popover on wide screens, sheet on narrow). Built on react-native-calendars,
 * themed to Sage Paper. Output is a full ISO timestamp string.
 *
 *   <DateTimePicker value={iso} onChange={setIso} withTime />
 *
 * `ui/DatePicker` stays date-only (ISO "YYYY-MM-DD"); this is the date+time
 * equivalent of the legacy `elements/MyDateTimePicker`.
 */
import dayjs from "dayjs";
import { useState } from "react";
import { Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { Calendar } from "react-native-calendars";

import MyIcon from "@/src/components/elements/MyIcon";
import { useTheme } from "@/src/providers/ThemeProvider";
import { Button } from "./Button";
import { SegmentedControl } from "./SegmentedControl";
import { Text } from "./Text";
import { usePresentedOverlay, type OverlayPresent } from "./overlay/usePresentedOverlay";
import { cn } from "./utils/cn";

export interface DateTimePickerProps {
  /** ISO timestamp string. */
  value?: string | null;
  onChange: (iso: string) => void;
  label?: string;
  placeholder?: string;
  /** Include hour/minute selection (default true). When false, behaves date-only. */
  withTime?: boolean;
  present?: OverlayPresent;
  minDate?: string;
  maxDate?: string;
  /** dayjs format for the trigger text (default depends on withTime). */
  displayFormat?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  testID?: string;
}

const clampHour = (h: number) => ((h % 12) + 12) % 12 || 12;

export function DateTimePicker({
  value,
  onChange,
  label,
  placeholder = "Select date",
  withTime = true,
  present,
  minDate,
  maxDate,
  displayFormat,
  error,
  disabled = false,
  className,
  testID = "datetime-picker",
}: DateTimePickerProps) {
  const { colors } = useTheme();
  const fmt = displayFormat ?? (withTime ? "MMM D, YYYY · h:mm A" : "MMM D, YYYY");

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
    title: label ?? "Select date",
    renderContent: (close, contentMaxHeight) => (
      <DateTimeContent
        value={value}
        withTime={withTime}
        minDate={minDate}
        maxDate={maxDate}
        calendarTheme={calendarTheme}
        primary={colors.primary}
        inkFaint={colors.inkFaint}
        contentMaxHeight={contentMaxHeight}
        onConfirm={iso => {
          onChange(iso);
          close();
        }}
      />
    ),
  });

  const display = value ? dayjs(value).format(fmt) : placeholder;

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

function DateTimeContent({
  value,
  withTime,
  minDate,
  maxDate,
  calendarTheme,
  primary,
  inkFaint,
  contentMaxHeight,
  onConfirm,
}: {
  value?: string | null;
  withTime: boolean;
  minDate?: string;
  maxDate?: string;
  calendarTheme: object;
  primary: string;
  inkFaint: string;
  contentMaxHeight: number;
  onConfirm: (iso: string) => void;
}) {
  const initial = value ? dayjs(value) : dayjs();
  const [day, setDay] = useState(initial.format("YYYY-MM-DD"));
  const [hour12, setHour12] = useState(clampHour(initial.hour())); // 1..12
  const [minute, setMinute] = useState(initial.minute());
  const [meridiem, setMeridiem] = useState<"AM" | "PM">(initial.hour() >= 12 ? "PM" : "AM");

  const buildIso = () => {
    let d = dayjs(day);
    if (withTime) {
      const h24 = (hour12 % 12) + (meridiem === "PM" ? 12 : 0);
      d = d.hour(h24).minute(minute).second(0).millisecond(0);
    } else {
      d = d.startOf("day");
    }
    return d.toISOString();
  };

  return (
    <ScrollView showsVerticalScrollIndicator style={{ maxHeight: contentMaxHeight }}>
      <View className="max-w-full p-1" style={{ minHeight: 366 }}>
        <Calendar
          current={day || minDate || undefined}
          minDate={minDate}
          maxDate={maxDate}
          onDayPress={d => setDay(d.dateString)}
          markedDates={day ? { [day]: { selected: true, selectedColor: primary } } : undefined}
          enableSwipeMonths
          theme={calendarTheme}
        />

        {withTime ? (
          <View className="mt-3 gap-2">
            <Text variant="label">Time</Text>
            <View className="flex-row items-center gap-2">
              <TimeField key={`h-${hour12}`} value={hour12} min={1} max={12} onCommit={v => setHour12(clampHour(v))} testID="time-hour" inkFaint={inkFaint} />
              <Text className="text-h3 text-ink">:</Text>
              <TimeField
                key={`m-${minute}`}
                value={minute}
                min={0}
                max={59}
                pad
                onCommit={v => setMinute(Math.max(0, Math.min(59, v)))}
                testID="time-minute"
                inkFaint={inkFaint}
              />
              <View className="ml-2 flex-1">
                <SegmentedControl
                  options={[
                    { key: "AM", label: "AM" },
                    { key: "PM", label: "PM" },
                  ]}
                  value={meridiem}
                  onChange={v => setMeridiem(v as "AM" | "PM")}
                  testID="time-meridiem"
                />
              </View>
            </View>
          </View>
        ) : null}

        <View className="mt-3 flex-row gap-2">
          <Button
            label="Today"
            variant="outline"
            className="flex-1"
            onPress={() => {
              const now = dayjs();
              setDay(now.format("YYYY-MM-DD"));
              if (withTime) {
                setHour12(clampHour(now.hour()));
                setMinute(now.minute());
                setMeridiem(now.hour() >= 12 ? "PM" : "AM");
              }
            }}
            testID="btn-datetime-today"
          />
          <Button label="Confirm" className="flex-1" onPress={() => onConfirm(buildIso())} testID="btn-datetime-confirm" />
        </View>
      </View>
    </ScrollView>
  );
}

function TimeField({
  value,
  min,
  max,
  pad = false,
  onCommit,
  testID,
  inkFaint,
}: {
  value: number;
  min: number;
  max: number;
  pad?: boolean;
  onCommit: (v: number) => void;
  testID: string;
  inkFaint: string;
}) {
  // Remounted via `key` when the committed value changes from outside (e.g. Today).
  const [text, setText] = useState(pad ? String(value).padStart(2, "0") : String(value));

  return (
    <TextInput
      value={text}
      onChangeText={t => setText(t.replace(/[^0-9]/g, "").slice(0, 2))}
      onBlur={() => {
        const n = Number(text);
        const next = Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min;
        onCommit(next);
        setText(pad ? String(next).padStart(2, "0") : String(next));
      }}
      keyboardType="number-pad"
      selectionColor={inkFaint}
      testID={testID}
      className="w-12 rounded-lg border border-border bg-surface px-2 py-2 text-center font-mono text-body text-ink"
      style={Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : undefined}
    />
  );
}
