import { useState } from "react";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import dayjs from "dayjs";
import { TransactionsView } from "@/src/lib/supabase";
import { useNotifications } from "@/src/providers/NotificationsProvider";
import {
  useDeleteTransaction,
  useGetTransactions,
  useUpsertTransaction,
} from "@/src/repositories/transactions.service";

export type GroupedData = {
  [date: string]: {
    amount: number;
    transactions: TransactionsView[];
  };
};
export type TransactionListHeaderProps = {
  selectedTransactions: TransactionsView[];
  selectedSum: number;
  deleteSelection: () => void;
  copyTransactions: () => void;
  clearSelection: () => void;
};

export default function useTransactions() {
  const router = useRouter();
  const { data: transactions, error, isLoading } = useGetTransactions();
  const { addNotification } = useNotifications();
  const [selectionMode, setSelectionMode] = useState(false); // To track if we're in selection mode
  const [selectedTransactions, setSelectedTransactions] = useState<TransactionsView[]>([]);
  const [selectedSum, setSelectedSum] = useState(0);

  const [isActionLoading, setIsActionLoading] = useState(false);
  const addMutation = useUpsertTransaction();
  const deleteMutation = useDeleteTransaction();

  const dailyTransactions = groupTransactions(transactions ?? []);
  const days = Object.keys(dailyTransactions);

  const backAction = () => {
    if (selectionMode) {
      clearSelection();
      return true;
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
        const { accountid, categoryid, ...newTransaction } = { ...item };

        await addMutation.mutateAsync(
          {
            fullFormTransaction: {
              description: item.description,
              date: new Date().toISOString(),
              amount: item.amount ?? 0,
              type: item.type,
              accountid: item.accountid!,
              categoryid: item.categoryid!,
              tags: item.tags,
              notes: item.notes,
              status: item.status!,
              transferid: item.transferid,
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
    for (let item of selectedTransactions) {
      await deleteMutation.mutateAsync(
        {
          ...item,
          id: item.transactionid!,
          amount: item.amount!,
          accountid: item.accountid!,
          transferid: item.transactionid,
          date: item.date!,

          status: item.status!,

          // These are required fields for the mutation
          createdat: "",
          createdby: "",
          updatedat: null,
          updatedby: null,
          isdeleted: false,
          tenantid: null,
        },
        {
          onSuccess: () => {
            addNotification({ message: "Transaction Deleted Successfully", type: "success" });
            setIsActionLoading(false);
          },
        },
      );
    }
    clearSelection();
  };

  const handlePress = (item: TransactionsView) => {
    if (selectionMode) {
      // In selection mode, short press selects/deselects
      if (Platform.OS !== "web") Haptics.selectionAsync();

      const updatedSelections = selectedTransactions.find(i => i.transactionid === item.transactionid)
        ? selectedTransactions.filter(t => t.transactionid !== item.transactionid)
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
      router.push(`/AddTransaction?transactionId=${item.transactionid}`);
    }
  };

  const handleLongPress = (item: any) => {
    if (selectionMode) handlePress(item);
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setSelectionMode(true);
    setSelectedTransactions(prev => [...prev, item]);
    setSelectedSum(prev => prev + item.amount);
  };

  return {
    transactions,
    error,
    isLoading,
    dailyTransactions,
    days,
    selectionMode,
    selectedTransactions,
    selectedSum,
    isActionLoading,
    backAction,
    handlePress,
    handleLongPress,
    clearSelection,
    deleteSelection,
    copyTransactions,
  };
}

const groupTransactions = (transactions: TransactionsView[]) => {
  return transactions
    .sort((b, a) => dayjs(a.date).diff(dayjs(b.date)))
    .reduce((acc: GroupedData, curr) => {
      const date = dayjs(curr.date).format("ddd, DD MMM YYYY");
      if (!acc[date]) {
        acc[date] = {
          amount: 0,
          transactions: [],
        };
      }
      acc[date].amount += curr.amount ?? 0;
      acc[date].transactions.push(curr);
      return acc;
    }, {});
};

const getTransactionProp = (type: string | null) => {
  const transactionProp = { iconName: "CircleHelp", color: "color-red-100", size: 20 };
  if (type === "Income") {
    transactionProp.iconName = "Plus";
    transactionProp.color = "success-100";
  } else if (type === "Expense") {
    transactionProp.iconName = "Minus";
    transactionProp.color = "error-100";
  } else if (type === "Transfer") {
    transactionProp.iconName = "ArrowLeftRight";
    transactionProp.color = "info-100";
  } else if (type === "Adjustment") {
    transactionProp.iconName = "Wrench";
    transactionProp.color = "warning-100";
  } else if (type === "Initial") {
    transactionProp.iconName = "Wallet";
    transactionProp.color = "info-100";
  }
  return transactionProp;
};
