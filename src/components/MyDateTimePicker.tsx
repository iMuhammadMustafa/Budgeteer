import React, { useRef, useState } from "react";
import { Text, Pressable, View, Keyboard, Platform } from "react-native";
import Modal from "react-native-modal";
import DateTimePicker from "react-native-ui-datepicker";
import dayjs from "dayjs";

type MyDateTimePickerProps = {
  label?: string;
  date: string | null;
  onChange: (date: any) => void;
  isModal?: boolean;
};

export default function MyDateTimePicker({
  label = "Date",
  date = dayjs().format("DD-MM-YYYY hh:mm:ss"),
  onChange,
  isModal = false,
}: MyDateTimePickerProps) {
  const [showDate, setShowDate] = useState(false);
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
      <Pressable
        onPress={() => {
          Keyboard.dismiss;
          setShowDate(prev => !prev);
        }}
        style={{
          marginBottom: 16,
          padding: 12,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: "#ddd",
          backgroundColor: "#fff",
          alignItems: "center",
        }}
        onLayout={onLayout}
      >
        <Text>{dayjs(date).format("DD-MM-YYYY hh:mm:ss")}</Text>
      </Pressable>

      {showDate && (
        <DateTimePickerContainer
          isVisible={showDate}
          setIsVisible={setShowDate}
          layout={buttonLayout}
          isModal={isModal}
        >
          <DateTimePicker
            mode="single"
            date={dayjs(date)}
            displayFullDays
            timePicker
            onChange={(params: any) => {
              onChange(params);
              setShowDate(false);
            }}
          />
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
        <View className={`max-w-[${layout.width / 2}px]]`}>{children}</View>
      </View>
    ) : (
      <Modal
        isVisible={isVisible}
        onDismiss={() => setIsVisible(false)}
        onBackButtonPress={() => setIsVisible(false)}
        onBackdropPress={() => setIsVisible(false)}
      >
        <View className="m-auto items-center justify-center bg-white rounded-md p-1">{children}</View>
      </Modal>
    )}
  </>
);
