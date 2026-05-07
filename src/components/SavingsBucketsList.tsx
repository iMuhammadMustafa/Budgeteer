import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useSavingsBucketService } from "../services/SavingsBuckets.Service";
import { SavingsBucket } from "../types/database/Tables.Types";
import SavingsBucketForm, { initialBucketState } from "./forms/SavingsBucketForm";
import Button from "./elements/Button";
import MyIcon from "./elements/MyIcon";
import MyModal from "./elements/MyModal";

interface SavingsBucketsListProps {
  accountId: string;
  accountBalance: number;
}

export default function SavingsBucketsList({ accountId, accountBalance }: SavingsBucketsListProps) {
  const bucketService = useSavingsBucketService();
  const { data: buckets, isLoading } = bucketService.useFindByAccountId(accountId);
  const { data: totalAllocated } = bucketService.useGetTotalAllocated(accountId);
  const { mutate: allocate, isPending: isAllocating } = bucketService.useAllocate();
  const { mutate: deleteBucket } = bucketService.useSoftDelete();

  const [showForm, setShowForm] = useState(false);
  const [editBucket, setEditBucket] = useState<SavingsBucket | null>(null);
  const [allocatingBucketId, setAllocatingBucketId] = useState<string | null>(null);
  const [allocateAmount, setAllocateAmount] = useState("");

  const unallocated = accountBalance - (totalAllocated ?? 0);

  const handleAllocate = (bucketId: string) => {
    const amount = Number(allocateAmount);
    if (isNaN(amount) || amount < 0) return;

    allocate(
      { bucketId, amount, accountBalance },
      {
        onSuccess: () => {
          setAllocatingBucketId(null);
          setAllocateAmount("");
        },
        onError: error => {
          console.error("Allocation error:", error.message);
        },
      },
    );
  };

  const getProgressPercent = (bucket: SavingsBucket) => {
    if (!bucket.targetamount || bucket.targetamount === 0) return 0;
    return Math.min((bucket.currentamount / bucket.targetamount) * 100, 100);
  };

  if (isLoading) {
    return (
      <View className="p-4">
        <Text className="text-muted-foreground text-sm">Loading buckets...</Text>
      </View>
    );
  }

  const isOverAllocated = unallocated < 0;

  return (
    <View className="mt-2">
      <View className="flex-row items-center justify-between px-4 py-2">
        <Text className="text-sm font-semibold text-foreground">Savings Buckets</Text>
        <Button
          testID="add-bucket-btn"
          rightIcon="Plus"
          variant="ghost"
          className="py-0 px-1"
          onPress={() => {
            setEditBucket(null);
            setShowForm(true);
          }}
        />
      </View>

      {/* Over-allocation warning */}
      {isOverAllocated && (
        <View className="mx-4 mb-2 p-2 bg-warning/10 border border-warning/30 rounded-md flex-row items-start gap-2">
          <MyIcon name="AlertTriangle" size={16} className="text-warning mt-0.5" />
          <View className="flex-1">
            <Text className="text-xs font-semibold text-warning">Over-Allocated</Text>
            <Text className="text-xs text-warning/80">
              Bucket allocations exceed the account balance by{" "}
              {Math.abs(unallocated).toLocaleString("en-US", { style: "currency", currency: "USD" })}.
              Consider reducing bucket amounts to match the current balance.
            </Text>
          </View>
        </View>
      )}

      {/* Unallocated balance */}
      <View className="px-4 pb-2">
        <Text className={`text-xs ${isOverAllocated ? "text-warning font-semibold" : "text-muted-foreground"}`}>
          Unallocated: {unallocated.toLocaleString("en-US", { style: "currency", currency: "USD" })}
          {isOverAllocated && " ⚠️"}
        </Text>
      </View>

      {(!buckets || buckets.length === 0) && (
        <View className="px-4 pb-2">
          <Text className="text-xs text-muted-foreground italic">No buckets yet. Tap + to create one.</Text>
        </View>
      )}

      {buckets?.map(bucket => (
        <View key={bucket.id} className="px-4 py-2 border-t border-border">
          <Pressable
            onPress={() => {
              setEditBucket(bucket);
              setShowForm(true);
            }}
            className="flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1 gap-2">
              <MyIcon name={bucket.icon} size={18} className="text-muted-foreground" />
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">{bucket.name}</Text>
                <View className="flex-row items-center gap-1">
                  <Text className="text-xs text-muted-foreground">
                    {bucket.currentamount.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                    {bucket.targetamount > 0 &&
                      ` / ${bucket.targetamount.toLocaleString("en-US", { style: "currency", currency: "USD" })}`}
                  </Text>
                </View>
                {/* Progress bar */}
                {bucket.targetamount > 0 && (
                  <View className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <View
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${getProgressPercent(bucket)}%` }}
                    />
                  </View>
                )}
              </View>
            </View>

            <View className="flex-row items-center gap-1">
              <Button
                testID={`allocate-btn-${bucket.id}`}
                rightIcon="ArrowUpDown"
                variant="ghost"
                className="py-0 px-1"
                onPress={() => {
                  setAllocatingBucketId(allocatingBucketId === bucket.id ? null : bucket.id);
                  setAllocateAmount(String(bucket.currentamount));
                }}
              />
            </View>
          </Pressable>

          {/* Inline allocation editor */}
          {allocatingBucketId === bucket.id && (
            <View className="flex-row items-center gap-2 mt-2 pl-7">
              <TextInput
                className="flex-1 border border-border rounded-md px-2 py-1 text-sm text-foreground"
                value={allocateAmount}
                onChangeText={setAllocateAmount}
                keyboardType="numeric"
                placeholder="Amount"
                placeholderTextColor="#999"
              />
              <Button
                testID={`save-allocate-${bucket.id}`}
                rightIcon="Check"
                variant="ghost"
                className="py-0 px-1"
                onPress={() => handleAllocate(bucket.id)}
                disabled={isAllocating}
              />
              <Button
                testID={`cancel-allocate-${bucket.id}`}
                rightIcon="X"
                variant="ghost"
                className="py-0 px-1"
                onPress={() => {
                  setAllocatingBucketId(null);
                  setAllocateAmount("");
                }}
              />
            </View>
          )}
        </View>
      ))}

      {/* Add/Edit Bucket Modal */}
      {showForm && (
        <MyModal
          isOpen={showForm}
          setIsOpen={(open: boolean) => {
            setShowForm(open);
            if (!open) setEditBucket(null);
          }}
          onClose={() => {
            setShowForm(false);
            setEditBucket(null);
          }}
          title={editBucket ? "Edit Bucket" : "New Bucket"}
        >
          <SavingsBucketForm
            bucket={editBucket ?? { ...initialBucketState, accountid: accountId }}
            accountId={accountId}
            onSuccess={() => {
              setShowForm(false);
              setEditBucket(null);
            }}
            onCancel={() => {
              setShowForm(false);
              setEditBucket(null);
            }}
          />
        </MyModal>
      )}
    </View>
  );
}
