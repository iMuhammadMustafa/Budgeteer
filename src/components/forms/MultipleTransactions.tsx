import { memo, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Platform, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import dayjs from "dayjs";

import { MultiTransactionGroup, MultiTransactionItem } from "@/src/types/components/MultipleTransactions.types";
import GenerateUuid from "@/src/utils/UUID.Helper";
import { TransactionFormType } from "./TransactionForm";
import { useGetTransactionCategories } from "@/src/services/repositories/TransactionCategories.Service";
import { useGetAccounts } from "@/src/services/repositories/Accounts.Service";
import { useCreateTransactions } from "@/src/services/repositories/Transactions.Service";
import TextInputField from "../TextInputField";
import TextInputFieldWithIcon from "../TextInputFieldWithIcon";
import MyDateTimePicker from "../MyDateTimePicker";
import DropdownField, { AccountSelecterDropdown, MyCategoriesDropdown } from "../DropDownField";
import MyIcon from "@/src/utils/Icons.Helper";
import { queryClient } from "@/src/providers/QueryProvider";
import { ViewNames } from "@/src/types/db/TableNames";

let groupId = GenerateUuid();
export const initalState: MultiTransactionGroup = {
  originalTransactionId: null,
  date: dayjs().local(),
  description: "",
  type: "Expense",
  accountid: "",
  isvoid: false,
  groupid: groupId,
  payee: "",
  transactions: {
    [GenerateUuid()]: {
      name: "",
      amount: 0,
      categoryid: "",
      notes: null,
      tags: null,
      groupid: groupId,
    },
  },
};

const generateInitalState = () => {
  let groupId = GenerateUuid();
  return {
    originalTransactionId: null,
    date: dayjs().local(),
    description: "",
    type: "Expense",
    accountid: "",
    isvoid: false,
    groupid: groupId,
    payee: "",
    transactions: {
      [GenerateUuid()]: {
        name: "",
        amount: 0,
        categoryid: "",
        notes: null,
        tags: null,
        groupid: groupId,
      },
    },
  };
};

function MultipleTransactions({ transaction }: { transaction: TransactionFormType | null }) {
  const [group, setGroup] = useState<MultiTransactionGroup>(initalState);

  const [mode, setMode] = useState<"plus" | "minus">("minus");

  const [currentAmount, setCurrentAmount] = useState(0);
  const [maxAmount, setMaxAmount] = useState(0);

  const { data: categories, isLoading: isCategoriesLoading } = useGetTransactionCategories();
  const { data: accounts, isLoading: isAccountsLoading } = useGetAccounts();
  const [isLoading, setIsLoading] = useState(false);

  const submitAllMutation = useCreateTransactions();

  if (isCategoriesLoading || isAccountsLoading) return <ActivityIndicator size="large" color="#0000ff" />;

  useEffect(() => {
    if (transaction && transaction.id) {
      setMode(parseFloat(transaction.amount.toString()) < 0 ? "minus" : "plus");
      setMaxAmount(Math.abs(parseFloat(transaction.amount.toString())));
      setCurrentAmount(parseFloat(transaction.amount.toString()));

      setGroup({
        originalTransactionId: transaction.id,
        date: dayjs(transaction.date),
        description: transaction.description!,
        type: transaction.type!,
        accountid: transaction.accountid!,
        isvoid: transaction.isvoid!,
        groupid: transaction.id,
        payee: transaction.payee!,
        transactions: {
          [GenerateUuid()]: {
            name: transaction.name!,
            amount: transaction.amount!,
            categoryid: transaction.categoryid!,
            notes: transaction.notes!,
            tags: transaction.tags!,
            groupid: groupId,
          },
        },
      });
    }
  }, [transaction]);

  const handleSubmit = async () => {
    setIsLoading(true);
    await submitAllMutation.mutateAsync(
      {
        transactionsGroup: group,
        totalAmount: Math.abs(currentAmount) * (mode === "minus" ? -1 : 1),
      },
      {
        onSuccess: async () => {
          console.log({
            message: `Transaction ${transaction?.id ? "Updated" : "Created"} Successfully`,
            type: "success",
          });
          setIsLoading(false);
          await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView], exact: false });
          handleReset();
          router.replace("/Transactions");
        },
      },
    );
  };

  const handleReset = () => {
    setGroup(generateInitalState());
    setMaxAmount(0);
    setCurrentAmount(0);
  };

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className={`flex-1 p-5 mt-2 ${Platform.OS !== "web" ? "mx-2" : ""}`}>
        <View className="flex-row gap-2 justify-center w-full">
          <TextInputField
            className="flex-1"
            label="Payee"
            value={group?.payee}
            onChange={value => setGroup({ ...group, payee: value })}
          />
          <TextInputField
            className="flex-1"
            label="Description"
            value={group?.description}
            onChange={value => setGroup({ ...group, description: value })}
          />
          {/*TODO: IsVoid */}
          <TextInputFieldWithIcon
            className="flex-1"
            label="Amount"
            mode={mode}
            setMode={setMode}
            type={transaction?.type ?? "Expense"}
            value={(maxAmount ?? 0).toString()}
            onModeChange={() => {
              // setMaxAmount(prev => (mode === "minus" ? Math.abs(prev) : Math.abs(prev) * -1));
            }}
            onChange={value => {
              let numericAmount = value
                .replace(/[^0-9.-]/g, "") // Allow digits, minus sign, and decimal point
                .replace(/(?!^)-/g, "") // Remove any minus sign that isn't at the start
                .replace(/(\d+)\.\.(\d+)/g, "$1.$2") // Keep only the first decimal point
                .replace(/^0+(?=\d)/, ""); // Remove leading zeros

              if (value.includes("-")) {
                setMode("minus");
                return;
              }
              if (value === "") return setMaxAmount(0);
              if (!/^-?\d*\.?\d*$/.test(value)) {
                return;
              }
              // setMaxAmount(numericAmount);
              setMaxAmount(prev => {
                return prev == 0 && numericAmount.toString().startsWith("0")
                  ? numericAmount.slice(0, -1)
                  : numericAmount;
              });

              // setMaxAmount(prev => {
              //   return prev == 0 || !numericAmount.toString().startsWith("0")
              //     ? numericAmount.slice(0, -1)
              //     : numericAmount;
              // });
            }}
            keyboardType="numeric"
          />
          <MyDateTimePicker
            label="Date"
            date={group.date}
            onChange={date => setGroup({ ...group, date })}
            isModal
          />
        </View>
        <View className="flex-row gap-2 justify-center w-full relative">
          <DropdownField
            options={[
              { id: "Income", label: "Income", value: "Income" },
              { id: "Expense", label: "Expense", value: "Expense" },
            ]}
            selectedValue={group.type}
            label="Type"
            onSelect={value => setGroup({ ...group, type: value?.value ?? "Expense" })}
          />
          <AccountSelecterDropdown
            isModal
            selectedValue={group.accountid}
            groupBy="group"
            onSelect={value => setGroup({ ...group, accountid: value?.id || "" })}
            accounts={accounts}
          />
        </View>

        <TransactionsCreationList
          group={group}
          groupId={groupId}
          setGroup={setGroup}
          currentAmount={currentAmount}
          setCurrentAmount={setCurrentAmount}
          maxAmount={parseFloat(maxAmount.toString())}
          categories={categories!}
          mode={mode}
        />
        <TransactionsFooter
          currentAmount={currentAmount}
          maxAmount={parseFloat(maxAmount.toString())}
          mode={mode}
          onSubmit={handleSubmit}
          onReset={handleReset}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const TransactionsCreationList = ({
  group,
  groupId,
  categories,
  maxAmount,
  currentAmount,
  setCurrentAmount,
  setGroup,
  mode,
}: {
  group: MultiTransactionGroup;
  groupId: string;
  categories: any[];
  maxAmount: number;
  currentAmount: number;
  setCurrentAmount: (amount: number | ((prev: number) => number)) => void;
  setGroup: (group: MultiTransactionGroup | ((prev: MultiTransactionGroup) => MultiTransactionGroup)) => void;
  mode: "plus" | "minus";
}) => {
  return (
    <View className=" -z-10">
      <AddNewTransaction
        group={group}
        setGroup={setGroup}
        groupId={groupId}
        currentAmount={currentAmount}
        setCurrentAmount={setCurrentAmount}
        maxAmount={maxAmount}
        mode={mode}
      />

      <ScrollView
        className={`custom-scrollbar my-3 w-full -z-10 ${Platform.OS === "web" ? "max-h-[320px] h-[320px]" : "max-h-[380px] h-[380px]"}`}
      >
        <FlatList
          data={Object.keys(group.transactions)}
          keyExtractor={(item, index) => index + item}
          renderItem={({ item, index }) => (
            <TransactionCard
              id={item}
              transaction={group.transactions[item]}
              categories={categories}
              group={group}
              setGroup={setGroup}
              currentAmount={currentAmount}
              setCurrentAmount={setCurrentAmount}
              maxAmount={maxAmount}
              mode={mode}
            />
          )}
        />
      </ScrollView>
    </View>
  );
};

