/**
 * SecondaryTabBar — one component replacing both legacy tab bars
 * (`TabNavigation` router-backed + `MyTabsRouter` in-memory).
 *
 *   // router-backed pages (derives the active tab from the URL itself):
 *   <SecondaryTabBar mode="router" routes={[{ name: "Accounts", path: "/Accounts" }, …]} />
 *
 *   // in-memory content:
 *   <SecondaryTabBar mode="inline" tabs={[{ id: 1, name: "Single", render: () => <Form/> }, …]} />
 *
 * Two visual `variant`s (default "pill"):
 *   - "pill"      — Sage Paper segmented control (`surface-alt` track, filled-`primary`
 *                   active pill). Equal-width when ≤ SCROLL_THRESHOLD tabs, scrollable
 *                   content-width pills beyond (e.g. Restore's 6).
 *   - "underline" — content-width tabs on a hairline baseline, each with a rounded
 *                   `primary` indicator under the active label; scrolls when it overflows.
 *
 * In `mode="router"` each tab is a real `<Link href>` (via `asChild`, so no extra DOM
 * node): on web it shows the URL on hover, opens in a new tab on middle/⌘-click, and
 * exposes the browser context menu — while a normal tap still navigates (replace).
 * Both modes support an optional trailing `rightSlot`.
 */
import { Link, Slot, usePathname, useRouter } from "expo-router";
import { type ReactNode, useState } from "react";
import { Platform, Pressable, ScrollView, View } from "react-native";

import { Text } from "./Text";
import { cn } from "./utils/cn";
import { triggerHaptic } from "./utils/haptic";

export type SecondaryTabVariant = "pill" | "underline";

export interface RouterTab {
  name: string;
  path: string;
}
export interface InlineTab {
  id: number;
  name: string;
  render: () => ReactNode;
}

export type SecondaryTabBarProps =
  | { mode: "router"; routes: RouterTab[]; variant?: SecondaryTabVariant; rightSlot?: ReactNode; testID?: string }
  | {
      mode: "inline";
      tabs: InlineTab[];
      defaultId?: number;
      variant?: SecondaryTabVariant;
      rightSlot?: ReactNode;
      testID?: string;
    };

/** Above this many tabs, the pill variant switches from equal-width to a scrollable strip. */
const SCROLL_THRESHOLD = 4;

interface Item {
  key: string;
  name: string;
  active: boolean;
  /** Router mode only — makes the tab a real `<Link>`. Absent for in-memory tabs. */
  href?: string;
  /** In-memory tabs handle their own state here; router tabs navigate via `<Link>`. */
  onPress: () => void;
}

/**
 * One tab. Router tabs (with `href`) wrap the Pressable in `<Link asChild replace>`
 * so the browser treats it as a navigable link; the Pressable still fires the
 * selection haptic. In-memory tabs just run `onPress`.
 */
function Tab({ item, variant, fill }: { item: Item; variant: SecondaryTabVariant; fill: boolean }) {
  const handlePress = () => {
    if (item.active) return;
    triggerHaptic("selection");
    if (!item.href) item.onPress(); // router nav is handled by <Link>
  };

  const body =
    variant === "underline" ? (
      <Pressable
        testID={`tab-${item.name}`}
        onPress={handlePress}
        accessibilityRole="tab"
        accessibilityState={{ selected: item.active }}
        className={cn("relative items-center px-4 py-3", fill && "flex-1", Platform.OS === "web" && "web:cursor-pointer")}
      >
        <Text
          selectable={false}
          numberOfLines={1}
          className={cn("text-body", item.active ? "font-sans-bold text-primary" : "font-sans-semibold text-ink-mute")}
        >
          {item.name}
        </Text>
        {item.active ? <View className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-primary" /> : null}
      </Pressable>
    ) : (
      <Pressable
        testID={`tab-${item.name}`}
        onPress={handlePress}
        accessibilityRole="tab"
        accessibilityState={{ selected: item.active }}
        className={cn(
          "items-center justify-center rounded-lg px-4 py-2",
          fill && "flex-1",
          item.active && "bg-primary",
          Platform.OS === "web" && "web:cursor-pointer",
        )}
      >
        <Text
          selectable={false}
          numberOfLines={1}
          className={cn("font-sans-bold text-sm", item.active ? "text-white" : "text-ink-mute")}
        >
          {item.name}
        </Text>
      </Pressable>
    );

  if (item.href) {
    return (
      <Link href={item.href as any} replace asChild>
        {body}
      </Link>
    );
  }
  return body;
}

/* ── pill (segmented) ── */
function PillStrip({ items, rightSlot, testID }: { items: Item[]; rightSlot?: ReactNode; testID?: string }) {
  const scrollable = items.length > SCROLL_THRESHOLD;
  return (
    <View className="flex-row items-center gap-2 px-4 py-2" testID={testID}>
      <View className="min-w-0 flex-1 flex-row rounded-xl border border-border bg-surface-alt p-1">
        {scrollable ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }} className="flex-1">
            {items.map(item => (
              <Tab key={item.key} item={item} variant="pill" fill={false} />
            ))}
          </ScrollView>
        ) : (
          <View className="flex-1 flex-row gap-1">
            {items.map(item => (
              <Tab key={item.key} item={item} variant="pill" fill />
            ))}
          </View>
        )}
      </View>
      {rightSlot}
    </View>
  );
}

