import { useCallback, useState } from "react";
import { TabView } from "react-native-tab-view";
import { TableNames } from "@/src/types/db/TableNames";
import { Tab, TabBar, TabHeader } from "@/src/components/MyTabs";
import { useTransactionCategoryService } from "@/src/services/TransactionCategories.Service";
import { useTransactionGroupService } from "@/src/services/TransactionGroups.Service";

export default function Categories() {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "first", title: "Categories" },
    { key: "second", title: "Groups" },
  ]);

  const renderScene = useCallback(({ route }: any) => {
    switch (route.key) {
      case "first":
        return <FirstRoute />;
      case "second":
        return <SecondRoute />;
      default:
        return <FirstRoute />;
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
    <TabHeader title="Categories" isSelected={props.navigationState.index === 0} onPress={() => props.setIndex(0)} />
    <TabHeader title="Groups" isSelected={props.navigationState.index === 1} onPress={() => props.setIndex(1)} />
  </>
);

const FirstRoute = () => {
  const transactionCategoryService = useTransactionCategoryService();
  return (
    <Tab
      title="Categories"
      queryKey={[TableNames.TransactionCategories]}
      useGet={transactionCategoryService.findAll}
      useDelete={transactionCategoryService.delete}
      upsertUrl={"/Categories/Upsert?categoryId="}
      groupedBy="group.name"
    />
  );
};

const SecondRoute = () => {
  const transactionGroupService = useTransactionGroupService();

  return (
    <Tab
      title="Groups"
      queryKey={[TableNames.TransactionGroups]}
      useGet={transactionGroupService.findAll}
      useDelete={transactionGroupService.softDelete}
      upsertUrl={"/Categories/Groups/Upsert?groupId="}
    />
  );
};
