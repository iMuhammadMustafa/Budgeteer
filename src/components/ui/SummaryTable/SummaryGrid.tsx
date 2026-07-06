/**
 * SummaryGrid — a frozen-corner comparison matrix, rebuilt from scratch.
 *
 * Layout (both axes freeze):
 *   ┌───────────┬───────────────────────────┐
 *   │  corner   │  period header (synced)    │  ← sticky top (outside vertical scroll)
 *   ├───────────┼───────────────────────────┤
 *   │ left      │  data area (h-scroll)      │
 *   │ panel     │  groups → categories →     │  ← shared vertical scroll
 *   │ (frozen)  │  totals                    │
 *   └───────────┴───────────────────────────┘
 *
 * The left panel is outside the horizontal ScrollView (so it stays put on
 * h-scroll) but inside the vertical ScrollView (so it scrolls with the rows).
 * The header row is outside the vertical ScrollView (stays put on v-scroll) and
 * its horizontal offset is driven by the data area's scroll. Row heights are
 * fixed constants shared by both columns so the two sides stay aligned.
 *
 * Column width is derived from the measured container width (onLayout) — not a
 * module-level Dimensions snapshot — so it reflows on resize and stays within the
 * content pane on desktop. Expense-only (see Summary view-model).
 */
import { useCallback, useRef, useState } from "react";
import { NativeScrollEvent, NativeSyntheticEvent, RefreshControl, ScrollView, View } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import { useTheme } from "@/src/providers/ThemeProvider";
import { ProgressBar } from "../ProgressBar";
import { Text } from "../Text";
import { cn } from "../utils/cn";
import { PeriodMeta, SummaryGridProps, SummaryRow } from "./types";

const HEADER_H = 44;
const GROUP_H = 46;
const CATEGORY_H = 58;
const TOTAL_H = 48;
const BUDGET_GRADIENT = ["#ef4444", "#f59e0b", "#10b981"];

/** Small up/down delta indicator. Expense up = worse (expense token); down = better (income token). */
function TrendArrow({ current, previous }: { current: number; previous?: number }) {
  const { colors } = useTheme();
  if (previous == null || current === previous) return null;
  const up = current > previous;
  return <MyIcon name={up ? "ArrowUp" : "ArrowDown"} size={11} color={up ? colors.expense : colors.income} />;
}

interface GroupBlock {
  group: string;
  groupIcon?: string | null;
  rows: SummaryRow[];
  totals: number[]; // per-period group totals
}

function buildGroups(rows: SummaryRow[], periodCount: number): GroupBlock[] {
  const order: string[] = [];
  const byGroup = new Map<string, GroupBlock>();
  for (const row of rows) {
    let block = byGroup.get(row.group);
    if (!block) {
      block = { group: row.group, groupIcon: row.groupIcon, rows: [], totals: Array(periodCount).fill(0) };
      byGroup.set(row.group, block);
      order.push(row.group);
    }
    block.rows.push(row);
    for (let i = 0; i < periodCount; i++) block.totals[i] += row.amounts[i] ?? 0;
  }
  return order.map(g => byGroup.get(g)!);
}

