import { Text, View } from "react-native";
import { Calendar } from "react-native-calendars";

export type CalendarDayProp = {
  selected?: boolean;
  marked?: boolean;
  selectedColor?: string;
  activeOpacity?: number;
  disabled?: boolean;
  disableTouchEvent?: boolean;
  dots?: {
    key: string;
    color: string;
  }[];
};

export type MyCalendarProps = {
  data: {
    [day: string]: CalendarDayProp;
  };
  label: string;
  onDayPress?: (day: any) => void;
};

export default function MyCalendar({ data, label, onDayPress }: MyCalendarProps) {
  return (
    <View className="p-4 m-auto bg-card my-2 rounded-md border border-muted">
      <Text className="text-start text-xl font-bold text-foreground">{label}</Text>
      <Calendar
        hideArrows
        disableMonthChange
        markedDates={data}
        markingType={"multi-dot"}
        hideExtraDays={true}
        firstDay={1}
        onDayPress={onDayPress}
        theme={{
          textSectionTitleColor: "var(--foreground)",
          textSectionTitleDisabledColor: "var(--muted)",
          dayTextColor: "var(--foreground)",
          textDisabledColor: "var(--muted)",
          textInactiveColor: "var(--muted)",
          backgroundColor: "transparent",
          calendarBackground: "transparent",
          monthTextColor: "var(--foreground)",
        }}
      />
    </View>
  );
}