/* ── underline ── */
function UnderlineStrip({ items, rightSlot, testID }: { items: Item[]; rightSlot?: ReactNode; testID?: string }) {
  return (
    <View className="flex-row items-center border-b border-border px-2" testID={testID}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1" contentContainerStyle={{ alignItems: "flex-end" }}>
        {items.map(item => (
          <Tab key={item.key} item={item} variant="underline" fill={false} />
        ))}
      </ScrollView>
      {rightSlot ? <View className="px-2">{rightSlot}</View> : null}
    </View>
  );
}

function TabStrip({
  items,
  variant,
  rightSlot,
  testID,
}: {
  items: Item[];
  variant: SecondaryTabVariant;
  rightSlot?: ReactNode;
  testID?: string;
}) {
  return variant === "underline" ? (
    <UnderlineStrip items={items} rightSlot={rightSlot} testID={testID} />
  ) : (
    <PillStrip items={items} rightSlot={rightSlot} testID={testID} />
  );
}

export function SecondaryTabBar(props: SecondaryTabBarProps) {
  if (props.mode === "router") return <RouterTabBar {...props} />;
  return <InlineTabBar {...props} />;
}

function RouterTabBar({
  routes,
  variant = "pill",
  rightSlot,
  testID = "secondary-tabbar",
}: Extract<SecondaryTabBarProps, { mode: "router" }>) {
  const pathname = usePathname();
  const router = useRouter();

  // Longest matching path wins so nested routes (e.g. /Accounts/Categories)
  // don't also light up their parent (/Accounts).
  const activePath = routes
    .filter(r => pathname === r.path || pathname.startsWith(r.path + "/"))
    .sort((a, b) => b.path.length - a.path.length)[0]?.path;

  const items: Item[] = routes.map(route => ({
    key: route.path,
    name: route.name,
    active: activePath === route.path,
    href: route.path,
    onPress: () => router.replace(route.path as any),
  }));

  return (
    <View className="flex-1">
      <TabStrip items={items} variant={variant} rightSlot={rightSlot} testID={testID} />
      <View className="flex-1">
        <Slot />
      </View>
    </View>
  );
}

function InlineTabBar({
  tabs,
  defaultId = 1,
  variant = "pill",
  rightSlot,
  testID = "secondary-tabbar",
}: Extract<SecondaryTabBarProps, { mode: "inline" }>) {
  const [activeId, setActiveId] = useState(defaultId);
  const activeTab = tabs.find(t => t.id === activeId) ?? tabs[0];

  const items: Item[] = tabs.map(tab => ({
    key: String(tab.id),
    name: tab.name,
    active: activeId === tab.id,
    onPress: () => setActiveId(tab.id),
  }));

  return (
    <View className="flex-1">
      <TabStrip items={items} variant={variant} rightSlot={rightSlot} testID={testID} />
      <View className="flex-1">{activeTab?.render()}</View>
    </View>
  );
}
