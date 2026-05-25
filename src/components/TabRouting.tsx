import Button from "@/src/components/elements/Button";
import { useState } from "react";
import { View } from "react-native";

type TabRoute<P> = {
  id: number;
  name: string;
  render: () => React.ReactNode;
};

export default function MyTabsRouter<P>({ tabs, defaultId = 1 }: { tabs: Array<TabRoute<P>>; defaultId?: number }) {
  const [index, setIndex] = useState(defaultId);
  const activeTab = tabs.find(tab => tab.id === index);

  return (
    <View className="flex-1">
      <View className="flex-row">
        {tabs.map(route => (
          <Button
            key={route.name}
            variant="ghost"
            className={`flex-1 rounded-none border-b-2 ${index === route.id ? "border-success" : "border-transparent"}`}
            onPress={() => setIndex(route.id)}
            label={route.name}
          />
        ))}
      </View>
      <View className="flex-1 py-2">{activeTab?.render()}</View>
    </View>
  );
}
