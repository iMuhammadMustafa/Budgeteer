import { useState } from "react";
import { View, Platform } from "react-native";
import { useGetCategories, useDeleteCategory } from "@/src/repositories/categories.service";
import { TabView, SceneMap } from "react-native-tab-view";
import { PageHeader, Tab, TabHeader } from "@/src/components/MyTabs";



export default function CategoriesGroups() {
  const { data: categories, isLoading, error } = useGetCategories();
  const { mutate: deleteCategory } = useDeleteCategory();

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
        first: () => <Tab items={categories} isLoading={isLoading} error={error} deleteItem={deleteCategory} upsertUrl={"/Categories/Upsert?categoryId="} selectable />,
        second: () => <Tab items={uniqueValues(categories)} isLoading={isLoading} error={error} deleteItem={deleteCategory} upsertUrl={"/Categories/Upsert?categoryId="} />,
      })}
      onIndexChange={setIndex}
      className="bg-background"
      renderTabBar={props => {
        return (
          <View className={`bg-background  ${Platform.OS === "web" ? "max-w" : ""}`}>
            <PageHeader title="Categories & Groups" upsertLink={["/Categories/Upsert"]}/>
            <View className="flex-row border-b border-gray-200 bg-background">
              <TabHeader title="Categories" isSelected = {props.navigationState.index === 0} onPress={() => setIndex(0)} />
              <TabHeader title="Groups" isSelected = {props.navigationState.index === 1} onPress={() => setIndex(1)} />
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