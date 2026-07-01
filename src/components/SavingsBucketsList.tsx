import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useSavingsBucketService } from "../services/SavingsBuckets.Service";
import { usePrimaryCurrency } from "../services/UserPreferences.Service";
import { SavingsBucket } from "../types/database/Tables.Types";
import { IconButton, ResponsiveModal } from "@/src/components/ui";
import MyIcon from "./elements/MyIcon";
import SavingsBucketForm, { initialBucketState } from "./forms/SavingsBucketForm";

interface SavingsBucketsListProps {
  accountId: string;
  accountBalance: number;
  compact?: boolean;
  buckets?: SavingsBucket[];
}

export default function SavingsBucketsList({
  accountId,
  accountBalance,
  compact = false,
  buckets: prefetchedBuckets,
}: SavingsBucketsListProps) {
  const bucketService = useSavingsBucketService();

  const { data: fetchedBuckets, isLoading } = bucketService.useFindByAccountId(
    prefetchedBuckets ? undefined : accountId,
  );
  const { mutate: allocate, isPending: isAllocating } = bucketService.useAllocate();
  const { mutate: deleteBucket } = bucketService.useSoftDelete();

  const buckets = prefetchedBuckets ?? fetchedBuckets;

  const [showForm, setShowForm] = useState(false);
  const [editBucket, setEditBucket] = useState<SavingsBucket | null>(null);
  const [allocatingBucketId, setAllocatingBucketId] = useState<string | null>(null);
  const [allocateAmount, setAllocateAmount] = useState("");
  const { formatCurrency } = usePrimaryCurrency();

  const totalAllocated = buckets?.reduce((sum, b) => sum + b.currentamount, 0) ?? 0;
  const unallocated = accountBalance - totalAllocated;
  const isOverAllocated = unallocated < 0;

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

  // Loading state (only when fetching, not when using prefetched)
  if (!prefetchedBuckets && isLoading) {
    return (
      <View className="p-4">
        <Text className="text-muted-foreground text-sm">Loading buckets...</Text>
      </View>
    );
  }

  // ─── Compact mode: lightweight inline view ───
  if (compact) {
    if (!buckets || buckets.length === 0) {
      return null; // Don't show anything inline if no buckets
    }

    return (
      <View className="px-5 pb-2 pt-1">
        {/* Unallocated summary */}
        <View className="flex-row items-center gap-1 mb-1">
          {isOverAllocated && <MyIcon name="AlertTriangle" size={12} className="text-warning" />}
          <Text className={`text-xs ${isOverAllocated ? "text-warning font-semibold" : "text-muted-foreground"}`}>
            Unallocated: {formatCurrency(unallocated, false)}
            {isOverAllocated && " (over-allocated)"}
          </Text>
        </View>

        {/* Compact bucket rows */}
        {buckets.map(bucket => (
          <View key={bucket.id} className="flex-row items-center py-1 gap-2 ml-2">
            <MyIcon name={bucket.icon || "PiggyBank"} size={14} className="text-muted-foreground" />
            <View className="flex-1">
              <Text className="text-xs font-medium text-foreground">{bucket.name}</Text>
              <View className="flex-row items-center gap-1">
                <Text className="text-xs text-muted-foreground">
                  {formatCurrency(bucket.currentamount, false)}
                  {bucket.targetamount > 0 && ` / ${formatCurrency(bucket.targetamount, false)}`}
                </Text>
              </View>
              {/* Mini progress bar */}
              {bucket.targetamount > 0 && (
                <View className="mt-0.5 h-1 bg-muted rounded-full overflow-hidden w-28">
                  <LinearGradient
                    colors={["#ef4444", "#f59e0b", "#10b981"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      width: `${getProgressPercent(bucket)}%`,
                      height: "100%",
                    }}
                  />
                </View>
              )}
            </View>

            {/* Inline allocate toggle */}
            <IconButton
              testID={`allocate-btn-compact-${bucket.id}`}
              icon="ArrowUpDown"
              variant="ghost"
              size="xs"
              accessibilityLabel="Allocate"
              onPress={() => {
                setAllocatingBucketId(allocatingBucketId === bucket.id ? null : bucket.id);
                setAllocateAmount(String(bucket.currentamount));
              }}
            />
          </View>
        ))}

        {/* Inline allocation editor (shared with compact bucket rows) */}
        {allocatingBucketId && (
          <View className="flex-row items-center gap-2 mt-1 ml-4">
            <TextInput
              className="flex-1 border border-border rounded-md px-2 py-1 text-sm text-foreground"
              value={allocateAmount}
              onChangeText={setAllocateAmount}
              keyboardType="numeric"
              placeholder="Amount"
              placeholderTextColor="#999"
              autoFocus
            />
            <IconButton
              testID={`save-allocate-compact-${allocatingBucketId}`}
              icon="Check"
              variant="ghost"
              size="xs"
              accessibilityLabel="Save allocation"
              onPress={() => handleAllocate(allocatingBucketId)}
              disabled={isAllocating}
            />
            <IconButton
              testID={`cancel-allocate-compact-${allocatingBucketId}`}
              icon="X"
              variant="ghost"
              size="xs"
              accessibilityLabel="Cancel allocation"
              onPress={() => {
                setAllocatingBucketId(null);
                setAllocateAmount("");
              }}
            />
          </View>
        )}
      </View>
    );
  }

  // ─── Full mode: header + add button + form modal ───
  return (
    <View className="mt-2">
      <View className="flex-row items-center justify-between px-4 py-2">
        <Text className="text-sm font-semibold text-foreground">Savings Buckets</Text>
        <IconButton
          testID="add-bucket-btn"
          icon="Plus"
          variant="ghost"
          size="sm"
          accessibilityLabel="Add bucket"
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
              Bucket allocations exceed the account balance by {formatCurrency(unallocated, false)}. Consider reducing
              bucket amounts to match the current balance.
            </Text>
          </View>
        </View>
      )}

      {/* Unallocated balance */}
      <View className="px-4 pb-2">
        <Text className={`text-xs ${isOverAllocated ? "text-warning font-semibold" : "text-muted-foreground"}`}>
          Unallocated: {formatCurrency(unallocated)}
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
                    {formatCurrency(bucket.currentamount)}
                    {bucket.targetamount > 0 && ` / ${formatCurrency(bucket.targetamount)}`}
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
              <IconButton
                testID={`allocate-btn-${bucket.id}`}
                icon="ArrowUpDown"
                variant="ghost"
                size="xs"
                accessibilityLabel="Allocate"
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
              <IconButton
                testID={`save-allocate-${bucket.id}`}
                icon="Check"
                variant="ghost"
                size="xs"
                accessibilityLabel="Save allocation"
                onPress={() => handleAllocate(bucket.id)}
                disabled={isAllocating}
              />
              <IconButton
                testID={`cancel-allocate-${bucket.id}`}
                icon="X"
                variant="ghost"
                size="xs"
                accessibilityLabel="Cancel allocation"
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
      {(() => {
        const handleClose = () => {
          setShowForm(false);
          setEditBucket(null);
        };
        const formContent = (
          <SavingsBucketForm
            bucket={editBucket ?? { ...initialBucketState, accountid: accountId }}
            accountId={accountId}
            onSuccess={handleClose}
            onCancel={handleClose}
          />
        );
        return (
          <ResponsiveModal
            visible={showForm}
            onClose={handleClose}
            title={editBucket ? "Edit Bucket" : "New Bucket"}
            size="lg"
            scrollable={false}
          >
            {formContent}
          </ResponsiveModal>
        );
      })()}
    </View>
  );
}
