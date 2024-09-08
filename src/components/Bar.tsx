import React from "react";
import { View, Dimensions } from "react-native";
import { VictoryBar, VictoryChart, VictoryTheme } from "victory-native";

const { width, height } = Dimensions.get("window");

export default function Bar({ data }) {
  return (
    <View className="p-5 m-auto">
      <VictoryChart theme={VictoryTheme.material} domainPadding={{ x: 50 }} width={width / 2}>
        <VictoryBar
          style={{ data: { fill: "rgba(0, 0, 0, 0.5" } }}
          barRatio={0.5}
          alignment="middle"
          // barWidth={({ index }) => 30}
          scale={{ x: "linear", y: "linear" }}
          labels={({ datum }) => datum.y}
          animate={{
            duration: 2000,
            onLoad: { duration: 1000 },
          }}
          data={data}
        />
      </VictoryChart>
    </View>
  );
}
