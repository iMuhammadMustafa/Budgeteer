import { FlatList, Text, View } from "react-native";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { TransactionsView } from "@/src/types/db/Tables.Types";
import { GroupedData } from "@/src/types/pages/Transactions.types";
import MyIcon from "@/src/utils/Icons.Helper";
import Divider from "@/src/components/Divider";
import TransactionItem from "./TransactionItem";

dayjs.extend(relativeTime);

export default function DaysList({
  day,
  data,
  selectedTransactions,
  handleLongPress,
  handlePress,
}: {
  day: string;
  data: GroupedData;
  selectedTransactions: TransactionsView[];
  handleLongPress: (item: TransactionsView) => void;
  handlePress: (item: TransactionsView) => void;
}) {
  return (
    <View className="flex justify-center p-3">
      <DaysListHeader day={day} data={data} />

      <FlatList
        data={data[day].transactions}
        renderItem={({ item: transaction }) => (
          <TransactionItem
            transaction={transaction}
            selectedTransactions={selectedTransactions}
            handleLongPress={handleLongPress}
            handlePress={handlePress}
          />
        )}
        keyExtractor={transaction => transaction.id!}
      />

      <Divider className="my-0.5 h-[2px]" />
    </View>
  );
}
function DaysListHeader({ day, data }: { day: string; data: GroupedData }) {
  const amount = data[day].amount;
  const amountString = amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const currency = data[day].transactions[0].currency;
  return (
    <View className="flex-row m-1 p-3 justify-between items-center bg-card border border-muted rounded-lg">
      <View className="flex-col items-start justify-start gap-2">
        <Text className="text-foreground">{day}</Text>
        <View className="flex-row gap-2 items-center">
          <MyIcon name="CalendarDays" size={15} className="text-foreground" />
          <Text className="text-foreground">{dayjs(day).fromNow()}</Text>
        </View>
      </View>
      <Text className={`${data[day].amount > 0 ? "text-success-500" : "text-danger-500"}`}>
        {amount > 0 ? `+` : ``}
        {amountString} {currency}
      </Text>
    </View>
  );
}
