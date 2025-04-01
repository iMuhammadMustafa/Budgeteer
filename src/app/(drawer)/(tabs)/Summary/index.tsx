import { useState, useEffect } from "react";
import { View, Text, SafeAreaView, StatusBar, StyleSheet, ActivityIndicator, ScrollView, Pressable } from "react-native";
import dayjs from "dayjs";
import ExpenseComparison from "@/src/components/pages/ExpenseComparison";
import { useGetStatsMonthlyCategoriesTransactions } from "@/src/services/repositories/Stats.Repository";

type TimePeriod = 'month' | '3months' | 'year';

export default function Summary() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [currentMonth] = useState(dayjs().format("YYYY-MM"));
  const [previousMonth] = useState(dayjs().subtract(1, 'month').format("YYYY-MM"));
  
  // Get date ranges based on selected time period
  const getDateRange = () => {
    switch(timePeriod) {
      case 'month':
        return {
          current: {
            start: dayjs(currentMonth).startOf('month').toISOString(),
            end: dayjs(currentMonth).endOf('month').toISOString(),
            label: dayjs(currentMonth).format('MMM YYYY')
          },
          previous: {
            start: dayjs(previousMonth).startOf('month').toISOString(),
            end: dayjs(previousMonth).endOf('month').toISOString(),
            label: dayjs(previousMonth).format('MMM YYYY')
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
            label: dayjs().year().toString()
          },
          previous: {
            start: dayjs().subtract(1, 'year').startOf('year').toISOString(),
            end: dayjs().subtract(1, 'year').endOf('year').toISOString(),
            label: dayjs().subtract(1, 'year').year().toString()
          }
        };
    }
  };
  
  const dateRange = getDateRange();
  
  // Current period data
  const { data: currentMonthData, isLoading: isLoadingCurrent, error: currentError } = 
    useGetStatsMonthlyCategoriesTransactions(
      dateRange.current.start,
      dateRange.current.end
    );
    
  // Previous period data
  const { data: previousMonthData, isLoading: isLoadingPrevious, error: previousError } = 
    useGetStatsMonthlyCategoriesTransactions(
      dateRange.previous.start,
      dateRange.previous.end
    );
  
  const isLoading = isLoadingCurrent || isLoadingPrevious;
  const hasError = currentError || previousError;
  
  // Function to transform data into the required format for ExpenseComparison
  const transformDataForComparison = () => {
    if (!currentMonthData || !previousMonthData) return [];
    
    // Create a map of all categories to ensure we include all in both months
    const allCategories = new Set<string>();
    currentMonthData.categories.forEach(cat => allCategories.add(cat.x));
    previousMonthData.categories.forEach(cat => allCategories.add(cat.x));
    
    // Create comparison data
    const comparisonData = [
      {
        date: dateRange.previous.label,
        transactions: Array.from(allCategories).map((category: string) => {
          const categoryData = previousMonthData.categories.find(c => c.x === category);
          // Use the group that matches the category name or default to "Other"
          const groupName = previousMonthData.groups.find(g => g.x === category.split(':')[0])?.x || "Other";
          
          return {
            category,
            group: groupName,
            amount: categoryData?.y || 0,
          };
        }),
      },
      {
        date: dateRange.current.label,
        transactions: Array.from(allCategories).map((category: string) => {
          const categoryData = currentMonthData.categories.find(c => c.x === category);
          // Use the group that matches the category name or default to "Other"
          const groupName = currentMonthData.groups.find(g => g.x === category.split(':')[0])?.x || "Other";
          
          return {
            category,
            group: groupName,
            amount: categoryData?.y || 0,
          };
        }),
      },
    ];
    
    return comparisonData;
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading expense data...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (hasError) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load expense data</Text>
          <Text style={styles.errorDetails}>
            {currentError?.message || previousError?.message}
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const comparisonData = transformDataForComparison();
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Expense Comparison</Text>
          
          {/* Time period selector */}
          <View style={styles.periodSelector}>
            <Pressable 
              style={[styles.periodButton, timePeriod === 'month' && styles.activePeriod]} 
              onPress={() => setTimePeriod('month')}>
              <Text style={[styles.periodText, timePeriod === 'month' && styles.activePeriodText]}>Monthly</Text>
            </Pressable>
            <Pressable 
              style={[styles.periodButton, timePeriod === '3months' && styles.activePeriod]} 
              onPress={() => setTimePeriod('3months')}>
              <Text style={[styles.periodText, timePeriod === '3months' && styles.activePeriodText]}>Last 3 Months</Text>
            </Pressable>
            <Pressable 
              style={[styles.periodButton, timePeriod === 'year' && styles.activePeriod]} 
              onPress={() => setTimePeriod('year')}>
              <Text style={[styles.periodText, timePeriod === 'year' && styles.activePeriodText]}>Yearly</Text>
            </Pressable>
          </View>
          
          <Text style={styles.headerSubtitle}>
            {dateRange.previous.label} vs {dateRange.current.label}
          </Text>
        </View>
        
        {comparisonData.length > 0 ? (
          <ExpenseComparison data={comparisonData} />
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No transaction data available for comparison</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  headerContainer: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderRadius: 6,
  },
  activePeriod: {
    backgroundColor: '#4CAF50',
  },
  periodText: {
    color: '#ddd',
    fontWeight: '500',
    fontSize: 13,
  },
  activePeriodText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ccc',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 8,
  },
  errorDetails: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
})