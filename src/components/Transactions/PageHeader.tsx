import { Button, IconButton, Input, Text as ThemedText } from "@/src/components/ui";
import { useRouter } from "expo-router";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";
import { TransactionsPageHeaderProps } from "@/src/types/components/Transactions.types";
import { TransactionsView } from "@/src/types/database/Tables.Types";
import { View } from "react-native";

export default function TransactionsPageHeader({
  selectedTransactions,
  selectedSum,
  openDeleteConfirm,
  openDuplicateConfirm,
  openBatchUpdate,
  onSplit,
  isActionLoading,
  clearSelection,
  refreshTransactions,
  searchText,
  onSearchTextChange,
  onOpenFilters,
  activeFilterCount,
}: TransactionsPageHeaderProps) {
  const router = useRouter();
  const { formatCurrency } = usePrimaryCurrency();
  const isSelection = selectedTransactions.length > 0;
  const isSingleNonVoidTransfer =
    isSelection &&
    selectedTransactions.length === 1 &&
    selectedTransactions.every(t => t.transferid === null) &&
    !selectedTransactions[0].isvoid;

  if (isSelection) {
    return (
      <View className="flex-row w-full justify-between items-center px-4 pt-2 pb-2">
        <SelectedInfo selectedTransactions={selectedTransactions} formatCurrency={formatCurrency} selectedSum={selectedSum} />
        <View className="flex-row justify-between items-center gap-3">
          <IconButton
            variant="ghost"
            size="md"
            haptic="medium"
            onPress={openDeleteConfirm}
            accessibilityLabel="Delete selected transactions"
            testID="btn-delete-selected"
            icon="Trash"
            disabled={isActionLoading}
          />
          <IconButton
            variant="ghost"
            size="md"
            onPress={openDuplicateConfirm}
            accessibilityLabel="Duplicate selected transactions"
            testID="btn-duplicate-selected"
            icon="Copy"
            disabled={isActionLoading}
          />
          {isSingleNonVoidTransfer && (
            <IconButton
              variant="ghost"
              size="md"
              onPress={onSplit}
              accessibilityLabel="Split transaction"
              testID="btn-split-transaction"
              icon="Scissors"
              disabled={isActionLoading}
            />
          )}
          <IconButton
            variant="ghost"
            size="md"
            onPress={openBatchUpdate}
            accessibilityLabel="Batch update selected transactions"
            testID="btn-batch-update"
            icon="Pencil"
            disabled={isActionLoading}
          />
          <IconButton
            variant="ghost"
            size="md"
            onPress={clearSelection}
            accessibilityLabel="Clear selection"
            testID="btn-clear-selection"
            icon="X"
            disabled={isActionLoading}
          />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-row w-full items-center gap-2 px-4 pt-2 pb-2">
      <View className="flex-1">
        <Input
          iconName="Search"
          placeholder="Search transactions..."
          value={searchText}
          onChangeText={onSearchTextChange}
          testID="input-search-transactions"
        />
      </View>
      <Button
        variant="outline"
        size="md"
        leadingIcon="SlidersHorizontal"
        label={activeFilterCount > 0 ? `Filter (${activeFilterCount})` : "Filter"}
        onPress={onOpenFilters}
        testID="btn-open-filters"
      />
      <IconButton
        variant="ghost"
        size="md"
        onPress={refreshTransactions}
        accessibilityLabel="Refresh transactions"
        testID="btn-refresh-transactions"
        icon="RefreshCw"
      />
      <IconButton
        variant="outline"
        size="md"
        onPress={() => router.push("/AddTransaction")}
        accessibilityLabel="Add transaction"
        testID="btn-add-transaction"
        icon="Plus"
      />
    </View>
  );
}

function SelectedInfo({
  selectedTransactions,
  formatCurrency,
  selectedSum,
}: {
  selectedTransactions: TransactionsView[];
  formatCurrency: (amount?: number | null, signed?: boolean) => string;
  selectedSum: number;
}) {
  return (
    <View className="flex-row">
      {selectedTransactions.length > 0 && (
        <>
          <ThemedText className="text-foreground mr-4">{selectedTransactions.length} selected</ThemedText>
          <ThemedText className="text-foreground mr-4">{formatCurrency(selectedSum, true)}</ThemedText>
        </>
      )}
    </View>
  );
}
