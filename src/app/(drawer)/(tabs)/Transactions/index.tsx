import Icon from "@/src/lib/IonIcons";
import { TransactionsView } from "@/src/lib/supabase";
import { Link } from "expo-router"; // Use `useRouter` for navigation
import React, { useEffect } from "react";
import dayjs from "dayjs";
import { Divider } from "@/components/ui/divider";
import relativeTime from "dayjs/plugin/relativeTime";
import { View, Text, FlatList, SafeAreaView, ActivityIndicator, Pressable, BackHandler, Platform } from "react-native";

import useTransactions from "./useTransactions";

dayjs.extend(relativeTime);

type GroupedData = {
  [date: string]: {
    amount: number;
    transactions: TransactionsView[];
  };
};
type TransactionListHeaderProps = {
  selectedTransactions: TransactionsView[];
  selectedSum: number;
  deleteSelection: () => void;
  copyTransactions: () => void;
  clearSelection: () => void;
};

export default function Transactions() {
  const {
    transactions,
    error,
    isLoading,
    selectionMode,
    selectedTransactions,
    selectedSum,
    dailyTransactions,
    days,
    backAction,
    clearSelection,
    handleLongPress,
    handlePress,
    deleteSelection,
    copyTransactions,
  } = useTransactions();

  useEffect(() => {
    if (Platform.OS === "web") return;
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [selectionMode]);

  if (isLoading || !transactions) return <ActivityIndicator />;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <SafeAreaView className="w-full h-full">
      <TransactionsPageHeader
        selectedTransactions={selectedTransactions}
        selectedSum={selectedSum}
        deleteSelection={deleteSelection}
        copyTransactions={copyTransactions}
        clearSelection={clearSelection}
      />

      <FlatList
        data={days}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <DaysList
            day={item}
            data={dailyTransactions}
            selectedTransactions={selectedTransactions}
            handleLongPress={handleLongPress}
            handlePress={handlePress}
          />
        )}
      />
    </SafeAreaView>
  );
}
const TransactionsPageHeader = ({
  selectedTransactions,
  selectedSum,
  deleteSelection,
  copyTransactions,
  clearSelection,
}: TransactionListHeaderProps) => {
  return (
    <View className="px-10 self-end my-2 flex-row justify-between items-center gap-2">
      {selectedTransactions.length > 0 && (
        <View className="flex-row items-center gap-2">
          <View className="flex-row">
            <Text className=" text-primary-500 mr-4">{selectedTransactions.length} selected</Text>
            <Text className=" text-primary-500 mr-4">
              {selectedSum} {selectedTransactions[0].currency}
            </Text>
          </View>
          <Pressable onPress={deleteSelection}>
            <Icon name="Trash" className="text-foreground" size={20} />
          </Pressable>
          <Pressable onPress={copyTransactions}>
            <Icon name="Copy" className="text-foreground" size={20} />
          </Pressable>
          <Pressable onPress={clearSelection}>
            <Icon name="X" className="text-foreground" size={20} />
          </Pressable>
        </View>
      )}
      <Link href="/AddTransaction" className="items-center justify-center">
        <Icon name="Plus" className="text-foreground" size={20} />
      </Link>
    </View>
  );
};
const DaysList = ({
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
}) => {
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
};
const DaysListHeader = ({ day, data }: { day: string; data: GroupedData }) => {
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
          <Icon name="CalendarDays" size={15} className="text-foreground" />
          <Text className="text-foreground">{dayjs(day).fromNow()}</Text>
        </View>
      </View>
      <Text className={`${data[day].amount > 0 ? "text-success-500" : "text-error-500"}`}>
        {amount > 0 ? `+` : ``}
        {amountString} {currency}
      </Text>
    </View>
  );
};

const TransactionItem = ({
  transaction,
  selectedTransactions,
  handleLongPress,
  handlePress,
}: {
  transaction: TransactionsView;
  selectedTransactions: TransactionsView[];
  handleLongPress: (item: TransactionsView) => void;
  handlePress: (item: TransactionsView) => void;
}) => {
  const isSelected = selectedTransactions.find(t => t.id === transaction.id);
  const iconProp = getTransactionProp(transaction.type);

  return (
    <View className="flex-row items-center justify-between">
      <Link href={`/AddTransaction?id=${transaction.id}`} asChild onPress={e => e.preventDefault()}>
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
          delayLongPress={300}
          onLongPress={() => handleLongPress(transaction)}
          onPress={() => handlePress(transaction)}
          className={`m-2 p-1 flex-row items-center justify-between gap-5 flex-1 rounded-md ${isSelected ? "bg-info-100" : "bg-background"}`}
        >
          <View
            className={`rounded-full h-10 w-10 flex justify-center items-center bg-${iconProp.color} border border-muted`}
          >
            <Icon name={transaction.icon ?? iconProp.iconName} size={iconProp.size} className="color-card-foreground" />
          </View>
          <View className="flex-1">
            <Text className="text-foreground">{transaction.description ?? transaction.categoryname ?? "Hello"}</Text>
            <View className="flex-row justify-start items-center gap-2">
              <Text className="text-foreground">{transaction.categoryname}</Text>
            </View>
          </View>
          <View className="flex items-end">
            <Text className={`text-${getTransactionProp(transaction.type).textColor}`}>
              {transaction.amount!.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              {transaction.currency}
            </Text>
            <Text className="text-foreground">
              {transaction.accountname} {" | "}
              {transaction.running_balance?.toLocaleString("en", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
        </Pressable>
      </Link>
    </View>
  );
};
const getTransactionProp = (type: string | null) => {
  const transactionProp = { iconName: "CircleHelp", color: "color-red-100", textColor: "foreground", size: 20 };
  if (type === "Income") {
    transactionProp.iconName = "Plus";
    transactionProp.color = "success-100";
    transactionProp.textColor = "success-500";
  } else if (type === "Expense") {
    transactionProp.iconName = "Minus";
    transactionProp.color = "error-100";
    transactionProp.textColor = "error-500";
  } else if (type === "Transfer") {
    transactionProp.iconName = "ArrowLeftRight";
    transactionProp.color = "info-100";
    transactionProp.textColor = "info-500";
  } else if (type === "Adjustment") {
    transactionProp.iconName = "Wrench";
    transactionProp.color = "warning-100";
    transactionProp.textColor = "warning-500";
  } else if (type === "Initial") {
    transactionProp.iconName = "Wallet";
    transactionProp.color = "info-100";
    transactionProp.textColor = "info-500";
  }
  return transactionProp;
};
