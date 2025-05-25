import { useCallback, useState } from "react";
import { TabView } from "react-native-tab-view";
import {
  useDeleteAccountCategory,
  useGetAccountCategories,
} from "@/src/services/repositories/AccountCategories.Repository";
import { useDeleteAccount, useGetAccounts } from "@/src/services/repositories/Accounts.Repository";
import { TableNames } from "@/src/types/db/TableNames";
import { Tab, TabBar, TabHeader } from "@/src/components/MyTabs";

export default function Accounts() {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "first", title: "Accounts" },
    { key: "second", title: "Categories" },
  ]);

  const renderScene = useCallback(({ route }: any) => {
    switch (route.key) {
      case "first":
        return <AccountsRoute />;
      case "second":
        return <AccountsCategoriesRoute />;
      default:
        return <AccountsRoute />;
    }
  }, []);

  return (
    <TabView
      navigationState={{ index, routes }}
      tabBarPosition="top"
      onIndexChange={setIndex}
      className="bg-background"
      lazy={true}
      renderScene={renderScene}
      renderTabBar={props => (
        <TabBar>
          <Bar {...props} setIndex={setIndex} />
        </TabBar>
      )}
    />
  );
}

const Bar = (props: any) => (
  <>
    <TabHeader title="Accounts" isSelected={props.navigationState.index === 0} onPress={() => props.setIndex(0)} />
    <TabHeader title="Categories" isSelected={props.navigationState.index === 1} onPress={() => props.setIndex(1)} />
  </>
);

const AccountsRoute = () => (
  <Tab
    title="Accounts"
    queryKey={[TableNames.Accounts]}
    useGet={useGetAccounts}
    customMapping={(item: any) => ({
      ...item,
      details: item.balance.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      }),
    })}
    customDetails={item =>
      `Balance: ${item.balance.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      })}`
    }
    useDelete={useDeleteAccount}
    upsertUrl={"/Accounts/Upsert?accountId="}
    groupedBy={"category.name"}
  />
);

const AccountsCategoriesRoute = () => (
  <Tab
    title="Categories"
    queryKey={[TableNames.AccountCategories]}
    useGet={useGetAccountCategories}
    useDelete={useDeleteAccountCategory}
    upsertUrl={"/Accounts/Categories/Upsert?categoryId="}
  />
);
