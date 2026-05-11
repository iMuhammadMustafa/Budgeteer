import { useRef, useState } from "react";
import { Keyboard, Platform, Pressable, Text, View } from "react-native";

import dayjs from "dayjs";
import DateTimePicker, { DateType } from "react-native-ui-datepicker";
import Button from "./Button";
import MyIcon from "./MyIcon";
import MyModal from "./MyModal";

type MyDateTimePickerProps = {
  label?: string;
  date: dayjs.Dayjs | null | undefined;
  onChange: (dateISOString: string | null) => void;
  isModal?: boolean;
  showClearButton?: boolean;
  onClear?: () => void;
};

export default function MyDateTimePicker({
  label = "Date",
  date,
  onChange,
  isModal = Platform.OS !== "web",
  showClearButton = false,
  onClear,
}: MyDateTimePickerProps) {
  const [showDate, setShowDate] = useState(false);
  const [pickerDate, setPickerDate] = useState(date ? dayjs(date) : dayjs());
  const hasSetLayout = useRef(false);
  const [buttonLayout, setButtonLayout] = useState({ height: 0, width: 0, top: 0 });

  const onLayout = (event: { nativeEvent: { layout: { height: number; width: number; y: number } } }) => {
    if (!hasSetLayout.current) {
      const { height, width, y } = event.nativeEvent.layout;
      setButtonLayout({ height, width, top: y });
      hasSetLayout.current = true;
    }
  };
  return (
    <View className="my-1">
      <Text className="text-foreground">{label}</Text>
      <View className="flex-row items-center w-full">
        <Button
          variant="ghost"
          size="md"
          hapticFeedback="light"
          onPress={() => {
            Keyboard.dismiss();
            if (!date) setPickerDate(dayjs());
            else setPickerDate(dayjs(date));
            setShowDate(prev => !prev);
          }}
          className="border border-input-border rounded-md p-3 items-center mb-1 bg-input-bg flex-1 min-w-[160px]"
          testID="btn-date-picker"
        >
          <Text selectable={false}>{date ? dayjs(date).format("MMM DD, YYYY") : "Select Date"}</Text>
        </Button>
        {showClearButton && date && onClear && (
          <Button
            variant="ghost"
            size="icon"
            onPress={() => {
              onClear();
              setShowDate(false);
            }}
            className="p-2 mb-1 ml-1 bg-muted rounded"
            accessibilityLabel="Clear date"
            testID="btn-date-clear"
          >
            <MyIcon name="X" size={18} className="text-text-secondary" />
          </Button>
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
            date={pickerDate}
            showOutsideDays
            className="bg-card text-foreground "
            classNames={{
              today: "border border-primary rounded-full",
              selected: "bg-primary rounded-full",
              disabled: "opacity-50",
              outside: "opacity-50",
              outside_label: "text-text-tertiary",
              day_label: "text-foreground",
              month_label: "text-foreground font-medium",
              year_label: "text-foreground font-medium",
              header: "bg-background border-b border-border text-foreground",
              selected_month_label: "text-primary font-medium",
            }}
            onChange={(params: { date: DateType }) => {
              if (params.date) {
                const newDate = dayjs(params.date);
                setPickerDate(newDate);
                onChange(newDate.toISOString());
              } else {
                onChange(null);
              }
            }}
            components={{
              IconNext: <MyIcon name="ChevronRight" size={20} className="text-foreground" />,
              IconPrev: <MyIcon name="ChevronLeft" size={20} className="text-foreground" />,
            }}
          />
          <View className="mt-2 flex-row space-x-2">
            <Button
              variant="secondary"
              size="sm"
              hapticFeedback="selection"
              className="flex-1 bg-status-success-subtle"
              onPress={() => {
                const today = dayjs();
                setPickerDate(today);
                onChange(today.toISOString());
              }}
              label="Today"
              testID="btn-date-today"
            />
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onPress={() => setShowDate(false)}
              label="Pick"
              testID="btn-date-pick"
            />
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
          style={{ width: 300 }}
        >
          {children}
        </View>
      </View>
    ) : (
      <MyModal isOpen={isVisible} setIsOpen={setIsVisible} onClose={() => setIsVisible(false)}>
        <Pressable onPressOut={() => setIsVisible(false)}>
          <View className="m-auto items-center justify-center bg-background rounded-md p-1" style={{ width: 300 }}>{children}</View>
        </Pressable>
      </MyModal>
    )}
  </>
);
