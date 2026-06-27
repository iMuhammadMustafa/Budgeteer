/**
 * chartAdapters — pure transforms from the legacy Stats.Service chart shapes
 * (`BarDataType`/`DoubleBarPoint`/`LineChartPoint`/`PieData`/`MyCalendarData`)
 * to the new `ui/charts` datum shapes. Centralized so Dashboard + Details share
 * them; deleted in Step 5 once Stats.Service is reshaped to emit the new types.
 */
import type { BarDatum, DonutDatum, DoubleBarDatum, LineDatum } from "@/src/components/ui";
import type { BarDataType, DoubleBarPoint, LineChartPoint, MyCalendarData, PieData } from "@/src/types/components/Charts.types";

export function toBarData(data: BarDataType[] = []): BarDatum[] {
  return data.map(d => ({ label: d.x, value: d.y, color: d.color }));
}

export function toLineData(data: LineChartPoint[] = []): LineDatum[] {
  return data.map(d => ({ label: d.x, value: d.y }));
}

export function toDonutData(data: PieData[] = []): DonutDatum[] {
  return data.map(d => ({ label: d.x, value: d.y }));
}

export interface DoubleBarAdapted {
  data: DoubleBarDatum[];
  bar1Label: string;
  bar2Label: string;
  bar1Color?: string;
  bar2Color?: string;
}

export function toDoubleBar(data: DoubleBarPoint[] = []): DoubleBarAdapted {
  const first = data[0];
  return {
    data: data.map(d => ({ label: d.x, income: d.barOne.value, expense: d.barTwo.value })),
    bar1Label: first?.barOne.label ?? "Income",
    bar2Label: first?.barTwo.label ?? "Expense",
    bar1Color: first?.barOne.color,
    bar2Color: first?.barTwo.color,
  };
}

/**
 * Calendar heatmap is shape-compatible already (`{ [day]: { dots: [{key,color}] } }`).
 * Identity passthrough kept for typing + a single migration seam.
 */
export function toHeatmap(data: MyCalendarData = {}): MyCalendarData {
  return data;
}
