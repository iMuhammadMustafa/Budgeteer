import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";

import { useTheme } from "@/src/providers/ThemeProvider";
import { CURRENCIES } from "@/src/utils/currency";
import { Input, ListRow, Text as ThemedText } from "@/src/components/ui";
import PageLayout from "@/src/components/ui/pages/PageLayout";
import MyIcon from "@/src/components/elements/MyIcon";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";

export default function CurrencySettings() {
  const { primaryCurrency, setPrimaryCurrency, isSaving } = usePrimaryCurrency();
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  const filtered = CURRENCIES.filter(c => {
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
    <PageLayout title="Currency" subtitle="Choose your primary currency" backHref="/Settings">
      <Input
        iconName="Search"
        placeholder="Search currency…"
        value={query}
        onChangeText={setQuery}
        testID="input-currency-search"
      />
      {filtered.map(c => {
        const isSelected = c.code === primaryCurrency;
        const isPending = pendingCode === c.code;
        return (
          <Pressable
            key={c.code}
            onPress={() => handleSelect(c.code)}
            className="flex-row items-center rounded-xl border border-border bg-surface px-[15px] py-[13px] active:opacity-90"
            testID={`btn-currency-${c.code}`}
          >
            <View
              className="h-[42px] w-[42px] items-center justify-center rounded-full"
              style={{ backgroundColor: colors.primarySoft }}
            >
              <ThemedText variant="label" style={{ color: colors.primary }}>
                {c.symbol}
              </ThemedText>
            </View>
            <View className="ml-[13px] flex-1">
              <ThemedText variant="label">{c.code}</ThemedText>
              <ThemedText variant="caption" className="text-ink-mute">
                {c.name}
              </ThemedText>
            </View>
            {isPending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : isSelected ? (
              <MyIcon name="Check" size={20} color={colors.primary} />
            ) : null}
          </Pressable>
        );
      })}
      {filtered.length === 0 && (
        <View className="items-center p-4">
          <ThemedText variant="caption">No matches.</ThemedText>
        </View>
      )}
    </PageLayout>
  );
}
