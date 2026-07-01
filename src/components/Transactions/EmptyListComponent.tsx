import { Button, Divider, Text as ThemedText } from "@/src/components/ui";
import MyIcon from "@/src/components/elements/MyIcon";
import { router } from "expo-router";
import { View } from "react-native";

export default function EmptyListComponent() {
  return (
    <View className="flex-1 items-center justify-center gap-4">
      <View className="p-5 rounded-full bg-background border border-outline-200 relative">
        <MyIcon name="ReceiptText" size={45} className="text-muted-foreground" />
        <View className="absolute bottom-0 right-0 bg-background rounded-full border border-outline-200 p-1">
          <MyIcon name="Plus" size={14} className="text-foreground" />
        </View>
      </View>
      <ThemedText variant="h3" className="text-lg">
        No transactions yet
      </ThemedText>
      <ThemedText variant="caption" className="text-center px-10">
        Add your first transaction or import{"\n"}from a file to get started
      </ThemedText>

      <View className="flex-row gap-3">
        <Button
          variant="outline"
          label="Add transaction"
          leadingIcon="Plus"
          onPress={() => router.push("/AddTransaction")}
        />
        <Button
          variant="outline"
          label="Import"
          leadingIcon="Upload"
          onPress={() => router.push("/Settings/ImportExport")}
        />
      </View>

      <Divider className="w-full max-w-[300px]" />

      <View className="flex-row gap-3">
        <Button
          variant="ghost"
          className="bg-surface rounded-full px-4 border border-outline-200"
          label="Set up recurrings"
          leadingIcon="Repeat"
          onPress={() => router.push("/Recurrings")}
        />
        <Button
          variant="ghost"
          className="bg-surface rounded-full px-4 border border-outline-200"
          label="View summary"
          leadingIcon="Presentation"
          onPress={() => router.push("/Summary")}
        />
      </View>
    </View>
  );
}
