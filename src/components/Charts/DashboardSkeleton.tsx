import Pulse from "@/src/components/elements/Pulse";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SKELETON_COLOR = "#e6e6e6";

/** Reusable skeleton card matching ChartsContainer styling */
function SkeletonCard({ children }: { children: React.ReactNode }) {
    const { width } = useWindowDimensions();

    const chartWidth = Math.min(width * 0.95, 600); // Use 95% of width or max 600
    const chartHeight = chartWidth * 0.75;
    return (
        <View className="gap-2 py-4 my-2 bg-card m-auto rounded-md border border-muted items-center" style={{ width: chartWidth * (chartWidth > 700 ? 1.75 : 1) }}>
            {children}
        </View>
    );
}

/** Title placeholder bar */
function TitleBar({ width = 140 }: { width?: number }) {
    return (
        <View
            style={{
                height: 14,
                width,
                backgroundColor: SKELETON_COLOR,
                borderRadius: 6,
                alignSelf: "center",
                marginBottom: 8,
            }}
        />
    );
}

/** Period controls placeholder */
function PeriodControlsPlaceholder() {
    return (
        <View className="flex-row items-center justify-center gap-4 mt-2">
            <View style={{ width: 24, height: 24, backgroundColor: SKELETON_COLOR, borderRadius: 12 }} />
            <View style={{ width: 100, height: 12, backgroundColor: SKELETON_COLOR, borderRadius: 6 }} />
            <View style={{ width: 24, height: 24, backgroundColor: SKELETON_COLOR, borderRadius: 12 }} />
        </View>
    );
}

/** Bar chart skeleton — 7 vertical bars of varying heights */
function BarSkeleton() {
    const barHeights = [60, 90, 45, 110, 70, 85, 55];
    return (
        <SkeletonCard>
            <TitleBar width={130} />
            <View className="flex-row items-end justify-center gap-3" style={{ height: 130, paddingHorizontal: 16 }}>
                {barHeights.map((h, i) => (
                    <View
                        key={i}
                        style={{
                            height: h,
                            width: 28,
                            backgroundColor: SKELETON_COLOR,
                            borderRadius: 4,
                        }}
                    />
                ))}
            </View>
            <PeriodControlsPlaceholder />
        </SkeletonCard>
    );
}

/** Double-bar (Net Earnings) skeleton — paired bars across months */
function DoubleBarSkeleton() {
    const pairs = [
        [80, 60],
        [100, 70],
        [65, 90],
        [110, 50],
        [75, 85],
        [95, 65],
    ];
    return (
        <SkeletonCard>
            <TitleBar width={120} />
            <View className="flex-row items-end justify-center gap-2" style={{ height: 140, paddingHorizontal: 12 }}>
                {pairs.map(([a, b], i) => (
                    <View key={i} className="flex-row items-end gap-1">
                        <View style={{ height: a, width: 14, backgroundColor: "#c8e6c9", borderRadius: 3 }} />
                        <View style={{ height: b, width: 14, backgroundColor: "#ffcdd2", borderRadius: 3 }} />
                    </View>
                ))}
            </View>
            {/* Legend placeholder */}
            <View className="flex-row items-center justify-center gap-4 mt-1">
                <View className="flex-row items-center gap-1">
                    <View style={{ width: 10, height: 10, backgroundColor: "#c8e6c9", borderRadius: 2 }} />
                    <View style={{ width: 50, height: 8, backgroundColor: SKELETON_COLOR, borderRadius: 4 }} />
                </View>
                <View className="flex-row items-center gap-1">
                    <View style={{ width: 10, height: 10, backgroundColor: "#ffcdd2", borderRadius: 2 }} />
                    <View style={{ width: 50, height: 8, backgroundColor: SKELETON_COLOR, borderRadius: 4 }} />
                </View>
            </View>
            <PeriodControlsPlaceholder />
        </SkeletonCard>
    );
}

