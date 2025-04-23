import { useState, useCallback } from "react";
import { SafeAreaView, ScrollView, Text, View, Pressable, ActivityIndicator, FlatList, RefreshControl } from "react-native";
import { router } from "expo-router";
import useDashboard from "./useDashboard";
import Bar from "@/src/components/Charts/Bar";
import DoubleBar from "@/src/components/Charts/DoubleBar";
import MyPie from "@/src/components/Charts/MyPie";
import MyCalendar from "@/src/components/Charts/MyCalendar";
import { PieData, DoubleBarPoint } from "@/src/types/components/Charts.types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import MyIcon from "@/src/utils/Icons.Helper";
import { TransactionsView } from "@/src/types/db/Tables.Types";
import { RefreshCcw } from "lucide-react-native";
import { queryClient } from "@/src/providers/QueryProvider";
import { ViewNames } from "@/src/types/db/TableNames";

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

// Define type for the TransactionsList component props
type TransactionsListProps = {
  transactions: TransactionsView[];
  onPress: (transaction: TransactionsView) => void;
};

// Internal TransactionsList component to avoid import issues
const TransactionsList = ({ transactions, onPress }: TransactionsListProps) => {
  return (
    <FlatList
      data={transactions}
      keyExtractor={(item: TransactionsView) => item.id?.toString() || Math.random().toString()}
      renderItem={({ item }: { item: TransactionsView }) => {
        const isExpense = item.amount ? item.amount < 0 : false;
        const localDate = dayjs(item.date || new Date()).local();
        // Use optional chaining to handle potential undefined properties
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
                <Text className="text-base text-foreground font-medium">
                  {item.name || 'Unnamed Transaction'}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {(item as any).groupname && item.categoryname ? 
                    `${(item as any).groupname} • ${item.categoryname}` : 
                    item.categoryname || 'Uncategorized'}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className={`text-base font-medium ${isExpense ? 'text-danger-500' : 'text-success-500'}`}>
                {isExpense ? '-' : '+'}${Math.abs(item.amount || 0).toFixed(2)}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {localDate.format('MMM D, YYYY')}
              </Text>
            </View>
          </Pressable>
        );
      }}
      className="flex-1"
    />
  );
};

