import { useRef, useState } from "react";
import { Keyboard, Platform, Pressable, Text, View } from "react-native";

import dayjs from "dayjs";
import DateTimePicker, { DateType } from "react-native-ui-datepicker";
import MyIcon from "./MyIcon";
import MyModal from "./MyModal";

type MyDateTimePickerProps = {
  label?: string;
  date: dayjs.Dayjs | null | undefined;
  onChange: (dateISOString: string | null) => void; // Changed to ISO string or null
  isModal?: boolean;
  showClearButton?: boolean; // Added
  onClear?: () => void; // Added
};

export default function MyDateTimePicker({
  label = "Date",
  date, // Removed default to allow null/undefined
  onChange,
  isModal = Platform.OS !== "web",
  showClearButton = false, // Default to false
  onClear, // Added
}: MyDateTimePickerProps) {
  const [showDate, setShowDate] = useState(false);
  const [pickerDate, setPickerDate] = useState(date ? dayjs(date) : dayjs()); // Internal state for picker
  const hasSetLayout = useRef(false);
  const [buttonLayout, setButtonLayout] = useState({ height: 0, width: 0, top: 0 });

  const onLayout = (event: any) => {
    if (!hasSetLayout.current) {
      const { height, width, y } = event.nativeEvent.layout;
      setButtonLayout({ height, width, top: y });
      hasSetLayout.current = true; // Mark as set
    }
  };
  return (
    <View className="my-1">
      <Text className="text-foreground">{label}</Text>
      <View className="flex-row items-center">
        <Pressable
          onPress={() => {
            Keyboard.dismiss();
            // Ensure pickerDate is valid when opening
            if (!date) setPickerDate(dayjs());
            else setPickerDate(dayjs(date));
            setShowDate(prev => !prev);
          }}
          className="border border-card rounded-md p-3 items-center mb-1 bg-white flex-1" // Changed padding
          onLayout={onLayout}
        >
          <Text selectable={false}>{date ? dayjs(date).format("MMM DD, YYYY") : "Select Date"}</Text>
        </Pressable>
        {showClearButton && date && onClear && (
          <Pressable
            onPress={() => {
              onClear();
              setShowDate(false); // Close picker if open
            }}
            className="p-2 mb-1 ml-1 bg-gray-200 rounded"
          >
            <MyIcon name="X" size={18} className="text-gray-600" />
          </Pressable>
        )}
      </View>

      {showDate && (
        <DateTimePickerContainer
          isVisible={showDate}
          setIsVisible={setShowDate}
          layout={buttonLayout}
          isModal={isModal}
        >
          <DateTimePicker
            mode="single"
            date={pickerDate} // Use internal pickerDate
            showOutsideDays
            className="bg-card text-foreground "
            classNames={{
              today: "border border-primary rounded-full",
              selected: "bg-primary rounded-full",
              disabled: "opacity-50",
              outside: "opacity-50",
              outside_label: "text-gray-500",
              day_label: "text-foreground",
              month_label: "text-foreground font-medium",
              year_label: "text-foreground font-medium",
              header: "bg-background border-b border-border text-foreground",
              selected_month_label: "text-primary font-medium",
            }}
            // timePicker // Removed time picker for date-only as per recurring table
            onChange={(params: { date: DateType }) => {
              // Use DateType from library
              if (params.date) {
                const newDate = dayjs(params.date);
                setPickerDate(newDate); // Update internal picker state
                onChange(newDate.toISOString()); // Pass ISO string back
              } else {
                onChange(null); // Handle case where date is cleared in picker
              }
              // setShowDate(false); // Optionally close on change
            }}
          />
          <View className="mt-2 flex-row space-x-2">
            <Pressable
              onPress={() => {
                const today = dayjs();
                setPickerDate(today);
                onChange(today.toISOString());
              }}
              className="flex-1 p-2 bg-green-100 rounded-md"
            >
              <Text className="text-center text-foreground">Today</Text>
            </Pressable>
            <Pressable onPress={() => setShowDate(false)} className="flex-1 p-2 bg-primary rounded-md">
              <Text className="text-white text-center">Pick</Text>
            </Pressable>
          </View>
        </DateTimePickerContainer>
      )}
    </View>
  );
}

const DateTimePickerContainer = ({
  isVisible,
  setIsVisible,
  children,
  layout,
  isModal,
}: {
  isVisible: boolean;
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
  children: React.ReactNode;
  layout: { height: number; width: number; top: number };
  isModal: boolean;
}) => (
  <>
    {!isModal ? (
      <View className="m-auto">
        <View
          // Use a fixed width based on the measured button layout so the picker
          // doesn't jump when month label width changes. Guard against 0 width.
          style={{ width: layout.width > 0 ? layout.width / 2 : undefined }}
        >
          {children}
        </View>
      </View>
    ) : (
      <MyModal isOpen={isVisible} setIsOpen={setIsVisible} onClose={() => setIsVisible(false)}>
        {/* <Modal
        visible={isVisible}
        onDismiss={() => setIsVisible(false)}
        // onBackButtonPress={() => setIsVisible(false)}
        // onBackdropPress={() => setIsVisible(false)}
      > */}
        <Pressable onPressOut={() => setIsVisible(false)}>
          <View className="m-auto items-center justify-center bg-background rounded-md p-1">{children}</View>
        </Pressable>
      </MyModal>
    )}
  </>
);
