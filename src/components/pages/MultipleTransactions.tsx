import { memo, useEffect, useState } from "react";
import MyDateTimePicker from "@/src/components/MyDateTimePicker";
import MyDropDown, { MyCategoriesDropdown } from "@/src/components/MyDropdown";
import TextInputField from "@/src/components/TextInputField";
import generateUuid from "@/src/lib/uuidHelper";
import { useGetAccounts } from "@/src/repositories/account.service";
import { useGetCategories } from "@/src/repositories/categories.service";
import { ActivityIndicator, FlatList, Platform, Pressable, View } from "react-native";
import { ScrollView, Text } from "react-native";
import { MultiTransactionGroup, MultiTransactionItem } from "@/src/consts/Types";
import { TransactionFormType, useCreateTransactions } from "@/src/repositories/transactions.service";
import TextInputFieldWithIcon from "../TextInputFieldWithIcon";
import Icon from "@/src/lib/IonIcons";
import { useNotifications } from "@/src/providers/NotificationsProvider";
import { useRouter } from "expo-router";

const groupId = generateUuid();
const initalState: MultiTransactionGroup = {
  originalTransactionId: null,
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
function MultipleTransactions({ transaction }: { transaction: TransactionFormType | null }) {
  const [group, setGroup] = useState<MultiTransactionGroup>(initalState);
  const [mode, setMode] = useState<"plus" | "minus">("minus");
  const [currentAmount, setCurrentAmount] = useState(0);
  const [maxAmount, setMaxAmount] = useState(0);

  const { data: categories, isLoading: isCategoriesLoading } = useGetCategories();
  const { data: accounts, isLoading: isAccountsLoading } = useGetAccounts();
  const submitAllMutation = useCreateTransactions();
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  if (isCategoriesLoading || isAccountsLoading) return <ActivityIndicator size="large" color="#0000ff" />;

  useEffect(() => {
    if (transaction.id) {
      // console.log(transaction);
      setMode(parseFloat(transaction.amount) < 0 ? "minus" : "plus");
      setMaxAmount(Math.abs(parseFloat(transaction.amount)));
      setCurrentAmount(parseFloat(transaction.amount));

      setGroup({
        originalTransactionId: transaction.id,
        date: transaction.date,
        description: transaction.description,
        type: transaction.type,
        accountid: transaction.accountid,
        status: transaction.status,
        groupid: groupId,
        transactions: {
          [generateUuid()]: {
            amount: transaction.amount,
            categoryid: transaction.categoryid,
            notes: transaction.notes,
            tags: transaction.tags,
            groupid: groupId,
          },
        },
      });
    }
  }, [transaction]);

  const handleSubmit = async () => {
    setIsLoading(true);
    await submitAllMutation.mutateAsync({
      transactionsGroup: group,
      totalAmount: currentAmount * (mode === "minus" ? -1 : 1),
    }, 
    {
      onSuccess: () => {
        addNotification({
          message: `Transaction ${transaction.id ? "Updated" : "Created"} Successfully`,
          type: "success",
        });
        setIsLoading(false);
        router.replace("/Transactions");
      },
    },);
    
  };

  return (
    <View className={`m-auto mt-2 ${Platform.OS !== "web" ? "mx-2" : ""}`}>
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
          type={transaction.type}
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

            setMaxAmount(numericAmount);
          }}
          keyboardType="numeric"
        />
        <MyDateTimePicker
          label="Date"
          date={group.date}
          onChange={({ date }) => setGroup({ ...group, date })}
          isModal
        />
      </View>
      <View className="flex-row gap-2 justify-center w-full relative">
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
          isModal
          label="Account"
          selectedValue={group.accountid}
          onSelect={value => setGroup({ ...group, accountid: value?.id || "" })}
          options={
            accounts?.map(account => ({
              id: account.id,
              label: account.name,
              details: `${account.owner} | ${account.balance.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}`,
              value: account,
              passedItem: account,
              icon: account.icon,
              iconColorClass: `text-${account.iconColor?.replace("100", "500") ?? "gray-500"}`,
              group: account.category.name,
            })) ?? []
          }
          groupBy="group"
          // onSelect={(value: any) => {
          //   handleTextChange("accountid", value.id);
          //   setSourceAccount(value.value);
          // }}
        />

      </View>

      <TransactionsCreationList
        group={group}
        groupId={groupId}
        setGroup={setGroup}
        currentAmount={currentAmount}
        setCurrentAmount={setCurrentAmount}
        maxAmount={parseFloat(maxAmount)}
        categories={categories!}
        mode={mode}
      />
      <TransactionsFooter
        currentAmount={currentAmount}
        maxAmount={parseFloat(maxAmount)}
        mode={mode}
        onSubmit={handleSubmit}
      />
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
        maxAmount * globalMultiplier - currentAmount + Number.parseFloat(transaction.amount.toString()) + numericValue;

      // Adjust the numeric value based on remaining amount
      if (Math.abs(numericValue) > Math.abs(remainingAmount) && currentMode === mode) {
        numericValue = currentMultiplier * remainingAmount;
        numericValue = parseFloat(numericValue.toFixed(2));
      }

      // Update group and current amount
      setGroup(prev => {
        const prevAmount = Number.parseFloat(prev.transactions[id].amount.toString()) || 0;
        const difference = (numericValue - prevAmount).toFixed(2);
        // console.log("prev.transactions[id].amount", prev.transactions[id].amount);
        // console.log("numericValue", numericValue);
        // console.log("prevAmount", prevAmount);
        // console.log("difference", difference);

        // console.log("currentAmount Should be ", currentAmount + difference);
        setCurrentAmount(prev => prev + parseFloat(difference)); // Update current amount based on the difference

        return {
          ...prev,
          transactions: {
            ...prev.transactions,
            [id]: { ...prev.transactions[id], amount: numericValue },
          },
        };
      });
    } else {
      const sign = currentMultiplier === -1 ? "-" : "";
      setGroup(prev => {
        return {
          ...prev,
          transactions: {
            ...prev.transactions,
            [id]: { ...prev.transactions[id], amount: sign + value },
          },
        };
      });
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
          setGroup((prev: MultiTransactionGroup): MultiTransactionGroup => {
            const { [id]: _, ...rest } = prev.transactions;
            setCurrentAmount((prevAmount: number) => prevAmount - _.amount);
            return { ...prev, transactions: rest };
          });
        }}
      >
        <Text className="text-center text-white" selectable={false}>
          <Icon name="Trash" className="text-white" />
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
  const isDisabled = currentAmount !== maxAmount * (mode === "minus" ? -1 : 1);
  const globalMultiplier = mode === "minus" ? -1 : 1; // Global mode multiplier (positive or negative)
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex">
        <Text className="text-center text-foreground">Total: ${globalMultiplier * maxAmount ?? 0.0}</Text>
        <Text className="text-center text-foreground">Current Total: ${currentAmount.toFixed(2) ?? 0.0}</Text>
        <Text className="text-center text-foreground">
          Remaining: ${(globalMultiplier * maxAmount - currentAmount).toFixed(2) ?? 0.0}
        </Text>
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

export default memo(MultipleTransactions);
