import Pulse from "@/src/components/elements/Pulse";
import { ChartPieIcon } from "lucide-react-native";
import { Platform, Text, useWindowDimensions, View } from "react-native";

/* ─── Shared ghost bar used in bar-chart empty states ─── */
function GhostBar({ width, height, color }: { width: number; height: number; color: string }) {
  return (
    <View
      style={{
        width,
        height,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        backgroundColor: color,
      }}
    />
  );
}

/* ─── Shared icon + message overlay ─── */
function EmptyOverlay({
  icon,
  title,
  subtitle,
  pill,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  pill?: string;
}) {
  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
      pointerEvents="none"
    >
      {/* Dashed icon container */}
      <View
        className="bg-muted/40"
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          borderWidth: 1.5,
          borderStyle: "dashed",
          borderColor: "#ddd",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>

      <Text
        className="text-muted-foreground"
        style={{ fontSize: 13, fontWeight: "600", letterSpacing: -0.2 }}
      >
        {title}
      </Text>

      {subtitle && (
        <Text
          className="text-muted-foreground/70"
          style={{ fontSize: 11.5 }}
        >
          {subtitle}
        </Text>
      )}

      {pill && (
        <View
          className="bg-muted/40 border border-muted"
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            borderRadius: 20,
            paddingVertical: 4,
            paddingHorizontal: 12,
          }}
        >
          <View
            style={{
              width: 5,
              height: 5,
              borderRadius: 2.5,
              backgroundColor: "#c8d8c8",
            }}
          />
          <Text className="text-muted-foreground/60" style={{ fontSize: 11 }}>
            {pill}
          </Text>
        </View>
      )}
    </View>
  );
}

/* ─── Simple icon components using View elements ─── */
function ChartLineIcon() {
  return (
    <View style={{ width: 18, height: 18, position: "relative" }}>
      <View style={{ position: "absolute", bottom: 2, left: 1, width: 4, height: 4, borderRadius: 2, backgroundColor: "#c8c3bc" }} />
      <View style={{ position: "absolute", bottom: 6, left: 5, width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#c8c3bc" }} />
      <View style={{ position: "absolute", bottom: 9, left: 9, width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#c8c3bc" }} />
      <View style={{ position: "absolute", bottom: 5, left: 12, width: 4, height: 4, borderRadius: 2, backgroundColor: "#c8c3bc" }} />
    </View>
  );
}

function CalendarIcon() {
  return (
    <View
      style={{
        width: 18,
        height: 18,
        borderWidth: 1.5,
        borderColor: "#c8c3bc",
        borderRadius: 3,
        padding: 2,
        justifyContent: "flex-end",
      }}
    >
      <View style={{ height: 1.5, backgroundColor: "#c8c3bc", marginBottom: 2, position: "absolute", top: 4, left: 0, right: 0 }} />
      <View style={{ flexDirection: "row", gap: 1, paddingTop: 3 }}>
        <View style={{ width: 4, height: 2, borderRadius: 1, backgroundColor: "#b5d9b5" }} />
        <View style={{ width: 4, height: 2, borderRadius: 1, backgroundColor: "#b5d9b5" }} />
      </View>
    </View>
  );
}

function ClockIcon() {
  return (
    <View
      style={{
        width: 18,
        height: 18,
        borderWidth: 1.5,
        borderColor: "#ccc7c0",
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View style={{ width: 1.5, height: 5, backgroundColor: "#ccc7c0", position: "absolute", top: 3 }} />
      <View style={{ width: 4, height: 1.5, backgroundColor: "#ccc7c0", position: "absolute", top: 7, left: 8 }} />
    </View>
  );
}

/* ═══════════════════════════════════════════════
   BAR CHART EMPTY STATE  (Week's Expenses)

   Original Bar sizes:
     chartWidth  = Math.min(width * 0.95, 600)
     chartHeight = chartWidth * 0.75
     VictoryChart width = chartWidth * (width > 700 ? 1.75 : 1)
     VictoryChart height = chartHeight
═══════════════════════════════════════════════ */
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK_H = [44, 28, 36, 52, 22, 38, 30];

export function BarEmptyState({ label }: { label: string }) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width * 0.95, 600);
  const chartHeight = chartWidth * 0.75;
  const containerWidth = chartWidth * (width > 700 ? 1.75 : 1);

  const todayIndex = new Date().getDay(); // 0=Sun..6=Sat

  return (
    <>
      <Text className="text-center text-xl font-bold text-foreground">{label}</Text>
      {/* Match VictoryChart container dimensions */}
      <View style={{ width: containerWidth, height: chartHeight, alignSelf: "center" }}>
        <Pulse duration={2400} minOpacity={0.35} maxOpacity={0.85}>
          <View style={{ position: "relative", width: containerWidth, height: chartHeight }}>
            {/* Ghost bars */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
                height: chartHeight - 28,
                paddingHorizontal: 16,
              }}
            >
              {DAYS.map((d, i) => (
                <View
                  key={d}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "flex-end",
                  }}
                >
                  <GhostBar
                    width={28}
                    height={WEEK_H[i]}
                    color={i === todayIndex ? "#daeeda" : "#eceae6"}
                  />
                </View>
              ))}
            </View>

            {/* Axis line */}
            <View
              style={{
                position: "absolute",
                bottom: 28,
                left: 16,
                right: 16,
                height: 1,
                backgroundColor: "#ebebeb",
              }}
            />

            {/* Day labels */}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                flexDirection: "row",
                height: 24,
              }}
            >
              {DAYS.map((d, i) => (
                <Text
                  key={d}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontSize: 10.5,
                    color: i === todayIndex ? "#a8d0a8" : "#d0ccc7",
                    fontWeight: i === todayIndex ? "600" : "400",
                  }}
                >
                  {d}
                </Text>
              ))}
            </View>

            {/* Overlay message */}
            <EmptyOverlay
              icon={<CalendarIcon />}
              title="Nothing logged this week"
              pill="Log an expense to get started"
            />
          </View>
        </Pulse>
      </View>
    </>
  );
}

