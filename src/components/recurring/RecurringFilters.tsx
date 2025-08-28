import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import MyIcon from "@/src/utils/Icons.Helper";
import { Recurring } from "@/src/types/recurring";

export interface RecurringFilters {
  autoApplyEnabled?: boolean | null;
  recurringType?: string | null;
  isActive?: boolean | null;
}

interface RecurringFiltersProps {
  filters: RecurringFilters;
  onFiltersChange: (filters: RecurringFilters) => void;
  className?: string;
}

export const RecurringFiltersComponent: React.FC<RecurringFiltersProps> = ({
  filters,
  onFiltersChange,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleFilter = (key: keyof RecurringFilters, value: any) => {
    const currentValue = filters[key];
    const newValue = currentValue === value ? null : value;
    onFiltersChange({
      ...filters,
      [key]: newValue,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== null && value !== undefined);

  return (
    <View className={`bg-background border-b border-gray-200 ${className}`}>
      <Pressable onPress={() => setIsExpanded(!isExpanded)} className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center">
          <MyIcon name="Filter" size={20} className="text-foreground mr-2" />
          <Text className="text-foreground font-medium">Filters</Text>
          {hasActiveFilters && <View className="bg-primary-500 w-2 h-2 rounded-full ml-2" />}
        </View>
        <MyIcon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={20} className="text-foreground" />
      </Pressable>

      {isExpanded && (
        <View className="px-4 pb-4">
          {/* Auto-Apply Filter */}
          <View className="mb-3">
            <Text className="text-sm font-medium text-foreground mb-2">Auto-Apply Status</Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => toggleFilter("autoApplyEnabled", true)}
                className={`px-3 py-2 rounded-full border ${
                  filters.autoApplyEnabled === true ? "bg-green-100 border-green-500" : "bg-gray-100 border-gray-300"
                }`}
              >
                <Text className={`text-sm ${filters.autoApplyEnabled === true ? "text-green-800" : "text-gray-600"}`}>
                  Auto-Apply
                </Text>
              </Pressable>
              <Pressable
                onPress={() => toggleFilter("autoApplyEnabled", false)}
                className={`px-3 py-2 rounded-full border ${
                  filters.autoApplyEnabled === false ? "bg-orange-100 border-orange-500" : "bg-gray-100 border-gray-300"
                }`}
              >
                <Text className={`text-sm ${filters.autoApplyEnabled === false ? "text-orange-800" : "text-gray-600"}`}>
                  Manual
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Recurring Type Filter */}
          <View className="mb-3">
            <Text className="text-sm font-medium text-foreground mb-2">Recurring Type</Text>
            <View className="flex-row gap-2 flex-wrap">
              <Pressable
                onPress={() => toggleFilter("recurringType", "Standard")}
                className={`px-3 py-2 rounded-full border ${
                  filters.recurringType === "Standard" ? "bg-blue-100 border-blue-500" : "bg-gray-100 border-gray-300"
                }`}
              >
                <Text className={`text-sm ${filters.recurringType === "Standard" ? "text-blue-800" : "text-gray-600"}`}>
                  Standard
                </Text>
              </Pressable>
              <Pressable
                onPress={() => toggleFilter("recurringType", "Transfer")}
                className={`px-3 py-2 rounded-full border ${
                  filters.recurringType === "Transfer" ? "bg-blue-100 border-blue-500" : "bg-gray-100 border-gray-300"
                }`}
              >
                <Text className={`text-sm ${filters.recurringType === "Transfer" ? "text-blue-800" : "text-gray-600"}`}>
                  Transfer
                </Text>
              </Pressable>
              <Pressable
                onPress={() => toggleFilter("recurringType", "CreditCardPayment")}
                className={`px-3 py-2 rounded-full border ${
                  filters.recurringType === "CreditCardPayment"
                    ? "bg-blue-100 border-blue-500"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <Text
                  className={`text-sm ${
                    filters.recurringType === "CreditCardPayment" ? "text-blue-800" : "text-gray-600"
                  }`}
                >
                  CC Payment
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Active Status Filter */}
          <View className="mb-3">
            <Text className="text-sm font-medium text-foreground mb-2">Status</Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => toggleFilter("isActive", true)}
                className={`px-3 py-2 rounded-full border ${
                  filters.isActive === true ? "bg-green-100 border-green-500" : "bg-gray-100 border-gray-300"
                }`}
              >
                <Text className={`text-sm ${filters.isActive === true ? "text-green-800" : "text-gray-600"}`}>
                  Active
                </Text>
              </Pressable>
              <Pressable
                onPress={() => toggleFilter("isActive", false)}
                className={`px-3 py-2 rounded-full border ${
                  filters.isActive === false ? "bg-red-100 border-red-500" : "bg-gray-100 border-gray-300"
                }`}
              >
                <Text className={`text-sm ${filters.isActive === false ? "text-red-800" : "text-gray-600"}`}>
                  Inactive
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Pressable onPress={clearAllFilters} className="bg-gray-200 px-3 py-2 rounded-md self-start">
              <Text className="text-gray-700 text-sm font-medium">Clear All Filters</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

/**
 * Filter recurring transactions based on the provided filters
 */
export const filterRecurringTransactions = (recurrings: Recurring[], filters: RecurringFilters): Recurring[] => {
  return recurrings.filter(recurring => {
    // Use enhanced fields directly from the database
    const autoApplyEnabled = recurring.autoapplyenabled || false;
    const recurringType = recurring.recurringtype || "Standard";

    // Apply filters
    if (filters.autoApplyEnabled !== null && filters.autoApplyEnabled !== undefined) {
      if (autoApplyEnabled !== filters.autoApplyEnabled) {
        return false;
      }
    }

    if (filters.recurringType !== null && filters.recurringType !== undefined) {
      if (recurringType !== filters.recurringType) {
        return false;
      }
    }

    if (filters.isActive !== null && filters.isActive !== undefined) {
      if (recurring.isactive !== filters.isActive) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Group recurring transactions by a specified field
 */
export const groupRecurringTransactions = (
  recurrings: Recurring[],
  groupBy: "autoApply" | "recurringType" | "status",
): { [key: string]: Recurring[] } => {
  const groups: { [key: string]: Recurring[] } = {};

  // First sort all recurrings by date descending (nextoccurrencedate or createdat if no next occurrence)
  const sortedRecurrings = [...recurrings].sort((a, b) => {
    const dateA = a.nextoccurrencedate || a.createdat;
    const dateB = b.nextoccurrencedate || b.createdat;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  sortedRecurrings.forEach(recurring => {
    let groupKey = "";

    if (groupBy === "autoApply") {
      const autoApplyEnabled = recurring.autoapplyenabled || false;
      groupKey = autoApplyEnabled ? "Auto-Apply Enabled" : "Manual Execution";
    } else if (groupBy === "recurringType") {
      const recurringType = recurring.recurringtype || "Standard";
      groupKey =
        recurringType === "CreditCardPayment"
          ? "Credit Card Payments"
          : recurringType === "Transfer"
            ? "Account Transfers"
            : "Standard Transactions";
    } else if (groupBy === "status") {
      groupKey = recurring.isactive ? "Active" : "Inactive";
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(recurring);
  });

  return groups;
};

export default RecurringFiltersComponent;
