import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Platform, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Assuming Expo is used for icons
import { useGetCategories, useDeleteCategory } from "@/src/repositories/categories.service";
import Icon from "@/src/lib/IonIcons";
import { Link, router } from "expo-router";
import { TabView, SceneMap } from "react-native-tab-view";
import { getTransactionProp } from "../(tabs)/Transactions";

const uniqueValues = (data: any) => {
  const uniqueSet = new Set();

  data.forEach((item: any) => {
    const entry = JSON.stringify({
      name: item.group,
      icon: item.groupicon || "Ellipsis",
      type: item.type,
    });
    uniqueSet.add(entry);
  });

  return Array.from(uniqueSet).map(item => JSON.parse(item));
};

export default function CategoriesGroups() {
  const { data: categories, isLoading, error } = useGetCategories();

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "first", title: "Categories" },
    { key: "second", title: "Groups" },
  ]);

  return (
    <TabView
      navigationState={{ index, routes }}
      tabBarPosition="top"
      lazy={true}
      renderScene={SceneMap({
        first: () => <Categories categories={categories} isLoading={isLoading} error={error} />,
        second: () => <Groups groups={uniqueValues(categories)} isLoading={isLoading} error={error} />,
      })}
      onIndexChange={setIndex}
      className="bg-background"
      renderTabBar={props => {
        return (
          <View className={`bg-background  ${Platform.OS === "web" ? "max-w" : ""}`}>
            <View className="flex-row justify-between items-center p-4 bg-white">
              <Text className="text-xl font-bold">Categories & Groups</Text>
              <View className="flex-row gap-2">
                <Link href={"/Categories/Upsert"}>
                  <Ionicons name="add" size={24} color="#000" />
                </Link>
                <TouchableOpacity>
                  <Ionicons name="help-circle-outline" size={24} color="#000" />
                </TouchableOpacity>
              </View>
            </View>
            <View className="flex-row border-b border-gray-200 bg-white">
              <TouchableOpacity
                className={`flex-1 py-3 items-center ${props.navigationState.index === 0 ? "border-b-2 border-green-500" : ""}`}
                onPress={() => setIndex(0)}
              >
                <Text className={`${props.navigationState.index === 0 ? "text-green-500" : "text-foreground"}`}>
                  Categories
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 items-center ${props.navigationState.index === 1 ? "border-b-2 border-green-500" : ""}`}
                onPress={() => setIndex(1)}
              >
                <Text className={`${props.navigationState.index === 1 ? "text-green-500" : "text-foreground"}`}>
                  Groups
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }}
    />
  );
}

function Categories({ categories, isLoading, error }: { categories: any; isLoading: boolean; error: any }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const { mutate: deleteCategory } = useDeleteCategory();

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
      // Navigate to category detail page
      router.push(`/Categories/Upsert?categoryId=${id}`);
    }
  };

  const handleDelete = () => {
    selectedIds.forEach(id => deleteCategory(id));
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  const renderCategory = (category: any) => (
    <TouchableOpacity
      key={category.id}
      className={`flex-row items-center px-5 py-3 border-b border-gray-200 ${selectedIds.includes(category.id) ? "bg-green-50" : "bg-white"}`}
      onLongPress={() => handleLongPress(category.id)}
      onPress={() => handlePress(category.id)}
    >
      <View
        className={`w-10 h-10 rounded-full justify-center items-center mr-4 bg-${getTransactionProp(category.type).color}`}
      >
        {category.icon && <Icon name={category.icon} size={24} className="color-card-foreground" />}
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold">{category.name}</Text>
        {/* <Text className="text-sm text-gray-600">Budgeted: ${category.budget.toFixed(2)} (Monthly)</Text> */}
      </View>
    </TouchableOpacity>
  );

  return (
    <View className={`flex-1 bg-gray-100  ${Platform.OS === "web" ? "max-w" : ""}`}>
      <ScrollView className="flex-1">
        {/* <Text className="text-lg font-bold mt-4 ml-4 mb-2">EXPENSE</Text> */}
        {categories?.map(renderCategory)}
      </ScrollView>
      {isSelectionMode && (
        <TouchableOpacity
          className="absolute right-4 bottom-4 w-14 h-14 rounded-full bg-red-500 justify-center items-center"
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function Groups({ groups, isLoading, error }: { groups: any; isLoading: boolean; error: any }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <View className={`flex-1 bg-gray-100  ${Platform.OS === "web" ? "max-w" : ""}`}>
      <ScrollView className="flex-1">
        {/* <Text className="text-lg font-bold mt-4 ml-4 mb-2">EXPENSE</Text> */}
        {groups?.map((group: any) => {
          return (
            <TouchableOpacity
              key={group.name + group.type}
              className={`flex-row items-center px-5 py-3 border-b border-gray-200 ${selectedIds.includes(group.name) ? "bg-green-50" : "bg-white"}`}
            >
              <View
                className={`w-10 h-10 rounded-full justify-center items-center mr-4 bg-${getTransactionProp(group.type).color}`}
              >
                <Icon name={group.icon} size={24} className="color-card-foreground" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold">{group.name}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
