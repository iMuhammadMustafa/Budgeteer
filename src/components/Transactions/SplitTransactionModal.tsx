import { useTransactionService } from "@/src/services/Transactions.Service";
import { TableNames } from "@/src/types/database/TableNames";
import { Inserts, TransactionCategory, TransactionsView } from "@/src/types/database/Tables.Types";
import GenerateUuid from "@/src/utils/uuid.Helper";
import { useEffect, useMemo, useState } from "react";
import { Platform, TextInput, View } from "react-native";
import Button from "../elements/Button";
import { MyCategoriesDropdown } from "../elements/dropdown/DropdownField";
import ModeIcon from "../elements/ModeIcon";
import MyIcon from "../elements/MyIcon";
import MyModal from "../elements/MyModal";
import ThemedText from "../elements/ThemedText";
import { initialTransactionState } from "../forms/TransactionForm";

export default function SplitTransactionModal({
  isOpen,
  setIsOpen,
  onClose,
  transaction,
  categories,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onClose: () => void;
  transaction: TransactionsView;
  categories: TransactionCategory[];
}) {
  const transactionService = useTransactionService();
  const splitMutation = transactionService.useSplitTransaction();

  const initalSplits = useMemo(() => {
    if (!transaction) return [];
    return [
      { ...initialTransactionState, name: `${transaction?.name} (Part 1)`, amount: transaction?.amount ?? 0 },
      {
        ...initialTransactionState,
        name: `${transaction?.name} (Part 2)`,
        amount: (transaction?.amount ?? 0) <= 0 ? -0 : 0,
      },
    ];
  }, [transaction]);

  const [splits, setSplits] = useState<Inserts<TableNames.Transactions>[]>(initalSplits);

  const splitsTotal = useMemo(() => {
    return splits.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  }, [splits]);

  const originalAmount = transaction?.amount ?? 0;
  const originalMode = originalAmount <= 0 ? "minus" : "plus";
  const isBalanced = Math.abs(splitsTotal - originalAmount) === 0;

  const addSplit = () => {
    const remaining = originalAmount - splitsTotal;
    const initialAmount = remaining === 0 && originalMode === "minus" ? -0 : remaining;
    setSplits(prev => [...prev, { ...initialTransactionState, id: GenerateUuid(), name: "", amount: initialAmount }]);
  };

  const removeSplit = (index: number) => {
    setSplits(prev => prev.filter((_, i) => i !== index));
  };

  const updateSplit = (index: number, field: string, value: any) => {
    setSplits(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!transaction) return;

    // Convert splits to transactions
    const children = splits.map(s => {
      return {
        accountid: transaction.accountid!,
        amount: s.amount,
        categoryid: s.categoryid || transaction.categoryid!,
        date: transaction.date!,
        description: "",
        groupid: transaction.groupid!,
        isvoid: false,
        name: s.name,
        notes: "transaction.notes",
        payee: "transaction.payee",
        tags: "transaction.tags",
        type: transaction.type!,
      };
    });

    await splitMutation.mutateAsync({
      original: transaction,
      children: children,
    });

    onClose();
  };

  useEffect(() => {
    if (transaction) {
      setSplits(initalSplits);
    }
  }, [transaction, initalSplits]);

  if (!transaction || !categories || !isOpen) return null;

  return (
    <MyModal isOpen={isOpen} setIsOpen={setIsOpen} onClose={onClose} title="Split Transaction">
      <View className="p-4">
        <View className="bg-card rounded-md p-3 mb-2 gap-2">
          <View className="flex-row justify-between items-center">
            <ThemedText variant="label" className="font-bold">
              Original Amount:
            </ThemedText>
            <ThemedText className="font-bold text-lg">${Math.abs(originalAmount).toFixed(2)}</ThemedText>
          </View>
          <View className="flex-row justify-between items-center">
            <ThemedText variant="label" className="font-bold">
              Split Amount:
            </ThemedText>
            <ThemedText className="font-bold text-lg">${Math.abs(splitsTotal).toFixed(2)}</ThemedText>
          </View>
        </View>

        <View className="flex-row items-center justify-between mb-3 px-1">
          <ThemedText className="text-xs">Split total: {Math.abs(splitsTotal).toFixed(2)}</ThemedText>
          <ThemedText className={`text-xs font-medium ${isBalanced ? "text-success-500" : "text-danger-500"}`}>
            {isBalanced ? "✓ Balanced" : `Remaining: ${Math.abs(originalAmount - splitsTotal).toFixed(2)}`}
          </ThemedText>
        </View>

        {splits.map((item, index) => (
          <View key={item.id ?? index} className="border border-border rounded-lg p-3 mb-2 bg-card">
            <View className="flex-row items-center justify-between mb-2">
              <ThemedText className="text-sm font-medium">Transaction {index + 1}</ThemedText>
              <Button variant="ghost" size="icon" onPress={() => removeSplit(index)} className="m-0 p-0 h-6 w-6">
                <MyIcon name="X" size={14} className="text-danger-500" />
              </Button>
            </View>
            <View className="flex-row items-center justify-center gap-2">
              <TextInput
                className="border border-border rounded-md px-3 py-2 text-foreground bg-background flex-1"
                placeholder="Name"
                value={item.name ?? ""}
                onChangeText={val => updateSplit(index, "name", val)}
              />
              <View className="mt-2 z-50 flex-1">
                <MyCategoriesDropdown
                  label=""
                  selectedValue={item.categoryid}
                  onSelect={cat => updateSplit(index, "categoryid", cat?.id || null)}
                  categories={categories}
                  isModal={true}
                />
              </View>
            </View>
            <View className={`${Platform.OS === "web" ? "flex flex-row gap-2 items-center" : "gap-2"}`}>
              <View className="flex-row items-center gap-2 flex-1">
                <ModeIcon
                  onPress={() => updateSplit(index, "amount", -(item.amount ?? 0))}
                  mode={(item.amount ?? 0) < 0 || Object.is(item.amount, -0) ? "minus" : "plus"}
                />
                <TextInput
                  placeholder="Amount"
                  value={item.amount || Object.is(item.amount, -0) ? String(Math.abs(item.amount ?? 0)) : ""}
                  onChangeText={val => {
                    let cleanValue = val
                      .replace(/[^0-9.]/g, "")
                      .replace(/\.{2,}/g, ".")
                      .replace(/^0+(?=\d)/, "");
                    if (cleanValue.includes(".")) {
                      const parts = cleanValue.split(".");
                      if (parts[1] && parts[1].length > 2) {
                        cleanValue = parts[0] + "." + parts[1].substring(0, 2);
                      }
                    }
                    const parsed = parseFloat(cleanValue) || 0;
                    const isMinus = (item.amount ?? 0) < 0 || Object.is(item.amount, -0);
                    updateSplit(index, "amount", isMinus ? -parsed : parsed);
                  }}
                  keyboardType="decimal-pad"
                  className="border border-border rounded-md px-3 py-2 text-foreground bg-background flex-1"
                />
              </View>
            </View>
          </View>
        ))}

        <Button
          variant="secondary"
          size="sm"
          onPress={addSplit}
          leftIcon="Plus"
          label="Add Split"
          className="mt-1 mb-4"
        />

        <View className="flex-row justify-end gap-2 mt-4 z-0">
          <Button variant="outline" onPress={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onPress={handleSubmit}
            disabled={!isBalanced || splitMutation.isPending}
            loading={splitMutation.isPending}
          >
            Apply Split
          </Button>
        </View>
      </View>
    </MyModal>
  );
}
