import { memo, useEffect, useState } from "react";
import { View, Text, ScrollView, Platform, Pressable, SafeAreaView, RefreshControl, Modal } from "react-native";
import { Href, Link, router } from "expo-router";

import MyIcon from "@/src/utils/Icons.Helper";
import { getTransactionProp } from "@/src/utils/transactions.helper";
import { queryClient } from "@/src/providers/QueryProvider";
import { RecurringFiltersComponent } from "@/src/components/recurring/RecurringFilters";
import { useMutation } from "@tanstack/react-query";

type TabProps = {
  title: string;
  isLoading?: boolean;
  error?: any;
  onDelete: () => ReturnType<typeof useMutation<void, unknown, { id: string; item?: any | undefined }>>;
  upsertUrl: Href;
  selectable?: boolean;
  items?: TabItemType[];
  onGet: () => { data: any; isLoading: boolean; error: any };
  queryKey?: string[];
  refreshOnPull?: boolean;
  customMapping?: any;
  customDetails?: (item: any) => string;
  groupedBy?: string;
  Footer?: React.ReactNode;
  customRenderItem?: (item: any, isSelected: boolean, onLongPress: () => void, onPress: () => void) => React.ReactNode; // Added to props type
  customFilter?: (items: any[]) => any[];
  customGroupBy?: (items: any[]) => Record<string, any[]>;
  filters?: any;
  setFilters?: (filters: any) => void;
  groupBy?: "autoApply" | "recurringType" | "status" | "isdateflexible" | null;
  setGroupBy?: (v: "autoApply" | "recurringType" | "status" | "isdateflexible" | null) => void;
};

type TabItemType = {
  id: string;
  name: string;
  details: string;
  icon: string;
  iconColor?: string;
};

