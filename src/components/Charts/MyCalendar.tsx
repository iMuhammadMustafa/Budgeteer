import { useTheme } from "@/src/providers/ThemeProvider";
import { MyCalendarProps } from "@/src/types/components/Charts.types";
import { useMemo } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import { Calendar } from "react-native-calendars";

export default function MyCalendar({ data, label, onDayPress, selectedDate, currentDate }: MyCalendarProps) {
  const themeContext = useTheme();

  const { width } = useWindowDimensions();

  const chartWidth = Math.min(width * 0.95, 600); // Use 95% of width or max 600
  const chartHeight = chartWidth * 0.75;


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
    <View className="mx-6" style={{ width: chartWidth * (width > 700 ? 1.65 : 1) }}>
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
