import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useAccountService } from "../services/Accounts.Service";
import { useSavingsBucketService } from "../services/SavingsBuckets.Service";
import { Account, SavingsBucket } from "../types/database/Tables.Types";
import Button from "./elements/Button";
import MyIcon from "./elements/MyIcon";

export default function BucketingSection() {
  const accountService = useAccountService();
  const bucketService = useSavingsBucketService();
  const { data: accounts } = accountService.useFindAllWithCategory();
  const { data: bucketsByAccountId } = bucketService.useFindAllGroupedByAccount();
  const { mutate: allocate, isPending: isAllocating } = bucketService.useAllocate();

  const [expanded, setExpanded] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Only show accounts that have at least one bucket
  const accountsWithBuckets = useMemo(() => {
    if (!accounts) return [];
    return accounts.filter(a => !a.isdeleted && bucketsByAccountId && bucketsByAccountId[a.id]?.length > 0);
  }, [accounts, bucketsByAccountId]);

  // Auto-select first account if none selected
  const selectedAccount = accounts?.find(a => a.id === selectedAccountId)
    ?? (accountsWithBuckets.length > 0 ? accountsWithBuckets[0] : null);

  // Don't render at all if no accounts have buckets
  if (accountsWithBuckets.length === 0) {
    return null;
  }

  return (
    <View className="bg-card border border-border rounded-lg">
      <Pressable
        onPress={() => setExpanded(!expanded)}
        className="flex-row items-center justify-between p-3"
      >
        <View className="flex-row items-center gap-2">
          <MyIcon name="PiggyBank" size={18} className="text-primary" />
          <Text className="text-sm font-semibold text-foreground">Savings Buckets</Text>
          <Text className="text-xs text-muted-foreground">
            ({accountsWithBuckets.length} {accountsWithBuckets.length === 1 ? "account" : "accounts"})
          </Text>
        </View>
        <MyIcon
          name={expanded ? "ChevronUp" : "ChevronDown"}
          size={16}
          className="text-muted-foreground"
        />
      </Pressable>

      {expanded && (
        <View className="px-3 pb-3 border-t border-border">
          {/* Account chips — only accounts with buckets */}
          {accountsWithBuckets.length > 1 && (
            <View className="flex-row flex-wrap gap-1.5 mt-2 mb-2">
              {accountsWithBuckets.map(account => (
                <Pressable
                  key={account.id}
                  onPress={() => setSelectedAccountId(account.id)}
                  className={`px-2.5 py-1 rounded-full border ${selectedAccount?.id === account.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background"
                    }`}
                >
                  <Text
                    className={`text-xs ${selectedAccount?.id === account.id ? "text-primary font-semibold" : "text-foreground"
                      }`}
                  >
                    {account.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Buckets for selected account */}
          {selectedAccount && (
            <AccountBucketsAllocator
              account={selectedAccount}
              buckets={bucketsByAccountId?.[selectedAccount.id] || []}
              allocate={allocate}
              isAllocating={isAllocating}
            />
          )}
        </View>
      )}
    </View>
  );
}

function AccountBucketsAllocator({
  account,
  buckets,
  allocate,
  isAllocating,
}: {
  account: Account;
  buckets: SavingsBucket[];
  allocate: (
    vars: { bucketId: string; amount: number; accountBalance: number },
    opts?: { onSuccess?: () => void; onError?: (error: Error) => void },
  ) => void;
  isAllocating: boolean;
}) {
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const totalAllocated = buckets.reduce((sum, b) => sum + b.currentamount, 0);
  const unallocated = account.balance - totalAllocated;
  const isOverAllocated = unallocated < 0;

  const handleAllocateAll = () => {
    setError(null);
    for (const bucket of buckets) {
      const newAmount = amounts[bucket.id];
      if (newAmount !== undefined && newAmount !== String(bucket.currentamount)) {
        const amount = Number(newAmount);
        if (isNaN(amount) || amount < 0) continue;
        allocate(
          { bucketId: bucket.id, amount, accountBalance: account.balance },
          {
            onError: (err: Error) => setError(err.message),
          },
        );
      }
    }
  };

  return (
    <View>
      {/* Over-allocation warning */}
      {isOverAllocated && (
        <View className="mb-2 p-2 bg-warning/10 border border-warning/30 rounded-md flex-row items-start gap-2">
          <MyIcon name="AlertTriangle" size={14} className="text-warning mt-0.5" />
          <View className="flex-1">
            <Text className="text-xs font-semibold text-warning">Over-Allocated</Text>
            <Text className="text-xs text-warning/80">
              Buckets exceed account balance by{" "}
              {Math.abs(unallocated).toLocaleString("en-US", { style: "currency", currency: "USD" })}.
            </Text>
          </View>
        </View>
      )}

      {/* Balance summary */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className={`text-xs ${isOverAllocated ? "text-warning font-semibold" : "text-muted-foreground"}`}>
          Balance: {account.balance.toLocaleString("en-US", { style: "currency", currency: "USD" })}
          {" · "}Unallocated: {unallocated.toLocaleString("en-US", { style: "currency", currency: "USD" })}
        </Text>
      </View>

      {/* Bucket allocation rows */}
      {buckets.map(bucket => (
        <View key={bucket.id} className="flex-row items-center gap-2 mb-1.5">
          <MyIcon name={bucket.icon || "PiggyBank"} size={14} className="text-muted-foreground" />
          <Text className="text-xs text-foreground flex-1" numberOfLines={1}>{bucket.name}</Text>
          <TextInput
            className="border border-border rounded-md px-2 py-0.5 text-xs text-foreground w-20 text-right"
            value={amounts[bucket.id] ?? String(bucket.currentamount)}
            onChangeText={val => setAmounts(prev => ({ ...prev, [bucket.id]: val }))}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor="#999"
          />
        </View>
      ))}

      {error && <Text className="text-xs text-destructive mb-1">{error}</Text>}

      <Button
        testID="apply-bucketing-btn"
        label={isAllocating ? "Applying..." : "Apply"}
        onPress={handleAllocateAll}
        disabled={isAllocating}
        size="sm"
        className="mt-1.5"
      />
    </View>
  );
}
