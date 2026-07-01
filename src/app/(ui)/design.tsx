/**
 * Design System showcase (`/design`).
 *
 * Living documentation for the new "Sage Paper" foundation: the type scale in
 * its three font families, every semantic color token (light + dark), radii,
 * money formatting, and category icon tiles. Built with the new Tailwind
 * tokens directly so it doubles as the Step 1 verification surface. Reachable
 * at /design (web) or via Settings → Appearance → Design System.
 */
import { Briefcase, Car, Droplet, Film, Home, Moon, ShoppingCart, Sun, Zap } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { accentFor, useBudgeteerFonts } from "@/src/components/ui";
import { useTheme } from "@/src/providers/ThemeProvider";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-9">
      <Text className="font-sans-semibold text-overline uppercase text-ink-faint mb-3">{title}</Text>
      <View className="gap-3">{children}</View>
    </View>
  );
}

function Swatch({ label, swatchClass, border }: { label: string; swatchClass: string; border?: boolean }) {
  return (
    <View className="items-center w-[84px]">
      <View className={`w-full h-14 rounded-lg ${swatchClass} ${border ? "border border-border-strong" : ""}`} />
      <Text className="font-mono text-[10px] text-ink-mute mt-1 text-center">{label}</Text>
    </View>
  );
}

const CATEGORIES = [
  { name: "Groceries", Icon: ShoppingCart },
  { name: "Rent", Icon: Home },
  { name: "Salary", Icon: Briefcase },
  { name: "Bills", Icon: Zap },
  { name: "Car", Icon: Car },
  { name: "Entertainment", Icon: Film },
  { name: "Water", Icon: Droplet },
] as const;

