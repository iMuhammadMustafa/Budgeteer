import Button from "@/src/components/elements/Button";
import MyIcon from "@/src/components/elements/MyIcon";
import { TransactionsPageHeaderProps } from "@/src/types/components/Transactions.types";
import { Link } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

export default function TransactionsPageHeader({
  selectedTransactions,
  selectedSum,
  openDeleteConfirm,
  openDuplicateConfirm,
  openBatchUpdate,
  isActionLoading,
  clearSelection,
  refreshTransactions,
  showSearch,
  setShowSearch,
}: TransactionsPageHeaderProps) {
  return (
    <View className="flex-row w-full justify-between px-10 mt-1 pt-2">
      <View className="flex-row">
        {selectedTransactions.length > 0 && (
          <>
            <Text className=" text-primary-500 mr-4">{selectedTransactions.length} selected</Text>
            <Text className=" text-primary-500 mr-4">
              {selectedSum.toFixed(2)} {selectedTransactions[0].currency}
            </Text>
          </>
        )}
      </View>
      <View className="flex-row justify-between items-center gap-3">
        {selectedTransactions.length > 0 ? (
          <>
            {isActionLoading ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  hapticFeedback="medium"
                  onPress={openDeleteConfirm}
                  accessibilityLabel="Delete selected transactions"
                  testID="btn-delete-selected"
                >
                  <MyIcon name="Trash" className="text-foreground" size={20} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onPress={openDuplicateConfirm}
                  accessibilityLabel="Duplicate selected transactions"
                  testID="btn-duplicate-selected"
                >
                  <MyIcon name="Copy" className="text-foreground" size={20} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onPress={openBatchUpdate}
                  accessibilityLabel="Batch update selected transactions"
                  testID="btn-batch-update"
                >
                  <MyIcon name="Pencil" className="text-foreground" size={20} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onPress={clearSelection}
                  accessibilityLabel="Clear selection"
                  testID="btn-clear-selection"
                >
                  <MyIcon name="X" className="text-foreground" size={20} />
                </Button>
              </>
            )}
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              onPress={() => setShowSearch(true)}
              accessibilityLabel="Search transactions"
              testID="btn-search-transactions"
            >
              <MyIcon name="Search" className="text-foreground" size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onPress={refreshTransactions}
              accessibilityLabel="Refresh transactions"
              testID="btn-refresh-transactions"
            >
              <MyIcon name="RefreshCw" className="text-foreground" size={20} />
            </Button>
            <Link href="/AddTransaction" className="items-center justify-center">
              <MyIcon name="Plus" className="text-foreground" size={20} />
            </Link>
          </>
        )}
      </View>
    </View>
  );
}
