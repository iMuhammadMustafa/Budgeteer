import MultipleTransactions from "@/src/components/pages/MultipleTransactions";
import TransactionForm, { initialTransactionState } from "@/src/components/pages/TransactionForm";
import { TransactionFormType, useGetTransactionById } from "@/src/repositories/transactions.service";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { TabView, SceneMap } from "react-native-tab-view";

export default function AddTransaction() {
  const params = useLocalSearchParams();
  const transaction = params as unknown as TransactionFormType;

  const id = transaction?.id && !transaction?.accountid && !transaction?.categoryid ? transaction.id : null;
  const { data: transactionById, isLoading, error } = useGetTransactionById(id);

  // const layout = useWindowDimensions();

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "first", title: "Single Transaction" },
    { key: "second", title: "Multiple Transactions" },
  ]);

  if (isLoading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <TabView
      navigationState={{ index, routes }}
      tabBarPosition="bottom"
      lazy={true}
      renderScene={SceneMap({
        first: () => (
          <TransactionForm transaction={transaction.id ? transaction : (transactionById ?? initialTransactionState)} />
        ),
        second: () => <MultipleTransactions transaction={transaction ?? null} />,
      })}
      onIndexChange={setIndex}
      // initialLayout={{ width: layout.width / 2 }}
      className="bg-white"
      renderTabBar={props => {
        return (
          <View className="flex-row items-center justify-center bg-card border-b border-muted">
            {props.navigationState.routes.map((route, i) => (
              <Pressable
                key={route.key}
                onPress={() => setIndex(i)}
                className={`p-2 ${index === i ? "bg-primary text-white" : "text-primary"}`}
              >
                <Text className="text-foreground">{route.title}</Text>
              </Pressable>
            ))}
          </View>
        );
      }}
    />
  );
}
