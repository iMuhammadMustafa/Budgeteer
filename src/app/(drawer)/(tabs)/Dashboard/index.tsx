import { View, ScrollView, SafeAreaView, Platform } from "react-native";
import Pie from "@/src/components/Charts/Pie";
import Bar from "@/src/components/Charts/Bar";
import DoubleBar from "@/src/components/Charts/DoubleBar";
import PieChartWeb from "@/src/components/Charts/Pie.web";
import useDashboard from "./useDashboard";

export default function Dashboard() {
  const { isLoading, lastWeekExpense, monthlyNetEarnings } = useDashboard();

  if (isLoading) {
    return <View>Loading...</View>;
  }

  const sampleData = [
    { x: "Food", y: 300 },
    { x: "Travel", y: 150 },
    { x: "Entertainment", y: 120 },
    { x: "Utilities", y: 90 },
    { x: "Rent", y: 500 },
    { x: "Healthcare", y: 80 },
    { x: "Education", y: 60 },
    { x: "Miscellaneous", y: 40 },
  ];

  return (
    <SafeAreaView className="w-full h-full m-auto">
      <ScrollView>
        <View>
          <Bar data={lastWeekExpense} hideY label="Last Week Expenses" />
          <DoubleBar data={monthlyNetEarnings} label="Net Earnings" />

          {Platform.OS === "web" ? (
            <>
              <PieChartWeb data={sampleData} />
              <PieChartWeb data={sampleData} />
            </>
          ) : (
            <>
              <Pie data={sampleData} />
              <Pie data={sampleData} />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
