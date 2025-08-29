import { useState, useCallback } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import useDashboard from "./useDashboardViewModel";
import Bar from "@/src/components/Charts/Bar";
import DoubleBar from "@/src/components/Charts/DoubleBar";
import Line from "@/src/components/Charts/Line";
import MyPie from "@/src/components/Charts/MyPie";
import MyCalendar from "@/src/components/Charts/MyCalendar";
import { PieData } from "@/src/types/components/Charts.types";
import dayjs from "dayjs";
import MyIcon from "@/src/utils/Icons.Helper";
import { TransactionsView } from "@/src/types/db/Tables.Types";
import { RefreshCcw } from "lucide-react-native";

export default function Dashboard() {
  const {
    weeklyTransactionTypesData,
    dailyTransactionTypesData,
    yearlyTransactionsTypes,
    monthlyCategories,
    monthlyGroups,
    netWorthGrowth,
    isLoading,
    selection,
    refreshing,
    onRefresh,
    handleDayPress,
    handlePiePress,
    handleBarPress,
    handleTransactionPress,
    handleBackToOverview,
  } = useDashboard();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="mt-4 text-foreground">Loading dashboard data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="w-full h-full m-auto flex-1">
      <View className="flex-row items-center justify-between px-4 py-2 bg-background">
        <Text className="text-xl font-bold text-foreground">Dashboard</Text>
        <Pressable onPress={onRefresh} className="p-2">
          <RefreshCcw size={24} color="#4CAF50" />
        </Pressable>
      </View>
      <ScrollView
        className="flex-1 h-full"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4CAF50"]}
            tintColor="#4CAF50"
            title="Pull to refresh"
            titleColor="#4CAF50"
          />
        }
      >
        {selection.type ? (
          <DetailView
            selection={selection}
            dailyTransactionTypesData={dailyTransactionTypesData}
            monthlyCategories={monthlyCategories}
            monthlyGroups={monthlyGroups}
            yearlyTransactionsTypes={yearlyTransactionsTypes}
            handleBackToOverview={handleBackToOverview}
            handleDayPress={handleDayPress}
            handlePiePress={handlePiePress}
            handleBarPress={handleBarPress}
            handleTransactionPress={handleTransactionPress}
          />
        ) : (
          <DashboardView
            weeklyTransactionTypesData={weeklyTransactionTypesData}
            yearlyTransactionsTypes={yearlyTransactionsTypes}
            netWorthGrowth={netWorthGrowth}
            monthlyCategories={monthlyCategories}
            monthlyGroups={monthlyGroups}
            dailyTransactionTypesData={dailyTransactionTypesData}
            handleBarPress={handleBarPress}
            handlePiePress={handlePiePress}
            handleDayPress={handleDayPress}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
function DashboardView({
  weeklyTransactionTypesData,
  yearlyTransactionsTypes,
  netWorthGrowth,
  monthlyCategories,
  monthlyGroups,
  dailyTransactionTypesData,
  handleBarPress,
  handlePiePress,
  handleDayPress,
}: {
  weeklyTransactionTypesData: any;
  yearlyTransactionsTypes: any;
  netWorthGrowth: any;
  monthlyCategories: any;
  monthlyGroups: any;
  dailyTransactionTypesData: any;
  handleBarPress: (item: any) => void;
  handlePiePress: (item: PieData, type: "category" | "group") => void;
  handleDayPress: (date: string) => void;
}) {
  return (
    <View>
      <Bar data={weeklyTransactionTypesData!} hideY label="Last Week Expenses" />
      <DoubleBar data={yearlyTransactionsTypes} label="Net Earnings" onBarPress={handleBarPress} />
      <Line data={netWorthGrowth} label="Net Worth Growth" color="rgba(76, 175, 80, 0.6)" />
      <MyPie data={monthlyCategories} label="Categories" onPiePress={item => handlePiePress(item, "category")} />
      <MyPie data={monthlyGroups} label="Groups" onPiePress={item => handlePiePress(item, "group")} />
      <MyCalendar label="Calendar" data={dailyTransactionTypesData!} onDayPress={handleDayPress} />
    </View>
  );
}

function DetailView({
  selection,
  dailyTransactionTypesData,
  monthlyCategories,
  monthlyGroups,
  yearlyTransactionsTypes,
  handleBackToOverview,
  handleDayPress,
  handlePiePress,
  handleBarPress,
  handleTransactionPress,
}: {
  selection: any;
  dailyTransactionTypesData: any;
  monthlyCategories: any;
  monthlyGroups: any;
  yearlyTransactionsTypes: any;
  handleBackToOverview: () => void;
  handleDayPress: (date: string) => void;
  handlePiePress: (item: any, type: "category" | "group") => void;
  handleBarPress: (item: any) => void;
  handleTransactionPress: (item: any) => void;
}) {
  if (!selection.type) return null;

  const getNavigationParams = () => {
    if (selection.type === "calendar") {
      return { date: selection.data.date };
    } else if (selection.type === "pie") {
      const key = selection.data.type === "category" ? "categoryid" : "groupid";
      return { [key]: selection.data.item.id };
    } else if (selection.type === "bar") {
      return { month: selection.data.item.x };
    }
    return {};
  };

  return (
    <View className="flex-1">
      <View className="p-4 bg-card/20 mb-4 rounded-md">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-foreground">{selection.data.label}</Text>
          <View className="flex-row gap-2">
            <Pressable
              className="py-2 px-4 bg-primary/80 rounded-md"
              onPress={() => {
                router.push({
                  pathname: "/Transactions",
                  params: getNavigationParams(),
                });
              }}
            >
              <Text className="text-white">View All</Text>
            </Pressable>
            <Pressable className="py-2 px-4 bg-primary rounded-md" onPress={handleBackToOverview}>
              <Text className="text-white">Back</Text>
            </Pressable>
          </View>
        </View>

        {selection.type === "calendar" && dailyTransactionTypesData && (
          <MyCalendar
            label=""
            data={dailyTransactionTypesData}
            onDayPress={handleDayPress}
            selectedDate={selection.data.date}
          />
        )}

        {selection.type === "pie" && selection.data.type === "category" && (
          <MyPie
            data={monthlyCategories}
            label="Categories"
            onPiePress={item => handlePiePress(item, "category")}
            highlightedSlice={selection.data.item.x}
          />
        )}

        {selection.type === "pie" && selection.data.type === "group" && (
          <MyPie
            data={monthlyGroups}
            label="Groups"
            onPiePress={item => handlePiePress(item, "group")}
            highlightedSlice={selection.data.item.x}
          />
        )}

        {selection.type === "bar" && yearlyTransactionsTypes && (
          <DoubleBar
            data={yearlyTransactionsTypes}
            label="Net Earnings"
            onBarPress={handleBarPress}
            highlightedBar={selection.data.item.x}
          />
        )}
      </View>

      <View className="flex-1">
        <Text className="text-lg font-semibold text-foreground mb-2 px-4">Transactions</Text>
        {selection.isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="small" color="#0000ff" />
            <Text className="mt-2 text-muted">Loading transactions...</Text>
          </View>
        ) : selection.transactions.length === 0 ? (
          <View className="flex-1 justify-center items-center p-4">
            <Text className="text-muted">No transactions found</Text>
          </View>
        ) : (
          <TransactionsList transactions={selection.transactions} onPress={handleTransactionPress} />
        )}
      </View>
    </View>
  );
}
function TransactionsList({
  transactions,
  onPress,
}: {
  transactions: TransactionsView[];
  onPress: (transaction: TransactionsView) => void;
}) {
  return (
    <FlatList
      className="flex-1"
      data={transactions}
      keyExtractor={item => item.id?.toString() || Math.random().toString()}
      renderItem={({ item }) => {
        const isExpense = item.amount ? item.amount < 0 : false;
        const localDate = dayjs(item.date || new Date()).local();
        const iconToUse = (item as any).groupicon || item.icon;

        return (
          <Pressable
            onPress={() => onPress(item)}
            className="flex-row items-center justify-between p-4 bg-card/30 rounded-lg mb-2"
          >
            <View className="flex-row items-center flex-1">
              {iconToUse && (
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                  <MyIcon name={iconToUse} size={20} color="#4CAF50" />
                </View>
              )}
              <View className="flex-1">
                <Text className="text-base text-foreground font-medium">{item.name || "Unnamed Transaction"}</Text>
                <Text className="text-sm text-muted-foreground">
                  {(item as any).groupname && item.categoryname
                    ? `${(item as any).groupname} • ${item.categoryname}`
                    : item.categoryname || "Uncategorized"}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className={`text-base font-medium ${isExpense ? "text-danger-500" : "text-success-500"}`}>
                {isExpense ? "-" : "+"}${Math.abs(item.amount || 0).toFixed(2)}
              </Text>
              <Text className="text-sm text-muted-foreground">{localDate.format("MMM D, YYYY")}</Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
}
