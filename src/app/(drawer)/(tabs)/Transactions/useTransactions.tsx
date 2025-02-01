import { useEffect, useState } from "react";
import { BackHandler, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import dayjs from "dayjs";
import { Account, TransactionsView } from "@/src/lib/supabase";
import { useNotifications } from "@/src/providers/NotificationsProvider";
import {
  groupTransactions,
  useDeleteTransaction,
  useGetTransactions,
  useGetTransactionsInfinite,
  useUpsertTransaction,
} from "@/src/repositories/services/transactions.service";
import { useQueryClient } from "@tanstack/react-query";
import { TableNames, ViewNames } from "@/src/consts/TableNames";
import { getAccountById } from "@/src/repositories/apis/account.api";
import { TransactionsSearchParams } from "@/src/types/transactions.types";
import { useGetAccounts } from "@/src/repositories/services/account.service";
import { useGetCategories } from "@/src/repositories/services/categories.service";

export type TransactionListHeaderProps = {
  selectedTransactions: TransactionsView[];
  selectedSum: number;
  deleteSelection: () => void;
  copyTransactions: () => void;
  clearSelection: () => void;
  refreshTransactions: () => void;
  showSearch: boolean;
  setShowSearch: (value: boolean) => void;
};

const searchFilters: TransactionsSearchParams = {
  startIndex: 0,
  endIndex: 10,
};

export default function useTransactions() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  const [selectionMode, setSelectionMode] = useState(false); // To track if we're in selection mode
  const [selectedTransactions, setSelectedTransactions] = useState<TransactionsView[]>([]);
  const [selectedSum, setSelectedSum] = useState(0);

  const [showSearch, setShowSearch] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const params = useLocalSearchParams() as TransactionsSearchParams;
  const [filters, setFilters] = useState<TransactionsSearchParams>(params);

  // useEffect(() => {
  //   queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
  // }, [filters]);

  const { data: accounts } = useGetAccounts() as any;
  const { data: categories } = useGetCategories() as any;
  // const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, error, isLoading } = useGetTransactionsInfinite(
  //   params ?? searchFilters,
  // );
  // const transactions = data?.pages.flatMap(page => page);

  const { data: transactions, status, error, isLoading } = useGetTransactions(params ?? searchFilters);

  const [isActionLoading, setIsActionLoading] = useState(false);
  const addMutation = useUpsertTransaction();
  const deleteMutation = useDeleteTransaction();

  console.log(transactions);
  const dailyTransactions = groupTransactions(transactions ?? []);
  const days = Object.keys(dailyTransactions);

  useEffect(() => {
    if (Platform.OS === "web") {
      if (selectionMode) {
        window.addEventListener("keydown", e => {
          if (e.key === "Escape") {
            clearSelection();
            return;
          }
        });
      }
    }
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => {
      backHandler.remove();
      window.removeEventListener("keydown", () => {});
    };
  }, [selectionMode]);

  // useEffect(() => {
  //   return () => {
  //     // Reset the query cache when the component unmounts
  //     queryClient.removeQueries({ queryKey: [ViewNames.TransactionsView, filter] });
  //   };
  // }, [queryClient, filter]);

  // useEffect(() => {
  //   queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
  // }, [params]);

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

  // const loadMore = () => {
  //   if (hasNextPage && !isFetchingNextPage) {
  //     fetchNextPage();
  //   }
  // };

  /*
  queryClient.setQueryData([ViewNames.TransactionsView], (data) => ({
  pages: data.pages.slice(1),
  pageParams: data.pageParams.slice(1),
}))
  */

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
    filters,
    setFilters,
    showCalendar,
    setShowCalendar,
    // loadMore,
    // isFetchingNextPage,
    status,
    showSearch,
    setShowSearch,
    accounts,
    categories,
    params,
  };
}
