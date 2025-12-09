import { useQueryClient } from "@/src/providers/QueryProvider";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { BackHandler, Platform } from "react-native";

import { TableNames, ViewNames } from "@/src/types/database/TableNames";
import { TransactionsView } from "@/src/types/database/Tables.Types";

import { TransactionFilters } from "@/src/types/apis/TransactionFilters";

import { useTransactionCategoryService } from "@/src/services//TransactionCategories.Service";
import { useAccountService } from "@/src/services/Accounts.Service";
import { useTransactionService } from "@/src/services/Transactions.Service";
import { duplicateTransaction, groupTransactions } from "@/src/utils/transactions.helper";

export default function useTransactions() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const params = useLocalSearchParams() as TransactionFilters;

  const transactionService = useTransactionService();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, error, isLoading } =
    transactionService.useFindAllInfinite(params);
  const transactions = data?.pages.flatMap(page => page);

  const transactionCategoriesService = useTransactionCategoryService();
  const accountsService = useAccountService();
  const { data: accounts } = accountsService.useFindAll();
  const { data: categories } = transactionCategoriesService.useFindAll();
  const addMutation = transactionService.useCreate();
  const deleteMutation = transactionService.useDelete();

  const [selectionMode, setSelectionMode] = useState(false); // To track if we're in selection mode
  const [selectedTransactions, setSelectedTransactions] = useState<TransactionsView[]>([]);
  const [selectedSum, setSelectedSum] = useState(0);

  const [showSearch, setShowSearch] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const [filters, setFilters] = useState<TransactionFilters>(params);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const dailyTransactions = groupTransactions(transactions ?? []);
  const days = Object.keys(dailyTransactions);

  const backAction = (): boolean => {
    if (selectionMode) {
      clearSelection();
      return true;
    }
    return false;
  };
  const clearSelection = () => {
    setSelectedTransactions([]);
    setSelectedSum(0);
    setSelectionMode(false); // Clear selection mode when we clear selections
  };
  useBackAction(selectionMode, backAction);

  const copyTransactions = async () => {
    setIsActionLoading(true);

    try {
      for (let item of selectedTransactions) {
        const newTransaction = duplicateTransaction(item);

        await addMutation.mutateAsync(newTransaction, {
          onSuccess: async () => {
            console.log({ message: "Transaction Created Successfully", type: "success" });
            await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
            await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
            await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
          },
        });
      }
    } catch (error) {
      console.log({ message: "Error creating transactions", type: "error" });
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
          id: item.id!,
          item,
        },
        {
          onSuccess: () => {
            console.log({ message: "Transaction Deleted Successfully", type: "success" });
          },
        },
      );
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
      // if (item.transferid) {
      //   item = transactions?.find(t => t.id === item.transferid) ?? item;
      // }
      router.push({ pathname: `/AddTransaction`, params: item as any }); // Remove the braces in params
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
    // resetInfiniteQueryPagination();
    // await queryClient.removeQueries({ queryKey: [ViewNames.TransactionsView], exact: false });
    await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView], exact: false });
    await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
    await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
  };
  const resetInfiniteQueryPagination = (): void => {
    queryClient.setQueryData([ViewNames.TransactionsView], (oldData: any) => {
      if (!oldData) return undefined;

      return {
        ...oldData,
        pages: oldData.pages.slice(0, 1),
        pageParams: oldData.pageParams.slice(0, 1),
      };
    });
  };

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      console.log("Loading more transactions...");
      fetchNextPage().catch(error => {
        console.error("Error loading more transactions:", error);
      });
    }
  };
  // const { data: accounts } = useGetAccounts() as any;
  // const { data: categories } = useGetCategories() as any;
  // useEffect(() => {
  //   queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
  // }, [filters]);
  // const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, error, isLoading } = useGetTransactionsInfinite(
  //   params ?? searchFilters,
  // );
  // const transactions = data?.pages.flatMap(page => page);

  // useEffect(() => {
  //   return () => {
  //     // Reset the query cache when the component unmounts
  //     queryClient.removeQueries({ queryKey: [ViewNames.TransactionsView, filter] });
  //   };
  // }, [queryClient, filter]);

  // useEffect(() => {
  //   queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
  // }, [params]);

  /*
  queryClient.setQueryData([ViewNames.TransactionsView], (data) => ({
  pages: data.pages.slice(1),
  pageParams: data.pageParams.slice(1),
}))
  */
  // Handle search submission
  const handleSearchSubmit = (formValues: any) => {
    setShowSearch(false);

    if (formValues) {
      // Apply filters
      setFilters(formValues);

      // Update URL params
      router.setParams(formValues);

      // Refresh transactions list with new filters
      refreshTransactions();
    } else {
      // If no values, just close the modal
      router.replace({ pathname: "/Transactions" });
    }
  };

  // Handle search reset
  const handleSearchReset = () => {
    // Clear filters
    setFilters({});

    // Reset URL params
    router.replace({ pathname: "/Transactions" });

    // Close search modal
    setShowSearch(false);

    // Refresh the list with cleared filters
    refreshTransactions();
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
    filters,
    setFilters,
    showCalendar,
    setShowCalendar,
    showSearch,
    setShowSearch,
    params,
    accounts,
    categories,
    status,
    loadMore,
    handleSearchSubmit,
    handleSearchReset,
  };
}

const useBackAction = (selectionMode: boolean, backAction: () => boolean) => {
  useEffect(() => {
    if (Platform.OS === "web") {
      if (selectionMode) {
        window.addEventListener("keydown", e => {
          if (e.key === "Escape") {
            backAction();
          }
        });
      }
    }
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => {
      backHandler.remove();
      if (Platform.OS === "web") window.removeEventListener("keydown", () => {});
    };
  }, [selectionMode, backAction]);
};