const TransactionCard = ({
  id,
  transaction,
  categories,
  group,
  setGroup,
  currentAmount,
  setCurrentAmount,
  maxAmount,
  mode, // global mode
}: {
  id: string;
  transaction: MultiTransactionItem;
  categories: any[];
  currentAmount: number;
  setCurrentAmount: (amount: number | ((prev: number) => number)) => void;
  maxAmount: number;
  group: MultiTransactionGroup;
  setGroup: (group: MultiTransactionGroup | ((prev: MultiTransactionGroup) => MultiTransactionGroup)) => void;
  mode: "plus" | "minus"; // global mode
}) => {
  const [currentMode, setCurrentMode] = useState<"plus" | "minus">(
    transaction.amount === 0 ? mode : transaction.amount < 0 ? "minus" : "plus",
  );

  const globalMultiplier = mode === "minus" ? -1 : 1; // Global mode multiplier (positive or negative)
  const currentMultiplier = currentMode === "minus" ? -1 : 1; // Current mode multiplier (positive or negative)

  const calculateAmounts = (numericValue: any, stringValue?: any) => {
    setGroup(prev => {
      const prevAmount = parseFloat(prev.transactions[id].amount.toString()) || 0;
      const difference = (numericValue - prevAmount).toFixed(2);
      setCurrentAmount(prev => prev + parseFloat(difference)); // Update current amount based on the difference

      return {
        ...prev,
        transactions: {
          ...prev.transactions,
          [id]: { ...prev.transactions[id], amount: stringValue ? stringValue : numericValue },
        },
      };
    });
  };

  const handleAmountChange = (value: string) => {
    if (!/^-?\d*\.?\d*$/.test(value)) {
      return; // Reject invalid numeric input
    }

    if (!value.endsWith(".")) {
      let numericValue = parseFloat(value);
      if (isNaN(numericValue)) {
        numericValue = 0;
      }
      // Update amount based on currentMode
      numericValue = Math.abs(numericValue) * currentMultiplier;

      // Respect the global mode and ensure the maxAmount respects the global mode

      const remainingAmount =
        maxAmount * globalMultiplier - currentAmount + parseFloat(transaction.amount.toString()) + numericValue;

      // Adjust the numeric value based on remaining amount
      if (Math.abs(numericValue) > Math.abs(remainingAmount) && currentMode === mode) {
        numericValue = currentMultiplier * remainingAmount;
        numericValue = parseFloat(numericValue.toFixed(2));
      }

      // Update group and current amount
      calculateAmounts(numericValue);
    } else {
      const sign = currentMultiplier === -1 ? "-" : "";
      const newAmount = sign + value;

      calculateAmounts(parseFloat(newAmount), newAmount);
    }
  };

  // Handle mode toggle (switch between plus/minus)
  const handleModeToggle = () => {
    setCurrentMode(prevMode => {
      const newMode = prevMode === "plus" ? "minus" : "plus"; // Toggle between plus and minus

      // Update the amount based on the new mode
      const newAmount = transaction.amount * -1;

      setGroup(prev => ({
        ...prev,
        transactions: {
          ...prev.transactions,
          [id]: { ...prev.transactions[id], amount: newAmount },
        },
      }));

      setCurrentAmount(prev => prev - transaction.amount + newAmount); // Update current amount with new signed value

      return newMode;
    });
  };

  return (
    <View
      className={`bg-card border border-muted  p-3 my-2 w-full ${Platform.OS === "web" ? "flex-row gap-2 items-center justify-between" : "flex-col"}`}
    >
      <TextInputFieldWithIcon
        className="flex-1"
        label="Amount"
        type="Expense"
        value={
          transaction.amount.toString().endsWith(".")
            ? transaction.amount
            : isNaN(transaction.amount)
              ? "0"
              : Math.abs(transaction.amount).toString()
        } // Always display absolute value
        onChange={value => {
          let numericAmount = value
            .replace(/[^0-9.-]/g, "") // Allow digits, minus sign, and decimal point
            .replace(/(?!^)-/g, "") // Remove any minus sign that isn't at the start
            .replace(/(\d+)\.\.(\d+)/g, "$1.$2") // Keep only the first decimal point
            .replace(/^0+(?=\d)/, ""); // Remove leading zeros

          handleAmountChange(numericAmount);
        }}
        mode={currentMode}
        setMode={handleModeToggle} // Pass the mode toggle handler
        keyboardType="numeric"
      />
      <TextInputField
        className="flex-1"
        label="Name"
        value={transaction?.name}
        onChange={value =>
          setGroup({ ...group, transactions: { ...group.transactions, [id]: { ...transaction, name: value } } })
        }
      />

      <MyCategoriesDropdown
        selectedValue={transaction.categoryid}
        categories={categories}
        onSelect={value => {
          setGroup({
            ...group,
            transactions: { ...group.transactions, [id]: { ...transaction, categoryid: value?.id || "" } },
          });
        }}
        isModal
      />

      <TextInputField
        className="flex-1"
        label="Notes"
        value={transaction?.notes}
        onChange={value =>
          setGroup({ ...group, transactions: { ...group.transactions, [id]: { ...transaction, notes: value } } })
        }
      />
      <TextInputField
        className="flex-1"
        label="Tags"
        value={transaction?.tags?.join(",")}
        onChange={value =>
          setGroup({
            ...group,
            transactions: { ...group.transactions, [id]: { ...transaction, tags: value.split(",") } },
          })
        }
      />
      <Pressable
        className="bg-danger-400 text-white rounded-md p-1.5 mt-4"
        onPress={() => {
          setGroup((prev: MultiTransactionGroup): MultiTransactionGroup => {
            const { [id]: _, ...rest } = prev.transactions;
            setCurrentAmount((prevAmount: number) => prevAmount - _.amount);
            return { ...prev, transactions: rest };
          });
        }}
      >
        <Text className="text-center text-white" selectable={false}>
          <MyIcon name="Trash" className="text-white" />
        </Text>
      </Pressable>
    </View>
  );
};

