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

import MyIcon from "@/src/components/elements/MyIcon";
// Legacy charts (victory-native) — kept only for the before/after comparison below.
import LegacyBar from "@/src/components/Charts/Bar";
import LegacyDoubleBar from "@/src/components/Charts/DoubleBar";
import LegacyLine from "@/src/components/Charts/Line";
import LegacyMyCalendar from "@/src/components/Charts/MyCalendar";
import LegacyMyPie from "@/src/components/Charts/MyPie";

import {
  accentFor,
  Avatar,
  Badge,
  BarChart,
  Button,
  Calculator,
  CalendarHeatmap,
  Card,
  Checkbox,
  Chip,
  ColorPicker,
  DatePicker,
  Dialog,
  Divider,
  DonutChart,
  DoubleBarChart,
  EmptyState,
  ErrorState,
  ExpandableRow,
  IconButton,
  IconPicker,
  Input,
  LineChart,
  ListRow,
  Loader,
  MiniBarChart,
  Pager,
  ProgressBar,
  Pulse,
  Radio,
  SearchableSelect,
  SectionHeader,
  SegmentedControl,
  Select,
  Sheet,
  SkeletonBlock,
  SkeletonGroup,
  Switch,
  Text,
  useAlert,
  useConfirm,
  type SearchableSelectOption,
  type Segment,
  type SelectOption,
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

// TODO: Add class flex-1 To Children
function Row({ children }: { children: React.ReactNode }) {
  return <View className="flex-row flex-wrap items-center gap-3">{children}</View>;
}

const BUTTON_VARIANTS = ["primary", "secondary", "outline", "ghost", "destructive"] as const;
const BADGE_TONES = ["primary", "success", "danger", "info", "neutral"] as const;

const ACCOUNTS: SelectOption[] = [
  { id: "acc-1", label: "Checking", detail: "$4,820.55", icon: "Wallet" },
  { id: "acc-2", label: "Savings", detail: "$40,675.77", icon: "PiggyBank" },
  { id: "acc-3", label: "Rewards Credit Card", detail: "−$1,204.18", icon: "CreditCard" },
];
const SELECT_CATEGORIES: SelectOption[] = [
  { id: "groceries", label: "Groceries", icon: "ShoppingCart", group: "Spending" },
  { id: "dining", label: "Dining", icon: "Utensils", group: "Spending" },
  { id: "rent", label: "Rent", icon: "House", group: "Bills" },
  { id: "utilities", label: "Utilities", icon: "Plug", group: "Bills" },
  { id: "salary", label: "Salary", icon: "Banknote", group: "Income" },
];
const SELECT_TYPES: SelectOption[] = [
  { id: "expense", label: "Expense" },
  { id: "income", label: "Income" },
  { id: "transfer", label: "Transfer" },
];

const fmtMoney = (n: number) => "$" + n.toLocaleString();
const DONUT_DATA = [
  { label: "Rent", value: 1200 },
  { label: "Groceries", value: 420 },
  { label: "Bills", value: 260 },
  { label: "Car", value: 180 },
  { label: "Entertainment", value: 140 },
  { label: "Dining Out", value: 95 },
  { label: "Fuel", value: 80 },
  { label: "Hobbies", value: 60 },
];
const WEEK_BARS = [
  { label: "Sun", value: 40 },
  { label: "Mon", value: 120 },
  { label: "Tue", value: 75 },
  { label: "Wed", value: 200 },
  { label: "Thu", value: 60 },
  { label: "Fri", value: 180 },
  { label: "Sat", value: 95 },
];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOUBLE_DATA = MONTH_LABELS.map((m, i) => ({
  label: m,
  income: 3200 + ((i * 7) % 5) * 420 + 800,
  expense: 1800 + ((i * 3) % 4) * 360,
}));
const LINE_DATA = MONTH_LABELS.map((m, i) => ({ label: m, value: 8000 + i * 1100 + ((i * 5) % 3) * 600 }));

// Legacy-shaped mock data (for the before/after comparison only).
const INCOME_HEX = "#2E9E6B";
const EXPENSE_HEX = "#DD6B5E";
const TRANSFER_HEX = "#4D8EF7";
const LEGACY_PIE = DONUT_DATA.slice(0, 6).map((d, i) => ({ id: String(i), x: d.label, y: d.value }));
const LEGACY_BAR = WEEK_BARS.map(b => ({ x: b.label, y: b.value }));
const LEGACY_DOUBLE = DOUBLE_DATA.map(d => ({
  x: d.label,
  barOne: { label: "Income", value: d.income, color: INCOME_HEX },
  barTwo: { label: "Expense", value: d.expense, color: EXPENSE_HEX },
}));
const LEGACY_LINE = LINE_DATA.map(p => ({ x: p.label, y: p.value }));
const CAL_DATA = {
  "2026-06-03": { dots: [{ key: "e", color: EXPENSE_HEX }] },
  "2026-06-08": {
    dots: [
      { key: "e", color: EXPENSE_HEX },
      { key: "i", color: INCOME_HEX },
      { key: "t", color: TRANSFER_HEX },
    ],
  },
  "2026-06-15": { dots: [{ key: "i", color: INCOME_HEX }] },
  "2026-06-21": { dots: [{ key: "e", color: EXPENSE_HEX }] },
};
const MINI_BARS = [3, 5, 2, 8, 4, 6, 5, 7];

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selAccount, setSelAccount] = useState<string | null>("acc-1");
  const [selType, setSelType] = useState<string | null>("expense");
  const [selCats, setSelCats] = useState<string[]>(["groceries"]);
  const [selSearch, setSelSearch] = useState<string | null>(null);
  const [nestDialog, setNestDialog] = useState(false);
  const [nestSheet, setNestSheet] = useState(false);
  const [nestSelect, setNestSelect] = useState<string | null>("acc-2");
  const [catIcon, setCatIcon] = useState<string | null>("ShoppingCart");
  const [catColor, setCatColor] = useState<string | null>("#DD6B5E");
  const [payee, setPayee] = useState<{ id: string; label: string } | null>(null);
  const [date, setDate] = useState<string | null>("2026-06-21");
  const [donutSel, setDonutSel] = useState<number | null>(null);
  const [barSel, setBarSel] = useState<number | null>(null);
  const [chartsLoading, setChartsLoading] = useState(false);
  const confirm = useConfirm();
  const alert = useAlert();

  // Demo-only async search over the accounts list (simulates a service call).
  const searchPayees = (q: string) =>
    new Promise<SearchableSelectOption[]>(resolve => {
      setTimeout(
        () =>
          resolve(
            ACCOUNTS.filter(a => a.label.toLowerCase().includes(q.toLowerCase())).map(a => ({
              id: a.id,
              label: a.label,
              detail: a.detail,
              icon: a.icon,
            })),
          ),
        350,
      );
    });

  const tile = (name: string) => {
    const c = accentFor(name, isDark ? "dark" : "light");
    return { iconColor: c.fg, iconBg: c.soft };
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

      {/* Select */}
      <Section title="Select · single / multi / grouped">
        <Select
          label="Account — present=auto (popover on web, sheet on mobile)"
          options={ACCOUNTS}
          value={selAccount}
          onChange={v => setSelAccount(v as string | null)}
          clearable
          placeholder="Choose an account"
        />
        <Select
          label="Type — forced popover, no search"
          present="popover"
          options={SELECT_TYPES}
          value={selType}
          onChange={v => setSelType(v as string | null)}
          searchable={false}
        />
        <Select
          label="Categories — multi · grouped · searchable · add-new"
          multiple
          searchable
          values={selCats}
          onChange={v => setSelCats(v as string[])}
          options={SELECT_CATEGORIES}
          groupBy={o => o.group ?? "Other"}
          addNew={{ label: "Add category", onPress: noop }}
          placeholder="Pick categories"
        />
        <Select
          label="Searchable flag — forced on a short list (3 options)"
          searchable
          options={ACCOUNTS}
          value={selSearch}
          onChange={v => setSelSearch(v as string | null)}
          clearable
          placeholder="Search accounts…"
        />
        <Select
          label="Forced sheet"
          present="sheet"
          options={ACCOUNTS}
          value={selAccount}
          onChange={v => setSelAccount(v as string | null)}
        />
        <Select label="Disabled" options={ACCOUNTS} value={selAccount} onChange={noop} disabled />
      </Section>

      {/* Overlays */}
      <Section title="Overlays · Dialog / Sheet / Confirm">
        <Row>
          <Button label="Open dialog" leadingIcon="SquareStack" onPress={() => setDialogOpen(true)} />
          <Button label="Open sheet" variant="secondary" leadingIcon="PanelBottom" onPress={() => setSheetOpen(true)} />
          <Button
            label="Confirm…"
            variant="outline"
            leadingIcon="TriangleAlert"
            onPress={async () => {
              const ok = await confirm({
                title: "Delete account?",
                message: "This permanently removes the account and its transactions.",
                confirmLabel: "Delete",
                tone: "danger",
              });
              await alert({
                title: ok ? "Deleted" : "Cancelled",
                message: ok ? "The account was deleted." : "Nothing was changed.",
              });
            }}
          />
        </Row>
        <Dialog visible={dialogOpen} onClose={() => setDialogOpen(false)} title="Edit note">
          <Input label="Note" placeholder="Add a note…" value={note} onChangeText={setNote} />
          <Button label="Save" className="mt-4" onPress={() => setDialogOpen(false)} />
        </Dialog>
        <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Quick actions">
          <View className="gap-2">
            <ListRow
              iconName="Pencil"
              iconShape="circle"
              title="Edit"
              subtitle="Modify this item"
              onPress={() => setSheetOpen(false)}
              bare
            />
            <ListRow
              iconName="Copy"
              iconShape="circle"
              title="Duplicate"
              subtitle="Create a copy"
              onPress={() => setSheetOpen(false)}
              bare
            />
            <ListRow
              iconName="Trash2"
              iconShape="circle"
              title="Delete"
              subtitle="Remove permanently"
              onPress={() => setSheetOpen(false)}
              bare
            />
          </View>
        </Sheet>
      </Section>

      {/* Overlays · nesting */}
      <Section title="Overlays · nesting (stacked layers)">
        <Text variant="caption">
          Open the dialog, then stack a Select popover, a Sheet, and a confirm on top. Esc / Android-back dismisses the
          top layer first; each backdrop dims the layer beneath it.
        </Text>
        <Button label="Open nested dialog" leadingIcon="Layers" onPress={() => setNestDialog(true)} />

        <Dialog visible={nestDialog} onClose={() => setNestDialog(false)} title="Layer 1 · Dialog">
          <Text variant="body" className="mb-3 text-ink-mute">
            The Select below opens layer 2 on top of this dialog (a popover on web, a sheet on mobile).
          </Text>
          <Select
            label="Account — opens over the dialog"
            options={ACCOUNTS}
            value={nestSelect}
            onChange={v => setNestSelect(v as string | null)}
          />
          <Button
            label="Open sheet — layer 2"
            variant="secondary"
            leadingIcon="PanelBottom"
            className="mt-4"
            onPress={() => setNestSheet(true)}
          />
        </Dialog>

        <Sheet visible={nestSheet} onClose={() => setNestSheet(false)} title="Layer 2 · Sheet">
          <Text variant="body" className="mb-3 text-ink-mute">
            Confirm from here opens layer 3 — three overlays deep.
          </Text>
          <Button
            label="Confirm something — layer 3"
            variant="outline"
            leadingIcon="TriangleAlert"
            onPress={async () => {
              await confirm({
                title: "Nested confirm",
                message: "This confirm sits on top of the sheet, which sits on top of the dialog.",
                confirmLabel: "Got it",
              });
              // Layer 3 (the confirm) always closes itself; layer 2 (this sheet) stays open.
            }}
          />
        </Sheet>
      </Section>

      {/* Pickers · icon + color */}
      <Section title="Pickers · icon + color (category appearance)">
        <Card className="gap-4">
          <View className="flex-row items-center gap-3">
            <View
              className="h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: (catColor ?? colors.inkMute) + "22" }}
            >
              <MyIcon name={catIcon || "Image"} size={24} color={catColor ?? colors.inkMute} />
            </View>
            <View>
              <Text variant="body" className="font-sans-semibold">
                Live preview
              </Text>
              <Text variant="caption">
                {catIcon ?? "—"} · {catColor ?? "—"}
              </Text>
            </View>
          </View>
          <IconPicker label="Icon" value={catIcon} onChange={setCatIcon} color={catColor ?? undefined} />
          <ColorPicker label="Color" value={catColor} onChange={setCatColor} />
        </Card>
      </Section>

      {/* Pickers · searchable (async) + date */}
      <Section title="Pickers · searchable (async) + date">
        <SearchableSelect
          label="Payee — async search (debounced, ~350ms)"
          selectedLabel={payee?.label}
          searchAction={searchPayees}
          onSelect={p => setPayee({ id: p.id, label: p.label })}
          onClear={() => setPayee(null)}
          clearable
          placeholder="Search accounts…"
        />
        <DatePicker label="Date" value={date} onChange={setDate} />
      </Section>

      {/* Charts */}
      <Section title="Charts · donut + bar">
        <Row>
          <Button
            label={chartsLoading ? "Show data" : "Show loading"}
            variant="secondary"
            size="sm"
            leadingIcon={chartsLoading ? "Eye" : "Loader"}
            onPress={() => setChartsLoading(v => !v)}
          />
          <Text variant="caption">Tap a slice / bar to select (emits an event + highlights).</Text>
        </Row>
        <Row>
          <Card className="flex-1">
            <Text variant="h3" className="mb-3">
              Spending by category
            </Text>
            <DonutChart
              data={DONUT_DATA}
              loading={chartsLoading}
              centerLabel="Spent"
              centerValue={fmtMoney(DONUT_DATA.reduce((s, d) => s + d.value, 0))}
              formatValue={fmtMoney}
              selectedIndex={donutSel}
              onSlicePress={(_, i) => setDonutSel(prev => (prev === i ? null : i))}
            />
          </Card>

          <Card className="flex-1">
            <Text variant="h3" className="mb-3">
              Donut · empty
            </Text>
            <DonutChart
              data={[]}
              emptyTitle="No categories found"
              emptySubtitle="Add categories to see your breakdown"
            />
          </Card>
        </Row>
        <Row>
          <Card className="flex-1">
            <Text variant="h3" className="mb-3">
              This week
            </Text>
            <BarChart
              data={WEEK_BARS}
              loading={chartsLoading}
              color={colors.expense}
              formatValue={fmtMoney}
              showValues
              onBarPress={(_, i) => setBarSel(prev => (prev === i ? null : i))}
            />
          </Card>
          <Card className="flex-1">
            <Text variant="h3" className="mb-3">
              Bar · empty
            </Text>
            <BarChart data={[]} emptyTitle="Nothing logged this week" emptySubtitle="Log an expense to get started" />
          </Card>
        </Row>
        <Row>
          <Card className="flex-1">
            <Text variant="h3" className="mb-3">
              Income vs expense
            </Text>
            <DoubleBarChart
              data={DOUBLE_DATA.slice(0, 6)}
              loading={chartsLoading}
              formatValue={fmtMoney}
              showValues
              bar1Label="Income"
              bar2Label="Expense"
            />
          </Card>
          <Card className="flex-1">
            <Text variant="h3" className="mb-3">
              Empty Double Bar
            </Text>
            <DoubleBarChart data={[]} loading={chartsLoading} formatValue={fmtMoney} />
          </Card>
        </Row>
        <Row>
          <Card className="flex-1">
            <Text variant="h3" className="mb-3">
              Net worth
            </Text>
            <LineChart
              data={LINE_DATA.slice(0, 9)}
              loading={chartsLoading}
              seriesLabel="Net worth"
              showLegend
              formatValue={fmtMoney}
            />
          </Card>
          <Card className="flex-1">
            <Text variant="h3" className="mb-3">
              Empty Line Chart
            </Text>
            <LineChart data={[]} loading={chartsLoading} seriesLabel="Net worth" showLegend formatValue={fmtMoney} />
          </Card>
        </Row>
        <Card>
          <Text variant="h3" className="mb-3">
            Activity calendar
          </Text>
          <CalendarHeatmap markedDates={CAL_DATA} currentDate="2026-06-21" loading={chartsLoading} onDayPress={noop} />
        </Card>
        <Card>
          <Text variant="h3" className="mb-3">
            Mini bars (landing preview)
          </Text>
          <MiniBarChart values={MINI_BARS} />
        </Card>
      </Section>

      {/* Before / after comparison */}
      <Section title="Charts · before (legacy) / after (new)">
        <Text variant="caption" className="mb-1">
          Legacy victory-native charts on the left, the new Sage Paper charts on the right — for comparison.
        </Text>
        {(
          [
            {
              title: "Donut / Pie",
              before: <LegacyMyPie data={LEGACY_PIE} label="Spending" />,
              after: (
                <DonutChart
                  data={DONUT_DATA}
                  centerLabel="Spent"
                  centerValue={fmtMoney(DONUT_DATA.reduce((s, d) => s + d.value, 0))}
                  formatValue={fmtMoney}
                  legendPosition="bottom"
                />
              ),
            },
            {
              title: "Weekly bars",
              before: <LegacyBar data={LEGACY_BAR} label="This week" />,
              after: <BarChart data={WEEK_BARS} color={colors.expense} formatValue={fmtMoney} showValues />,
            },
            {
              title: "Income vs expense",
              before: <LegacyDoubleBar data={LEGACY_DOUBLE} label="Net earnings" />,
              after: <DoubleBarChart data={DOUBLE_DATA} formatValue={fmtMoney} />,
            },
            {
              title: "Net worth line",
              before: <LegacyLine data={LEGACY_LINE} label="Net worth" />,
              after: <LineChart data={LINE_DATA} seriesLabel="Net worth" formatValue={fmtMoney} />,
            },
            {
              title: "Activity calendar",
              before: <LegacyMyCalendar data={CAL_DATA} label="Activity" currentDate="2026-06-21" />,
              after: <CalendarHeatmap markedDates={CAL_DATA} currentDate="2026-06-21" />,
            },
          ] as const
        ).map(row => (
          <View key={row.title} className="gap-3 md:flex-row">
            <Card className="flex-1">
              <Badge tone="neutral" label="Before" className="mb-3 self-start" />
              {row.before}
            </Card>
            <Card className="flex-1">
              <Badge tone="primary" label="After" className="mb-3 self-start" />
              {row.after}
            </Card>
          </View>
        ))}
      </Section>
      <Section title="Calculator · amount entry">
        <Calculator onSubmit={noop} />
      </Section>
    </ScrollView>
  );
}
