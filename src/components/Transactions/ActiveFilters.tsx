import MyIcon from "@/src/components/elements/MyIcon";
import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { Account, TransactionCategory } from "@/src/types/database/Tables.Types";
import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

/** Filter keys that are internal / pagination-related and should never be shown as chips. */
const HIDDEN_KEYS = new Set(["offset", "limit", "raw", "isDeleted"]);

/** Human-readable labels for each filter key. */
const FILTER_LABELS: Record<string, string> = {
  name: "Name",
  description: "Description",
  amount: "Amount",
  accountid: "Account",
  categoryid: "Category",
  groupid: "Group",
  type: "Type",
  isVoid: "Void",
  tags: "Tags",
  startDate: "From",
  endDate: "To",
};

type ActiveFilter = {
  key: keyof TransactionFilters;
  label: string;
  value: string;
};

interface ActiveFiltersProps {
  filters: TransactionFilters;
  accounts: Account[];
  categories: TransactionCategory[];
  onRemoveFilter: (key: keyof TransactionFilters) => void;
  onClearAll: () => void;
}

export default function ActiveFilters({
  filters,
  accounts,
  categories,
  onRemoveFilter,
  onClearAll,
}: ActiveFiltersProps) {
  const activeFilters = useMemo(() => {
    const result: ActiveFilter[] = [];

    for (const [key, value] of Object.entries(filters)) {
      if (HIDDEN_KEYS.has(key)) continue;
      if (value === undefined || value === null || value === "") continue;

      // For arrays, skip empty ones
      if (Array.isArray(value) && value.length === 0) continue;

      let displayValue: string;

      switch (key) {
        case "accountid":
          displayValue = accounts.find(a => a.id === value)?.name ?? String(value);
          break;
        case "categoryid":
          displayValue = categories.find(c => c.id === value)?.name ?? String(value);
          break;
        case "tags":
          displayValue = Array.isArray(value) ? value.join(", ") : String(value);
          break;
        case "isVoid":
          displayValue = value === "true" || value === true ? "Yes" : "No";
          break;
        default:
          displayValue = String(value);
      }

      result.push({
        key: key as keyof TransactionFilters,
        label: FILTER_LABEL_FOR(key),
        value: displayValue,
      });
    }

    return result;
  }, [filters, accounts, categories]);

  if (activeFilters.length === 0) return null;

  return (
    <View className="px-4 pt-2 pb-1">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="flex-row items-center gap-2"
      >
        {activeFilters.map(filter => (
          <Pressable
            key={filter.key}
            onPress={() => onRemoveFilter(filter.key)}
            className="flex-row items-center bg-secondary rounded-full pl-3 pr-2 py-1.5 gap-1.5"
            accessibilityLabel={`Remove ${filter.label} filter`}
            accessibilityRole="button"
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Text className="text-xs text-text-secondary" selectable={false}>
              {filter.label}:
            </Text>
            <Text className="text-xs font-medium text-foreground" numberOfLines={1} selectable={false}>
              {filter.value}
            </Text>
            <MyIcon name="X" size={14} className="text-text-secondary ml-0.5" />
          </Pressable>
        ))}

        {activeFilters.length > 1 && (
          <Pressable
            onPress={onClearAll}
            className="flex-row items-center bg-danger-300/20 rounded-full px-3 py-1.5 gap-1"
            accessibilityLabel="Clear all filters"
            accessibilityRole="button"
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <MyIcon name="X" size={14} className="text-status-danger" />
            <Text className="text-xs font-medium text-status-danger" selectable={false}>
              Clear All
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

function FILTER_LABEL_FOR(key: string): string {
  return FILTER_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}
