import Pulse from "@/src/components/elements/Pulse";
import { View } from "react-native";

export default function DaySkeleton() {
  return (
    <Pulse>
      <View className="px-4 py-3 border-b border-gray-200">
        {/* day header placeholder */}
        <View className="flex-row m-1 p-3 justify-between items-center bg-card border border-muted rounded-lg">
          <View className="flex-col items-start justify-start gap-2">
            <View style={{ height: 12, width: 120, backgroundColor: "#e6e6e6", borderRadius: 6, marginBottom: 10 }} />
            <View className="flex-row gap-2 items-center">
              <View style={{ height: 12, width: 120, backgroundColor: "#e6e6e6", borderRadius: 6, marginBottom: 10 }} />
            </View>
          </View>
          <View style={{ height: 12, width: 120, backgroundColor: "#e6e6e6", borderRadius: 6, marginBottom: 10 }} />
        </View>

        {/* 3 placeholder transactions */}
        {Array.from({ length: 3 }).map((_, i) => (
          <View key={i} className="flex-row items-center py-3">
            <View style={{ height: 40, width: 40, backgroundColor: "#e6e6e6", borderRadius: 20 }} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View
                style={{ height: 10, width: "60%", backgroundColor: "#e6e6e6", borderRadius: 6, marginBottom: 6 }}
              />
              <View style={{ height: 8, width: "40%", backgroundColor: "#e6e6e6", borderRadius: 6 }} />
            </View>
            <View style={{ height: 12, width: 60, backgroundColor: "#e6e6e6", borderRadius: 6 }} />
          </View>
        ))}
      </View>
    </Pulse>
  );
}
