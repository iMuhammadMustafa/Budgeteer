import SkeletonList from "@/src/components/elements/SkeletonList";
import GridPattern from "@/src/components/GridPattern";
import ActiveFilters from "@/src/components/Transactions/ActiveFilters";
import BatchActionConfirmModal from "@/src/components/Transactions/BatchActionConfirmModal";
import BatchUpdateModal from "@/src/components/Transactions/BatchUpdateModal";
import DaysList from "@/src/components/Transactions/Days";
import DaySkeleton from "@/src/components/Transactions/DaySkeleton";
import EmptyListComponent from "@/src/components/Transactions/EmptyListComponent";
import ErrorStateComponent from "@/src/components/Transactions/ErrorStateComponent";
import TransactionsPageHeader from "@/src/components/Transactions/PageHeader";
import TransactionSearchForm from "@/src/components/Transactions/SearchForm";
import SplitTransactionModal from "@/src/components/Transactions/SplitTransactionModal";
import { FlatList } from "react-native";
import useTransactions from "./useTransactions";

export default function Transactions() {
  const {
    error,
    isLoading,
    isActionLoading,
    selectedTransactions,
    selectedSum,
    dailyTransactions,
    days,
    clearSelection,
    handleLongPress,
    handlePress,
    refreshTransactions,
    showSearch,
    setShowSearch,
    filters,
    accounts,
    categories,
    params,
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
  } = useTransactions();

  if (error) {
    return <ErrorStateComponent error={error} onRetry={refreshTransactions} />;
  }

  return (
    <>
      <GridPattern />
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
        setShowSearch={setShowSearch}
      />

      <TransactionSearchForm
        isOpen={showSearch}
        setIsOpen={setShowSearch}
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
        <SkeletonList length={5} customSkeleton={<DaySkeleton />} />
      ) : (
        <FlatList
          data={days}
          keyExtractor={item => item}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          onRefresh={refreshTransactions}
          refreshing={isLoading && days.length > 0}
          contentContainerClassName="flex-1"
          renderItem={({ item }) => (
            <DaysList
              day={item}
              data={dailyTransactions}
              selectedTransactions={selectedTransactions}
              handleLongPress={handleLongPress}
              handlePress={handlePress}
            />
          )}
          ListFooterComponent={status === "pending" ? <DaySkeleton /> : null}
          ListEmptyComponent={<EmptyListComponent />}
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
    </>
  );
}
