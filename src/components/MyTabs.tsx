import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Platform, Pressable } from "react-native";
import Icon from "@/src/lib/IonIcons";
import { Href, Link, router } from "expo-router";
import { getTransactionProp } from "../app/(drawer)/(tabs)/Transactions";

export function Tab({
  title,
  items,
  isLoading,
  error,
  deleteItem,
  upsertUrl,
  selectable = false,
  refreshQueries,
}: {
  title: string;
  items: any;
  isLoading: boolean;
  error: any;
  deleteItem: any;
  upsertUrl: Href;
  selectable?: boolean;
  refreshQueries: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

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
    selectedIds.forEach(id => deleteItem(id));
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  return (
    <View className={`flex-1 bg-background  ${Platform.OS === "web" ? "max-w" : ""}`}>
      <PageHeader title={title} upsertLink={[upsertUrl]} refreshQueries={refreshQueries} />
      <ScrollView className="flex-1">
        {items?.map((item: any) => {
          return (
            <ListItem
              id={item.id}
              onLongPress={() => (selectable ? handleLongPress(item.id) : null)}
              onPress={() => handlePress(item.id)}
              name={item.name}
              details={item.details}
              icon={item.icon}
              iconColor={item.iconColor ? item.iconColor : getTransactionProp(item.type).color}
              isSelected={selectedIds.includes(item.id)}
            />
          );
        })}
      </ScrollView>
      {isSelectionMode && (
        <TouchableOpacity
          className="absolute right-4 bottom-4 w-14 h-14 rounded-full bg-red-500 justify-center items-center"
          onPress={handleDelete}
        >
          <Icon name="Trash" size={24} className="bg-red-500" />
        </TouchableOpacity>
      )}
    </View>
  );
}

export function PageHeader({
  title,
  upsertLink,
  refreshQueries,
}: {
  title: string;
  upsertLink: Array<Href>;
  refreshQueries: () => void;
}) {
  return (
    <View className="flex-row justify-between items-center p-2 px-4 bg-background">
      <Text className="font-bold text-foreground">{title}</Text>
      <View className="flex-row gap-2 items-center">
        {refreshQueries && (
          <Pressable onPress={refreshQueries}>
            <Icon name="RefreshCw" className="text-foreground" size={20} />
          </Pressable>
        )}
        {upsertLink &&
          upsertLink.map(link => {
            return (
              <Link href={link} key={link.toString()}>
                <Icon name="Plus" size={24} className="text-foreground" />
              </Link>
            );
          })}
      </View>
    </View>
  );
}
export function TabHeader({ title, isSelected, onPress }: { title: string; isSelected: boolean; onPress: any }) {
  return (
    <TouchableOpacity
      className={`flex-1 py-1 items-center ${isSelected ? "border-b-2 border-green-500" : ""}`}
      onPress={onPress}
    >
      <Text className={`${isSelected ? "text-primary" : "text-foreground"}`}>{title}</Text>
    </TouchableOpacity>
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
    <TouchableOpacity
      key={id}
      className={`flex-row items-center px-5 py-3 border-b border-gray-200 text-foreground ${isSelected ? "bg-info-100" : "bg-background"}`}
      onLongPress={onLongPress}
      onPress={onPress}
    >
      <View className={`w-8 h-8 rounded-full justify-center items-center mr-4 bg-${iconColor}`}>
        {icon && <Icon name={icon} size={18} className="color-card-foreground" />}
      </View>
      <View className="flex-1">
        <Text className="text-md text-foreground">{name}</Text>
        <Text className="text-md text-foreground">{details}</Text>
      </View>
    </TouchableOpacity>
  );
}
