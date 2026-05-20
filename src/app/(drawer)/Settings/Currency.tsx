import Button from "@/src/components/elements/Button";
import MyIcon from "@/src/components/elements/MyIcon";
import ThemedText from "@/src/components/elements/ThemedText";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";
import { CURRENCIES } from "@/src/utils/currency";
import { useState } from "react";
import { ActivityIndicator, ScrollView, TextInput, View } from "react-native";

export default function CurrencySettings() {
  const { primaryCurrency, setPrimaryCurrency, isSaving } = usePrimaryCurrency();
  const [query, setQuery] = useState("");
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  const filtered = CURRENCIES.filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
  });

  const handleSelect = async (code: string) => {
    if (code === primaryCurrency || isSaving) return;
    setPendingCode(code);
    try {
      await setPrimaryCurrency(code);
    } finally {
      setPendingCode(null);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View className="p-4 border-b border-muted">
        <TextInput
          placeholder="Search currency…"
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={setQuery}
          className="border border-input-border bg-input-bg rounded-md px-3 py-2 text-foreground"
          testID="input-currency-search"
        />
      </View>
      <ScrollView className="flex-1">
        {filtered.map((c) => {
          const isSelected = c.code === primaryCurrency;
          const isPending = pendingCode === c.code;
          return (
            <Button
              key={c.code}
              variant="ghost"
              size="lg"
              onPress={() => handleSelect(c.code)}
              className="flex-row items-center p-4 border-b border-muted active:bg-muted/50 rounded-none justify-start"
              testID={`btn-currency-${c.code}`}
            >
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                <ThemedText variant="label" className="text-sm">{c.symbol}</ThemedText>
              </View>
              <View className="ml-3 flex-1">
                <ThemedText variant="label">{c.code}</ThemedText>
                <ThemedText variant="caption" className="text-sm text-muted-foreground">{c.name}</ThemedText>
              </View>
              {isPending ? (
                <ActivityIndicator size="small" />
              ) : isSelected ? (
                <MyIcon name="Check" size={20} className="text-primary" />
              ) : null}
            </Button>
          );
        })}
        {filtered.length === 0 && (
          <View className="p-4 items-center">
            <ThemedText variant="caption">No matches.</ThemedText>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
