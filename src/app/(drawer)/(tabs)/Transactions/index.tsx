import { router } from "expo-router";
import { Text, SafeAreaView, ActivityIndicator, FlatList } from "react-native";
import DaysList from "@/src/components/pages/Transactions/Days";
import TransactionsPageHeader from "@/src/components/pages/Transactions/PageHeader";
import TransactionSearchModal from "@/src/components/pages/Transactions/SearchModal";
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
    accounts,
    categories,
    params,
    status,
    loadMore,
  } = useTransactions();

  if (isLoading || status === "pending") return <ActivityIndicator size="large" color="#0000ff" />;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <SafeAreaView className="w-full h-full">
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

      <TransactionSearchModal
        isOpen={showSearch}
        setIsOpen={setShowSearch}
        searchParams={params}
        accounts={accounts ?? []}
        categories={categories ?? []}
        onSubmit={formValues => {
          setShowSearch(false);
          if (formValues) {
            router.setParams(formValues);
          } else {
            router.replace({ pathname: "/Transactions" });
          }
        }}
        onClear={() => {
          setFilters({});
        }}
      />

      <FlatList
        data={days}
        keyExtractor={item => item}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        onRefresh={refreshTransactions}
        refreshing={isLoading}
        renderItem={({ item }) => (
          <DaysList
            day={item}
            data={dailyTransactions}
            selectedTransactions={selectedTransactions}
            handleLongPress={handleLongPress}
            handlePress={handlePress}
          />
        )}
        // ListFooterComponent={isFetchingNextPage ? <Text>Loading more...</Text> : null}
      />
    </SafeAreaView>
  );
}
