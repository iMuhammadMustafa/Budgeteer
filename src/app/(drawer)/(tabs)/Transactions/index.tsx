import { router } from "expo-router";
import { Text, SafeAreaView, ActivityIndicator, FlatList, View } from "react-native";
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

  if (error) return (
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

      {isLoading && days.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
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
          ListFooterComponent={
            status === "pending" ? (
              <View className="py-4 flex items-center">
                <ActivityIndicator size="small" color="#0000ff" />
                <Text className="text-muted pt-2">Loading more...</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