/* ═══════════════════════════════════════════════
   DOUBLE BAR EMPTY STATE  (Net Earnings)

   Original DoubleBar sizes:
     chartWidth  = Math.min(width * 0.95, 600)
     chartHeight = chartWidth * 0.75
     VictoryChart width = chartWidth * (width > 700 ? 1.75 : 1)
     VictoryChart height = chartHeight
     + VictoryLegend inside the chart
═══════════════════════════════════════════════ */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const INC_H = [72, 66, 80, 68, 85, 74, 60, 77, 70, 82, 64, 75];
const EXP_H = [38, 35, 40, 33, 42, 36, 30, 39, 34, 41, 32, 37];

export function DoubleBarEmptyState({ label }: { label: string }) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width * 0.95, 600);
  const chartHeight = chartWidth * 0.75;
  const containerWidth = chartWidth * (width > 700 ? 1.75 : 1);

  return (
    <>
      <Text className="text-center text-xl font-bold text-foreground">{label}</Text>

      {/* Match VictoryChart container dimensions */}
      <View style={{ width: containerWidth, height: chartHeight, alignSelf: "center" }}>
        {/* Legend dots — positioned at top-right like VictoryLegend */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, paddingTop: 4, paddingBottom: 4 }}>
          {[
            ["#c8e6c9", "Income"],
            ["#ffcdd2", "Expense"],
          ].map(([c, l]) => (
            <View key={l} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c }} />
              <Text className="text-muted-foreground" style={{ fontSize: 11.5 }}>
                {l}
              </Text>
            </View>
          ))}
        </View>

        <Pulse duration={2400} minOpacity={0.35} maxOpacity={0.85} style={{ position: "relative", flex: 1 }}>
          <View style={{ position: "relative", flex: 1 }}>
            {/* Ghost bars */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
                flex: 1,
                paddingBottom: 28,
                paddingHorizontal: 8,
              }}
            >
              {MONTHS.map((m, i) => (
                <View
                  key={m}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    gap: 2,
                  }}
                >
                  <GhostBar width={10} height={INC_H[i] * (chartHeight / 200)} color="#daeeda" />
                  <GhostBar width={10} height={EXP_H[i] * (chartHeight / 200)} color="#f5dbd8" />
                </View>
              ))}
            </View>

            {/* Axis line */}
            <View
              style={{
                position: "absolute",
                bottom: 28,
                left: 8,
                right: 8,
                height: 1,
                backgroundColor: "#ebebeb",
              }}
            />

            {/* Month labels */}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                flexDirection: "row",
                height: 24,
              }}
            >
              {MONTHS.map(m => (
                <Text
                  key={m}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontSize: 10,
                    color: "#d0ccc7",
                  }}
                >
                  {m}
                </Text>
              ))}
            </View>

            {/* Overlay message */}
            <EmptyOverlay
              icon={<ChartLineIcon />}
              title="No earnings data yet"
              subtitle="Add transactions to see your monthly trend"
            />
          </View>
        </Pulse>
      </View>
    </>
  );
}

