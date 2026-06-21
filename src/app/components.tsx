/**
 * Component preview (`/components`).
 *
 * Living gallery of the new design-system primitives (Step 3). Reachable at
 * /components (web) or via Settings → Appearance → Components, and cross-linked
 * from the /design token showcase.
 */
import { useRouter } from "expo-router";
import { Moon, Sun } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import {
  Avatar,
  Badge,
  Button,
  Card,
  categoryColors,
  Checkbox,
  Chip,
  Divider,
  EmptyState,
  ErrorState,
  ExpandableRow,
  IconButton,
  Input,
  ListRow,
  Loader,
  Pager,
  ProgressBar,
  Pulse,
  Radio,
  SectionHeader,
  SegmentedControl,
  SkeletonBlock,
  SkeletonGroup,
  Switch,
  Text,
  type Segment,
} from "@/src/components/ui";
import { useTheme } from "@/src/providers/ThemeProvider";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-9">
      <Text variant="overline" className="mb-3">
        {title}
      </Text>
      <View className="gap-3">{children}</View>
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View className="flex-row flex-wrap items-center gap-3">{children}</View>;
}

const BUTTON_VARIANTS = ["primary", "secondary", "outline", "ghost", "destructive"] as const;
const BADGE_TONES = ["primary", "success", "danger", "info", "neutral"] as const;

