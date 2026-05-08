import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FlatList, View } from "react-native";
import ThemedText from "@/src/components/elements/ThemedText";

import MyIcon from "@/src/components/elements/MyIcon";
import TransactionItem from "@/src/components/Transactions/TransactionItem";
import { GroupedData } from "@/src/types/components/Transactions.types";
import { TransactionsView } from "@/src/types/database/Tables.Types";
import TransactionAmount from "./TransactionAmount";

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
  handleLongPress: (item: TransactionsView, transferItem: TransactionsView) => void;
  handlePress: (item: TransactionsView, transferItem: TransactionsView) => void;
}) {
  return (
    <View className="flex justify-center px-3 py-1">
      <DaysListHeader day={day} data={data} />

      <FlatList
        data={data[day].transactions}
        renderItem={({ item: transaction }) => (
          <TransactionItem
            transaction={transaction}
            selectedTransactions={selectedTransactions}
            handleLongPress={handleLongPress}
            handlePress={handlePress}
            transferTransaction={data[day].transactions.find(t => t.id === transaction.transferid)}
          />
        )}
        keyExtractor={transaction => transaction.id!}
      />
    </View>
  );
}
function DaysListHeader({ day, data }: { day: string; data: GroupedData }) {
  return (
    <View className="flex-row m-1 p-3 justify-between items-center bg-card border border-muted rounded-lg">
      <View className="flex-col items-start justify-start gap-2">
        <ThemedText>{day}</ThemedText>
        <View className="flex-row gap-2 items-center">
          <MyIcon name="CalendarDays" size={15} className="text-foreground" />
          <ThemedText>{dayjs(day).fromNow()}</ThemedText>
        </View>
      </View>
      <TransactionAmount amount={data[day].amount} currency={data[day].transactions[0].currency} />
    </View>
  );
}
