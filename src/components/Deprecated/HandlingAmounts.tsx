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
  const [currentMode, setCurrentMode] = useState<"plus" | "minus">(transaction.amount < 0 ? "minus" : "plus");

  const globalMultiplier = mode === "minus" ? -1 : 1; // Global mode multiplier (positive or negative)

  const handleAmountChange = (value: string) => {
    if (!/^-?\d*\.?\d*$/.test(value)) {
      return; // Reject invalid numeric input
    }

    let numericValue = parseFloat(value || "0");

    // Update amount based on currentMode
    if (currentMode === "minus") {
      numericValue = Math.abs(numericValue) * -1; // Make it negative
    } else {
      numericValue = Math.abs(numericValue); // Make it positive
    }

    // Respect the global mode and ensure the maxAmount respects the global mode
    const remainingAmount = maxAmount * globalMultiplier - currentAmount;

    // Adjust the numeric value based on remaining amount
    if (numericValue > remainingAmount) {
      numericValue = remainingAmount;
    } else if (numericValue < -remainingAmount) {
      numericValue = -remainingAmount;
    }

    // Update group and current amount
    setGroup(prev => {
      const prevAmount = prev.transactions[id].amount || 0;
      const difference = numericValue - prevAmount;

      setCurrentAmount(prev => prev + difference); // Update current amount based on the difference

      return {
        ...prev,
        transactions: {
          ...prev.transactions,
          [id]: { ...prev.transactions[id], amount: numericValue },
        },
      };
    });
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
    <View className="flex-row gap-2 bg-card border border-muted items-center justify-between p-3 my-2">
      <TextInputFieldWithIcon
        className="flex-1"
        label="Amount"
        value={Math.abs(transaction.amount).toString()} // Always display absolute value
        onChange={value => handleAmountChange(value)}
        mode={currentMode}
        setMode={handleModeToggle} // Pass the mode toggle handler
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
        <Text className="text-center text-foreground" selectable={false}>
          Remove
        </Text>
      </Pressable>
    </View>
  );
};