const TransactionsFooter = ({
  maxAmount,
  currentAmount,
  mode,
  onSubmit,
  onReset,
}: {
  maxAmount: number;
  currentAmount: number;
  mode: "plus" | "minus";
  onSubmit: () => void;
  onReset: () => void;
}) => {
  const isDisabled = currentAmount !== maxAmount * (mode === "minus" ? -1 : 1);
  const globalMultiplier = mode === "minus" ? -1 : 1; // Global mode multiplier (positive or negative)
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex">
        <Text className="text-center text-foreground">Total: {(globalMultiplier * maxAmount).toFixed(2)}$</Text>
        <Text className="text-center text-foreground">Current Total: {currentAmount.toFixed(2) ?? 0.0}$</Text>
        <Text className="text-center text-foreground">
          Remaining: {(globalMultiplier * maxAmount - currentAmount).toFixed(2) ?? 0.0}$
        </Text>
      </View>
      <View className="flex gap-2 items-center justify-center">
        <Pressable
          className={`${isDisabled ? "bg-secondary" : "bg-primary"} px-4 py-2 align-center justify-center rounded-md`}
          disabled={isDisabled}
          onPress={onSubmit}
        >
          <Text className="text-center text-foreground" selectable={false}>
            Submit
          </Text>
        </Pressable>
        <Pressable className="bg-danger-400 px-5 py-2 align-center justify-center rounded-md" onPress={onReset}>
          <Text className="text-foreground font-medium text-md" selectable={false}>
            Reset
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
const AddNewTransaction = ({
  group,
  setGroup,
  groupId,
  currentAmount,
  setCurrentAmount,
  maxAmount,
  mode,
}: {
  group: MultiTransactionGroup;
  setGroup: (group: MultiTransactionGroup | ((prev: MultiTransactionGroup) => MultiTransactionGroup)) => void;
  groupId: string;
  currentAmount: number;
  setCurrentAmount: (amount: number | ((prev: number) => number)) => void;
  maxAmount: number;
  mode: "plus" | "minus";
}) => {
  const globalMultiplier = mode === "minus" ? -1 : 1; // Global mode multiplier (positive or negative)
  return (
    <Pressable
      className="p-2 bg-primary text-white rounded-md"
      onPress={() => {
        const newAmount = Number((globalMultiplier * maxAmount - currentAmount).toFixed(2));
        setCurrentAmount((amount: number) => amount + newAmount);

        setGroup({
          ...group,
          transactions: {
            ...group.transactions,
            [GenerateUuid()]: {
              name: "",
              amount: newAmount,
              categoryid: "",
              notes: null,
              groupid: groupId,
              tags: null,
            },
          },
        });
      }}
    >
      <Text className="text-center text-foreground" selectable={false}>
        Add Transaction
      </Text>
    </Pressable>
  );
};

export default memo(MultipleTransactions);
