import MyIcon from "@/src/components/elements/MyIcon";
import { TransactionsPageHeaderProps } from "@/src/types/components/Transactions.types";
import { Link } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

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
                <Pressable onPress={openDeleteConfirm} accessibilityLabel="Delete selected transactions" accessibilityRole="button">
                  <MyIcon name="Trash" className="text-foreground" size={20} />
                </Pressable>
                <Pressable onPress={openDuplicateConfirm} accessibilityLabel="Duplicate selected transactions" accessibilityRole="button">
                  <MyIcon name="Copy" className="text-foreground" size={20} />
                </Pressable>
                <Pressable onPress={openBatchUpdate} accessibilityLabel="Batch update selected transactions" accessibilityRole="button">
                  <MyIcon name="Pencil" className="text-foreground" size={20} />
                </Pressable>
                <Pressable onPress={clearSelection} accessibilityLabel="Clear selection" accessibilityRole="button">
                  <MyIcon name="X" className="text-foreground" size={20} />
                </Pressable>
              </>
            )}
          </>
        ) : (
          <>
            <Pressable onPress={() => setShowSearch(true)} className="items-center justify-center">
              <MyIcon name="Search" className="text-foreground" size={20} />
            </Pressable>
            <Pressable onPress={refreshTransactions} className="items-center justify-center">
              <MyIcon name="RefreshCw" className="text-foreground" size={20} />
            </Pressable>
            <Link href="/AddTransaction" className="items-center justify-center">
              <MyIcon name="Plus" className="text-foreground" size={20} />
            </Link>
          </>
        )}
      </View>
    </View>
  );
}
