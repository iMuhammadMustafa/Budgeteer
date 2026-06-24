/**
 * OverlayHeader — title row + close affordance shared by Dialog and Sheet.
 * Renders nothing when there's no title and no close handler.
 */
import { View } from "react-native";

import { IconButton } from "../IconButton";
import { Text } from "../Text";

export function OverlayHeader({ title, onClose }: { title?: string; onClose?: () => void }) {
  if (!title && !onClose) return null;
  return (
    <View accessibilityRole="header" className="flex-row items-center justify-between gap-3 border-b border-border px-5 py-3.5">
      <Text variant="h3" numberOfLines={1} className="flex-1 text-h3">
        {title ?? ""}
      </Text>
      {onClose ? (
        <IconButton icon="X" variant="ghost" size="sm" accessibilityLabel="Close" onPress={onClose} testID="overlay-close" />
      ) : null}
    </View>
  );
}
