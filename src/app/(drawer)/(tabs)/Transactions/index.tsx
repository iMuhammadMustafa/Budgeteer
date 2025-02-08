import DaysList from "@/src/components/pages/Transactions/Days";
import TransactionsPageHeader from "@/src/components/pages/Transactions/PageHeader";
import TransactionSearchForm from "@/src/components/pages/Transactions/SearchForm";
import TransactionSearchModal from "@/src/components/pages/Transactions/SearchModal";
import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { TransactionSearchFormProps, TransactionsPageHeaderProps } from "@/src/types/pages/Transactions.types";
import MyIcon from "@/src/utils/Icons.Helper";
import { Link, router } from "expo-router";
import { useEffect } from "react";
import { View, Text, SafeAreaView, ActivityIndicator, FlatList, Platform, BackHandler, Pressable } from "react-native";
import Modal from "react-native-modal";

export default function Transactions() {
  const {
    transactions,
    error,
    isLoading,
    selectionMode,
    selectedTransactions,
    selectedSum,
    dailyTransactions,
    days,
    backAction,
    clearSelection,
    handleLongPress,
    handlePress,
    deleteSelection,
    copyTransactions,
    refreshTransactions,
    // loadMore,
    // isFetchingNextPage,
    status,
    showSearch,
    setShowSearch,
    filters,
    setFilters,
    accounts,
    categories,
    params,
  } = useTransactions();

  if (isLoading) return <ActivityIndicator size="large" color="#0000ff" />;
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
        accounts={accounts}
        categories={categories}
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
        // onEndReached={loadMore}
        // onEndReachedThreshold={0.5}
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