export function Tab({
  title,
  queryKey,
  onGet,
  onDelete,
  upsertUrl,
  refreshOnPull = true,
  selectable = true,
  groupedBy,
  customDetails,
  Footer,
  customRenderItem, // Added new prop
  groupBy,
  setGroupBy,
  customFilter,
  customGroupBy,
  filters,
  setFilters,
}: TabProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const { data, isLoading, error } = onGet();
  const { mutate } = onDelete();

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
    const item = data.find((item: any) => item.id === selectedIds[0]);
    selectedIds.forEach(id => mutate({ id, item }));
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKey });
  };

  let filteredData = data;
  if (typeof customFilter === "function" && Array.isArray(data)) {
    filteredData = customFilter(data);
  }

  let groupedData: Record<string, any[]> | null = null;
  const getNestedValue = (obj: any, path: string) => {
    if (!path) return undefined;
    return path.split(".").reduce((acc, part) => acc && acc[part], obj);
  };
  if (typeof customGroupBy === "function" && Array.isArray(filteredData)) {
    groupedData = customGroupBy(filteredData);
  } else if (groupedBy && Array.isArray(filteredData)) {
    groupedData = (filteredData as any[]).reduce(
      (acc: Record<string, any[]>, item: any) => {
        const groupValue = getNestedValue(item, groupedBy) || "Uncategorized";
        (acc[groupValue] = acc[groupValue] || []).push(item);
        return acc;
      },
      {} as Record<string, any[]>,
    );
  }

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <SafeAreaView className={`flex-1 bg-background  ${Platform.OS === "web" ? "max-w" : ""}`}>
      <PageHeader
        title={title}
        upsertLink={[upsertUrl]}
        refreshQueries={handleRefresh}
        filters={filters}
        setFilters={setFilters}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
      />
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />}
      >
        {groupedData
          ? Object.entries(groupedData).map(([groupName, itemsInGroup]) => (
              <View key={groupName}>
                <Text className="font-bold text-lg p-2 px-4 bg-card text-foreground">{groupName}</Text>
                {itemsInGroup.map((item: any) => (
                  <ListItemWithCustom
                    key={item.id}
                    item={item}
                    customRenderItem={customRenderItem}
                    selectedIds={selectedIds}
                    selectable={selectable}
                    handleLongPress={handleLongPress}
                    handlePress={handlePress}
                  />
                ))}
              </View>
            ))
          : Array.isArray(filteredData) &&
            filteredData.map((item: any) => (
              <ListItemWithCustom
                key={item.id}
                item={item}
                customRenderItem={customRenderItem}
                selectedIds={selectedIds}
                selectable={selectable}
                handleLongPress={handleLongPress}
                handlePress={handlePress}
              />
            ))}
      </ScrollView>

      {isSelectionMode && (
        <Pressable
          className="absolute right-4 bottom-4 w-14 h-14 rounded-full bg-red-400 justify-center items-center"
          onPress={handleDelete}
        >
          <MyIcon name="Trash" size={24} className="bg-red-500" />
        </Pressable>
      )}

      {Footer && <View className="p-2">{typeof Footer === "string" ? <Text>{Footer}</Text> : Footer}</View>}
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
function PageHeader({
  title,
  upsertLink,
  refreshQueries,
  filters,
  setFilters,
  groupBy,
  setGroupBy,
}: {
  title: string;
  refreshQueries: () => void;
  upsertLink: Array<Href>;
  filters?: any;
  setFilters?: (filters: any) => void;
  groupBy?: "autoApply" | "recurringType" | "status" | null;
  setGroupBy?: (v: "autoApply" | "recurringType" | "status" | null) => void;
}) {
  return (
    <View className="flex-row justify-between items-center p-2 px-4 bg-background">
      <Text className="font-bold text-foreground">{title}</Text>
      <View className="flex-row gap-2 items-center">
        {typeof setFilters === "function" && typeof filters !== "undefined" && (
          <FilterButtonWithModal filters={filters} setFilters={setFilters} />
        )}
        {typeof groupBy !== "undefined" && typeof setGroupBy === "function" && (
          <GroupByToggleButton groupBy={groupBy} setGroupBy={setGroupBy} />
        )}
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

function ListItemWithCustom({
  item,
  customRenderItem,
  selectedIds,
  selectable,
  handleLongPress,
  handlePress,
  customDetails,
}: {
  item: any;
  customRenderItem?: (item: any, isSelected: boolean, onLongPress: () => void, onPress: () => void) => React.ReactNode;
  selectedIds: string[];
  selectable: boolean;
  handleLongPress: (id: string) => void;
  handlePress: (id: string) => void;
  customDetails?: (item: any) => string;
}) {
  return (
    <>
      {customRenderItem ? (
        customRenderItem(
          item,
          selectedIds.includes(item.id),
          () => (selectable ? handleLongPress(item.id) : null),
          () => handlePress(item.id),
        )
      ) : (
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
      )}
    </>
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
function FilterButtonWithModal({ filters, setFilters }: { filters: any; setFilters: (filters: any) => void }) {
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  return (
    <>
      <Pressable onPress={() => setFilterModalVisible(true)} className="p-2 rounded-md bg-gray-100 ml-2">
        <MyIcon name="Filter" size={20} className="text-foreground" />
      </Pressable>
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.2)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 12,
              padding: 16,
              minWidth: 280,
              maxWidth: "90%",
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 5,
            }}
          >
            <RecurringFiltersComponent filters={filters} onFiltersChange={setFilters} className="bg-white" />
            <Pressable
              onPress={() => setFilterModalVisible(false)}
              className="mt-2 p-2 rounded bg-gray-200 items-center"
            >
              <Text className="text-gray-700">Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

function GroupByToggleButton({
  groupBy,
  setGroupBy,
}: {
  groupBy: "autoApply" | "recurringType" | "status" | null;
  setGroupBy: (v: "autoApply" | "recurringType" | "status" | null) => void;
}) {
  return (
    <Pressable
      onPress={() => setGroupBy(groupBy ? null : "status")}
      className={`p-2 rounded-md ${groupBy ? "bg-primary-100" : "bg-gray-100"} ml-2`}
    >
      <MyIcon name="Group" size={20} className={groupBy ? "text-primary-600" : "text-gray-600"} />
    </Pressable>
  );
}