export function SummaryGrid({
  periods,
  rows,
  totals,
  formatCurrency,
  refreshing,
  onRefresh,
  legendWidth = 200,
  columnMinWidth = 120,
}: SummaryGridProps) {
  const headerScrollRef = useRef<ScrollView>(null);
  const [containerW, setContainerW] = useState(0);

  const periodCount = periods.length;
  const groups = buildGroups(rows, periodCount);

  // 32px from outer px-4 padding (16 × 2) + 2px from the rounded container’s border (1px each side).
  const horizontalPadding = 34;
  const available = containerW - horizontalPadding - legendWidth;
  const columnWidth =
    containerW > 0 && periodCount > 0 ? Math.max(columnMinWidth, available / periodCount) : columnMinWidth;

  const syncHeader = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    headerScrollRef.current?.scrollTo({ x: e.nativeEvent.contentOffset.x, animated: false });
  }, []);

  const dataCell = (height: number, child: React.ReactNode, key: string | number) => (
    <View key={key} style={{ width: columnWidth, height }} className="justify-center border-b border-border px-3">
      {/* <View key={key} style={{ width: columnWidth, height }} className="items-start justify-center border-b border-border px-3"> */}
      {child}
    </View>
  );

  // Display periods left-to-right: current period on left, oldest on right.
  const displayPeriods = [...periods].reverse();

  return (
    <View className="flex-1 px-4 pt-2" onLayout={e => setContainerW(e.nativeEvent.layout.width)}>
      <View className="flex-1 overflow-hidden rounded-xl border border-border">
        {/* ── sticky period header ── */}
        <View className="flex-row border-b border-border bg-surface-alt">
          <View style={{ width: legendWidth, height: HEADER_H }} className="justify-center px-3">
            <Text variant="overline">Category</Text>
          </View>
          <ScrollView ref={headerScrollRef} horizontal scrollEnabled={false} showsHorizontalScrollIndicator={false}>
            <View className="flex-row">
              {displayPeriods.map((p: PeriodMeta) => (
                <View key={p.start} style={{ width: columnWidth, height: HEADER_H }} className="justify-center px-3">
                  <Text variant="overline" className={cn(p.isCurrent && "text-primary")}>
                    {p.label}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* ── body ── */}
        <ScrollView
          className="flex-1"
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined}
        >
          <View className="flex-row">
            {/* frozen left panel */}
            <View style={{ width: legendWidth }}>
              {groups.map(block => (
                <View key={block.group}>
                  <View
                    style={{ height: GROUP_H }}
                    className="flex-row items-center border-b border-border bg-surface-alt px-3"
                  >
                    {block.groupIcon ? (
                      <View className="mr-2">
                        <MyIcon name={block.groupIcon} size={16} />
                      </View>
                    ) : null}
                    <Text className="flex-1 font-sans-semibold text-sm" numberOfLines={1}>
                      {block.group}
                    </Text>
                  </View>
                  {block.rows.map(row => (
                    <View
                      key={row.category}
                      style={{ height: CATEGORY_H }}
                      className="flex-row items-center border-b border-border px-3 pl-5"
                    >
                      {row.categoryIcon ? (
                        <View className="mr-2">
                          <MyIcon name={row.categoryIcon} size={14} />
                        </View>
                      ) : null}
                      <Text className="flex-1 text-sm text-ink-mute" numberOfLines={1}>
                        {row.category}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
              <View style={{ height: TOTAL_H }} className="justify-center border-b border-border bg-primary/10 px-3">
                <Text className="font-sans-semibold text-sm">Total</Text>
              </View>
            </View>

            {/* scrollable data area */}
            <ScrollView horizontal onScroll={syncHeader} scrollEventThrottle={16} showsHorizontalScrollIndicator>
              <View>
                {groups.map(block => (
                  <View key={block.group}>
                    {/* group aggregate row */}
                    <View className="flex-row bg-surface-alt">
                      {[...block.totals].reverse().map((amount, i, arr) =>
                        dataCell(
                          GROUP_H,
                          <View className="flex-row items-center gap-1">
                            <Text className="font-mono-semibold text-sm">{formatCurrency(amount, false)}</Text>
                            <TrendArrow current={amount} previous={i < arr.length - 1 ? arr[i + 1] : undefined} />
                          </View>,
                          i,
                        ),
                      )}
                    </View>
                    {/* category rows */}
                    {block.rows.map(row => {
                      const revAmounts = [...row.amounts].reverse();
                      const revBudgets = [...row.budgets].reverse();
                      return (
                        <View key={row.category} className="flex-row">
                          {revAmounts.map((amount, i) => {
                            const budget = revBudgets[i] ?? 0;
                            return dataCell(
                              CATEGORY_H,
                              <View className="gap-1">
                                <View className="flex-row items-center gap-1">
                                  <Text className="font-mono text-sm">{formatCurrency(amount, false)}</Text>
                                  <TrendArrow
                                    current={amount}
                                    previous={i < revAmounts.length - 1 ? revAmounts[i + 1] : undefined}
                                  />
                                </View>
                                {budget > 0 ? (
                                  <>
                                    <Text className="text-overline text-ink-faint">
                                      of {formatCurrency(budget, false)}
                                    </Text>
                                    <ProgressBar value={amount} max={budget} gradient={BUDGET_GRADIENT} height={5} />
                                  </>
                                ) : null}
                              </View>,
                              i,
                            );
                          })}
                        </View>
                      );
                    })}
                  </View>
                ))}
                {/* grand totals row */}
                <View className="flex-row bg-primary/10">
                  {[...totals].reverse().map((amount, i, arr) =>
                    dataCell(
                      TOTAL_H,
                      <View className="flex-row items-center gap-1">
                        <Text className="font-mono-semibold text-sm">{formatCurrency(amount, false)}</Text>
                        <TrendArrow current={amount} previous={i < arr.length - 1 ? arr[i + 1] : undefined} />
                      </View>,
                      i,
                    ),
                  )}
                </View>
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
