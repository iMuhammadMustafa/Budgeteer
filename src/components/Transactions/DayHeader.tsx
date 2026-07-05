import { Text as ThemedText } from "@/src/components/ui";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { memo } from "react";
import { View } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import TransactionAmount from "./TransactionAmount";

dayjs.extend(relativeTime);

function DayHeader({ day, amount }: { day: string; amount: number }) {
  return (
    <View className="flex justify-center px-3 py-1">
      <View className="flex-row m-1 p-3 justify-between items-center bg-surface border border-border rounded-lg">
        <View className="flex-col items-start justify-start gap-2">
          <ThemedText className="font-sans-semibold">{day}</ThemedText>
          <View className="flex-row gap-2 items-center">
            <MyIcon name="CalendarDays" size={15} className="text-ink-mute" />
            <ThemedText variant="caption">{dayjs(day).fromNow()}</ThemedText>
          </View>
        </View>
        <TransactionAmount amount={amount} />
      </View>
    </View>
  );
}

export default memo(DayHeader);
