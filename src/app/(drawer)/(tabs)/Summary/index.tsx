import { useState, useEffect } from "react";
import { View, Text, SafeAreaView, StatusBar, ActivityIndicator, ScrollView, Pressable, Modal } from "react-native";
import dayjs from "dayjs";
import ExpenseComparison from "@/src/components/ExpenseComparison";
import { useGetStatsMonthlyCategoriesTransactions } from "@/src/services/repositories/Stats.Repository";
import { Calendar } from "react-native-calendars";
import { getStatsMonthlyCategoriesTransactions } from "@/src/services/apis/Stats.api";

type TimePeriod = 'month' | '3months' | 'year' | 'custom';

// Type for the raw API response
type CategoryTransaction = {
  groupname: string | null;
  type: string | null;
  groupbudgetamount: number | null;
  groupbudgetfrequency: string | null;
  groupicon: string | null;
  groupcolor: string | null;
  groupdisplayorder: number | null;
  categoryname: string | null;
  categorybudgetamount: number | null;
  categorybudgetfrequency: string | null;
  categoryicon: string | null;
  categorycolor: string | null;
  categorydisplayorder: number | null;
  date: string | null;
  sum: number | null;
};

export default function Summary() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [currentMonth, setCurrentMonth] = useState(dayjs().format("YYYY-MM"));
  const [previousMonth, setPreviousMonth] = useState(dayjs().subtract(1, 'month').format("YYYY-MM"));
  
  const [showFirstMonthPicker, setShowFirstMonthPicker] = useState(false);
  const [showSecondMonthPicker, setShowSecondMonthPicker] = useState(false);
  
  const [firstSelectedMonth, setFirstSelectedMonth] = useState(previousMonth);
  const [secondSelectedMonth, setSecondSelectedMonth] = useState(currentMonth);
  
  // State to store raw API data
  const [currentMonthRawData, setCurrentMonthRawData] = useState<CategoryTransaction[]>([]);
  const [previousMonthRawData, setPreviousMonthRawData] = useState<CategoryTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Get date ranges based on selected time period
  const getDateRange = () => {
    switch(timePeriod) {
      case 'month':
        return {
          current: {
            start: dayjs(currentMonth).startOf('month').toISOString(),
            end: dayjs(currentMonth).endOf('month').toISOString(),
            label: dayjs(currentMonth).format('MMMM YYYY')
          },
          previous: {
            start: dayjs(previousMonth).startOf('month').toISOString(),
            end: dayjs(previousMonth).endOf('month').toISOString(),
            label: dayjs(previousMonth).format('MMMM YYYY')
          }
        };
      case '3months':
        return {
          current: {
            start: dayjs().subtract(2, 'month').startOf('month').toISOString(),
            end: dayjs().endOf('month').toISOString(),
            label: `Last 3 Months`
          },
          previous: {
            start: dayjs().subtract(5, 'month').startOf('month').toISOString(),
            end: dayjs().subtract(3, 'month').endOf('month').toISOString(),
            label: `Previous 3 Months`
          }
        };
      case 'year':
        return {
          current: {
            start: dayjs().startOf('year').toISOString(),
            end: dayjs().endOf('year').toISOString(),
            label: dayjs().format('YYYY')
          },
          previous: {
            start: dayjs().subtract(1, 'year').startOf('year').toISOString(),
            end: dayjs().subtract(1, 'year').endOf('year').toISOString(),
            label: dayjs().subtract(1, 'year').format('YYYY')
          }
        };
      case 'custom':
        return {
          current: {
            start: dayjs(secondSelectedMonth).startOf('month').toISOString(),
            end: dayjs(secondSelectedMonth).endOf('month').toISOString(),
            label: dayjs(secondSelectedMonth).format('MMMM YYYY')
          },
          previous: {
            start: dayjs(firstSelectedMonth).startOf('month').toISOString(),
            end: dayjs(firstSelectedMonth).endOf('month').toISOString(),
            label: dayjs(firstSelectedMonth).format('MMMM YYYY')
          }
        };
    }
  };
  
  const dateRange = getDateRange();
  
  // Fetch data directly from the API when date ranges change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch data for both periods
        const currentData = await getStatsMonthlyCategoriesTransactions(
          dateRange.current.start,
          dateRange.current.end
        );
        
        const previousData = await getStatsMonthlyCategoriesTransactions(
          dateRange.previous.start,
          dateRange.previous.end
        );
        
        setCurrentMonthRawData(currentData);
        setPreviousMonthRawData(previousData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [dateRange.current.start, dateRange.previous.start]);
  
  // Function to transform data into the required format for ExpenseComparison
  const transformDataForComparison = () => {
    if (!currentMonthRawData || !previousMonthRawData) return [];
    
    // Get all unique categories from both datasets
    const allCategories = new Set<string>();
    const allGroups = new Set<string>();
    
    // Track categories by their full names to handle potential name conflicts
    currentMonthRawData.forEach(item => {
      if (item.categoryname && item.groupname) {
        allCategories.add(`${item.groupname}:${item.categoryname}`);
        allGroups.add(item.groupname);
      }
    });
    
    previousMonthRawData.forEach(item => {
      if (item.categoryname && item.groupname) {
        allCategories.add(`${item.groupname}:${item.categoryname}`);
        allGroups.add(item.groupname);
      }
    });
    
    // Create comparison data
    const comparisonData = [
      {
        date: dateRange.previous.label,
        transactions: Array.from(allCategories).map((fullCategory: string) => {
          const [groupName, categoryName] = fullCategory.split(':');
          
          // Find the matching data in the previous month
          const categoryData = previousMonthRawData.find(item => 
            item.groupname === groupName && item.categoryname === categoryName
          );
          
          return {
            category: categoryName,
            group: groupName,
            amount: categoryData?.sum || 0,
            categoryIcon: categoryData?.categoryicon || undefined,
            groupIcon: categoryData?.groupicon || undefined
          };
        }),
      },
      {
        date: dateRange.current.label,
        transactions: Array.from(allCategories).map((fullCategory: string) => {
          const [groupName, categoryName] = fullCategory.split(':');
          
          // Find the matching data in the current month
          const categoryData = currentMonthRawData.find(item => 
            item.groupname === groupName && item.categoryname === categoryName
          );
          
          return {
            category: categoryName,
            group: groupName,
            amount: categoryData?.sum || 0,
            categoryIcon: categoryData?.categoryicon || undefined,
            groupIcon: categoryData?.groupicon || undefined
          };
        }),
      },
    ];
    
    return comparisonData;
  };
  
  // Month selection handlers
  const handleMonthSelect = (date: { dateString: string }) => {
    const formattedDate = dayjs(date.dateString).format('YYYY-MM');
    
    if (showFirstMonthPicker) {
      setFirstSelectedMonth(formattedDate);
      setShowFirstMonthPicker(false);
    } else if (showSecondMonthPicker) {
      setSecondSelectedMonth(formattedDate);
      setShowSecondMonthPicker(false);
    }
    
    if (timePeriod !== 'custom') {
      setTimePeriod('custom');
    }
  };
  
  const renderMonthPicker = (isFirstMonth: boolean) => {
    const visible = isFirstMonth ? showFirstMonthPicker : showSecondMonthPicker;
    const setVisible = isFirstMonth ? setShowFirstMonthPicker : setShowSecondMonthPicker;
    
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-card rounded-md p-4 w-[90%] max-w-md">
            <Text className="text-lg font-semibold text-foreground mb-4 text-center">
              Select {isFirstMonth ? 'First' : 'Second'} Month
            </Text>
            
            <Calendar
              onDayPress={handleMonthSelect}
              hideExtraDays
              markedDates={{
                [isFirstMonth ? 
                  dayjs(firstSelectedMonth).format('YYYY-MM-DD') : 
                  dayjs(secondSelectedMonth).format('YYYY-MM-DD')]: { selected: true, selectedColor: '#4CAF50' }
              }}
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#b6c1cd',
                selectedDayBackgroundColor: '#4CAF50',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#4CAF50',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                monthTextColor: '#2d4150',
              }}
            />
            
            <Pressable 
              className="bg-danger-500 py-2 px-4 rounded-md mt-4 self-center"
              onPress={() => setVisible(false)}
            >
              <Text className="text-white font-semibold">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  };
  
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <StatusBar barStyle="light-content" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text className="mt-4 text-base text-muted">Loading expense data...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <StatusBar barStyle="light-content" />
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-lg font-bold text-danger-500 mb-2">Failed to load expense data</Text>
          <Text className="text-sm text-muted text-center">
            {error.message}
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const comparisonData = transformDataForComparison();
  
  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />
      <ScrollView>
        <View className="items-center px-4 py-6">
          <Text className="text-2xl font-bold text-foreground mb-3">Expense Comparison</Text>
          
          {/* Time period selector */}
          <View className="w-full max-w-lg mb-3 bg-card/30 rounded-lg p-1">
            <View className="flex-row mb-1">
              <Pressable 
                className={`flex-1 py-2.5 px-1 items-center rounded-md ${timePeriod === 'month' ? 'bg-primary' : ''}`}
                onPress={() => setTimePeriod('month')}>
                <Text className={`text-sm font-medium ${timePeriod === 'month' ? 'text-primary-foreground' : 'text-muted-foreground'}`}>Monthly</Text>
              </Pressable>
              <Pressable 
                className={`flex-1 py-2.5 px-1 items-center rounded-md ${timePeriod === '3months' ? 'bg-primary' : ''}`}
                onPress={() => setTimePeriod('3months')}>
                <Text className={`text-sm font-medium ${timePeriod === '3months' ? 'text-primary-foreground' : 'text-muted-foreground'}`}>Last 3 Months</Text>
              </Pressable>
            </View>
            <View className="flex-row">
              <Pressable 
                className={`flex-1 py-2.5 px-1 items-center rounded-md ${timePeriod === 'year' ? 'bg-primary' : ''}`}
                onPress={() => setTimePeriod('year')}>
                <Text className={`text-sm font-medium ${timePeriod === 'year' ? 'text-primary-foreground' : 'text-muted-foreground'}`}>Yearly</Text>
              </Pressable>
              <Pressable 
                className={`flex-1 py-2.5 px-1 items-center rounded-md ${timePeriod === 'custom' ? 'bg-primary' : ''}`}
                onPress={() => setTimePeriod('custom')}>
                <Text className={`text-sm font-medium ${timePeriod === 'custom' ? 'text-primary-foreground' : 'text-muted-foreground'}`}>Custom</Text>
              </Pressable>
            </View>
          </View>
          
          {timePeriod === 'custom' && (
            <View className="w-full max-w-lg flex-row mb-4 justify-center gap-3">
              <Pressable 
                className="flex-1 py-2 px-3 bg-card rounded-md border border-muted"
                onPress={() => setShowFirstMonthPicker(true)}
              >
                <Text className="text-center text-foreground">{dayjs(firstSelectedMonth).format('MMM YYYY')}</Text>
              </Pressable>
              <Text className="text-foreground self-center">vs</Text>
              <Pressable 
                className="flex-1 py-2 px-3 bg-card rounded-md border border-muted"
                onPress={() => setShowSecondMonthPicker(true)}
              >
                <Text className="text-center text-foreground">{dayjs(secondSelectedMonth).format('MMM YYYY')}</Text>
              </Pressable>
            </View>
          )}
          
          <Text className="text-base text-muted-foreground mb-4 text-center">
            Comparing: {dateRange.previous.label} vs {dateRange.current.label}
          </Text>
        </View>
        
        {comparisonData.length > 0 ? (
          <View className="mb-6">
            <ExpenseComparison data={comparisonData} />
          </View>
        ) : (
          <View className="justify-center items-center p-5">
            <Text className="text-base text-muted-foreground text-center">No transaction data available for comparison</Text>
          </View>
        )}
      </ScrollView>
      
      {/* Month picker modals */}
      {renderMonthPicker(true)}
      {renderMonthPicker(false)}
    </SafeAreaView>
  )
}