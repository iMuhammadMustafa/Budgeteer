import React from "react";
import { View, Dimensions, TouchableOpacity } from "react-native";
import { Svg, G, Path } from "react-native-svg";
import { pie, arc } from "d3-shape";

const MyPie = ({ data, onSlicePress }) => {
  const width = Dimensions.get("window").width;
  const height = Dimensions.get("window").height / 2;
  const radius = Math.min(width, height) / 2;

  // Log data for debugging
  console.log("Pie chart data:", data);

  const pieData = pie().value(d => d.sum)(data);
  const arcGenerator = arc().innerRadius(0).outerRadius(radius);

  return (
    <View>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <G transform={`translate(${width / 2}, ${height / 2})`}>
          {pieData.map((slice, index) => (
            <TouchableOpacity key={index} onPress={() => onSlicePress(data[index])}>
              <Path d={arcGenerator(slice)} fill={data[index].color} />
            </TouchableOpacity>
          ))}
        </G>
      </Svg>
    </View>
  );
};

export default MyPie;
