import { useState } from "react";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import dayjs from "dayjs";
import { Account, TransactionsView } from "@/src/lib/supabase";
import { useNotifications } from "@/src/providers/NotificationsProvider";
import {
  useDeleteTransaction,
  useGetTransactions,
  useUpsertTransaction,
} from "@/src/repositories/transactions.service";
import { useQueryClient } from "@tanstack/react-query";
import { TableNames, ViewNames } from "@/src/consts/TableNames";
import { getAccountById } from "@/src/repositories/account.api";

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

  const queryClient = useQueryClient();

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

        const sourceAccount =
          (await queryClient
            .getQueryData<Account[]>([TableNames.Accounts])
            ?.find((a: any) => a.accountid === item.accountid)) ?? (await getAccountById(item.accountid!));
        let destinationAccount = null;

        if (item.transferaccountid) {
          destinationAccount =
            (await queryClient
              .getQueryData<Account[]>([TableNames.Accounts])
              ?.find((a: any) => a.accountid === item.transferaccountid)) ??
            (await getAccountById(item.transferaccountid));
        }

        await addMutation.mutateAsync(
          {
            fullFormTransaction: {
              ...item,
              id: null,
              date: new Date().toISOString(),
              createdat: new Date().toISOString(),
              amount: item.amount ?? 0,
            },
            originalData: undefined,
            sourceAccount: sourceAccount!,
            destinationAccount: destinationAccount,
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
      await deleteMutation.mutateAsync(item, {
        onSuccess: () => {
          addNotification({ message: "Transaction Deleted Successfully", type: "success" });
        },
      });
    }
    setIsActionLoading(false);
    clearSelection();
  };

  const handlePress = (item: TransactionsView) => {
    if (selectionMode) {
      // In selection mode, short press selects/deselects
      if (Platform.OS !== "web") Haptics.selectionAsync();

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

      if (item.transferid) {
        item = transactions?.find(t => t.id === item.transferid) ?? item;
      }
      router.push({ pathname: `/AddTransaction`, params: item }); // Remove the braces in params
    }
  };

  const handleLongPress = (item: any) => {
    if (selectionMode) handlePress(item);
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setSelectionMode(true);
    setSelectedTransactions(prev => [...prev, item]);
    setSelectedSum(prev => prev + item.amount);
  };

  const refreshTransactions = async () => {
    await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
    await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
    await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
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
    refreshTransactions,
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
