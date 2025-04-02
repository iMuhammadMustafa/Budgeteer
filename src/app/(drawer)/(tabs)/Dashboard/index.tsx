import { useState } from "react";
import { SafeAreaView, ScrollView, Text, View, Pressable, ActivityIndicator, FlatList } from "react-native";
import { router } from "expo-router";
import useDashboard from "./useDashboard";
import Bar from "@/src/components/Charts/Bar";
import DoubleBar from "@/src/components/Charts/DoubleBar";
import MyPie from "@/src/components/Charts/MyPie";
import MyCalendar from "@/src/components/Charts/MyCalendar";
import { PieData, DoubleBarPoint } from "@/src/types/components/Charts.types";
import dayjs from "dayjs";
import MyIcon from "@/src/utils/Icons.Helper";
import { TransactionsView } from "@/src/types/db/Tables.Types";

// Internal TransactionsList component to avoid import issues
const TransactionsList = ({ 
  transactions, 
  onPress 
}: { 
  transactions: TransactionsView[];
  onPress: (transaction: TransactionsView) => void;
}) => {
  const renderItem = ({ item }: { item: TransactionsView }) => {
    const isExpense = item.type === 'Expense' || (item.amount ?? 0) < 0;
    const amountColor = isExpense ? 'text-danger-500' : 'text-success-500';
    
    return (
      <Pressable 
        className="flex-row justify-between items-center p-4 border-b border-muted"
        onPress={() => onPress(item)}
      >
        <View className="flex-row items-center gap-3">
          {item.icon && (
            <View className="w-8 h-8 rounded-full bg-card/30 items-center justify-center">
              <MyIcon name={item.icon} className="text-foreground" size={18} />
            </View>
          )}
          
          <View>
            <Text className="text-foreground font-medium">{item.name || 'Unnamed'}</Text>
            <Text className="text-muted-foreground text-sm">
              {item.categoryname || 'No Category'} • {dayjs(item.date || new Date()).format('MMM D, YYYY')}
            </Text>
          </View>
        </View>
        
        <Text className={`tabular-nums font-medium ${amountColor}`}>
          {isExpense ? '-' : '+'}${Math.abs(item.amount ?? 0).toFixed(2)}
        </Text>
      </Pressable>
    );
  };

  return (
    <FlatList
      data={transactions}
      renderItem={renderItem}
      keyExtractor={(item) => item.id ?? `transaction-${Math.random()}`}
      className="bg-background"
      contentContainerStyle={{ paddingBottom: 20 }}
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
  const [selectedTransactions, setSelectedTransactions] = useState<any[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [activeView, setActiveView] = useState<'calendar' | 'pie' | 'bar' | null>(null);

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
      setSelectedDay(day.dateString);
      setActiveView('calendar');
      
      const transactions = await fetchTransactionsForDate(day.dateString);
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
      
      const transactions = await fetchTransactionsForCategory(item.x, type);
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
              {activeView === 'calendar' ? `Transactions on ${selectedDay}` :
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
      <ScrollView className="flex-1 h-full">
        {activeView ? renderDetailView() : renderDashboardOverview()}
      </ScrollView>
    </SafeAreaView>
  );
}
