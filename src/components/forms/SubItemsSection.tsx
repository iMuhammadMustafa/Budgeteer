import { useCallback, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import GenerateUuid from "@/src/utils/uuid.Helper";
import MyIcon from "../elements/MyIcon";

export interface SubItem {
  id: string;
  name: string;
  amount: number;
  notes: string | null;
}

interface SubItemsSectionProps {
  items: SubItem[];
  onChange: (items: SubItem[]) => void;
  transactionAmount: number;
}

export default function SubItemsSection({ items, onChange, transactionAmount }: SubItemsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(items.length > 0);

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + (item.amount || 0), 0),
    [items],
  );

  const absTransactionAmount = Math.abs(transactionAmount || 0);
  const isBalanced = items.length === 0 || Math.abs(totalAmount - absTransactionAmount) < 0.01;
  const remaining = absTransactionAmount - totalAmount;

  const addItem = useCallback(() => {
    onChange([
      ...items,
      {
        id: GenerateUuid(),
        name: "",
        amount: Math.max(0, Math.round(remaining * 100) / 100),
        notes: null,
      },
    ]);
    if (!isExpanded) setIsExpanded(true);
  }, [items, onChange, remaining, isExpanded]);

  const removeItem = useCallback(
    (id: string) => {
      onChange(items.filter(item => item.id !== id));
    },
    [items, onChange],
  );

  const updateItem = useCallback(
    (id: string, field: keyof SubItem, value: string | number | null) => {
      onChange(items.map(item => (item.id === id ? { ...item, [field]: value } : item)));
    },
    [items, onChange],
  );

  return (
    <View className="mt-2">
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        className="flex-row items-center justify-between py-3 px-4 bg-surface-elevated rounded-t-lg border border-border-default"
      >
        <View className="flex-row items-center gap-2">
          <MyIcon name="List" size={16} className="text-foreground-muted" />
          <Text className="text-foreground font-medium text-sm">
            Sub-Items {items.length > 0 && `(${items.length})`}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          {items.length > 0 && !isBalanced && (
            <Text className="text-status-danger text-xs">
              {remaining > 0 ? `${remaining.toFixed(2)} remaining` : `${Math.abs(remaining).toFixed(2)} over`}
            </Text>
          )}
          <MyIcon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={16} className="text-foreground-muted" />
        </View>
      </Pressable>

      {isExpanded && (
        <View className="border border-t-0 border-border-default rounded-b-lg p-3 bg-surface">
          {items.map((item, index) => (
            <View key={item.id} className="mb-3 p-3 bg-surface-elevated rounded-lg border border-border-default">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-foreground-muted text-xs font-medium">Item {index + 1}</Text>
                <Pressable onPress={() => removeItem(item.id)} className="p-1">
                  <MyIcon name="X" size={14} className="text-status-danger" />
                </Pressable>
              </View>

              <View className="flex-row gap-2 mb-2">
                <View className="flex-1">
                  <Text className="text-foreground-muted text-xs mb-1">Name</Text>
                  <TextInput
                    value={item.name}
                    onChangeText={val => updateItem(item.id, "name", val)}
                    placeholder="Item name"
                    className="border border-border-default rounded-md px-3 py-2 text-foreground text-sm bg-surface"
                  />
                </View>
                <View className="w-28">
                  <Text className="text-foreground-muted text-xs mb-1">Amount</Text>
                  <TextInput
                    value={item.amount ? item.amount.toString() : ""}
                    onChangeText={val => {
                      const cleaned = val.replace(/[^0-9.]/g, "");
                      const num = parseFloat(cleaned);
                      updateItem(item.id, "amount", isNaN(num) ? 0 : Math.round(num * 100) / 100);
                    }}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    className="border border-border-default rounded-md px-3 py-2 text-foreground text-sm bg-surface"
                  />
                </View>
              </View>

              <View>
                <Text className="text-foreground-muted text-xs mb-1">Notes</Text>
                <TextInput
                  value={item.notes || ""}
                  onChangeText={val => updateItem(item.id, "notes", val || null)}
                  placeholder="Optional notes"
                  className="border border-border-default rounded-md px-3 py-2 text-foreground text-sm bg-surface"
                />
              </View>
            </View>
          ))}

          <Pressable
            onPress={addItem}
            className="flex-row items-center justify-center gap-2 py-2 px-4 border border-dashed border-border-default rounded-lg"
          >
            <MyIcon name="Plus" size={14} className="text-primary-500" />
            <Text className="text-primary-500 text-sm font-medium">Add Sub-Item</Text>
          </Pressable>

          {items.length > 0 && (
            <View className="mt-3 pt-3 border-t border-border-default flex-row justify-between items-center">
              <Text className="text-foreground-muted text-xs">
                Total: {totalAmount.toFixed(2)} / {absTransactionAmount.toFixed(2)}
              </Text>
              {isBalanced ? (
                <Text className="text-status-success text-xs font-medium">Balanced</Text>
              ) : (
                <Text className="text-status-danger text-xs font-medium">
                  {remaining > 0 ? `${remaining.toFixed(2)} remaining` : `${Math.abs(remaining).toFixed(2)} over`}
                </Text>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
