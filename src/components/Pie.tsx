import React from "react";
import { View, Dimensions } from "react-native";
import { VictoryPie, VictoryLabel } from "victory-native";

const { width, height } = Dimensions.get("window");

export default function Pie({ pieChart }) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <VictoryPie
        width={width * 0.8}
        height={height * 0.5}
        padding={50}
        animate={{
          duration: 2000,
        }}
        // labelComponent={<VictoryLabel text={() => ""} />}
        events={[
          {
            target: "data",
            eventHandlers: {
              onPress: () => {
                return [
                  {
                    target: "data",
                    mutation: ({ style }) => {
                      return style.fill === "#c43a31" ? null : { style: { fill: "#c43a31" } };
                    },
                  },
                ];
              },
            },
          },
        ]}
        data={pieChart}
      />
    </View>
  );
}
