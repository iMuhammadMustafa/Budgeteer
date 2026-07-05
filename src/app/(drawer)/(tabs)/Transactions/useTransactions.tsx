import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import useBackAction from "@/src/utils/useBackAction";

import { TableNames, ViewNames } from "@/src/types/database/TableNames";
import { queryKeys } from "@/src/services/queryKeys";
import { TransactionsView } from "@/src/types/database/Tables.Types";

import { TransactionFilters } from "@/src/types/apis/TransactionFilters";

import { BatchActionType } from "@/src/components/Transactions/BatchActionConfirmModal";
import { BatchUpdatePayload } from "@/src/components/Transactions/BatchUpdateModal";
import { useTransactionCategoryService } from "@/src/services//TransactionCategories.Service";
import { useAccountService } from "@/src/services/Accounts.Service";
import { BatchUpdateParams, useTransactionService } from "@/src/services/Transactions.Service";
import { duplicateTransaction, groupTransactions } from "@/src/utils/transactions.helper";

/** Filter keys that are internal / pagination-related, never counted as a user-facing filter. */
const NON_FILTER_KEYS = new Set(["offset", "limit", "page", "raw", "isDeleted", "name"]);

const countActiveFilters = (filters: TransactionFilters) =>
  Object.entries(filters).filter(([key, value]) => {
    if (NON_FILTER_KEYS.has(key)) return false;
    if (value === undefined || value === null || value === "") return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }).length;