export default function DesignShowcase() {
  const { isDark, toggleTheme, colors } = useTheme();
  const fontsLoaded = useBudgeteerFonts();

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 24, paddingBottom: 64, maxWidth: 920, alignSelf: "center", width: "100%" }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-3">
          <View className="w-11 h-11 rounded-xl bg-primary items-center justify-center">
            <Text className="font-serif text-h3 text-white">B</Text>
          </View>
          <View>
            <Text className="font-serif text-h2 text-ink">Design System</Text>
            <Text className="font-sans text-sm text-ink-mute">Sage Paper · {isDark ? "Dark" : "Light"}</Text>
          </View>
        </View>
        <Pressable
          onPress={toggleTheme}
          className="flex-row items-center gap-2 rounded-full border border-border bg-surface px-3 py-2"
        >
          {isDark ? <Sun size={16} color={colors.ink} /> : <Moon size={16} color={colors.ink} />}
          <Text className="font-sans-semibold text-sm text-ink">{isDark ? "Light" : "Dark"}</Text>
        </Pressable>
      </View>
      <Text className="font-sans text-sm text-ink-faint mb-8">Fonts loaded: {fontsLoaded ? "yes" : "loading…"}</Text>

      {/* Type scale */}
      <Section title="Type scale · Newsreader (serif)">
        <Text className="font-serif text-display text-ink">Display 46</Text>
        <Text className="font-serif text-h1 text-ink">Heading 1 · 30</Text>
        <Text className="font-serif text-h2 text-ink">Heading 2 · 23</Text>
        <Text className="font-serif text-h3 text-ink">Heading 3 · 19</Text>
      </Section>

      <Section title="Body · Hanken Grotesk (sans)">
        <Text className="font-sans text-body-lg text-ink">Body Large · 16 — the quick brown fox.</Text>
        <Text className="font-sans text-body text-ink">Body · 14 — the quick brown fox jumps.</Text>
        <Text className="font-sans-medium text-body text-ink">Body Medium · 14</Text>
        <Text className="font-sans-semibold text-body text-ink">Body Semibold · 14</Text>
        <Text className="font-sans-bold text-body text-ink">Body Bold · 14</Text>
        <Text className="font-sans-semibold text-overline uppercase text-ink-faint">Overline · 11</Text>
      </Section>

      <Section title="Amounts · JetBrains Mono">
        <Text className="font-mono-semibold text-h1 text-ink">$123,215.56</Text>
        <View className="flex-row flex-wrap gap-4">
          <Text className="font-mono-semibold text-body-lg text-income">+$5,348.98</Text>
          <Text className="font-mono-semibold text-body-lg text-expense">−$2,218.45</Text>
          <Text className="font-mono-semibold text-body-lg text-transfer">$500.00</Text>
          <Text className="font-mono text-body-lg text-ink-mute">$0.00</Text>
        </View>
      </Section>

      {/* Colors */}
      <Section title="Surfaces & lines">
        <View className="flex-row flex-wrap gap-3">
          <Swatch label="bg" swatchClass="bg-bg" border />
          <Swatch label="surface" swatchClass="bg-surface" border />
          <Swatch label="surface-alt" swatchClass="bg-surface-alt" border />
          <Swatch label="grid" swatchClass="bg-grid" border />
          <Swatch label="border" swatchClass="bg-border" />
          <Swatch label="border-strong" swatchClass="bg-border-strong" />
        </View>
      </Section>

      <Section title="Ink (text)">
        <View className="flex-row flex-wrap gap-3">
          <Swatch label="ink" swatchClass="bg-ink" />
          <Swatch label="ink-mute" swatchClass="bg-ink-mute" />
          <Swatch label="ink-faint" swatchClass="bg-ink-faint" />
        </View>
      </Section>

      <Section title="Brand & semantic">
        <View className="flex-row flex-wrap gap-3">
          <Swatch label="primary" swatchClass="bg-primary" />
          <Swatch label="primary-deep" swatchClass="bg-primary-deep" />
          <Swatch label="primary-soft" swatchClass="bg-primary-soft" border />
          <Swatch label="income" swatchClass="bg-income" />
          <Swatch label="income-soft" swatchClass="bg-income-soft" border />
          <Swatch label="expense" swatchClass="bg-expense" />
          <Swatch label="expense-soft" swatchClass="bg-expense-soft" border />
          <Swatch label="transfer" swatchClass="bg-transfer" />
          <Swatch label="transfer-soft" swatchClass="bg-transfer-soft" border />
        </View>
      </Section>

      {/* Status (semantic) */}
      <Section title="Status (semantic) · generic, reusable">
        <View className="flex-row flex-wrap gap-3">
          <Swatch label="success" swatchClass="bg-success" />
          <Swatch label="success-soft" swatchClass="bg-success-soft" border />
          <Swatch label="danger" swatchClass="bg-danger" />
          <Swatch label="danger-soft" swatchClass="bg-danger-soft" border />
          <Swatch label="warning" swatchClass="bg-warning" />
          <Swatch label="warning-soft" swatchClass="bg-warning-soft" border />
          <Swatch label="info" swatchClass="bg-info" />
          <Swatch label="info-soft" swatchClass="bg-info-soft" border />
        </View>
        <Text className="font-sans text-xs text-ink-faint">
          income = success · expense = danger · transfer = info (finance aliases, same colors)
        </Text>
      </Section>

      {/* Radii */}
      <Section title="Radii">
        <View className="flex-row flex-wrap gap-3">
          {[
            { label: "xs", cls: "rounded-xs" },
            { label: "sm", cls: "rounded-sm" },
            { label: "md", cls: "rounded-md" },
            { label: "lg", cls: "rounded-lg" },
            { label: "xl", cls: "rounded-xl" },
            { label: "2xl", cls: "rounded-2xl" },
            { label: "full", cls: "rounded-full" },
          ].map(r => (
            <View key={r.label} className="items-center">
              <View className={`w-16 h-16 bg-surface border border-border-strong ${r.cls}`} />
              <Text className="font-mono text-[10px] text-ink-mute mt-1">{r.label}</Text>
            </View>
          ))}
        </View>
      </Section>

      {/* Category icon tiles */}
      <Section title="Category tiles">
        <View className="flex-row flex-wrap gap-4">
          {CATEGORIES.map(({ name, Icon }) => {
            const c = accentFor(name, isDark ? "dark" : "light");
            const bg = c.soft;
            return (
              <View key={name} className="items-center w-[72px]">
                <View
                  style={{ backgroundColor: bg }}
                  className="w-[42px] h-[42px] rounded-lg items-center justify-center"
                >
                  <Icon size={19} color={c.fg} strokeWidth={2.1} />
                </View>
                <Text className="font-sans text-[10px] text-ink-mute mt-1 text-center">{name}</Text>
              </View>
            );
          })}
        </View>
      </Section>

      {/* Mini component preview */}
      <Section title="Preview">
        <View className="bg-surface border border-border rounded-2xl p-5 gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-serif text-h3 text-ink">Total balance</Text>
            <View className="flex-row items-center self-start rounded-full bg-income-soft px-3 py-1">
              <Text className="font-sans-bold text-xs text-income">+4.2%</Text>
            </View>
          </View>
          <Text className="font-mono-semibold text-display text-ink">$123,215.56</Text>
          <View className="flex-row gap-3">
            <Pressable className="flex-1 items-center rounded-lg bg-primary py-3">
              <Text className="font-sans-bold text-body text-white">New Transaction</Text>
            </Pressable>
            <Pressable className="items-center rounded-lg border border-border-strong px-5 py-3">
              <Text className="font-sans-bold text-body text-ink">Filter</Text>
            </Pressable>
          </View>
        </View>
      </Section>
    </ScrollView>
  );
}
