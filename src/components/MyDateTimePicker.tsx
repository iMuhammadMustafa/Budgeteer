import { useRef, useState } from "react";
import { Text, Pressable, View, Keyboard, Platform, Modal } from "react-native";

import DateTimePicker, { DateType } from "react-native-ui-datepicker"; // Import DateType
import dayjs from "dayjs";
import MyIcon from "@/src/utils/Icons.Helper"; // Added MyIcon import

type MyDateTimePickerProps = {
  label?: string;
  date: dayjs.Dayjs | null | undefined; // Allow null or undefined
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
            displayFullDays
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
          <Pressable onPress={() => setShowDate(false)} className="mt-2 p-2 bg-primary rounded-md">
            <Text className="text-white text-center">Done</Text>
          </Pressable>
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
        <View className={`max-w-[${layout.width / 2}px]`}>{children}</View>
      </View>
    ) : (
      <Modal
        visible={isVisible}
        onDismiss={() => setIsVisible(false)}
        // onBackButtonPress={() => setIsVisible(false)}
        // onBackdropPress={() => setIsVisible(false)}
      >
        <Pressable onPressOut={() => setIsVisible(false)}>
          <View className="m-auto items-center justify-center bg-white rounded-md p-1">{children}</View>
        </Pressable>
      </Modal>
    )}
  </>
);
