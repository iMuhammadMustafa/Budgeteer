import { Box } from "@/components/ui/box";
import { TableRow, TableData } from "@/components/ui/table";
import List from "@/src/components/List";
import Icon from "@/src/lib/IonIcons";
import { Transaction } from "@/src/lib/supabase";
import { useDeleteTransaction, useGetTransactions } from "@/src/repositories/transactions.service";
import { Link, useRouter } from "expo-router"; // Use `useRouter` for navigation
import React, { useState } from "react";
import dayjs from "dayjs";
import { Divider } from "@/components/ui/divider";
import relativeTime from "dayjs/plugin/relativeTime";
import { View, Text, FlatList, ScrollView, SafeAreaView, ActivityIndicator, Pressable } from "react-native";

export default function Transactions() {
  const { data: transactions, error, isLoading } = useGetTransactions();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false); // To track if we're in selection mode
  const mutation = useDeleteTransaction();
  const router = useRouter(); // Expo Router hook for navigation

  if (isLoading || !transactions) return <ActivityIndicator />;
  if (error) return <Text>Error: {error.message}</Text>;

  const groupedData = transactions
    .sort((b, a) => dayjs(a.date).diff(dayjs(b.date)))
    .reduce((acc, curr) => {
      const date = dayjs(curr.date).format("ddd, DD MMM YYYY");
      if (!acc[date]) {
        acc[date] = {
          amount: 0,
          transactions: [],
        };
      }
      acc[date].amount += curr.amount;
      acc[date].transactions.push(curr);
      return acc;
    }, {});

  const days = Object.keys(groupedData);
  dayjs.extend(relativeTime);

  // Long press to start selection mode and select the first transaction
  const handleLongPress = (id: string) => {
    setSelectionMode(true);
    setSelectedTransactions(prev => (prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]));
  };

  // Short press behavior depends on selection mode
  const handlePress = (id: string) => {
    if (selectionMode) {
      // In selection mode, short press selects/deselects
      const updatedSelections = selectedTransactions.includes(id)
        ? selectedTransactions.filter(t => t !== id)
        : [...selectedTransactions, id];

      setSelectedTransactions(updatedSelections);

      // Exit selection mode if no more items are selected
      if (updatedSelections.length === 0) {
        setSelectionMode(false);
      }
    } else {
      // Outside selection mode, navigate to transaction details
      // Use router for navigation
      router.push(`../AddTransaction?transactionId=${id}`);
    }
  };

  const clearSelection = () => {
    setSelectedTransactions([]);
    setSelectionMode(false); // Clear selection mode when we clear selections
  };

  const renderTransaction = transaction => (
    <Pressable
      onLongPress={() => handleLongPress(transaction.id)}
      onPress={() => handlePress(transaction.id)} // Handles selection or navigation based on selectionMode
      className={`m-3 flex-row items-center justify-between gap-7 flex-1 ${selectedTransactions.includes(transaction.id) ? "bg-blue-200" : "bg-white"}`} // Highlighting selected items
    >
      <View className="rounded-full h-10 w-10 bg-neutral-100 flex justify-center items-center">
        <TransactionTypeIcon transaction={transaction} />
      </View>
      <View className="flex-1">
        <Text>{transaction.description ?? transaction.category?.name ?? "Hello"}</Text>
        <View className="flex-row justify-start items-center gap-2">
          <Text>{transaction.category?.name}</Text>
        </View>
      </View>
      <View className="flex items-center">
        <Text className={`${getTransactionProp(transaction.type).color}`}>
          {transaction.amount} {transaction.account?.currency}
        </Text>
        <Text>{transaction.account?.name}</Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView className="w-full h-full">
      <Box className="px-10 self-end my-2 flex-row justify-between items-center">
        {/* Show selected count if any transaction is selected */}
        {selectedTransactions.length > 0 && (
          <View className="flex-row items-center">
            <Text className="text-lg text-primary-500 mr-4">{selectedTransactions.length} selected</Text>
            <Pressable onPress={clearSelection}>
              <Text className="text-sm text-danger-500">Clear Selection</Text>
            </Pressable>
          </View>
        )}
        <Link href="../AddTransaction">
          <Icon name="Plus" className="text-foreground" />
        </Link>
      </Box>

      <ScrollView className="m-2">
        <FlatList
          data={days}
          renderItem={({ item }) => (
            <View className="flex justify-center p-3">
              <View className="flex-row m-1 p-3 justify-between items-center bg-muted rounded-lg">
                <View className="flex-col items-start justify-start gap-2">
                  <Text>{item}</Text>
                  <View className="flex-row gap-2 items-center">
                    <Icon name="CalendarDays" size={15} />
                    <Text>{dayjs(item).fromNow()}</Text>
                  </View>
                </View>
                <Text className={`${groupedData[item].amount > 0 ? "text-success-500" : "text-error-500"}`}>
                  {groupedData[item].amount > 0 ? `+${groupedData[item].amount}` : `${groupedData[item].amount}`}
                </Text>
              </View>

              {/* Render each transaction */}
              <FlatList
                data={groupedData[item].transactions}
                renderItem={({ item: transaction }) => (
                  <View className="flex-row items-center justify-between">{renderTransaction(transaction)}</View>
                )}
                keyExtractor={transaction => transaction.id}
              />

              <Divider className="my-0.5 h-[2px]" />
            </View>
          )}
          keyExtractor={item => item}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const TransactionTypeIcon = ({ transaction }) => {
  const iconProp = getTransactionProp(transaction.type);
  return <Icon name={iconProp.iconName} size={iconProp.size} className={iconProp.color} />;
};

const getTransactionProp = (type: string | null) => {
  const transactionProp = { iconName: "CircleHelp", color: "text-muted-foreground", size: 20 };
  if (type === "Income") {
    transactionProp.iconName = "Plus";
    transactionProp.color = "text-success-500";
  } else if (type === "Expense") {
    transactionProp.iconName = "Minus";
    transactionProp.color = "text-error-500";
  } else if (type === "Transfer") {
    transactionProp.iconName = "ArrowLeftRight";
    transactionProp.color = "text-info-500";
  } else if (type === "Adjustment") {
    transactionProp.iconName = "Wrench";
    transactionProp.color = "text-warning-500";
  }
  return transactionProp;
};
