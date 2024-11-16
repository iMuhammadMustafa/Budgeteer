import { useState } from "react";

import { useDeleteAccount, useGetAccounts } from "@/src/repositories/account.service";
import { useDeleteAccountCategory, useGetAccountCategories } from "@/src/repositories/accountcategories.service";
import { SceneMap, TabView } from "react-native-tab-view";
import { PageHeader, Tab, TabHeader } from "@/src/components/MyTabs";
import { Platform, View } from "react-native";

export default function Accounts() {
  const { data: accounts, isLoading, error } = useGetAccounts();
  const { data: categories, isLoading: isCategoriesLoading, error: categoriesError } = useGetAccountCategories();

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "first", title: "Accounts" },
    { key: "second", title: "Categories" },
  ]);
  const { mutate: deleteAccount } = useDeleteAccount();
  const { mutate: deleteCategory } = useDeleteAccountCategory();
return(
  <TabView
  navigationState={{ index, routes }}
  tabBarPosition="top"
  lazy={true}
  renderScene={SceneMap({
    first: () => <Tab items={accounts} isLoading={isLoading} error={error} deleteItem={deleteAccount} upsertUrl={"/Accounts/Upsert?accountId="} selectable />,
    second: () => <Tab items={categories} isLoading={isLoading} error={error} deleteItem={deleteCategory} upsertUrl={"/Accounts/Categories/Upsert?categoryId="} />,
  })}
  onIndexChange={setIndex}
  className="bg-background"
  renderTabBar={props => {
    return (
      <View className={`bg-background  ${Platform.OS === "web" ? "max-w" : ""}`}>
        <PageHeader title="Accounts & Categories" upsertLink={["/Categories/Upsert", "/Accounts/Categories/Upsert"]}/>
        <View className="flex-row border-b border-gray-200 bg-background">
          <TabHeader title="Accounts" isSelected = {props.navigationState.index === 0} onPress={() => setIndex(0)} />
          <TabHeader title="Categories" isSelected = {props.navigationState.index === 1} onPress={() => setIndex(1)} />
        </View>
      </View>
    );
  }}
/>
);
}
