import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { TransactionsPageHeaderProps } from "@/src/types/pages/Transactions.types";
import MyIcon from "@/src/utils/Icons.Helper";

export default function TransactionsPageHeader({
  selectedTransactions,
  selectedSum,
  deleteSelection,
  copyTransactions,
  clearSelection,
  refreshTransactions,
  showSearch,
  setShowSearch,
}: TransactionsPageHeaderProps) {
  return (
    <View className="px-10 self-end my-2 flex-row justify-between items-center gap-3">
      {selectedTransactions.length > 0 && (
        <View className="flex-row items-center gap-2">
          <View className="flex-row">
            <Text className=" text-primary-500 mr-4">{selectedTransactions.length} selected</Text>
            <Text className=" text-primary-500 mr-4">
              {selectedSum} {selectedTransactions[0].currency}
            </Text>
          </View>
          <Pressable onPress={deleteSelection}>
            <MyIcon name="Trash" className="text-foreground" size={20} />
          </Pressable>
          <Pressable onPress={copyTransactions}>
            <MyIcon name="Copy" className="text-foreground" size={20} />
          </Pressable>
          <Pressable onPress={clearSelection}>
            <MyIcon name="X" className="text-foreground" size={20} />
          </Pressable>
        </View>
      )}
      <Pressable onPress={() => setShowSearch(true)} className="items-center justify-center">
        <MyIcon name="Search" className="text-foreground" size={20} />
      </Pressable>
      <Pressable onPress={refreshTransactions} className="items-center justify-center">
        <MyIcon name="RefreshCw" className="text-foreground" size={20} />
      </Pressable>
      <Link href="/AddTransaction" className="items-center justify-center">
        <MyIcon name="Plus" className="text-foreground" size={20} />
      </Link>
    </View>
  );
}
