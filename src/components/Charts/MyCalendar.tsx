import { Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { MyCalendarProps } from "@/src/types/components/Charts.types";
import { useTheme } from "@/src/providers/ThemeProvider";

export default function MyCalendar({ data, label, onDayPress, selectedDate }: MyCalendarProps) {
  const theme = useTheme();

  const foreground = theme.isDarkMode ? "white" : "black";
  
  // Combine markedDates with the selectedDate highlighted
  const markedDates = { ...data };
  if (selectedDate) {
    // Add or update the selected date with a special style
    markedDates[selectedDate] = {
      ...(markedDates[selectedDate] || {}),
      selected: true,
      selectedColor: '#0000ff', // Blue color for selection
    };
  }

  return (
    <View className="p-4 m-auto bg-card my-2 rounded-md border border-muted">
      <Text className="text-start text-xl font-bold text-foreground">{label}</Text>
      <Calendar
        hideArrows
        disableMonthChange
        markedDates={markedDates}
        markingType={"multi-dot"}
        hideExtraDays={true}
        firstDay={1}
        onDayPress={onDayPress}
        theme={{
          textSectionTitleColor: foreground,
          textSectionTitleDisabledColor: "grey",
          dayTextColor: foreground,
          textDisabledColor: "grey",
          textInactiveColor: "grey",
          backgroundColor: "transparent",
          calendarBackground: "transparent",
          monthTextColor: foreground,
        }}
      />
    </View>
  );
}