/* ═══════════════════════════════════════════════
   PIE CHART EMPTY STATE  (Categories / Groups)

   Original MyPie sizes:
     chartWidth  = Math.min(width, 600)
     chartHeight = Math.min(width, 600)
     showLegend  = width > 600 * 1.5
     VictoryContainer width = chartWidth * 1.25, height = chartHeight
     + ChartLegend below (or beside when showLegend)
═══════════════════════════════════════════════ */
const PIE_COLORS = ["#f4b8c4", "#9ecae8", "#f5d98a", "#82d4cc"];
const PIE_LABELS = ["Label 1", "Label 2", "Label 3", "Label 4"];
const PIE_WIDTHS = [56, 44, 52, 62];

export function PieEmptyState({ label }: { label: string }) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width, 600);
  const chartHeight = Math.min(width, 600);
  const showLegend = width > 600 * 1.5;
  const donutSize = Math.min(chartWidth, 300);

  return (
    <>
      <Text className={`text-center text-xl font-bold text-foreground`}>{label}</Text>

      {/* Match the original chart's outer layout structure */}
      <View
        className={`w-full justify-center overflow-visible ${Platform.OS === "web" ? "items-center" : ""} ${showLegend ? "flex flex-row " : "flex flex-col-reverse"}`}
      >
        {/* Chart area — matches <View style={{ width: chartWidth }}> + VictoryContainer dims */}
        <View style={{ width: chartWidth }} className="overflow-visible">
          <Pulse duration={2600} minOpacity={0.3} maxOpacity={0.85}>
            <View
              style={{
                height: chartHeight,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Donut ghost */}
              <View style={{ position: "relative", width: donutSize, height: donutSize }}>
                {/* Base donut ring */}
                <View
                  style={{
                    width: donutSize,
                    height: donutSize,
                    borderRadius: donutSize / 2,
                    borderWidth: donutSize * 0.12,
                    borderColor: "#f4b8c4",
                    borderTopColor: "#82d4cc",
                    borderRightColor: "#9ecae8",
                    borderBottomColor: "#f5d98a",
                    opacity: 0.35,
                  }}
                />

                {/* Center label */}
                {
                  showLegend ? (
                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 2,
                      }}
                    >
                      <ClockIcon />
                      <Text style={{ fontSize: 9.5, color: "#ccc7c0", letterSpacing: 1.2, fontWeight: "600" }}>
                        EMPTY
                      </Text>
                    </View>
                  ) :
                    (
                      <EmptyOverlay
                        icon={<ChartPieIcon />}
                        title="No categories found"
                        subtitle="Add categories to see your pie chart"
                      />
                    )
                }
              </View>
            </View>
          </Pulse>
        </View>

        {/* Legend area — matches ChartLegend placement */}
        <View className="items-center justify-center mt-2 px-2 pb-2">
          <Text className="font-bold text-md mb-2 text-foreground">Legend</Text>
          <Pulse duration={2600} minOpacity={0.3} maxOpacity={0.85}>
            <View
              style={{
                width: showLegend ? width * 0.25 * 0.9 : chartWidth,
                maxHeight: showLegend ? chartHeight * 0.8 : 60,
              }}
              className={`${showLegend ? "" : "flex-row justify-center"}`}
            >
              {PIE_LABELS.map((_, i) => (
                <View
                  key={i}
                  className={`flex-row items-center gap-2 ${showLegend ? "my-1" : "mx-2"}`}
                >
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      backgroundColor: PIE_COLORS[i],
                      opacity: 0.4,
                    }}
                  />
                  <View style={{ gap: 2 }}>
                    <View
                      style={{
                        width: PIE_WIDTHS[i],
                        height: 9,
                        borderRadius: 4,
                        backgroundColor: "#eceae6",
                      }}
                    />
                    <View
                      style={{
                        width: PIE_WIDTHS[i] * 0.65,
                        height: 7,
                        borderRadius: 4,
                        backgroundColor: "#f2f0ed",
                      }}
                    />
                  </View>
                </View>
              ))}
              {showLegend && <EmptyOverlay
                icon={<ChartPieIcon />}
                title="No categories found"
                subtitle="Add categories to see your pie chart"
              />}
            </View>
          </Pulse>
        </View>
      </View>
    </>
  );
}

