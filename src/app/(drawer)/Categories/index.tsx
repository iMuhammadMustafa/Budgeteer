import { useCallback, useState } from "react";
import { TabView } from "react-native-tab-view";
import { TableNames } from "@/src/types/db/TableNames";
import { Tab, TabBar, TabHeader } from "@/src/components/MyTabs";
import {
  useDeleteTransactionCategory,
  useGetTransactionCategories,
} from "@/src/services/repositories/TransactionCategories.Repository";
import {
  useDeleteTransactionGroup,
  useGetTransactionGroups,
} from "@/src/services/repositories/TransactionGroups.Repository";

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

const FirstRoute = () => (
  <Tab
    title="Categories"
    queryKey={[TableNames.TransactionCategories]}
    useGet={useGetTransactionCategories}
    useDelete={useDeleteTransactionCategory}
    upsertUrl={"/Categories/Upsert?categoryId="}
  />
);

const SecondRoute = () => (
  <Tab
    title="Groups"
    queryKey={[TableNames.TransactionGroups]}
    useGet={useGetTransactionGroups}
    useDelete={useDeleteTransactionGroup}
    upsertUrl={"/Categories/Groups/Upsert?groupd="}
  />
);
