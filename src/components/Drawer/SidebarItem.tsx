import { Pressable } from "react-native";
import { Link } from "expo-router";

import { useTheme } from "@/src/providers/ThemeProvider";
import { Text } from "@/src/components/ui";
import MyIcon from "@/src/components/elements/MyIcon";

export default function SidebarItem({
  item,
  isActive,
  onPress,
}: {
  item: { label: string; icon: string; path: Href };
  isActive: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Link href={item.path} asChild onPress={e => e.preventDefault()}>
      <Pressable
        onPress={onPress}
        className={`mx-2 my-1 flex-row items-center gap-3 rounded-md px-3 py-2 ${isActive ? "bg-primary-soft" : "active:bg-surface-alt"}`}
      >
        <MyIcon name={item.icon} size={20} color={isActive ? colors.primaryDeep : colors.inkMute} />
        <Text
          selectable={false}
          className={`text-body ${isActive ? "font-sans-bold text-primary-deep" : "font-sans-medium text-ink-mute"}`}
        >
          {item.label}
        </Text>
      </Pressable>
    </Link>
  );
}