/* ═══════════════════════════════════════════════
   LINE CHART EMPTY STATE  (Net Worth Growth)

   Original Line sizes:
     chartWidth  = Math.min(width * 0.95, 600)
     chartHeight = chartWidth * 0.6
     showLegend  = width > 600 * 1.5
     Inner View  = { width: chartWidth, height: chartHeight }
     + ChartLegend below (or beside when showLegend)
═══════════════════════════════════════════════ */
const LINE_MONTHS = ["Jan", "Mar", "May", "Jul", "Sep", "Nov"];
const DOT_POSITIONS = [
  { x: 8, y: 35 },
  { x: 22, y: 55 },
  { x: 36, y: 42 },
  { x: 50, y: 68 },
  { x: 64, y: 58 },
  { x: 78, y: 78 },
  { x: 92, y: 72 },
];

export function LineEmptyState({ label }: { label: string }) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width * 0.95, 600);
  const chartHeight = chartWidth * 0.6;
  const showLegend = width > 600 * 1.5;
  const areaHeight = chartHeight - 28;

  return (
    <>
      <Text className={`text-center text-xl font-bold text-foreground`}>{label}</Text>

      {/* Match the original chart's outer layout structure */}
      <View
        className={`w-full justify-center items-center ${showLegend ? "flex flex-row " : "flex flex-col-reverse"}`}
      >
        {/* Chart area — matches <View style={{ width: chartWidth, height: chartHeight }}> */}
        <View style={{ width: chartWidth, height: chartHeight }}>
          <Pulse duration={2400} minOpacity={0.35} maxOpacity={0.85}>
            <View style={{ position: "relative", width: chartWidth, height: chartHeight }}>
              {/* Horizontal grid lines */}
              {[0.25, 0.5, 0.75].map((pct, i) => (
                <View
                  key={i}
                  style={{
                    position: "absolute",
                    left: 16,
                    right: 16,
                    bottom: 28 + areaHeight * pct,
                    height: 1,
                    backgroundColor: "#f0f0f0",
                  }}
                />
              ))}

              {/* Ghost dots */}
              {DOT_POSITIONS.map((pos, i) => (
                <View
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${pos.x}%` as any,
                    bottom: 28 + (areaHeight * pos.y) / 100,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "rgba(76, 175, 80, 0.3)",
                    marginLeft: -4,
                  }}
                />
              ))}

              {/* Month labels */}
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  flexDirection: "row",
                  height: 24,
                }}
              >
                {LINE_MONTHS.map(m => (
                  <Text
                    key={m}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      fontSize: 10.5,
                      color: "#d0ccc7",
                    }}
                  >
                    {m}
                  </Text>
                ))}
              </View>

              {/* Overlay message */}
              <EmptyOverlay
                icon={<ChartLineIcon />}
                title="No growth data yet"
                subtitle="Add transactions to track your net worth over time"
              />
            </View>
          </Pulse>
        </View>

        {/* Legend area — matches ChartLegend placement */}
        <View className="items-center justify-center mt-2 px-2 pb-2">
          <Text className="font-bold text-md mb-2 text-foreground">Legend</Text>
          <Pulse duration={2400} minOpacity={0.35} maxOpacity={0.85}>
            <View
              style={{
                width: showLegend ? width * 0.25 * 0.9 : chartWidth,
                maxHeight: showLegend ? chartHeight * 0.8 : 60,
              }}
              className={`${showLegend ? "" : "flex-row justify-center"}`}
            >
              {[60, 50, 55, 45].map((w, i) => (
                <View
                  key={i}
                  className={`flex-row items-center gap-2 ${showLegend ? "my-1" : "mx-2"}`}
                >
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      backgroundColor: "#e6e6e6",
                    }}
                  />
                  <View style={{ gap: 2 }}>
                    <View
                      style={{
                        width: w,
                        height: 9,
                        borderRadius: 4,
                        backgroundColor: "#eceae6",
                      }}
                    />
                    <View
                      style={{
                        width: w * 0.65,
                        height: 7,
                        borderRadius: 4,
                        backgroundColor: "#f2f0ed",
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </Pulse>
        </View>
      </View>
    </>
  );
}
