import { useTransactionItemService } from "@/src/services/TransactionItems.Service";
import { useTransactionService } from "@/src/services/Transactions.Service";
import { TableNames } from "@/src/types/database/TableNames";
import { Inserts, Transaction, TransactionCategory, TransactionsView } from "@/src/types/database/Tables.Types";
import { getAmountMode, roundToCents } from "@/src/utils/amount.helper";
import GenerateUuid from "@/src/utils/uuid.Helper";
import { useMemo, useRef, useState } from "react";
import { ScrollView, TextInput, useWindowDimensions, View } from "react-native";
import {
  Button,
  Dialog,
  GroupedInput,
  IconButton,
  MyCategoriesDropdown,
  Sheet,
  Text as ThemedText,
} from "@/src/components/ui";

type SplitChildInsert = Inserts<TableNames.Transactions>;

interface SplitTransactionModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  /** Called when the user dismisses without applying (Cancel, X, Escape, backdrop). */
  onClose: () => void;
  /** Called after a successful split, in addition to onClose. Use this to clear selection. */
  onSuccess?: () => void;
  transaction: TransactionsView;
  categories: TransactionCategory[];
}

const buildInitialSplits = (originalAmount: number, baseName: string | null | undefined): SplitChildInsert[] => {
  const isMinus = originalAmount <= 0;
  return [
    {
      id: GenerateUuid(),
      name: `${baseName ?? ""} (Part 1)`,
      amount: roundToCents(originalAmount),
      accountid: "",
      categoryid: "",
      date: new Date().toISOString(),
    },
    {
      id: GenerateUuid(),
      name: `${baseName ?? ""} (Part 2)`,
      amount: isMinus ? -0 : 0,
      accountid: "",
      categoryid: "",
      date: new Date().toISOString(),
    },
  ];
};

