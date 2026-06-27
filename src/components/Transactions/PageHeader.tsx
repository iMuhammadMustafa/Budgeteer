import { IconButton , Text as ThemedText } from "@/src/components/ui";
import MyIcon from "@/src/components/elements/MyIcon";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";
import { TransactionsPageHeaderProps } from "@/src/types/components/Transactions.types";
import { TransactionsView } from "@/src/types/database/Tables.Types";
import { Link } from "expo-router";
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
  setShowSearch,
}: TransactionsPageHeaderProps) {
  const { formatCurrency } = usePrimaryCurrency();
  const isSelection = selectedTransactions.length > 0;
  const isSingleNonVoidTransfer =
    isSelection &&
    selectedTransactions.length === 1 &&
    selectedTransactions.every(t => t.transferid === null) &&
    !selectedTransactions[0].isvoid;
  return (
    <View className="flex-row w-full justify-between px-10 mt-1 pt-2">
      <SelectedInfo
        selectedTransactions={selectedTransactions}
        formatCurrency={formatCurrency}
        selectedSum={selectedSum}
      />
      <View className="flex-row justify-between items-center gap-3">
        {isSelection ? (
          <>
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
          </>
        ) : (
          <>
            <IconButton
              variant="ghost"
              size="md"
              onPress={() => setShowSearch(true)}
              accessibilityLabel="Search transactions"
              testID="btn-search-transactions"
              icon="Search"
            />
            <IconButton
              variant="ghost"
              size="md"
              onPress={refreshTransactions}
              accessibilityLabel="Refresh transactions"
              testID="btn-refresh-transactions"
              icon="RefreshCw"
            />
            <Link href="/AddTransaction" className="items-center justify-center">
              <MyIcon name="Plus" className="text-foreground" size={20} />
            </Link>
          </>
        )}
      </View>
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