/** Line chart skeleton — a wavy path approximated with dots */
function LineSkeleton() {
    const dotPositions = [
        { left: 10, bottom: 40 },
        { left: 55, bottom: 65 },
        { left: 100, bottom: 50 },
        { left: 145, bottom: 80 },
        { left: 190, bottom: 70 },
        { left: 235, bottom: 95 },
        { left: 280, bottom: 85 },
    ];
    return (
        <SkeletonCard>
            <TitleBar width={150} />
            <View style={{ height: 130, width: 310, position: "relative", alignSelf: "center" }}>
                {/* Horizontal grid lines */}
                {[30, 60, 90].map((y, i) => (
                    <View
                        key={`grid-${i}`}
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: y,
                            height: 1,
                            backgroundColor: "#f0f0f0",
                        }}
                    />
                ))}
                {/* Dots */}
                {dotPositions.map((pos, i) => (
                    <View
                        key={i}
                        style={{
                            position: "absolute",
                            left: pos.left,
                            bottom: pos.bottom,
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: SKELETON_COLOR,
                        }}
                    />
                ))}
            </View>
            <PeriodControlsPlaceholder />
        </SkeletonCard>
    );
}

/** Pie chart skeleton — circle + legend items */
function PieSkeleton() {
    return (
        <SkeletonCard>
            <TitleBar width={100} />
            <View
                style={{
                    width: 160,
                    height: 160,
                    borderRadius: 80,
                    borderWidth: 30,
                    borderColor: SKELETON_COLOR,
                    alignSelf: "center",
                }}
            />
            {/* Legend */}
            <View className="flex-row items-center justify-center gap-3 mt-2 flex-wrap px-4">
                {[70, 55, 60, 50].map((w, i) => (
                    <View key={i} className="flex-row items-center gap-1">
                        <View style={{ width: 10, height: 10, backgroundColor: SKELETON_COLOR, borderRadius: 2 }} />
                        <View style={{ width: w, height: 8, backgroundColor: SKELETON_COLOR, borderRadius: 4 }} />
                    </View>
                ))}
            </View>
            <PeriodControlsPlaceholder />
        </SkeletonCard>
    );
}

/** Calendar skeleton — day-cell grid */
function CalendarSkeleton() {
    return (
        <SkeletonCard>
            <TitleBar width={80} />
            <View className="px-4" style={{ width: 280, alignSelf: "center" }}>
                {/* Day-of-week headers */}
                <View className="flex-row justify-between mb-2">
                    {["M", "T", "W", "T", "F", "S", "S"].map((_, i) => (
                        <View key={i} style={{ width: 28, height: 8, backgroundColor: SKELETON_COLOR, borderRadius: 4 }} />
                    ))}
                </View>
                {/* 5 rows of day cells */}
                {Array.from({ length: 5 }).map((_, row) => (
                    <View key={row} className="flex-row justify-between mb-2">
                        {Array.from({ length: 7 }).map((_, col) => (
                            <View
                                key={col}
                                style={{
                                    width: 28,
                                    height: 28,
                                    backgroundColor: SKELETON_COLOR,
                                    borderRadius: 14,
                                    opacity: row === 4 && col > 3 ? 0 : 1,
                                }}
                            />
                        ))}
                    </View>
                ))}
            </View>
            <PeriodControlsPlaceholder />
        </SkeletonCard>
    );
}

/**
 * Full dashboard skeleton — mirrors the real dashboard chart layout order:
 * Bar → DoubleBar → Line → Pie (Categories) → Pie (Groups) → Calendar
 */
export default function DashboardSkeleton() {
    return (
        <SafeAreaView className="w-full h-full m-auto flex-1">
            {/* Header placeholder */}
            <View className="flex-row items-center justify-between px-4 py-2 bg-background">
                <View style={{ height: 18, width: 100, backgroundColor: SKELETON_COLOR, borderRadius: 6 }} />
                <View style={{ width: 24, height: 24, backgroundColor: SKELETON_COLOR, borderRadius: 12 }} />
            </View>
            <ScrollView className="flex-1 h-full">
                <Pulse>
                    <BarSkeleton />
                    <DoubleBarSkeleton />
                    <LineSkeleton />
                    <PieSkeleton />
                    <PieSkeleton />
                    <CalendarSkeleton />
                </Pulse>
            </ScrollView>
        </SafeAreaView>
    );
}
