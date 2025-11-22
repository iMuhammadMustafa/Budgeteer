import DaysList from "@/src/components/Transactions/Days";
import DaySkeleton from "@/src/components/Transactions/DaySkeleton";
import TransactionsPageHeader from "@/src/components/Transactions/PageHeader";
import TransactionSearchForm from "@/src/components/Transactions/SearchForm";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useTransactions from "./useTransactions";

export default function Transactions() {
  const {
    error,
    isLoading,
    selectedTransactions,
    selectedSum,
    dailyTransactions,
    days,
    clearSelection,
    handleLongPress,
    handlePress,
    deleteSelection,
    copyTransactions,
    refreshTransactions,
    showSearch,
    setShowSearch,
    setFilters,
    filters,
    accounts,
    categories,
    params,
    status,
    loadMore,
    handleSearchSubmit,
    handleSearchReset,
  } = useTransactions();

  if (error)
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-danger-500">Error: {error.message}</Text>
      </View>
    );

  return (
    <SafeAreaView className="w-full h-full bg-background">
      <TransactionsPageHeader
        selectedTransactions={selectedTransactions}
        selectedSum={selectedSum}
        deleteSelection={deleteSelection}
        copyTransactions={copyTransactions}
        clearSelection={clearSelection}
        refreshTransactions={refreshTransactions}
        showSearch={showSearch}
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

      {isLoading && days.length === 0 ? (
        <FlatList
          data={Array.from({ length: 5 })}
          keyExtractor={(_, idx) => `skeleton-${idx}`}
          renderItem={() => <DaySkeleton />}
        />
      ) : days.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-xl text-muted">No transactions found</Text>
        </View>
      ) : (
        <FlatList
          data={days}
          keyExtractor={item => item}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          onRefresh={refreshTransactions}
          refreshing={isLoading && days.length > 0}
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
        />
      )}
    </SafeAreaView>
  );
}
