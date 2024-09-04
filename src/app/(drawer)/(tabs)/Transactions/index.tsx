import { Box } from "@/components/ui/box";
import { TableRow, TableData } from "@/components/ui/table";
import List from "@/src/components/List";
import Icon from "@/src/lib/IonIcons";
import { Transaction } from "@/src/lib/supabase";
import { useDeleteTransaction, useGetTransactions } from "@/src/repositories/transactions.service";
import { Link } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import dayjs from "dayjs";
import { Divider } from "@/components/ui/divider";
import relativeTime from "dayjs/plugin/relativeTime";

export default function Transactions() {
  const { data: transactions, error, isLoading } = useGetTransactions();

  const [isActionLoading, setIsActionLoading] = useState(false);
  const mutation = useDeleteTransaction();

  if (isLoading || !transactions) return <ActivityIndicator />;
  if (error) return <Text>Error: {error.message}</Text>;

  const groupedData = transactions.reduce((acc, curr) => {
    const date = curr.date.split("T")[0];

    if (!acc[date]) {
      acc[date] = {
        amount: 0,
        transactions: [],
      };
    }
    acc[date].amount += curr.amount;
    acc[date].transactions.push(curr);

    return acc;
  }, {});

  // const groupedData = Object.groupBy(transactions!, ({ date }) => date.split("T")[0]);
  const days = Object.keys(groupedData);
  dayjs.extend(relativeTime);

  return (
    <SafeAreaView className="w-full h-full">
      <Box className="px-10 self-end my-2 flex-row">
        <Link href="../AddTransaction">
          <Icon name="Plus" className="text-foreground" />
        </Link>
      </Box>
      <ScrollView className="m-2  ">
        <FlatList
          data={days}
          renderItem={({ item }) => {
            return (
              <View className="flex justify-center items-center">
                <View className="justify-center">
                  <View className="flex-row my-2 justify-between items-center bg-muted p-1 rounded-lg">
                    <View className="flex-col items-start  justify-start">
                      <Text>{dayjs(item).format("ddd, DD MMM YYYY")}</Text>
                      <View className="flex-row gap-2 items-center">
                        <Icon name="CalendarDays" size={15} />
                        <Text>{dayjs(item).fromNow()}</Text>
                      </View>
                    </View>
                    <Text className={`${groupedData[item].amount > 0 ? "text-success-500" : "text-error-500"}`}>
                      {groupedData[item].amount > 0 ? `+${groupedData[item].amount}` : `-${groupedData[item].amount}`}
                    </Text>
                  </View>
                  <FlatList
                    data={groupedData[item].transactions}
                    renderItem={({ item: transaction }) => {
                      return (
                        <Link href={`../AddTransaction?transactionId=${transaction.id}`}>
                          <View className="my-2 flex-row items-center gap-7">
                            <View className={`rounded-full h-10 w-10 bg-neutral-100 flex justify-center items-center`}>
                              <TransactionTypeIcon transaction={transaction} />
                            </View>
                            <View className="">
                              <Text>{transaction.description ?? transaction.category?.name ?? "Hello"}</Text>
                              <View className="flex-row justify-start items-center gap-2">
                                <Text>{transaction.category?.name}</Text>
                              </View>
                            </View>
                            <View className="flex items-center">
                              <Text className={`${getTransactionProp(transaction.type).color}`}>
                                {transaction.amount} {transaction.account?.currency}
                              </Text>
                              <Text>{transaction.account?.name}</Text>
                            </View>
                          </View>
                        </Link>
                      );
                    }}
                    keyExtractor={transaction => transaction.id}
                  />
                </View>

                <Divider className="my-0.5  h-[2px]" />
              </View>
            );
          }}
          keyExtractor={item => item}
        />
      </ScrollView>
    </SafeAreaView>

    // <List
    //   data={transactions!}
    //   columns={["", "Type", "Account", "Amount", "", "Category", "Date", "Notes", "Tags"]}
    //   createLinks={["../AddTransaction"]}
    //   renderItem={(transaction: Transaction) => {
    //     return (
    //       <TableRow key={transaction.id} className="text-center">
    //         <TableData className="flex justify-evenly items-center">
    //           <TransactionTypeIcon transaction={transaction} />
    //         </TableData>
    //         <TableData>{transaction.type}</TableData>
    //         <TableData>{transaction.account?.name ?? ""}</TableData>
    //         <TableData>{transaction.amount}</TableData>
    //         <TableData className="flex justify-center items-center gap-2">
    //           {transaction.category?.icon ? (
    //             <Icon name={transaction.category?.icon} size={20} className="text-muted-foreground" />
    //           ) : (
    //             ""
    //           )}
    //         </TableData>
    //         <TableData>{transaction.category?.name ?? ""}</TableData>
    //         <TableData>{new Date(transaction.date).toLocaleDateString("en-GB")}</TableData>
    //         <TableData>{transaction.notes}</TableData>
    //         <TableData>{transaction.tags}</TableData>

    //         <TableData className="flex justify-center items-center gap-2">
    //           <Link href={`../AddTransaction?transactionId=${transaction.id}`}>
    //             <Icon name="Pencil" size={20} className="text-primary-300" />
    //           </Link>
    //           {isActionLoading ? (
    //             <Icon name="Loader" size={20} className="text-primary-300" />
    //           ) : (
    //             <TouchableOpacity
    //               onPress={() =>
    //                 mutation.mutateAsync(transaction, {
    //                   onSuccess: () => setIsActionLoading(false),
    //                   onError: () => setIsActionLoading(false),
    //                 })
    //               }
    //             >
    //               <Icon name="Trash2" size={20} className="text-red-600" />
    //             </TouchableOpacity>
    //           )}
    //         </TableData>
    //       </TableRow>
    //     );
    //   }}
    // />
  );
}

const TransactionTypeIcon = ({ transaction }: { transaction: Transaction }) => {
  const iconProp = getTransactionProp(transaction.type);
  return <Icon name={iconProp.iconName} size={iconProp.size} className={iconProp.color} />;
};
const getTransactionProp = (type: string | null) => {
  const transactionProp = { iconName: "CircleHelp", color: "text-muted-foreground", size: 20 };
  if (type === "Income") {
    transactionProp.iconName = "Plus";
    transactionProp.color = "text-success-500";
  }
  if (type === "Expense") {
    transactionProp.iconName = "Minus";
    transactionProp.color = "text-error-500";
  }
  if (type === "Transfer") {
    transactionProp.iconName = "ArrowLeftRight";
    transactionProp.color = "text-info-500";
  }
  if (type === "Adjustment") {
    transactionProp.iconName = "Wrench";
    transactionProp.color = "text-warning-500";
  }

  return transactionProp;
};
