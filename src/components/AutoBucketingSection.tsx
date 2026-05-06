import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useAccountService } from "../services/Accounts.Service";
import { useSavingsBucketService } from "../services/SavingsBuckets.Service";
import { Account, SavingsBucket } from "../types/database/Tables.Types";
import Button from "./elements/Button";
import MyIcon from "./elements/MyIcon";
import MyModal from "./elements/MyModal";

export default function AutoBucketingSection() {
  const accountService = useAccountService();
  const bucketService = useSavingsBucketService();
  const { data: accounts } = accountService.useFindAllWithCategory();
  const { mutate: allocate, isPending: isAllocating } = bucketService.useAllocate();

  const [expanded, setExpanded] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const selectedAccount = accounts?.find(a => a.id === selectedAccountId);

  return (
    <View className="bg-card border border-border rounded-lg mx-4 mb-4">
      <Pressable
        onPress={() => setExpanded(!expanded)}
        className="flex-row items-center justify-between p-4"
      >
        <View className="flex-row items-center gap-2">
          <MyIcon name="PiggyBank" size={20} className="text-primary" />
          <Text className="text-md font-semibold text-foreground">Auto-Bucketing</Text>
        </View>
        <MyIcon
          name={expanded ? "ChevronUp" : "ChevronDown"}
          size={18}
          className="text-muted-foreground"
        />
      </Pressable>

      {expanded && (
        <View className="px-4 pb-4">
          <Text className="text-xs text-muted-foreground mb-3">
            Quickly allocate funds to your savings buckets from an account.
          </Text>

          {/* Account Picker */}
          <Text className="text-sm font-medium text-foreground mb-1">Select Account</Text>
          <View className="flex-row flex-wrap gap-2 mb-3">
            {accounts
              ?.filter(a => !a.isdeleted)
              .map(account => (
                <Pressable
                  key={account.id}
                  onPress={() => setSelectedAccountId(account.id)}
                  className={`px-3 py-1.5 rounded-full border ${
                    selectedAccountId === account.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background"
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      selectedAccountId === account.id ? "text-primary font-semibold" : "text-foreground"
                    }`}
                  >
                    {account.name}
                  </Text>
                </Pressable>
              ))}
          </View>

          {/* Buckets for selected account */}
          {selectedAccount && (
            <AccountBucketsAllocator
              account={selectedAccount}
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
  allocate,
  isAllocating,
}: {
  account: Account;
  allocate: (
    vars: { bucketId: string; amount: number; accountBalance: number },
    opts?: { onSuccess?: () => void; onError?: (error: Error) => void },
  ) => void;
  isAllocating: boolean;
}) {
  const bucketService = useSavingsBucketService();
  const { data: buckets, isLoading } = bucketService.useFindByAccountId(account.id);
  const { data: totalAllocated } = bucketService.useGetTotalAllocated(account.id);

  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const unallocated = account.balance - (totalAllocated ?? 0);

  const handleAllocateAll = () => {
    setError(null);
    if (!buckets) return;

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

  if (isLoading) {
    return <Text className="text-xs text-muted-foreground">Loading buckets...</Text>;
  }

  if (!buckets || buckets.length === 0) {
    return (
      <Text className="text-xs text-muted-foreground italic">
        No buckets for this account. Create buckets from the Accounts page first.
      </Text>
    );
  }

  return (
    <View>
      <Text className="text-xs text-muted-foreground mb-2">
        Account Balance: {account.balance.toLocaleString("en-US", { style: "currency", currency: "USD" })}
        {" · "}Unallocated: {unallocated.toLocaleString("en-US", { style: "currency", currency: "USD" })}
      </Text>

      {buckets.map(bucket => (
        <View key={bucket.id} className="flex-row items-center gap-2 mb-2">
          <MyIcon name={bucket.icon} size={16} className="text-muted-foreground" />
          <Text className="text-sm text-foreground flex-1">{bucket.name}</Text>
          <TextInput
            className="border border-border rounded-md px-2 py-1 text-sm text-foreground w-24 text-right"
            value={amounts[bucket.id] ?? String(bucket.currentamount)}
            onChangeText={val => setAmounts(prev => ({ ...prev, [bucket.id]: val }))}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor="#999"
          />
        </View>
      ))}

      {error && <Text className="text-xs text-destructive mb-2">{error}</Text>}

      <Button
        testID="apply-bucketing-btn"
        label={isAllocating ? "Applying..." : "Apply Allocations"}
        onPress={handleAllocateAll}
        disabled={isAllocating}
        className="mt-2"
      />
    </View>
  );
}
