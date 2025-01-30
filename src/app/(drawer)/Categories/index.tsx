import { useState } from "react";
import { View, Platform } from "react-native";
import { useGetCategories, useDeleteCategory } from "@/src/repositories/services/categories.service";
import { TabView, SceneMap } from "react-native-tab-view";
import { Tab, TabHeader } from "@/src/components/MyTabs";
import { useQueryClient } from "@tanstack/react-query";
import { TableNames } from "@/src/consts/TableNames";
import { useDeleteCategoryGroup, useGetCategoryGroups } from "@/src/repositories/services/categorygroups.service";

export default function CategoriesGroups() {
  const queryClient = useQueryClient();
  const { data: categories, isLoading: isCategoriesLoading, error: categoriesError } = useGetCategories();
  const { data: groups, isLoading: isGroupsLoading, error: groupsError } = useGetCategoryGroups();
  const { mutate: deleteCategory } = useDeleteCategory();
  const { mutate: deleteCategoryGroup } = useDeleteCategoryGroup();

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "first", title: "Categories" },
    { key: "second", title: "Groups" },
  ]);

  const refreshGroups = async () => {
    await queryClient.invalidateQueries({ queryKey: [TableNames.CategoryGroups] });
  };
  const refreshCategories = async () => {
    await queryClient.invalidateQueries({ queryKey: [TableNames.Categories] });
  };

  return (
    <TabView
      navigationState={{ index, routes }}
      tabBarPosition="top"
      lazy={true}
      renderScene={SceneMap({
        first: () => (
          <Tab
            title="Categories"
            items={categories}
            isLoading={isCategoriesLoading}
            error={categoriesError}
            deleteItem={deleteCategory}
            upsertUrl={"/Categories/Upsert?categoryId="}
            selectable
            refreshQueries={refreshCategories}
          />
        ),
        second: () => (
          <Tab
            title="Groups"
            items={groups}
            isLoading={isGroupsLoading}
            error={groupsError}
            deleteItem={deleteCategoryGroup}
            upsertUrl={"/Categories/Groups/Upsert?categoryId="}
            selectable
            refreshQueries={refreshGroups}
          />
        ),
      })}
      onIndexChange={setIndex}
      className="bg-background"
      renderTabBar={props => {
        return (
          <View className={`bg-background  ${Platform.OS === "web" ? "max-w" : ""}`}>
            <View className="flex-row border-b mt-3 border-gray-200 bg-background">
              <TabHeader
                title="Categories"
                isSelected={props.navigationState.index === 0}
                onPress={() => setIndex(0)}
              />
              <TabHeader title="Groups" isSelected={props.navigationState.index === 1} onPress={() => setIndex(1)} />
            </View>
          </View>
        );
      }}
    />
  );
}

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

  return Array.from(uniqueSet).map((item: any) => JSON.parse(item));
};
