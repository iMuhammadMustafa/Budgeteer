import ExpenseComparison from "@/src/components/ExpenseComparison";
import { useStatsService } from "@/src/services/Stats.Service";
import { StatsMonthlyCategoriesTransactions } from "@/src/types/database/Tables.Types";
import dayjs from "dayjs";
import { LinearGradient } from "expo-linear-gradient";
import { RefreshCcw } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";

type TimePeriod = "month" | "3months" | "year" | "custom";

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

// Helper function to calculate budget usage percentage
const calculateBudgetUsagePercentage = (sum: number, budget: number): number => {
  if (!budget) return 0;
  const usage = Math.abs(sum) / budget;
  return Math.min(usage, 1); // Cap at 100%
};

// Helper function to get gradient colors based on usage
const getGradientColors = (usage: number): [string, string] => {
  if (usage <= 0.5) {
    // Green to Yellow
    return ["#4CAF50", "#FFC107"];
  } else {
    // Yellow to Red
    return ["#FFC107", "#F44336"];
  }
};

// Budget Progress Bar component
const BudgetProgressBar = ({
  usage,
  budget,
  spent,
  label,
}: {
  usage: number;
  budget: number;
  spent: number;
  label: string;
}) => {
  const gradientColors = getGradientColors(usage);

  return (
    <View className="mb-2">
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-sm text-foreground">{label}</Text>
        <Text className="text-sm text-muted-foreground">
          ${Math.abs(spent).toFixed(2)} / ${budget.toFixed(2)}
        </Text>
      </View>
      <View className="h-2 bg-muted rounded-full overflow-hidden flex-row">
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            flex: usage,
            height: "100%",
          }}
        />
        <View style={{ flex: 1 - usage }} />
      </View>
    </View>
  );
};

