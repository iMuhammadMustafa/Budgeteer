import { useTheme } from "@/src/providers/ThemeProvider";
import { MyCalendarProps } from "@/src/types/components/Charts.types";
import { useMemo } from "react";
import { Text, View } from "react-native";
import { Calendar } from "react-native-calendars";

export default function MyCalendar({ data, label, onDayPress, selectedDate, currentDate }: MyCalendarProps) {
  const themeContext = useTheme();

  const textColor = themeContext.isDarkMode ? "white" : "black";

  // Combine markedDates with the selectedDate highlighted
  const markedDates = { ...data };
  if (selectedDate) {
    // Add or update the selected date with a special style
    markedDates[selectedDate] = {
      ...(markedDates[selectedDate] || {}),
      selected: true,
      selectedColor: "#0000ff", // Blue color for selection
    };
  }

  // Memoize the theme object for the Calendar
  const calendarTheme = useMemo(() => {
    return {
      textSectionTitleColor: textColor,
      textSectionTitleDisabledColor: "grey",
      dayTextColor: textColor,
      textDisabledColor: "grey",
      textInactiveColor: "grey",
      backgroundColor: "transparent",
      calendarBackground: "transparent",
      monthTextColor: textColor,
    };
  }, [textColor]);

  return (
    <View className="mx-6">
      <Text className="text-center text-xl font-bold text-foreground">{label}</Text>
      <Calendar
        key={currentDate} // Force re-render when month changes
        hideArrows
        disableMonthChange
        current={currentDate}
        markedDates={markedDates}
        markingType={"multi-dot"}
        hideExtraDays={true}
        firstDay={1}
        onDayPress={onDayPress}
        theme={calendarTheme}
      />
    </View>
  );
}