export default function SplitTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  transaction,
  categories,
}: SplitTransactionModalProps) {
  const { width } = useWindowDimensions();
  const useSheet = width < 768;
  const transactionService = useTransactionService();
  const splitMutation = transactionService.useSplitTransaction();
  const transactionItemService = useTransactionItemService();
  // The view is missing fields like notes/payee/tags/description – fetch the full row.
  const { data: fullTransaction } = transactionService.useFindById(transaction?.id ?? undefined);
  // Existing line items on the original transaction become the seed for the split children
  // — splitting a transaction that already has a breakdown should "promote" each item into
  // its own standalone transaction rather than orphaning the items on a voided parent.
  const { data: existingItems } = transactionItemService.useFindByTransactionId(transaction?.id ?? undefined);
  const source: Transaction | TransactionsView = (fullTransaction as Transaction | null) ?? transaction;

  const originalAmount = source?.amount ?? 0;
  const originalMode = getAmountMode(originalAmount);

  const initialSplits = useMemo(() => {
    if (!source) return [];
    if (existingItems && existingItems.length > 0) {
      const baseName = source.name ?? "";
      return existingItems.map(item => ({
        id: GenerateUuid(),
        name: item.name || baseName,
        amount: roundToCents(item.amount ?? 0),
        accountid: "",
        categoryid: item.categoryid || "",
        date: new Date().toISOString(),
      })) as SplitChildInsert[];
    }
    return buildInitialSplits(originalAmount, source.name);
  }, [source, originalAmount, existingItems]);

  const [splits, setSplits] = useState<SplitChildInsert[]>(initialSplits);
  const prevInitialSplitsRef = useRef(initialSplits);
  if (prevInitialSplitsRef.current !== initialSplits) {
    prevInitialSplitsRef.current = initialSplits;
    setSplits(initialSplits);
  }

  const splitsTotal = useMemo(() => roundToCents(splits.reduce((sum, item) => sum + (item.amount ?? 0), 0)), [splits]);

  const isBalanced = roundToCents(splitsTotal - originalAmount) === 0;

  const addSplit = () => {
    const remaining = roundToCents(originalAmount - splitsTotal);
    const initialAmount = remaining === 0 && originalMode === "minus" ? -0 : remaining;
    setSplits(prev => [
      ...prev,
      {
        id: GenerateUuid(),
        name: "",
        amount: initialAmount,
        accountid: "",
        categoryid: "",
        date: new Date().toISOString(),
      },
    ]);
  };

  const removeSplit = (index: number) => {
    setSplits(prev => prev.filter((_, i) => i !== index));
  };

  const updateSplit = <K extends keyof SplitChildInsert>(index: number, field: K, value: SplitChildInsert[K]) => {
    setSplits(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!source) return;

    const children: SplitChildInsert[] = splits.map(s => ({
      accountid: source.accountid!,
      amount: s.amount,
      categoryid: s.categoryid || source.categoryid!,
      date: source.date!,
      description: (source as Transaction).description ?? null,
      isvoid: false,
      name: s.name,
      notes: (source as Transaction).notes ?? null,
      payee: (source as Transaction).payee ?? null,
      tags: (source as Transaction).tags ?? null,
      type: source.type!,
    }));

    await splitMutation.mutateAsync({
      original: transaction,
      children,
    });

    onSuccess?.();
    onClose();
  };

  if (!transaction || !categories || !isOpen) return null;

  const content = (
    <View className="p-4">
        <View className="bg-card rounded-md p-3 mb-2 gap-2">
          <View className="flex-row justify-between items-center">
            <ThemedText variant="label" className="font-bold">
              Original Amount:
            </ThemedText>
            <ThemedText variant="body" className="font-bold text-lg">${Math.abs(originalAmount).toFixed(2)}</ThemedText>
          </View>
          <View className="flex-row justify-between items-center">
            <ThemedText variant="label" className="font-bold">
              Split Amount:
            </ThemedText>
            <ThemedText variant="body" className="font-bold text-lg">${Math.abs(splitsTotal).toFixed(2)}</ThemedText>
          </View>
        </View>

        <View className="flex-row items-center justify-between mb-3 px-1">
          <ThemedText className="text-xs">Split total: {Math.abs(splitsTotal).toFixed(2)}</ThemedText>
          <ThemedText className={`text-xs font-medium ${isBalanced ? "text-success-500" : "text-danger-500"}`}>
            {isBalanced ? "✓ Balanced" : `Remaining: ${roundToCents(originalAmount - splitsTotal).toFixed(2)}`}
          </ThemedText>
        </View>

        {/* The list scrolls; the action buttons stay pinned outside the scroll so they remain reachable. */}
        <ScrollView className="max-h-[420px]" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator>
          {splits.map((item, index) => (
            <View key={item.id ?? index} className="border border-border rounded-lg p-3 mb-2 bg-card">
              <View className="flex-row items-center justify-between mb-2">
                <ThemedText className="text-sm font-medium">Transaction {index + 1}</ThemedText>
                <IconButton variant="ghost" size="md" icon="X" onPress={() => removeSplit(index)} accessibilityLabel="Remove split" className="h-6 w-6" />
              </View>
              <View className="flex-row items-center gap-2 mb-2">
                <TextInput
                  className="border border-border rounded-md px-3 py-2 text-foreground bg-background flex-1"
                  placeholder="Name"
                  value={item.name ?? ""}
                  onChangeText={val => updateSplit(index, "name", val)}
                />
                <MyCategoriesDropdown
                  selectedValue={item.categoryid}
                  onSelect={cat => updateSplit(index, "categoryid", cat?.id ?? "")}
                  categories={categories}
                  isModal
                />
              </View>
              <GroupedInput
                amount={item.amount ?? 0}
                onChange={val => updateSplit(index, "amount", roundToCents(val))}
                showCalculator={false}
                inputTestID={`input-split-amount-${index}`}
              />
            </View>
          ))}

          <Button
            variant="secondary"
            size="sm"
            onPress={addSplit}
            leadingIcon="Plus"
            label="Add Split"
            className="mt-1 mb-4"
          />
        </ScrollView>

        <View className="flex-row justify-end gap-2 mt-4 z-0">
          <Button variant="outline" onPress={onClose} label="Cancel" />
          <Button
            variant="primary"
            onPress={handleSubmit}
            disabled={!isBalanced || splitMutation.isPending}
            loading={splitMutation.isPending}
            label="Apply Split"
          />
        </View>
      </View>
  );

  return useSheet ? (
    <Sheet visible={isOpen} onClose={onClose} title="Split Transaction" scrollable={false}>
      {content}
    </Sheet>
  ) : (
    <Dialog visible={isOpen} onClose={onClose} title="Split Transaction" size="lg" scrollable={false}>
      {content}
    </Dialog>
  );
}
