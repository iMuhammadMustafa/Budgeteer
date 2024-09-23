import { useState } from "react";
import MyDateTimePicker from "@/src/components/MyDateTimePicker";
import MyDropDown, { MyCategoriesDropdown } from "@/src/components/MyDropdown";
import TextInputField from "@/src/components/TextInputField";
import generateUuid from "@/src/lib/uuidHelper";
import { useGetAccounts } from "@/src/repositories/account.service";
import { useGetCategories } from "@/src/repositories/categories.service";
import { FlatList, Pressable, View } from "react-native";
import { ScrollView, Text } from "react-native";
import { MultiTransactionGroup, MultiTransactionItem } from "@/src/consts/Types";
import { useCreateTransactions } from "@/src/repositories/transactions.service";
import TextInputFieldWithIcon from "../TextInputFieldWithIcon";

// const handleAmountChange = (value: string) => {
//   let numericValue: number | string = returnNumericValue(value);

//   // Allow "-" as a valid intermediate state without performing any calculations
//   if (numericValue === "-") {
//     setGroup({
//       ...group,
//       transactions: {
//         ...group.transactions,
//         [id]: { ...group.transactions[id], amount: numericValue }, // Keep "-" as is for now
//       },
//     });
//     return;
//   }

//   // Try to parse the value to a number
//   numericValue = parseFloat(numericValue as string);

//   // If numericValue is still NaN (invalid), return without any state changes
//   if (isNaN(numericValue)) {
//     return;
//   }

//   setGroup(prev => {
//     let prevAmount = isNaN(prev.transactions[id].amount) ? 0 : prev.transactions[id].amount;
//     let difference = numericValue - prevAmount;

//     // Cap the difference to not exceed the max available amount
//     if (difference > parseFloat(maxAmount) - currentAmount) {
//       difference = parseFloat(maxAmount) - currentAmount;
//       numericValue = prevAmount + difference;
//     }

//     // Update currentAmount only if there's an actual change
//     if (difference !== 0) {
//       setCurrentAmount((prev: number) => prev + difference);
//     }

//     // Return the updated group object with the new transaction amount
//     return {
//       ...prev,
//       transactions: {
//         ...prev.transactions,
//         [id]: { ...prev.transactions[id], amount: numericValue },
//       },
//     };
//   });
// };
const returnNumericValue = (value: string) => {
  if (value === "0-") return "-";
  if (!/^-?\d*\.?\d*$/.test(value)) return "";
  if (value.charAt(0) == "0") return value.charAt(0) == "0" ? value.substring(1) : value;
  if (value === ".") return "0.";
  if (value === "00" || value === "") return "0";
  if (value === "0" || value === "-") return value;
  return value;
};

