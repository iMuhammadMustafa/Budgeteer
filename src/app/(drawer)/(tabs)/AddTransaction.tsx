import { useCallback, useState } from "react";
import { TabView } from "react-native-tab-view";
import { useLocalSearchParams } from "expo-router";

import { TabBar, TabHeader } from "@/src/components/MyTabs";
import TransactionForm, { initialTransactionState, TransactionFormType } from "@/src/components/forms/TransactionForm";
import MultipleTransactions from "@/src/components/forms/MultipleTransactions";
import { useTransactionService } from "@/src/services/Transactions.Service";

export default function AddTransaction() {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "first", title: "Single" },
    { key: "second", title: "Multiple" },
  ]);

  const params = useLocalSearchParams();
  const transaction = params as unknown as TransactionFormType;

  const id = transaction?.id && !transaction?.accountid && !transaction?.categoryid ? transaction.id : undefined;
  const transactionService = useTransactionService();
  const { data: transactionById, isLoading, error } = transactionService.findById(id);

  const renderScene = useCallback(
    ({ route }: any) => {
      switch (route.key) {
        case "first":
          return (
            <FirstRoute transaction={transaction.id ? transaction : (transactionById ?? initialTransactionState)} />
          );
        case "second":
          return <SecondRoute transaction={transaction ?? null} />;
        default:
          return <FirstRoute />;
      }
    },
    [transaction],
  );

  return (
    <TabView
      navigationState={{ index, routes }}
      tabBarPosition="bottom"
      lazy={true}
      onIndexChange={setIndex}
      className="bg-background"
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
    <TabHeader title="Single" isSelected={props.navigationState.index === 0} onPress={() => props.setIndex(0)} />
    <TabHeader title="Multiple" isSelected={props.navigationState.index === 1} onPress={() => props.setIndex(1)} />
  </>
);

const FirstRoute = ({ transaction }: any) => <TransactionForm transaction={transaction} />;

const SecondRoute = ({ transaction }: any) => <MultipleTransactions transaction={transaction ?? null} />;