export default function Summary() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month");
  const [currentMonth, setCurrentMonth] = useState(dayjs().format("YYYY-MM"));
  const [previousMonth, setPreviousMonth] = useState(dayjs().subtract(1, "month").format("YYYY-MM"));
  const [showBudget, setShowBudget] = useState(false);

  const [showFirstMonthPicker, setShowFirstMonthPicker] = useState(false);
  const [showSecondMonthPicker, setShowSecondMonthPicker] = useState(false);

  const [firstSelectedMonth, setFirstSelectedMonth] = useState(previousMonth);
  const [secondSelectedMonth, setSecondSelectedMonth] = useState(currentMonth);
  const [refreshing, setRefreshing] = useState(false);
  const statsService = useStatsService();

  // Get date ranges based on selected time period
  const getDateRange = () => {
    switch (timePeriod) {
      case "month":
        return {
          current: {
            start: dayjs(currentMonth).startOf("month").toISOString(),
            end: dayjs(currentMonth).endOf("month").toISOString(),
            label: dayjs(currentMonth).format("MMMM YYYY"),
          },
          previous: {
            start: dayjs(previousMonth).startOf("month").toISOString(),
            end: dayjs(previousMonth).endOf("month").toISOString(),
            label: dayjs(previousMonth).format("MMMM YYYY"),
          },
        };
      case "3months":
        return {
          current: {
            start: dayjs().subtract(2, "month").startOf("month").toISOString(),
            end: dayjs().endOf("month").toISOString(),
            label: `Last 3 Months`,
          },
          previous: {
            start: dayjs().subtract(5, "month").startOf("month").toISOString(),
            end: dayjs().subtract(3, "month").endOf("month").toISOString(),
            label: `Previous 3 Months`,
          },
        };
      case "year":
        return {
          current: {
            start: dayjs().startOf("year").toISOString(),
            end: dayjs().endOf("year").toISOString(),
            label: dayjs().format("YYYY"),
          },
          previous: {
            start: dayjs().subtract(1, "year").startOf("year").toISOString(),
            end: dayjs().subtract(1, "year").endOf("year").toISOString(),
            label: dayjs().subtract(1, "year").format("YYYY"),
          },
        };
      case "custom":
        return {
          current: {
            start: dayjs(secondSelectedMonth).startOf("month").toISOString(),
            end: dayjs(secondSelectedMonth).endOf("month").toISOString(),
            label: dayjs(secondSelectedMonth).format("MMMM YYYY"),
          },
          previous: {
            start: dayjs(firstSelectedMonth).startOf("month").toISOString(),
            end: dayjs(firstSelectedMonth).endOf("month").toISOString(),
            label: dayjs(firstSelectedMonth).format("MMMM YYYY"),
          },
        };
    }
  };

  const dateRange = getDateRange();

  // Use Tanstack Query with enabled flag to control when queries run
  const {
    data: currentMonthData,
    isLoading: isCurrentLoading,
    error: currentError,
    refetch: refetchCurrent,
  } = statsService.useGetStatsMonthlyCategoriesTransactionsRaw(dateRange.current.start, dateRange.current.end);

  const {
    data: previousMonthData,
    isLoading: isPreviousLoading,
    error: previousError,
    refetch: refetchPrevious,
  } = statsService.useGetStatsMonthlyCategoriesTransactionsRaw(dateRange.previous.start, dateRange.previous.end);

  const isLoading = isCurrentLoading || isPreviousLoading;
  const error = currentError || previousError;

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([refetchCurrent(), refetchPrevious()]).finally(() => {
      setRefreshing(false);
    });
  }, [refetchCurrent, refetchPrevious]);

  // Function to manually refresh data
  const handleRefresh = () => {
    refetchCurrent();
    refetchPrevious();
  };

  // Function to load data for a specific period
  const loadData = async (period: "current" | "previous") => {
    if (period === "current") {
      await refetchCurrent();
    } else {
      await refetchPrevious();
    }
  };

  // Function to transform data into the required format for ExpenseComparison
  type ExpenseComparisonData = {
    date: string;
    transactions: {
      category: string;
      group: string;
      amount: number;
      categoryIcon?: string;
      groupIcon?: string;
      categoryBudget?: number;
      groupBudget?: number;
    }[];
  };

  /**
   * Transforms current and previous month data into the format required by ExpenseComparison.
   * Returns an array with two objects: previous and current period data.
   */
  const transformDataForComparison = (): ExpenseComparisonData[] => {
    if (!Array.isArray(currentMonthData) || !Array.isArray(previousMonthData)) return [];

    // Get all unique categories from both datasets
    const allCategories = new Set<string>();

    currentMonthData.forEach((item: StatsMonthlyCategoriesTransactions) => {
      if (item.groupname && item.categoryname && item.type === "Expense") {
        allCategories.add(`${item.groupname}:${item.categoryname}`);
      }
    });

    previousMonthData.forEach((item: StatsMonthlyCategoriesTransactions) => {
      if (item.groupname && item.categoryname && item.type === "Expense") {
        allCategories.add(`${item.groupname}:${item.categoryname}`);
      }
    });

    // Create comparison data for previous and current periods
    const comparisonData: ExpenseComparisonData[] = [
      {
        date: dateRange.previous.label,
        transactions: Array.from(allCategories).map((fullCategory: string) => {
          const [groupName, categoryName] = fullCategory.split(":");
          const categoryData = previousMonthData.find(
            (item: StatsMonthlyCategoriesTransactions) =>
              item.groupname === groupName && item.categoryname === categoryName && item.type === "Expense",
          );
          return {
            category: categoryName,
            group: groupName,
            amount: Math.abs(categoryData?.sum || 0),
            categoryIcon: categoryData?.categoryicon || undefined,
            groupIcon: categoryData?.groupicon || undefined,
            categoryBudget: categoryData?.categorybudgetamount || undefined,
            groupBudget: categoryData?.groupbudgetamount || undefined,
          };
        }),
      },
      {
        date: dateRange.current.label,
        transactions: Array.from(allCategories).map((fullCategory: string) => {
          const [groupName, categoryName] = fullCategory.split(":");
          const categoryData = currentMonthData.find(
            (item: StatsMonthlyCategoriesTransactions) =>
              item.groupname === groupName && item.categoryname === categoryName && item.type === "Expense",
          );
          return {
            category: categoryName,
            group: groupName,
            amount: Math.abs(categoryData?.sum || 0),
            categoryIcon: categoryData?.categoryicon || undefined,
            groupIcon: categoryData?.groupicon || undefined,
            categoryBudget: categoryData?.categorybudgetamount || undefined,
            groupBudget: categoryData?.groupbudgetamount || undefined,
          };
        }),
      },
    ];

    return comparisonData;
  };

  /**
   * Calculates budget usage for groups and categories for the current month.
   * Returns two objects: groupBudgets and categoryBudgets.
   */
  const calculateBudgetUsage = (): {
    groupBudgets: { [key: string]: { spent: number; budget: number } };
    categoryBudgets: { [key: string]: { spent: number; budget: number } };
  } => {
    const groupBudgets: { [key: string]: { spent: number; budget: number } } = {};
    const categoryBudgets: { [key: string]: { spent: number; budget: number } } = {};

    if (!Array.isArray(currentMonthData)) return { groupBudgets, categoryBudgets };

    currentMonthData.forEach((item: StatsMonthlyCategoriesTransactions) => {
      if (item.groupname && item.categoryname) {
        // Add to group totals
        if (!groupBudgets[item.groupname]) {
          groupBudgets[item.groupname] = {
            spent: 0,
            budget: item.groupbudgetamount || 0,
          };
        }
        groupBudgets[item.groupname].spent += Math.abs(item.sum || 0);

        // Add to category totals
        const key = `${item.groupname}:${item.categoryname}`;
        categoryBudgets[key] = {
          spent: Math.abs(item.sum || 0),
          budget: item.categorybudgetamount || 0,
        };
      }
    });

    return { groupBudgets, categoryBudgets };
  };

  // Month selection handlers
  const handleMonthSelect = (date: { dateString: string }) => {
    const formattedDate = dayjs(date.dateString).format("YYYY-MM");

    if (showFirstMonthPicker) {
      setFirstSelectedMonth(formattedDate);
      setShowFirstMonthPicker(false);
    } else if (showSecondMonthPicker) {
      setSecondSelectedMonth(formattedDate);
      setShowSecondMonthPicker(false);
    }

    if (timePeriod !== "custom") {
      setTimePeriod("custom");
    }
  };

  const renderMonthPicker = (isFirstMonth: boolean) => {
    const visible = isFirstMonth ? showFirstMonthPicker : showSecondMonthPicker;
    const setVisible = isFirstMonth ? setShowFirstMonthPicker : setShowSecondMonthPicker;

    return (
      <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={() => setVisible(false)}>
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-card rounded-md p-4 w-[90%] max-w-md">
            <Text className="text-lg font-semibold text-foreground mb-4 text-center">
              Select {isFirstMonth ? "First" : "Second"} Month
            </Text>

            <Calendar
              onDayPress={handleMonthSelect}
              hideExtraDays
              markedDates={{
                [isFirstMonth
                  ? dayjs(firstSelectedMonth).format("YYYY-MM-DD")
                  : dayjs(secondSelectedMonth).format("YYYY-MM-DD")]: { selected: true, selectedColor: "#4CAF50" },
              }}
              theme={{
                backgroundColor: "#ffffff",
                calendarBackground: "#ffffff",
                textSectionTitleColor: "#b6c1cd",
                selectedDayBackgroundColor: "#4CAF50",
                selectedDayTextColor: "#ffffff",
                todayTextColor: "#4CAF50",
                dayTextColor: "#2d4150",
                textDisabledColor: "#d9e1e8",
                monthTextColor: "#2d4150",
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
        <StatusBar backgroundColor="#1E293B" barStyle="light-content" translucent={false} />
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
        <StatusBar backgroundColor="#1E293B" barStyle="light-content" translucent={false} />
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-lg font-bold text-danger-500 mb-2">Failed to load expense data</Text>
          <Text className="text-sm text-muted text-center">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </Text>
          <Pressable onPress={handleRefresh} className="mt-4 bg-primary py-2 px-4 rounded-md">
            <Text className="text-white">Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const comparisonData = transformDataForComparison();
  const { groupBudgets, categoryBudgets } = calculateBudgetUsage();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar backgroundColor="#1E293B" barStyle="light-content" translucent={false} />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="px-2"
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
        <View className="items-center py-6">
          <View className="flex-row items-center justify-between w-full mb-3">
            <Text className="text-2xl font-bold text-foreground">Expense Comparison</Text>
            <Pressable onPress={handleRefresh} className="p-2">
              <RefreshCcw size={24} color="#4CAF50" />
            </Pressable>
          </View>

          {/* Budget toggle */}
          <View className="w-full mb-4 flex-row items-center justify-between bg-card/30 rounded-lg p-3">
            <Text className="text-foreground">Show Budget Usage</Text>
            <Switch
              value={showBudget}
              onValueChange={setShowBudget}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={showBudget ? "#4CAF50" : "#f4f3f4"}
            />
          </View>

          {/* Time period selector */}
          <View className="w-full mb-3 bg-card/30 rounded-lg p-1">
            <View className="flex-row mb-1">
              <Pressable
                className={`flex-1 py-2 px-1 items-center rounded-md ${timePeriod === "month" ? "bg-primary" : ""}`}
                onPress={() => setTimePeriod("month")}
              >
                <Text
                  className={`text-xs font-medium ${timePeriod === "month" ? "text-primary-foreground" : "text-muted-foreground"}`}
                >
                  Monthly
                </Text>
              </Pressable>
              <Pressable
                className={`flex-1 py-2 px-1 items-center rounded-md ${timePeriod === "3months" ? "bg-primary" : ""}`}
                onPress={() => setTimePeriod("3months")}
              >
                <Text
                  className={`text-xs font-medium ${timePeriod === "3months" ? "text-primary-foreground" : "text-muted-foreground"}`}
                >
                  3 Months
                </Text>
              </Pressable>
            </View>
            <View className="flex-row">
              <Pressable
                className={`flex-1 py-2 px-1 items-center rounded-md ${timePeriod === "year" ? "bg-primary" : ""}`}
                onPress={() => setTimePeriod("year")}
              >
                <Text
                  className={`text-xs font-medium ${timePeriod === "year" ? "text-primary-foreground" : "text-muted-foreground"}`}
                >
                  Yearly
                </Text>
              </Pressable>
              <Pressable
                className={`flex-1 py-2 px-1 items-center rounded-md ${timePeriod === "custom" ? "bg-primary" : ""}`}
                onPress={() => setTimePeriod("custom")}
              >
                <Text
                  className={`text-xs font-medium ${timePeriod === "custom" ? "text-primary-foreground" : "text-muted-foreground"}`}
                >
                  Custom
                </Text>
              </Pressable>
            </View>
          </View>

          {timePeriod === "custom" && (
            <View className="w-full flex-row mb-4 justify-center gap-2">
              <Pressable
                className="flex-1 py-2 px-2 bg-card rounded-md border border-muted"
                onPress={() => setShowFirstMonthPicker(true)}
              >
                <Text className="text-center text-foreground text-xs">
                  {dayjs(firstSelectedMonth).format("MMM YYYY")}
                </Text>
              </Pressable>
              <Text className="text-foreground self-center">vs</Text>
              <Pressable
                className="flex-1 py-2 px-2 bg-card rounded-md border border-muted"
                onPress={() => setShowSecondMonthPicker(true)}
              >
                <Text className="text-center text-foreground text-xs">
                  {dayjs(secondSelectedMonth).format("MMM YYYY")}
                </Text>
              </Pressable>
            </View>
          )}

          <Text className="text-sm text-muted-foreground mb-4 text-center">
            Comparing: {dateRange.previous.label} vs {dateRange.current.label}
          </Text>

          {/* Load Data Buttons */}
          <View className="w-full flex-row gap-2 mb-4">
            <Pressable className="flex-1 py-2 px-4 bg-primary rounded-md" onPress={() => loadData("previous")}>
              <Text className="text-white text-center">Load {dateRange.previous.label}</Text>
            </Pressable>
            <Pressable className="flex-1 py-2 px-4 bg-primary rounded-md" onPress={() => loadData("current")}>
              <Text className="text-white text-center">Load {dateRange.current.label}</Text>
            </Pressable>
          </View>

          {/* Budget Usage Section */}
          {showBudget && (
            <View className="w-full mb-6 bg-card/30 rounded-lg p-4">
              <Text className="text-lg font-semibold text-foreground mb-4">Budget Usage</Text>

              {/* Group Budgets */}
              <View className="mb-4">
                <Text className="text-base font-medium text-foreground mb-2">Groups</Text>
                {Object.entries(groupBudgets).map(([groupName, { spent, budget }]) => (
                  <BudgetProgressBar
                    key={groupName}
                    label={groupName}
                    usage={calculateBudgetUsagePercentage(spent, budget)}
                    spent={spent}
                    budget={budget}
                  />
                ))}
              </View>

              {/* Category Budgets */}
              <View>
                <Text className="text-base font-medium text-foreground mb-2">Categories</Text>
                {Object.entries(categoryBudgets).map(([key, { spent, budget }]) => {
                  const [groupName, categoryName] = key.split(":");
                  return (
                    <BudgetProgressBar
                      key={key}
                      label={`${groupName} • ${categoryName}`}
                      usage={calculateBudgetUsagePercentage(spent, budget)}
                      spent={spent}
                      budget={budget}
                    />
                  );
                })}
              </View>
            </View>
          )}

          {comparisonData.length > 0 ? (
            <View className="w-full items-center mb-6">
              <View className="w-full">
                <ExpenseComparison data={comparisonData} />
              </View>
            </View>
          ) : (
            <View className="justify-center items-center p-5">
              <Text className="text-base text-muted-foreground text-center">
                No transaction data available for comparison
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Month picker modals */}
      {renderMonthPicker(true)}
      {renderMonthPicker(false)}
    </SafeAreaView>
  );
}
