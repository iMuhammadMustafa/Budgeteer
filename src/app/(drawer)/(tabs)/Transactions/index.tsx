import { SkeletonGroup } from "@/src/components/ui";
import ActiveFilters from "@/src/components/Transactions/ActiveFilters";
import BatchActionConfirmModal from "@/src/components/Transactions/BatchActionConfirmModal";
import BatchUpdateModal from "@/src/components/Transactions/BatchUpdateModal";
import DayHeader from "@/src/components/Transactions/DayHeader";
import DaySkeleton from "@/src/components/Transactions/DaySkeleton";
import EmptyListComponent from "@/src/components/Transactions/EmptyListComponent";
import ErrorStateComponent from "@/src/components/Transactions/ErrorStateComponent";
import TransactionsPageHeader from "@/src/components/Transactions/PageHeader";
import TransactionSearchForm from "@/src/components/Transactions/SearchForm";
import SplitTransactionModal from "@/src/components/Transactions/SplitTransactionModal";
import TransactionItem from "@/src/components/Transactions/TransactionItem";
import { TransactionListRow } from "@/src/types/components/Transactions.types";
import { CONTENT_MAX_WIDTH } from "@/src/constants/layout";
import { useCallback } from "react";
import { FlatList, View } from "react-native";
import useTransactions from "./useTransactions";

export default function Transactions() {
  const {
    error,
    isLoading,
    isFetchingNextPage,
    isActionLoading,
    selectedTransactions,
    selectedSum,
    selectedIds,
    rows,
    clearSelection,
    handleLongPress,
    handlePress,
    refreshTransactions,
    showFilters,
    setShowFilters,
    searchText,
    handleSearchTextChange,
    activeFilterCount,
    filters,
    accounts,
    categories,
    params,
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
  } = useTransactions();

  const renderItem = useCallback(
    ({ item }: { item: TransactionListRow }) =>
      item.kind === "header" ? (
        <DayHeader day={item.day} amount={item.amount} />
      ) : (
        <TransactionItem
          transaction={item.transaction}
          transferTransaction={item.transferTransaction}
          isSelected={selectedIds.has(item.transaction.id)}
          onPress={handlePress}
          onLongPress={handleLongPress}
        />
      ),
    [selectedIds, handlePress, handleLongPress],
  );

  if (error) {
    return <ErrorStateComponent error={error} onRetry={refreshTransactions} />;
  }

  return (
    <View className="flex-1 items-center">
      <View className="w-full flex-1" style={{ maxWidth: CONTENT_MAX_WIDTH }}>
        <TransactionsPageHeader
        selectedTransactions={selectedTransactions}
        selectedSum={selectedSum}
        openDeleteConfirm={() => openConfirmModal("delete")}
        openDuplicateConfirm={() => openConfirmModal("duplicate")}
        openBatchUpdate={() => setShowBatchUpdate(true)}
        onSplit={() => setShowSplitModal(true)}
        isActionLoading={isActionLoading}
        clearSelection={clearSelection}
        refreshTransactions={refreshTransactions}
        searchText={searchText}
        onSearchTextChange={handleSearchTextChange}
        onOpenFilters={() => setShowFilters(true)}
        activeFilterCount={activeFilterCount}
      />

      <TransactionSearchForm
        isOpen={showFilters}
        setIsOpen={setShowFilters}
        filters={params || filters}
        accounts={accounts ?? []}
        categories={categories ?? []}
        onSubmit={handleSearchSubmit}
        onClear={handleSearchReset}
      />

      <ActiveFilters
        filters={params || filters}
        accounts={accounts ?? []}
        categories={categories ?? []}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleSearchReset}
      />

      {isLoading ? (
        <SkeletonGroup count={5} renderRow={() => <DaySkeleton />} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={row => row.key}
          renderItem={renderItem}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          onRefresh={refreshTransactions}
          refreshing={isLoading && rows.length > 0}
          contentContainerStyle={rows.length === 0 ? { flexGrow: 1 } : undefined}
          ListFooterComponent={isFetchingNextPage ? <DaySkeleton /> : null}
          ListEmptyComponent={<EmptyListComponent />}
          windowSize={11}
          maxToRenderPerBatch={12}
          initialNumToRender={12}
        />
      )}

      <BatchUpdateModal
        isOpen={showBatchUpdate}
        setIsOpen={setShowBatchUpdate}
        selectedTransactions={selectedTransactions}
        accounts={accounts ?? []}
        categories={categories ?? []}
        onUpdate={handleBatchUpdateSubmit}
      />

      <SplitTransactionModal
        isOpen={showSplitModal}
        setIsOpen={setShowSplitModal}
        onClose={() => setShowSplitModal(false)}
        onSuccess={clearSelection}
        transaction={selectedTransactions[0]}
        categories={categories ?? []}
      />

      <BatchActionConfirmModal
        isOpen={confirmAction !== null}
        setIsOpen={open => !open && closeConfirmModal()}
        actionType={confirmAction ?? "delete"}
        selectedTransactions={selectedTransactions}
        isLoading={isActionLoading}
        onConfirm={executeConfirmedAction}
        updateSummary={confirmAction === "update" ? updateSummary : undefined}
      />
      </View>
    </View>
  );
}