export default function ComponentsPreview() {
  const { isDark, toggleTheme, colors } = useTheme();
  const router = useRouter();
  const noop = () => {};
  const [txType, setTxType] = useState("expense");
  const [period, setPeriod] = useState("monthly");
  const [note, setNote] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [filters, setFilters] = useState<string[]>(["income"]);
  const toggleFilter = (k: string) => setFilters(f => (f.includes(k) ? f.filter(x => x !== k) : [...f, k]));
  const [check1, setCheck1] = useState(true);
  const [check2, setCheck2] = useState(false);
  const [month, setMonth] = useState(9); // 0-indexed → October
  const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const [radio, setRadio] = useState("monthly");

  const tile = (name: keyof typeof categoryColors) => {
    const c = categoryColors[name];
    return { iconColor: c.fg, iconBg: isDark ? c.softDark : c.softLight };
  };

  const TYPE_SEGS: Segment[] = [
    { key: "expense", label: "Expense", tone: "danger" },
    { key: "income", label: "Income", tone: "success" },
    { key: "transfer", label: "Transfer", tone: "info" },
  ];
  const PERIOD_SEGS: Segment[] = [
    { key: "monthly", label: "Monthly" },
    { key: "quarterly", label: "Quarterly" },
    { key: "yearly", label: "Yearly" },
  ];

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 24, paddingBottom: 64, maxWidth: 920, alignSelf: "center", width: "100%" }}
    >
      {/* Header */}
      <View className="mb-8 flex-row items-center justify-between">
        <View>
          <Text variant="h2">Components</Text>
          <Pressable onPress={() => router.push("/design" as never)}>
            <Text variant="caption" className="text-primary-deep">
              ← Back to tokens (/design)
            </Text>
          </Pressable>
        </View>
        <Pressable
          onPress={toggleTheme}
          className="flex-row items-center gap-2 rounded-full border border-border bg-surface px-3 py-2"
        >
          {isDark ? <Sun size={16} color={colors.ink} /> : <Moon size={16} color={colors.ink} />}
          <Text variant="label" className="text-ink">
            {isDark ? "Light" : "Dark"}
          </Text>
        </Pressable>
      </View>

      {/* Text */}
      <Section title="Text variants">
        <Text variant="display">Display</Text>
        <Text variant="h1">Heading 1</Text>
        <Text variant="h2">Heading 2</Text>
        <Text variant="h3">Heading 3</Text>
        <Text variant="bodyLg">Body large — the quick brown fox.</Text>
        <Text variant="body">Body — the quick brown fox jumps.</Text>
        <Text variant="label">Label</Text>
        <Text variant="caption">Caption</Text>
        <Text variant="overline">Overline</Text>
        <Text variant="money" className="text-income">
          +$5,348.98
        </Text>
        <Text variant="moneyLg">$123,215.56</Text>
      </Section>

      {/* Buttons */}
      <Section title="Button · variants × sizes">
        {BUTTON_VARIANTS.map(v => (
          <Row key={v}>
            <Button label={`${v} sm`} variant={v} size="sm" onPress={noop} />
            <Button label={`${v} md`} variant={v} size="md" onPress={noop} />
            <Button label={`${v} lg`} variant={v} size="lg" onPress={noop} />
          </Row>
        ))}
      </Section>

      <Section title="Button · icons, loading, disabled, full">
        <Row>
          <Button label="Leading" leadingIcon="Plus" onPress={noop} />
          <Button label="Trailing" trailingIcon="ChevronRight" variant="secondary" onPress={noop} />
          <Button label="Loading" loading onPress={noop} />
          <Button label="Disabled" disabled onPress={noop} />
        </Row>
        <Button label="Full width" leadingIcon="Check" full onPress={noop} />
      </Section>

      {/* IconButtons */}
      <Section title="IconButton · variants × sizes">
        <Row>
          <IconButton icon="Plus" variant="ghost" size="md" accessibilityLabel="ghost" onPress={noop} />
          <IconButton icon="Pencil" variant="outline" size="md" accessibilityLabel="outline" onPress={noop} />
          <IconButton icon="RefreshCcw" variant="surface" size="md" accessibilityLabel="surface" onPress={noop} />
          <IconButton icon="Trash2" variant="destructive" size="md" accessibilityLabel="destructive" onPress={noop} />
          <IconButton icon="Settings" variant="surface" size="xs" accessibilityLabel="xs" onPress={noop} />
          <IconButton icon="Settings" variant="surface" size="sm" accessibilityLabel="sm" onPress={noop} />
          <IconButton icon="Settings" variant="surface" size="lg" accessibilityLabel="lg" onPress={noop} />
          <IconButton icon="Bell" variant="ghost" loading accessibilityLabel="loading" onPress={noop} />
        </Row>
      </Section>

      {/* Badges */}
      <Section title="Badge · tones">
        <Row>
          {BADGE_TONES.map(t => (
            <Badge key={t} tone={t} label={t} />
          ))}
        </Row>
        <Row>
          <Badge tone="success" label="+4.2%" iconName="TrendingUp" />
          <Badge tone="danger" label="−1.1%" iconName="TrendingDown" />
          <Badge tone="primary" label="Auto" iconName="Sparkles" />
        </Row>
      </Section>

      {/* Dividers */}
      <Section title="Divider">
        <View className="rounded-xl border border-border bg-surface p-4">
          <Text variant="body">Above</Text>
          <Divider className="my-3" />
          <Text variant="body">Below (plain)</Text>
          <Divider className="my-3" inset={32} />
          <Text variant="body">Below (inset 32)</Text>
          <Divider className="my-3" label="June 2026" />
          <View className="h-8 flex-row items-center gap-3">
            <Text variant="body">Left</Text>
            <Divider direction="vertical" />
            <Text variant="body">Right</Text>
          </View>
        </View>
      </Section>

      {/* Card */}
      <Section title="Card">
        <Card>
          <Text variant="h3">Padded card</Text>
          <Text variant="caption" className="mt-1">
            Default surface, border, large radius, soft shadow.
          </Text>
        </Card>
        <Card padded={false} className="overflow-hidden p-3">
          <Text variant="caption">Unpadded card (padding controlled by content)</Text>
        </Card>
        <Card onPress={noop}>
          <Text variant="h3">Pressable card</Text>
          <Text variant="caption" className="mt-1">
            Tap me — dims on press.
          </Text>
        </Card>
      </Section>

      {/* SegmentedControl */}
      <Section title="SegmentedControl">
        <SegmentedControl options={TYPE_SEGS} value={txType} onChange={setTxType} />
        <SegmentedControl options={PERIOD_SEGS} value={period} onChange={setPeriod} />
      </Section>

      {/* Input */}
      <Section title="Input">
        <Input label="Note" placeholder="Add a note…" value={note} onChangeText={setNote} />
        <Input label="Search" iconName="Search" placeholder="Search transactions…" />
        <Input label="Email" iconName="Mail" placeholder="you@example.com" error="Enter a valid email address" />
      </Section>

      {/* ListRow */}
      <Section title="ListRow">
        <Card padded={false} className="gap-2 overflow-hidden p-2">
          <ListRow
            iconName="ShoppingCart"
            {...tile("Groceries")}
            title="Groceries"
            subtitle="Rewards Credit Card"
            amount={-185.89}
            subAmount="−$4,603.14"
          />
          <ListRow
            iconName="Briefcase"
            {...tile("Salary")}
            title="Salary"
            subtitle="Primary Checking"
            amount={5348.98}
            subAmount="$78,123.57"
          />
          <ListRow
            iconName="ArrowRightLeft"
            {...tile("Car")}
            title="CC Payment"
            subtitle="Checking → Rewards Card"
            amountText="$500.00"
            tone="transfer"
          />
          <ListRow
            iconName="Clock"
            {...tile("Bills")}
            title="Internet"
            subtitle="Monthly"
            onPress={noop}
            right={<Badge tone="primary" label="Auto" />}
          />
        </Card>
      </Section>

      {/* ListRow — account appearance */}
      <Section title="ListRow · account appearance (icon shape + actions)">
        <Card padded={false} className="gap-2 overflow-hidden p-2">
          <ListRow
            iconName="Wallet"
            iconShape="tile"
            {...tile("Salary")}
            title="Primary Checking"
            subtitle={"Balance: $77,623.57"}
            right={
              <View className="flex-row items-center gap-1">
                <IconButton
                  icon="ArrowRightLeft"
                  variant="ghost"
                  size="xs"
                  accessibilityLabel="Transfer"
                  onPress={noop}
                />
                <IconButton icon="PiggyBank" variant="ghost" size="xs" accessibilityLabel="Buckets" onPress={noop} />
                <IconButton icon="SquarePen" variant="ghost" size="xs" accessibilityLabel="Edit" onPress={noop} />
                <IconButton icon="Trash2" variant="ghost" size="xs" accessibilityLabel="Delete" onPress={noop} />
              </View>
            }
          />
          <ListRow
            iconName="PiggyBank"
            iconShape="circle"
            {...tile("Salary")}
            title="Savings Account"
            subtitle={
              <Text variant="caption" className="font-mono text-xs text-ink-mute">
                Balance: $50,000.00
              </Text>
            }
            right={
              <View className="flex-row items-center gap-1">
                <IconButton icon="RefreshCcw" variant="ghost" size="xs" accessibilityLabel="Refresh" onPress={noop} />
                <IconButton icon="SquarePen" variant="ghost" size="xs" accessibilityLabel="Edit" onPress={noop} />
                <IconButton icon="Trash2" variant="ghost" size="xs" accessibilityLabel="Delete" onPress={noop} />
              </View>
            }
          />
        </Card>
      </Section>

      {/* ProgressBar — savings buckets */}
      <Section title="ProgressBar · savings buckets">
        <Card className="gap-4">
          {[
            { name: "Emergency Fund", cur: 30000, max: 30000, color: colors.expense },
            { name: "Vacation", cur: 4000, max: 8000, color: colors.transfer },
            { name: "New Car", cur: 5000, max: 25000, color: "#E4A24A" },
            { name: "Home Renovation", cur: 1675, max: 15000, color: "#9B85D6" },
          ].map(b => (
            <View key={b.name} className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text variant="body" className="font-sans-semibold">
                  {b.name}
                </Text>
                <Text className="font-mono text-sm text-ink-mute">
                  ${b.cur.toLocaleString()} / ${b.max.toLocaleString()}
                </Text>
              </View>
              <ProgressBar value={b.cur} max={b.max} color={b.color} />
            </View>
          ))}
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text variant="body" className="font-sans-semibold">
                Gradient · health
              </Text>
              <Text className="font-mono text-sm text-ink-mute">60%</Text>
            </View>
            <ProgressBar value={60} max={100} gradient={["#ef4444", "#f59e0b", "#10b981"]} />
          </View>
        </Card>
      </Section>

      {/* ExpandableRow — savings account with buckets */}
      <Section title="ExpandableRow · savings account → buckets">
        <ExpandableRow
          iconName="PiggyBank"
          iconShape="circle"
          {...tile("Salary")}
          title="CapitalOne Savings"
          subtitle={
            <View>
              <Text className="font-mono text-sm text-ink-mute">Balance: $40,675.77</Text>
              <Text className="font-mono text-xs text-ink-faint">Unallocated: $0.00</Text>
            </View>
          }
          defaultExpanded
          actions={
            <>
              <IconButton icon="RefreshCcw" variant="ghost" size="xs" accessibilityLabel="Refresh" onPress={noop} />
              <IconButton icon="SquarePen" variant="ghost" size="xs" accessibilityLabel="Edit" onPress={noop} />
              <IconButton icon="Trash2" variant="ghost" size="xs" accessibilityLabel="Delete" onPress={noop} />
            </>
          }
        >
          <View className="gap-4">
            {[
              { name: "Emergency Fund", cur: 30000, max: 30000, color: colors.expense, icon: "Pill" },
              { name: "Vacation", cur: 4000, max: 8000, color: colors.transfer, icon: "Plane" },
              { name: "New Car", cur: 5000, max: 25000, color: "#E4A24A", icon: "Car" },
              { name: "Home Renovation", cur: 1675, max: 15000, color: "#9B85D6", icon: "Home" },
            ].map(b => (
              <View key={b.name} className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text variant="body" className="font-sans-semibold">
                    {b.name}
                  </Text>
                  <Text className="font-mono text-sm text-ink-mute">
                    ${b.cur.toLocaleString()} / ${b.max.toLocaleString()}
                  </Text>
                </View>
                <ProgressBar value={b.cur} max={b.max} color={b.color} />
              </View>
            ))}
            <Button
              label="Add bucket"
              leadingIcon="Plus"
              variant="ghost"
              size="sm"
              onPress={noop}
              className="self-start"
            />
          </View>
        </ExpandableRow>
      </Section>

      {/* Pager */}
      <Section title="Pager">
        <Pager
          label={`${MONTHS[month]} 2026`}
          onPrev={() => setMonth(m => (m + 11) % 12)}
          onNext={() => setMonth(m => (m + 1) % 12)}
        />
      </Section>

      {/* Checkbox + Radio */}
      <Section title="Checkbox & Radio">
        <Checkbox checked={check1} onChange={setCheck1} label="Include transfers" />
        <Checkbox checked={check2} onChange={setCheck2} label="Only uncategorized" />
        <View className="h-2" />
        {["monthly", "quarterly", "yearly"].map(k => (
          <Radio key={k} selected={radio === k} onPress={() => setRadio(k)} label={k[0].toUpperCase() + k.slice(1)} />
        ))}
      </Section>

      {/* SectionHeader */}
      <Section title="SectionHeader">
        <SectionHeader title="Cash" />
        <SectionHeader
          title="Accounts"
          variant="heading"
          right={
            <>
              <IconButton icon="RefreshCcw" variant="ghost" size="sm" accessibilityLabel="Refresh" onPress={noop} />
              <IconButton icon="Plus" variant="surface" size="sm" accessibilityLabel="Add account" onPress={noop} />
            </>
          }
        />
      </Section>

      {/* Switch */}
      <Section title="Switch">
        <View className="flex-row items-center justify-between rounded-xl border border-border bg-surface p-4">
          <Text variant="body">Grid background</Text>
          <Switch value={enabled} onValueChange={setEnabled} />
        </View>
      </Section>

      {/* Avatar */}
      <Section title="Avatar">
        <Row>
          <Avatar name="Cash Wallet" />
          <Avatar name="Primary Checking" />
          <Avatar iconName="User" />
          <Avatar name="Alex Doe" size={56} />
        </Row>
      </Section>

      {/* Chip */}
      <Section title="Chip">
        <Row>
          {[
            { k: "income", label: "Income" },
            { k: "expense", label: "Expense" },
            { k: "transfer", label: "Transfer" },
          ].map(c => (
            <Chip key={c.k} label={c.label} selected={filters.includes(c.k)} onPress={() => toggleFilter(c.k)} />
          ))}
          <Chip label="Groceries" iconName="ShoppingCart" onRemove={noop} />
        </Row>
      </Section>

      {/* Loading */}
      <Section title="Loading · Pulse, Skeleton, Loader">
        <Pulse>
          <View className="rounded-xl bg-surface-alt p-4">
            <Text variant="caption">This block pulses</Text>
          </View>
        </Pulse>
        <View className="rounded-xl border border-border bg-surface p-2">
          <SkeletonGroup count={3} />
        </View>
        <Row>
          <SkeletonBlock width={48} height={48} radius={24} />
          <SkeletonBlock width={120} height={14} />
          <SkeletonBlock width={80} height={14} />
        </Row>
        <View className="rounded-xl border border-border bg-surface">
          <Loader size="md" label="Loading…" />
        </View>
        <Row>
          {(["primary", "success", "danger", "info", "neutral"] as const).map(t => (
            <Loader key={t} size="sm" tone={t} label={t} />
          ))}
        </Row>
      </Section>

      {/* Empty / Error */}
      <Section title="EmptyState / ErrorState">
        <View className="h-64 overflow-hidden rounded-xl border border-border bg-surface">
          <EmptyState
            iconName="Inbox"
            title="No transactions yet"
            subtitle="Add your first transaction to see it here."
            action={{ label: "New Transaction", onPress: noop }}
          />
        </View>
        <View className="h-64 overflow-hidden rounded-xl border border-border bg-surface">
          <ErrorState message="We couldn't load your data. Check your connection and try again." onRefresh={noop} />
        </View>
      </Section>
    </ScrollView>
  );
}
