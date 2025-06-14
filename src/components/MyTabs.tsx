import { memo, useEffect, useState } from "react";
import { View, Text, ScrollView, Platform, Pressable, SafeAreaView, RefreshControl } from "react-native";
import { Href, Link, router } from "expo-router";

import MyIcon from "@/src/utils/Icons.Helper";
import { getTransactionProp } from "@/src/utils/transactions.helper";
import { queryClient } from "@/src/providers/QueryProvider";

// export const Tab = memo(TabComponent, (prevProps, nextProps) => {
//   return prevProps.items === nextProps.items;
// });

export function Tab({
  title,
  queryKey,
  useGet,
  useDelete,
  upsertUrl,
  refreshOnPull = true,
  selectable = false,
  groupedBy,
  customDetails,
  Footer,
}: TabProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const { data, isLoading, error } = useGet();
  const { mutate } = useDelete();

  const getNestedValue = (obj: any, path: string) => {
    if (!path) return undefined;
    return path.split(".").reduce((acc, part) => acc && acc[part], obj);
  };

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  const handleLongPress = (id: string) => {
    setIsSelectionMode(true);
    setSelectedIds([id]);
  };

  const handlePress = (id: string) => {
    if (isSelectionMode) {
      setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
    } else {
      let route = (upsertUrl + id) as Href;
      router.push(route);
    }
  };

  const handleDelete = () => {
    selectedIds.forEach(id => mutate(id));
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKey });
  };

  return (
    <SafeAreaView className={`flex-1 bg-background  ${Platform.OS === "web" ? "max-w" : ""}`}>
      <PageHeader title={title} upsertLink={[upsertUrl]} refreshQueries={handleRefresh} />
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />}
      >
        {groupedBy && data
          ? (
              Object.entries(
                (data as any[]).reduce(
                  (acc: Record<string, any[]>, item: any) => {
                    const groupValue = getNestedValue(item, groupedBy) || "Uncategorized";
                    (acc[groupValue] = acc[groupValue] || []).push(item);
                    return acc;
                  },
                  {} as Record<string, any[]>,
                ),
              ) as Array<[string, any[]]>
            ).map(([groupName, itemsInGroup]) => (
              <View key={groupName}>
                <Text className="font-bold text-lg p-2 px-4 bg-card text-foreground">{groupName}</Text>
                {itemsInGroup.map((item: any) => (
                  <ListItem
                    key={item.id}
                    id={item.id}
                    onLongPress={() => (selectable ? handleLongPress(item.id) : null)}
                    onPress={() => handlePress(item.id)}
                    name={item.name}
                    details={customDetails ? customDetails(item) : item.details}
                    icon={item.icon}
                    iconColor={item.iconColor ? item.iconColor : getTransactionProp(item.type)?.color}
                    isSelected={selectedIds.includes(item.id)}
                  />
                ))}
              </View>
            ))
          : data?.map((item: any) => {
              return (
                <ListItem
                  key={item.id}
                  id={item.id}
                  onLongPress={() => (selectable ? handleLongPress(item.id) : null)}
                  onPress={() => handlePress(item.id)}
                  name={item.name}
                  details={customDetails ? customDetails(item) : item.details}
                  icon={item.icon}
                  iconColor={item.iconColor ? item.iconColor : getTransactionProp(item.type)?.color}
                  isSelected={selectedIds.includes(item.id)}
                />
              );
            })}
      </ScrollView>

      {isSelectionMode && (
        <Pressable
          className="absolute right-4 bottom-4 w-14 h-14 rounded-full bg-red-500 justify-center items-center"
          onPress={handleDelete}
        >
          <MyIcon name="Trash" size={24} className="bg-red-500" />
        </Pressable>
      )}

      {Footer && <View className="p-2">{Footer}</View>}
    </SafeAreaView>
  );
}

export function TabBar({ children }: { children: React.ReactNode }) {
  return (
    <View className={`bg-background  ${Platform.OS === "web" ? "max-w" : ""}`}>
      <View className="flex-row border-b mt-3 border-gray-200 bg-background">{children}</View>
    </View>
  );
}
export function PageHeader({
  title,
  upsertLink,
  refreshQueries,
}: {
  title: string;
  refreshQueries: () => void;
  upsertLink: Array<Href>;
}) {
  return (
    <View className="flex-row justify-between items-center p-2 px-4 bg-background">
      <Text className="font-bold text-foreground">{title}</Text>
      <View className="flex-row gap-2 items-center">
        {refreshQueries && (
          <Pressable onPress={refreshQueries}>
            <MyIcon name="RefreshCw" className="text-foreground" size={20} />
          </Pressable>
        )}
        {upsertLink &&
          upsertLink.map(link => {
            return (
              <Link href={link} key={link.toString()}>
                <MyIcon name="Plus" size={24} className="text-foreground" />
              </Link>
            );
          })}
      </View>
    </View>
  );
}
export function TabHeader({ title, isSelected, onPress }: { title: string; isSelected: boolean; onPress: any }) {
  return (
    <Pressable
      className={`flex-1 py-1 items-center ${isSelected ? "border-b-2 border-green-500" : ""}`}
      onPress={onPress}
    >
      <Text className={`${isSelected ? "text-primary" : "text-foreground"}`}>{title}</Text>
    </Pressable>
  );
}
function ListItem({
  id,
  onPress,
  name,
  details,
  icon,
  iconColor,
  isSelected,
  onLongPress,
}: {
  id: string;
  onLongPress: () => void;
  onPress: () => void;
  name: string;
  details: string;
  icon: string;
  iconColor: string;
  isSelected: boolean;
}) {
  return (
    <Pressable
      key={id}
      className={`flex-row items-center px-5 py-3 border-b border-gray-200 text-foreground ${isSelected ? "bg-info-100" : "bg-background"}`}
      onLongPress={onLongPress}
      onPress={onPress}
    >
      <View className={`w-8 h-8 rounded-full justify-center items-center mr-4 bg-${iconColor}`}>
        {icon && <MyIcon name={icon} size={18} className="color-card-foreground" />}
      </View>
      <View className="flex-1">
        <Text className="text-md text-foreground">{name}</Text>
        <Text className="text-md text-foreground">{details}</Text>
      </View>
      <MyIcon name="ChevronRight" size={20} className="text-gray-400 dark:text-gray-500" />
    </Pressable>
  );
}

type TabProps = {
  title: string;
  isLoading?: boolean;
  error?: any;
  useDelete: () => { mutate: (id: string) => void };
  upsertUrl: Href;
  selectable?: boolean;
  items?: TabItemType[];
  useGet: () => { data: any; isLoading: boolean; error: any };
  queryKey?: string[];
  refreshOnPull?: boolean;
  customMapping?: any;
  customDetails?: (item: any) => string;
  groupedBy?: string;
  Footer?: React.ReactNode;
};

type TabItemType = {
  id: string;
  name: string;
  details: string;
  icon: string;
  iconColor?: string;
};
