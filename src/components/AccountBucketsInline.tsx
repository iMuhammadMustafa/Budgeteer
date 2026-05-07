import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SavingsBucket } from "../types/database/Tables.Types";
import Button from "./elements/Button";
import MyIcon from "./elements/MyIcon";
import MyModal from "./elements/MyModal";

interface AccountBucketsInlineProps {
  buckets: SavingsBucket[];
  accountBalance: number;
  onAllocate: (bucketId: string, amount: number, accountBalance: number) => void;
  isAllocating: boolean;
}

export default function AccountBucketsInline({
  buckets,
  accountBalance,
  onAllocate,
  isAllocating,
}: AccountBucketsInlineProps) {
  const [fundModal, setFundModal] = useState<{ open: boolean; bucket: SavingsBucket | null }>({
    open: false,
    bucket: null,
  });
  const [fundAmount, setFundAmount] = useState("");

  const totalAllocated = buckets.reduce((sum, b) => sum + b.currentamount, 0);
  const unallocated = accountBalance - totalAllocated;
  const isOverAllocated = totalAllocated > accountBalance;

  const getProgressPercent = (bucket: SavingsBucket) => {
    if (!bucket.targetamount || bucket.targetamount === 0) return 0;
    return Math.min((bucket.currentamount / bucket.targetamount) * 100, 100);
  };

  const handleFundSubmit = () => {
    if (!fundModal.bucket || !fundAmount) return;
    const amount = Number(fundAmount);
    if (isNaN(amount) || amount < 0) return;
    onAllocate(fundModal.bucket.id, amount, accountBalance);
    setFundModal({ open: false, bucket: null });
    setFundAmount("");
  };

  if (buckets.length === 0) {
    return (
      <View className="ml-12 py-1">
        <Text className="text-xs text-muted-foreground italic">No buckets</Text>
      </View>
    );
  }

  return (
    <View className="ml-8 border-l-2 border-border pl-3 py-1">
      {/* Unallocated summary */}
      <View className="flex-row items-center gap-1 mb-1">
        {isOverAllocated && <MyIcon name="AlertTriangle" size={12} className="text-warning" />}
        <Text className={`text-xs ${isOverAllocated ? "text-warning font-semibold" : "text-muted-foreground"}`}>
          Unallocated: {unallocated.toLocaleString("en-US", { style: "currency", currency: "USD" })}
          {isOverAllocated && " (over-allocated!)"}
        </Text>
      </View>

      {/* Bucket rows */}
      {buckets.map(bucket => (
        <View key={bucket.id} className="flex-row items-center py-1 gap-2">
          {/* Tree connector */}
          <Text className="text-muted-foreground text-xs">└</Text>

          {/* Bucket icon */}
          <MyIcon name={bucket.icon || "PiggyBank"} size={14} className="text-muted-foreground" />

          {/* Bucket info */}
          <View className="flex-1">
            <Text className="text-xs font-medium text-foreground">{bucket.name}</Text>
            <View className="flex-row items-center gap-1">
              <Text className="text-xs text-muted-foreground">
                {bucket.currentamount.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                {bucket.targetamount > 0 &&
                  ` / ${bucket.targetamount.toLocaleString("en-US", { style: "currency", currency: "USD" })}`}
              </Text>
            </View>
            {/* Mini progress bar */}
            {bucket.targetamount > 0 && (
              <View className="mt-0.5 h-1 bg-muted rounded-full overflow-hidden w-24">
                <View
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${getProgressPercent(bucket)}%` }}
                />
              </View>
            )}
          </View>

          {/* Fund bucket button */}
          <Button
            testID={`fund-bucket-btn-${bucket.id}`}
            rightIcon="ArrowUpDown"
            variant="ghost"
            className="py-0 px-1"
            iconSize={14}
            onPress={() => {
              setFundModal({ open: true, bucket });
              setFundAmount(String(bucket.currentamount));
            }}
          />
        </View>
      ))}

      {/* Fund Bucket Modal */}
      {fundModal.open && fundModal.bucket && (
        <MyModal
          isOpen={fundModal.open}
          setIsOpen={(open: boolean) => setFundModal({ open, bucket: open ? fundModal.bucket : null })}
          onClose={() => {
            setFundModal({ open: false, bucket: null });
            setFundAmount("");
          }}
        >
          <View className="p-4">
            <Text className="text-lg font-bold mb-1 text-foreground">
              Fund: {fundModal.bucket.name}
            </Text>
            <Text className="text-sm text-muted-foreground mb-3">
              Current: {fundModal.bucket.currentamount.toLocaleString("en-US", { style: "currency", currency: "USD" })}
              {fundModal.bucket.targetamount > 0 &&
                ` · Target: ${fundModal.bucket.targetamount.toLocaleString("en-US", { style: "currency", currency: "USD" })}`}
            </Text>
            <Text className="text-xs text-muted-foreground mb-3">
              Available (unallocated): {unallocated.toLocaleString("en-US", { style: "currency", currency: "USD" })}
            </Text>

            <Text className="text-sm font-medium text-foreground mb-1">New Allocation Amount</Text>
            <TextInput
              testID="fund-bucket-amount-input"
              className="border border-input-border bg-input-bg rounded-md p-2 text-base text-foreground mb-3"
              keyboardType="numeric"
              value={fundAmount}
              onChangeText={setFundAmount}
              placeholder="Amount"
              placeholderTextColor="#999"
              autoFocus
            />

            <View className="flex-row gap-3">
              <Pressable
                className="flex-1 p-3 rounded-md items-center bg-secondary"
                onPress={() => {
                  setFundModal({ open: false, bucket: null });
                  setFundAmount("");
                }}
              >
                <Text className="font-bold text-white">Cancel</Text>
              </Pressable>
              <Pressable
                className="flex-1 p-3 rounded-md items-center bg-primary"
                onPress={handleFundSubmit}
                disabled={!fundAmount || isNaN(Number(fundAmount)) || Number(fundAmount) < 0 || isAllocating}
              >
                <Text className="font-bold text-white">
                  {isAllocating ? "Saving..." : "Apply"}
                </Text>
              </Pressable>
            </View>
          </View>
        </MyModal>
      )}
    </View>
  );
}