const groupId = generateUuid();
const initalState: MultiTransactionGroup = {
  date: new Date().toISOString(),
  description: "",
  type: "Expense",
  accountid: "",
  status: "None",
  groupid: groupId,
  transactions: {
    [generateUuid()]: {
      amount: 0,
      categoryid: "",
      notes: null,
      tags: null,
      groupid: groupId,
    },
  },
};
export default function MultipleTransactions() {
  const [group, setGroup] = useState<MultiTransactionGroup>(initalState);
  const [mode, setMode] = useState<"plus" | "minus">("minus");
  const [currentAmount, setCurrentAmount] = useState(0);
  const [maxAmount, setMaxAmount] = useState(0);

  const { data: categories, isLoading: isCategoriesLoading } = useGetCategories();
  const { data: accounts, isLoading: isAccountsLoading } = useGetAccounts();
  const submitAllMutation = useCreateTransactions();

  if (isCategoriesLoading || isAccountsLoading) return <Text>Loading...</Text>;

  const handleSubmit = async () => {
    await submitAllMutation.mutateAsync({
      transactionsGroup: group,
      totalAmount: currentAmount,
    });
  };

  return (
    <View className="m-auto mt-2">
      <View className="flex-row gap-2 justify-center w-full">
        <TextInputField
          className="flex-1"
          label="Description"
          value={group?.description}
          onChange={value => setGroup({ ...group, description: value })}
        />
        <TextInputFieldWithIcon
          className="flex-1"
          label="Amount"
          mode={mode}
          setMode={setMode}
          value={(maxAmount ?? 0).toString()}
          onChange={value => {
            if (value.includes("-")) {
              setMode("minus");
              return;
            }
            if (value === "") return setMaxAmount(0);
            if (!/^-?\d*\.?\d*$/.test(value)) {
              return;
            }

            setMaxAmount(parseFloat(value));
          }}
        />
        <MyDateTimePicker
          label="Date"
          date={group.date}
          onChange={({ date }) => setGroup({ ...group, date })}
          isModal
        />
      </View>
      <View className="flex-row gap-2 justify-center w-full ">
        <MyDropDown
          options={[
            { id: "Income", label: "Income", value: "Income" },
            { id: "Expense", label: "Expense", value: "Expense" },
          ]}
          selectedValue={group.type}
          label="Type"
          onSelect={value => setGroup({ ...group, type: value?.value ?? "Expense" })}
        />

        <MyDropDown
          options={accounts?.map(account => ({ id: account.id, label: account.name, value: account })) ?? []}
          label="Account"
          selectedValue={group.accountid}
          onSelect={value => setGroup({ ...group, accountid: value?.id || "" })}
        />
      </View>

      <TransactionsCreationList
        group={group}
        groupId={groupId}
        setGroup={setGroup}
        currentAmount={currentAmount}
        setCurrentAmount={setCurrentAmount}
        maxAmount={maxAmount}
        categories={categories!}
        mode={mode}
      />
      <TransactionsFooter currentAmount={currentAmount} maxAmount={maxAmount} mode={mode} onSubmit={handleSubmit} />
    </View>
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
    <ScrollView className="max-h-[300px] h-[300px] custom-scrollbar my-3 w-full -z-10">
      <AddNewTransaction
        group={group}
        setGroup={setGroup}
        groupId={groupId}
        currentAmount={currentAmount}
        setCurrentAmount={setCurrentAmount}
        maxAmount={maxAmount}
      />
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
  mode,
}: {
  id: string;
  transaction: MultiTransactionItem;
  categories: any[];
  currentAmount: number;
  setCurrentAmount: (amount: number | ((prev: number) => number)) => void;
  maxAmount: number;
  group: MultiTransactionGroup;
  setGroup: (group: MultiTransactionGroup | ((prev: MultiTransactionGroup) => MultiTransactionGroup)) => void;
  mode: "plus" | "minus";
}) => {
  // const [currentMode, setCurrentMode] = useState<"plus" | "minus">(
  //   transaction.amount == 0 ? mode : transaction.amount < 0 ? "minus" : "plus",
  // );
  const [currentMode, setCurrentMode] = useState<"plus" | "minus">(mode);
  const handleAmountChange = (value: string) => {
    let numericValue = 0;

    if (value.includes("-")) {
      setCurrentMode("minus");
      return;
    }
    if (value === "") numericValue = 0;
    if (!/^-?\d*\.?\d*$/.test(value)) {
      return;
    }

    numericValue = parseFloat(value);

    setGroup(prev => {
      let prevAmount = isNaN(prev.transactions[id].amount) ? 0 : prev.transactions[id].amount;
      let difference = numericValue - prevAmount;

      return {
        ...prev,
        transactions: {
          ...prev.transactions,
          [id]: { ...prev.transactions[id], amount: numericValue },
        },
      };
    });
  };

  return (
    <View className="flex-row gap-2 bg-card border border-muted items-center justify-between p-3 my-2">
      <TextInputFieldWithIcon
        className="flex-1"
        label="Amount"
        value={transaction.amount.toString()}
        onChange={value => handleAmountChange(value)}
        mode={currentMode}
        setMode={setCurrentMode}
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
        className="bg-error-400 text-white rounded-md p-1.5 mt-4"
        onPress={() => {
          setCurrentAmount((prev: number) => prev - transaction.amount);
          setGroup((prev: MultiTransactionGroup): MultiTransactionGroup => {
            const { [id]: _, ...rest } = prev.transactions;
            setCurrentAmount((prev: number) => prev - transaction.amount);
            return { ...prev, transactions: rest };
          });
        }}
      >
        <Text className="text-center text-foreground" selectable={false}>
          Remove
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
}: {
  maxAmount: number;
  currentAmount: number;
  mode: "plus" | "minus";
  onSubmit: () => void;
}) => {
  const isDisabled = currentAmount !== maxAmount;
  const isMinus = mode === "minus";
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex">
        <Text className="text-center text-foreground">Max Amount: ${maxAmount ?? 0.0}</Text>
        <Text className="text-center text-foreground">Total: ${currentAmount ?? 0.0}</Text>
        <Text className="text-center text-foreground">Remaining: ${maxAmount - currentAmount ?? 0.0}</Text>
      </View>
      <Pressable
        className={`p-2 rounded-md ${isDisabled ? "bg-secondary" : "bg-primary"} `}
        disabled={isDisabled}
        onPress={onSubmit}
      >
        <Text className="text-center text-foreground" selectable={false}>
          Submit
        </Text>
      </Pressable>
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
}: {
  group: MultiTransactionGroup;
  setGroup: (group: MultiTransactionGroup | ((prev: MultiTransactionGroup) => MultiTransactionGroup)) => void;
  groupId: string;
  currentAmount: number;
  setCurrentAmount: (amount: number | ((prev: number) => number)) => void;
  maxAmount: number;
}) => {
  return (
    <Pressable
      className="p-2 bg-primary text-white rounded-md"
      onPress={() => {
        const newAmount = maxAmount - currentAmount;
        setCurrentAmount((amount: number) => amount + newAmount);

        setGroup({
          ...group,
          transactions: {
            ...group.transactions,
            [generateUuid()]: {
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
