import Button from "@/src/components/elements/Button";
import MyIcon from "@/src/components/elements/MyIcon";
import ThemedText from "@/src/components/elements/ThemedText";
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
            <Button
              variant="ghost"
              size="icon"
              hapticFeedback="medium"
              onPress={openDeleteConfirm}
              accessibilityLabel="Delete selected transactions"
              testID="btn-delete-selected"
              className="m-0 p-0"
              leftIcon="Trash"
              disabled={isActionLoading}
            />
            <Button
              variant="ghost"
              size="icon"
              onPress={openDuplicateConfirm}
              accessibilityLabel="Duplicate selected transactions"
              testID="btn-duplicate-selected"
              className="m-0 p-0"
              leftIcon="Copy"
              disabled={isActionLoading}
            />
            {isSingleNonVoidTransfer && (
              <Button
                variant="ghost"
                size="icon"
                onPress={onSplit}
                accessibilityLabel="Split transaction"
                testID="btn-split-transaction"
                className="m-0 p-0"
                leftIcon="Scissors"
                iconSize={20}
                disabled={isActionLoading}
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              onPress={openBatchUpdate}
              accessibilityLabel="Batch update selected transactions"
              testID="btn-batch-update"
              className="m-0 p-0"
              leftIcon="Pencil"
              disabled={isActionLoading}
            />
            <Button
              variant="ghost"
              size="icon"
              onPress={clearSelection}
              accessibilityLabel="Clear selection"
              testID="btn-clear-selection"
              className="m-0 p-0"
              leftIcon="X"
              disabled={isActionLoading}
            />
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              onPress={() => setShowSearch(true)}
              accessibilityLabel="Search transactions"
              testID="btn-search-transactions"
              className="m-0 p-0"
              leftIcon="Search"
            />
            <Button
              variant="ghost"
              size="icon"
              onPress={refreshTransactions}
              accessibilityLabel="Refresh transactions"
              testID="btn-refresh-transactions"
              className="m-0 p-0"
              leftIcon="RefreshCw"
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