export default function Dashboard() {
  const {
    weeklyTransactionTypesData,
    dailyTransactionTypesData,
    yearlyTransactionsTypes,
    monthlyCategories,
    monthlyGroups,
    isWeeklyLoading,
    isMonthlyLoading,
    isYearlyLoading,
    fetchTransactionsForDate,
    fetchTransactionsForCategory,
    fetchTransactionsForMonthAndType,
  } = useDashboard();

  // State for selected data and transactions
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedPieSlice, setSelectedPieSlice] = useState<{data: PieData, type: 'category' | 'group'} | null>(null);
  const [selectedBarData, setSelectedBarData] = useState<DoubleBarPoint | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<TransactionsView[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [activeView, setActiveView] = useState<'calendar' | 'pie' | 'bar' | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Handle refresh function for pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Invalidate all stats queries
    queryClient.invalidateQueries({ 
      queryKey: [ViewNames.StatsDailyTransactions] 
    });
    queryClient.invalidateQueries({ 
      queryKey: [ViewNames.StatsMonthlyCategoriesTransactions] 
    });
    queryClient.invalidateQueries({ 
      queryKey: [ViewNames.StatsMonthlyTransactionsTypes] 
    }).then(() => {
      setRefreshing(false);
    });
  }, []);

  // Function to manually refresh data with the button
  const handleRefresh = () => {
    // Invalidate all stats queries
    queryClient.invalidateQueries({ 
      queryKey: [ViewNames.StatsDailyTransactions] 
    });
    queryClient.invalidateQueries({ 
      queryKey: [ViewNames.StatsMonthlyCategoriesTransactions] 
    });
    queryClient.invalidateQueries({ 
      queryKey: [ViewNames.StatsMonthlyTransactionsTypes] 
    });
  };

  if (isWeeklyLoading && isMonthlyLoading && isYearlyLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="mt-4 text-foreground">Loading dashboard data...</Text>
      </View>
    );
  }

  // Handle calendar day press
  const handleDayPress = async (day: any) => {
    try {
      setIsLoadingTransactions(true);
      // Convert the selected date to local timezone
      const localDate = dayjs(day.dateString).local();
      setSelectedDay(localDate.format('YYYY-MM-DD'));
      setActiveView('calendar');
      
      const transactions = await fetchTransactionsForDate(localDate.format('YYYY-MM-DD'));
      setSelectedTransactions(transactions);
    } catch (error) {
      console.error("Error fetching transactions for date:", error);
      setSelectedTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Handle pie chart slice press
  const handlePiePress = async (item: PieData, type: 'category' | 'group') => {
    try {
      setIsLoadingTransactions(true);
      setSelectedPieSlice({ data: item, type });
      setActiveView('pie');
      
      const transactions = await fetchTransactionsForCategory(item.id, type);
      setSelectedTransactions(transactions);
    } catch (error) {
      console.error("Error fetching transactions for category:", error);
      setSelectedTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Handle bar chart press
  const handleBarPress = async (item: DoubleBarPoint) => {
    try {
      setIsLoadingTransactions(true);
      setSelectedBarData(item);
      setActiveView('bar');
      
      const transactions = await fetchTransactionsForMonthAndType(item.x);
      setSelectedTransactions(transactions);
    } catch (error) {
      console.error("Error fetching transactions for month:", error);
      setSelectedTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Reset selection to return to main dashboard view
  const handleBackToOverview = () => {
    setActiveView(null);
    setSelectedDay(null);
    setSelectedPieSlice(null);
    setSelectedBarData(null);
    setSelectedTransactions([]);
  };

  // Handle transaction press
  const handleTransactionPress = (transaction: any) => {
    if (transaction.id) {
      router.push({
        pathname: "/AddTransaction",
        params: { id: transaction.id }
      });
    }
  };

  // Render detailed view based on selection
  const renderDetailView = () => {
    if (!activeView) return null;

    return (
      <View className="flex-1">
        <View className="p-4 bg-card/20 mb-4 rounded-md">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-foreground">
              {activeView === 'calendar' ? `Transactions on ${dayjs(selectedDay || '').format('MMM D, YYYY')}` :
               activeView === 'pie' ? `${selectedPieSlice?.type === 'category' ? 'Category' : 'Group'}: ${selectedPieSlice?.data.x}` :
               `Month: ${selectedBarData?.x}`}
            </Text>
            <View className="flex-row gap-2">
              <Pressable 
                className="py-2 px-4 bg-primary/80 rounded-md" 
                onPress={() => {
                  // Navigate to the Transactions page with the relevant filter
                  if (activeView === 'calendar' && selectedDay) {
                    router.push({
                      pathname: "/Transactions",
                      params: { date: selectedDay }
                    });
                  } else if (activeView === 'pie' && selectedPieSlice) {
                    router.push({
                      pathname: "/Transactions",
                      params: { 
                        [selectedPieSlice.type === 'category' ? 'categoryid' : 'groupid']: selectedPieSlice.data.x 
                      }
                    });
                  } else if (activeView === 'bar' && selectedBarData) {
                    router.push({
                      pathname: "/Transactions",
                      params: { month: selectedBarData.x }
                    });
                  }
                }}
              >
                <Text className="text-white">View All</Text>
              </Pressable>
              <Pressable 
                className="py-2 px-4 bg-primary rounded-md" 
                onPress={handleBackToOverview}
              >
                <Text className="text-white">Back</Text>
              </Pressable>
            </View>
          </View>

          {/* Display the relevant chart at the top */}
          {activeView === 'calendar' && dailyTransactionTypesData && (
            <MyCalendar 
              label="" 
              data={dailyTransactionTypesData} 
              onDayPress={handleDayPress}
              selectedDate={selectedDay}
            />
          )}
          
          {activeView === 'pie' && selectedPieSlice?.type === 'category' && (
            <MyPie 
              data={monthlyCategories} 
              label="Categories" 
              onPiePress={(item) => handlePiePress(item, 'category')}
              highlightedSlice={selectedPieSlice?.data.x}
            />
          )}
          
          {activeView === 'pie' && selectedPieSlice?.type === 'group' && (
            <MyPie 
              data={monthlyGroups} 
              label="Groups" 
              onPiePress={(item) => handlePiePress(item, 'group')}
              highlightedSlice={selectedPieSlice?.data.x}
            />
          )}
          
          {activeView === 'bar' && yearlyTransactionsTypes && (
            <DoubleBar 
              data={yearlyTransactionsTypes} 
              label="Net Earnings" 
              onBarPress={handleBarPress}
              highlightedBar={selectedBarData?.x}
            />
          )}
        </View>

        {/* Display the transactions that make up the selection */}
        <View className="flex-1">
          <Text className="text-lg font-semibold text-foreground mb-2 px-4">Transactions</Text>
          {isLoadingTransactions ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="small" color="#0000ff" />
              <Text className="mt-2 text-muted">Loading transactions...</Text>
            </View>
          ) : selectedTransactions.length === 0 ? (
            <View className="flex-1 justify-center items-center p-4">
              <Text className="text-muted">No transactions found</Text>
            </View>
          ) : (
            <TransactionsList 
              transactions={selectedTransactions}
              onPress={handleTransactionPress}
            />
          )}
        </View>
      </View>
    );
  };

  // Main Dashboard View
  const renderDashboardOverview = () => {
    return (
      <View>
        <Bar 
          data={weeklyTransactionTypesData!} 
          hideY 
          label="Last Week Expenses" 
        />
        
        <DoubleBar 
          data={yearlyTransactionsTypes} 
          label="Net Earnings" 
          onBarPress={handleBarPress}
        />

        <MyPie 
          data={monthlyCategories} 
          label="Categories"
          onPiePress={(item) => handlePiePress(item, 'category')}
        />
        
        <MyPie 
          data={monthlyGroups} 
          label="Groups"
          onPiePress={(item) => handlePiePress(item, 'group')}
        />

        <MyCalendar 
          label="Calendar" 
          data={dailyTransactionTypesData!} 
          onDayPress={handleDayPress} 
        />
      </View>
    );
  };

  return (
    <SafeAreaView className="w-full h-full m-auto flex-1">
      <View className="flex-row items-center justify-between px-4 py-2 bg-background">
        <Text className="text-xl font-bold text-foreground">Dashboard</Text>
        <Pressable 
          onPress={handleRefresh}
          className="p-2"
        >
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
        {activeView ? renderDetailView() : renderDashboardOverview()}
      </ScrollView>
    </SafeAreaView>
  );
}
