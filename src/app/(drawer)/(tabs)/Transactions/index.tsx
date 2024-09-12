import { Box } from "@/components/ui/box";
import { TableRow, TableData } from "@/components/ui/table";
import List from "@/src/components/List";
import Icon from "@/src/lib/IonIcons";
import { Inserts, Transaction } from "@/src/lib/supabase";
import {
  useDeleteTransaction,
  useGetTransactions,
  useUpsertTransaction,
} from "@/src/repositories/transactions.service";
import { Link, useNavigation, useRouter } from "expo-router"; // Use `useRouter` for navigation
import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Divider } from "@/components/ui/divider";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Pressable,
  BackHandler,
} from "react-native";
import { useAuth } from "@/src/providers/AuthProvider";
import { useNotifications } from "@/src/providers/NotificationsProvider";
import { TableNames } from "@/src/consts/TableNames";
import { TransactionFormType } from "@/src/components/pages/TransactionFormNew";
import * as Haptics from "expo-haptics";

export default function Transactions() {
  const { data: transactions, error, isLoading } = useGetTransactions();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<TransactionFormType[]>([]);
  const [selectedSum, setSelectedSum] = useState(0);
  const [selectionMode, setSelectionMode] = useState(false); // To track if we're in selection mode
  const mutation = useDeleteTransaction();
  const router = useRouter(); // Expo Router hook for navigation
  const { addNotification } = useNotifications();
  const addMutation = useUpsertTransaction();

  const deleteMutation = useDeleteTransaction();

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);

    return () => backHandler.remove();
  }, [selectionMode]);

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
  const handleLongPress = (item: any) => {
    Haptics.selectionAsync();
    setSelectionMode(true);
    setSelectedTransactions(prev => [...prev, item]);
    setSelectedSum(prev => prev + item.amount);
  };

  // Short press behavior depends on selection mode
  const handlePress = (item: any) => {
    if (selectionMode) {
      // In selection mode, short press selects/deselects
      Haptics.selectionAsync();
      const updatedSelections = selectedTransactions.find(i => i.id === item.id)
        ? selectedTransactions.filter(t => t.id !== item.id)
        : [...selectedTransactions, item];

      setSelectedTransactions(updatedSelections);

      // Update selected sum
      setSelectedSum(
        updatedSelections.reduce((acc, curr) => {
          return acc + (curr?.amount ?? 0);
        }, 0),
      );

      // Exit selection mode if no more items are selected
      if (updatedSelections.length === 0) {
        setSelectionMode(false);
      }
    } else {
      // Outside selection mode, navigate to transaction details
      // Use router for navigation
      router.push(`../AddTransaction?transactionId=${item.id}`);
    }
  };

  const clearSelection = () => {
    setSelectedTransactions([]);
    setSelectedSum(0);
    setSelectionMode(false); // Clear selection mode when we clear selections
  };

  const copyTransactions = async () => {
    setIsActionLoading(true);

    try {
      for (let item of selectedTransactions) {
        const { account, category, ...newTransaction } = { ...item };

        await addMutation.mutateAsync(
          {
            fullFormTransaction: {
              ...newTransaction,
              id: null,
              date: dayjs().toISOString(),
              createdat: dayjs().toISOString(),
              updatedat: null,
              createdby: null,
              updatedby: null,
            },
          },
          {
            onSuccess: () => addNotification({ message: "Transaction Created Successfully", type: "success" }),
          },
        );
      }
    } catch (error) {
      addNotification({ message: "Error creating transactions", type: "error" });
    } finally {
      setIsActionLoading(false);
      clearSelection();
    }
  };

  const deleteSelection = async () => {
    setIsActionLoading(true);

    // Delete selected transactions
    // await Promise.all(
    for (let item of selectedTransactions) {
      await deleteMutation.mutateAsync(item, {
        onSuccess: () => {
          addNotification({ message: "Transaction Deleted Successfully", type: "success" });
          setIsActionLoading(false);
        },
      });
    }

    // );

    // Clear selections and exit selection

    clearSelection();
  };

  // const navigation = useNavigation();
  // useEffect(() => {
  //   if (selectionMode) {
  //     navigation.addListener("beforeRemove", e => {
  //       console.log(e);
  //       e.preventDefault();
  //       clearSelection();
  //     });
  //   } else {
  //     // navigation.removeListener("beforeRemove", e => {
  //     //   navigation.dispatch(e.data.action);
  //     // });
  //   }
  // }, [selectionMode]);

  const backAction = () => {
    if (selectionMode) {
      clearSelection();
      return true;
    } else {
      router.back();
    }
  };

  const renderTransaction = transaction => {
    return (
      <Pressable
        delayLongPress={300}
        onLongPress={() => handleLongPress(transaction)}
        onPress={() => handlePress(transaction)} // Handles selection or navigation based on selectionMode
        className={`m-3 flex-row items-center justify-between gap-7 flex-1 ${selectedTransactions.find(t => t.id === transaction.id) ? "bg-blue-200" : "bg-white"}`} // Highlighting selected items
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
        <View className="flex items-end">
          <Text className={`${getTransactionProp(transaction.type).color}`}>
            {transaction.amount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            {transaction.account?.currency}
          </Text>
          <Text>
            {transaction.account?.name} {transaction.account?.balance}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="w-full h-full">
      <Box className="px-10 self-end my-2 flex-row justify-between items-center">
        {/* Show selected count if any transaction is selected */}
        {selectedTransactions.length > 0 && (
          <View className="flex-row items-center">
            <Text className="text-lg text-primary-500 mr-4">{selectedTransactions.length} selected</Text>
            <Text className="text-lg text-primary-500 mr-4">{selectedSum} USD</Text>
            <Pressable onPress={deleteSelection}>
              <Icon name="Trash" className="text-error-500" />
            </Pressable>
            <Pressable onPress={copyTransactions}>
              <Icon name="Copy" className="text-info-500" />
            </Pressable>
            <Pressable onPress={clearSelection}>
              <Icon name="X" className="text-danger-500" />
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
                  {groupedData[item].amount > 0
                    ? `+${groupedData[item].amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : `${groupedData[item].amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`}
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
  return <Icon name={transaction.category.icon ?? iconProp.iconName} size={iconProp.size} className={iconProp.color} />;
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
