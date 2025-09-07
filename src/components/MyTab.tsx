import { Link, router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { queryClient } from "../providers/QueryProvider";
import Button from "./Button";
import MyIcon from "./MyIcon";

export default function MyTab({
  title,
  queryKey,
  onGet,
  onBatchDelete,
  upsertUrl,
  groupBy,
  Footer,
}: {
  title: string;
  queryKey: string[];
  onGet: () => { data: any[]; isLoading: boolean; error: any };
  onBatchDelete: () => BatchDeleteMutation;
  upsertUrl: Href;
  groupBy?: string;
  Footer?: React.ReactNode | string;
}) {
  const {
    selectedItems,
    groupedData,
    isLoading,
    isSelectionMode,
    handleLongPress,
    handlePress,
    handleDelete,
    handleRefresh,
  } = useMyTab({
    queryKey,
    onGet,
    onBatchDelete,
    upsertUrl,
    groupBy,
  });

  if (isLoading) return <ActivityIndicator />;
  return (
    <SafeAreaView className={`flex-1 bg-background  ${Platform.OS === "web" ? "max-w" : ""}`}>
      <View className="flex-row justify-between items-center p-2 px-4 bg-background">
        <Text className="font-bold text-foreground">{title}</Text>
        <View className="flex-row items-center">
          <Button variant="ghost" onPress={handleRefresh} rightIcon="RefreshCw" />
          <Link href={upsertUrl} key={upsertUrl.toString()}>
            <MyIcon name="Plus" size={24} />
          </Link>
        </View>
      </View>

      {groupedData &&
        Object.entries(groupedData).map(([groupName, itemsInGroup]) => (
          <View key={groupName}>
            <Text className="font-bold text-lg p-2 px-4 bg-card text-foreground">{groupName}</Text>
            {itemsInGroup.map((item: any) => {
              const isSelected = selectedItems.some(selectedItem => item.id === selectedItem.id);
              return (
                <Button
                  variant="ghost"
                  key={item.id}
                  className={`flex-row items-center px-5 py-3 border-b border-gray-200 text-foreground ${isSelected ? "bg-info-100" : "bg-background"}`}
                  onLongPress={() => handleLongPress(item)}
                  onPress={() => handlePress(item)}
                  rightIcon="ChevronRight"
                >
                  <View className="flex flex-row flex-1 width-full">
                    <View className={`w-8 h-8 rounded-full justify-center items-center mr-4 bg-${item.iconColor}`}>
                      {item.icon && <MyIcon name={item.icon} size={18} className="color-card-foreground" />}
                    </View>
                    <View className="flex-1">
                      <Text className="text-md text-foreground">{item.name}</Text>
                      <Text className="text-md text-foreground">{item.details}</Text>
                    </View>
                    {/* <MyIcon name="ChevronRight" size={20} className="text-gray-400 dark:text-gray-500" /> */}
                  </View>
                </Button>
              );
            })}
          </View>
        ))}

      {isSelectionMode && (
        <Button
          className="absolute right-4 bottom-4 w-14 h-14 rounded-full justify-center items-center"
          variant="destructive"
          onPress={handleDelete}
          rightIcon="Trash"
          iconSize={24}
        />
      )}

      {Footer && <View className="p-2">{typeof Footer === "string" ? <Text>{Footer}</Text> : Footer}</View>}
    </SafeAreaView>
  );
}

const useMyTab = ({
  queryKey,
  onGet,
  onBatchDelete,
  upsertUrl,
  groupBy,
}: {
  queryKey: string[];
  onGet: () => { data: any[]; isLoading: boolean; error: any };
  onBatchDelete: () => BatchDeleteMutation;
  upsertUrl: string;
  groupBy?: string;
}) => {
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const isSelectionMode = selectedItems.length > 0;

  const { data, isLoading, error } = onGet();
  const { mutate } = onBatchDelete();

  let groupedData: Record<string, any[]> = useMemo(() => {
    if (!groupBy) return data;

    const getNestedValue = (obj: any, path: string) => {
      if (!path) return undefined;
      return path.split(".").reduce((acc, part) => acc && acc[part], obj);
    };

    return data.reduce(
      (acc, item) => {
        const groupValue = getNestedValue(item, groupBy) || "Uncategorized";
        (acc[groupValue] = acc[groupValue] || []).push(item);
        return acc;
      },
      {} as Record<string, any[]>,
    );
  }, [data, groupBy]);

  const handleLongPress = (item: any) => {
    setSelectedItems(prev => [...prev, item]);
  };
  const handlePress = (item: any) => {
    if (isSelectionMode && selectedItems) {
      setSelectedItems(prev =>
        prev.some(i => i.id === item.id) ? prev.filter(i => i.id !== item.id) : [...prev, item],
      );
    } else {
      let route: Href = upsertUrl + item;
      router.push(route);
    }
  };

  const handleDelete = () => {
    if (isSelectionMode && selectedItems.length > 0) {
      mutate({ items: selectedItems });
      setSelectedItems([]);
    }
  };
  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKey });
  };

  return {
    selectedItems,
    isSelectionMode,
    groupedData,
    isLoading,
    error,
    handleLongPress,
    handlePress,
    handleDelete,
    handleRefresh,
  };
};