export default function useTransactions() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const params = useLocalSearchParams() as TransactionFilters & { page?: string };
  // `page` is a scroll-depth bookmark for the URL only — it must never reach the query,
  // or every `loadMore` write to the URL would change the query key and restart the list.
  const { page: _pageParam, ...queryFilters } = params;

  const transactionService = useTransactionService();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, error, isLoading } =
    transactionService.useFindAllInfinite(queryFilters);
  const transactions = data?.pages.flatMap(page => page);

  // Restore roughly how far the user had scrolled: the URL's `page` param tracks how many
  // pages of the infinite query were loaded, so a fresh load of the same URL replays that
  // many `fetchNextPage` calls instead of starting the user back at the very top.
  const targetPageRef = useRef(params.page ? parseInt(params.page, 10) : 1);
  const hydratingRef = useRef(false);
  useEffect(() => {
    if (hydratingRef.current) return;
    const loadedPages = data?.pages.length ?? 0;
    if (loadedPages === 0) return; // wait for the first page to land
    if (loadedPages >= targetPageRef.current) return;
    if (!hasNextPage || isFetchingNextPage) return;

    hydratingRef.current = true;
    fetchNextPage().finally(() => {
      hydratingRef.current = false;
    });
  }, [data?.pages.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const transactionCategoriesService = useTransactionCategoryService();
  const accountsService = useAccountService();
  const { data: accounts } = accountsService.useFindAll();
  const { data: categories } = transactionCategoriesService.useFindAll();
  const addMutation = transactionService.useCreate();
  const deleteMutation = transactionService.useDelete();

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<TransactionsView[]>([]);
  const [selectedSum, setSelectedSum] = useState(0);

  const [showFilters, setShowFilters] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const [filters, setFilters] = useState<TransactionFilters>(params);
  const [searchText, setSearchText] = useState(params.name ?? "");
  const activeFilterCount = countActiveFilters(filters);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [confirmAction, setConfirmAction] = useState<BatchActionType | null>(null);
  const [showBatchUpdate, setShowBatchUpdate] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<BatchUpdatePayload | null>(null);
  const [updateSummary, setUpdateSummary] = useState("");

  const updateMultipleMutation = transactionService.useUpdateMultipleTransactions();

  const openConfirmModal = (actionType: BatchActionType) => setConfirmAction(actionType);
  const closeConfirmModal = () => setConfirmAction(null);

  const dailyTransactions = groupTransactions(transactions ?? []);
  const days = Object.keys(dailyTransactions);

  const clearSelection = useCallback(() => {
    setSelectedTransactions([]);
    setSelectedSum(0);
    setSelectionMode(false);
  }, []);

  const copyTransactions = async () => {
    setIsActionLoading(true);

    try {
      for (let item of selectedTransactions) {
        const newTransaction = duplicateTransaction(item);

        await addMutation.mutateAsync(newTransaction, {
          onSuccess: async () => {
            console.log({ message: "Transaction Created Successfully", type: "success" });
            await queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
            await queryClient.invalidateQueries({ queryKey: queryKeys.transactions.viewAll });
            await queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
          },
        });
      }
    } catch (error) {
      console.log({ message: "Error creating transactions", type: "error" });
    } finally {
      setIsActionLoading(false);
      clearSelection();
      closeConfirmModal();
    }
  };

  const deleteSelection = async () => {
    setIsActionLoading(true);
    try {
      for (let item of selectedTransactions) {
        await deleteMutation.mutateAsync(
          { id: item.id!, item: item as any },
          {
            onSuccess: () => {
              console.log({ message: "Transaction Deleted Successfully", type: "success" });
            },
          },
        );
      }
    } finally {
      setIsActionLoading(false);
      clearSelection();
      closeConfirmModal();
    }
  };

  const handleBatchUpdateSubmit = (updates: BatchUpdatePayload, summary: string) => {
    setPendingUpdates(updates);
    setUpdateSummary(summary);
    setShowBatchUpdate(false);
    openConfirmModal("update");
  };

  const executeBatchUpdate = async () => {
    if (!pendingUpdates) return;

    setIsActionLoading(true);
    try {
      const params: BatchUpdateParams = {
        transactions: selectedTransactions,
        updates: pendingUpdates,
      };
      await updateMultipleMutation.mutateAsync(params);
      console.log({ message: "Transactions updated successfully", type: "success" });
    } catch (error) {
      console.log({ message: "Error updating transactions", type: "error", error });
    } finally {
      setIsActionLoading(false);
      clearSelection();
      closeConfirmModal();
      setPendingUpdates(null);
      setUpdateSummary("");
    }
  };

  const executeConfirmedAction = async () => {
    switch (confirmAction) {
      case "delete":
        await deleteSelection();
        break;
      case "duplicate":
        await copyTransactions();
        break;
      case "update":
        await executeBatchUpdate();
        break;
    }
  };

  const handlePress = (item: TransactionsView, transferItem?: TransactionsView) => {
    if (selectionMode) {
      // In selection mode, short press selects/deselects
      if (Platform.OS !== "web") Haptics.selectionAsync();

      const updatedSelections = selectedTransactions.find(i => i.id === item.id)
        ? selectedTransactions.filter(t => t.id !== item.id)
        : [...selectedTransactions, item];

      setSelectedTransactions(updatedSelections);

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

  const handleLongPress = (item: any, transferItem?: TransactionsView) => {
    if (selectionMode) handlePress(item, transferItem);
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setSelectionMode(true);
    setSelectedTransactions(prev => [...prev, item]);
    setSelectedSum(prev => prev + item.amount);
  };

  const refreshTransactions = async () => {
    // resetInfiniteQueryPagination();
    // await queryClient.removeQueries({ queryKey: queryKeys.transactions.viewAll, exact: false });
    await queryClient.invalidateQueries({ queryKey: queryKeys.transactions.viewAll, exact: false });
    await queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    await queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
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
      fetchNextPage()
        .then(result => {
          const loadedPages = result.data?.pages.length;
          if (loadedPages) {
            targetPageRef.current = loadedPages;
            // Shallow update so a reload of this URL restores roughly this scroll depth
            // without re-navigating or disturbing the current scroll position.
            router.setParams({ page: String(loadedPages) } as any);
          }
        })
        .catch(error => {
          console.error("Error loading more transactions:", error);
        });
    }
  };

  // Handle search submission
  const handleSearchSubmit = (formValues: any) => {
    setShowFilters(false);

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
    setSearchText("");

    // Reset URL params
    router.replace({ pathname: "/Transactions" });

    // Close filter panel
    setShowFilters(false);

    // Refresh the list with cleared filters
    refreshTransactions();
  };

  // Handle removing a single filter
  const handleRemoveFilter = (key: keyof TransactionFilters) => {
    const updatedFilters = { ...filters };
    delete updatedFilters[key];
    setFilters(updatedFilters);
    if (key === "name") setSearchText("");

    // Always use replace so the removed key is actually dropped from the URL
    // (router.setParams only merges — it never deletes keys)
    const visibleKeys = Object.keys(updatedFilters).filter(
      k =>
        !["offset", "limit", "page", "raw", "isDeleted"].includes(k) &&
        updatedFilters[k as keyof TransactionFilters] !== undefined,
    );

    if (visibleKeys.length === 0) {
      router.replace({ pathname: "/Transactions" });
    } else {
      router.replace({ pathname: "/Transactions", params: updatedFilters as any });
    }

    refreshTransactions();
  };

  // Inline header search: reflects into `filters`/URL after a short debounce so
  // every keystroke doesn't trigger a refetch + URL rewrite.
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      if (text.trim()) {
        const updatedFilters = { ...filters, name: text.trim() };
        setFilters(updatedFilters);
        router.replace({ pathname: "/Transactions", params: updatedFilters as any });
      } else {
        handleRemoveFilter("name");
        return;
      }
      refreshTransactions();
    }, 400);
  };
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const [showSplitModal, setShowSplitModal] = useState(false);

  const isAnyModalOpen = showSplitModal || showBatchUpdate || confirmAction !== null || showFilters;
  const backAction = useCallback((): boolean => {
    // When a modal is open, let the modal's own back handler claim Escape — otherwise
    // selection-mode would consume it and the modal would never receive the event.
    if (isAnyModalOpen) return false;
    if (selectionMode) {
      clearSelection();
      return true;
    }
    return false;
  }, [isAnyModalOpen, selectionMode, clearSelection]);
  useBackAction(selectionMode, backAction);

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
    showFilters,
    setShowFilters,
    searchText,
    handleSearchTextChange,
    activeFilterCount,
    params,
    accounts,
    categories,
    status,
    loadMore,
    handleSearchSubmit,
    handleSearchReset,
    handleRemoveFilter,
    // Modal states and handlers
    confirmAction,
    openConfirmModal,
    closeConfirmModal,
    showBatchUpdate,
    setShowBatchUpdate,
    updateSummary,
    handleBatchUpdateSubmit,
    executeConfirmedAction,
    showSplitModal,
    setShowSplitModal,
  };
}
