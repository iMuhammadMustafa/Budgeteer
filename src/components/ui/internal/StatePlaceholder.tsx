/**
 * StatePlaceholder — internal shared layout for EmptyState / ErrorState.
 * Icon tile + optional pill + title + optional message + optional action,
 * centered in a filling container. Tone differences (tile bg, icon/title color,
 * action shape) are passed in by the wrapper.
 *
 * Internal: NOT exported from the barrel — use the EmptyState / ErrorState
 * wrappers, which encode the semantic defaults.
 */
import { View } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import { Badge } from "../Badge";
import { Button } from "../Button";
import { Text } from "../Text";
import { cn } from "../utils/cn";

export interface StatePlaceholderAction {
  label: string;
  onPress: () => void;
  leadingIcon?: string;
  testID?: string;
}

export interface StatePlaceholderProps {
  iconName: string;
  /** Raw hex for the icon (theme-derived by the wrapper). */
  iconColor: string;
  /** Tailwind bg class for the icon tile, e.g. "bg-surface-alt". */
  tileClassName: string;
  title: string;
  /** Tailwind text class for the title, e.g. "text-expense". */
  titleClassName?: string;
  message?: string;
  /** Tailwind max-width class for the message line. Default "max-w-[300px]". */
  messageClassName?: string;
  pill?: string;
  action?: StatePlaceholderAction;
  testID?: string;
  className?: string;
}

export function StatePlaceholder({
  iconName,
  iconColor,
  tileClassName,
  title,
  titleClassName,
  message,
  messageClassName = "max-w-[300px]",
  pill,
  action,
  testID,
  className,
}: StatePlaceholderProps) {
  return (
    <View testID={testID} className={cn("flex-1 items-center justify-center gap-3 px-8 py-12", className)}>
      <View className={cn("h-16 w-16 items-center justify-center rounded-xl", tileClassName)}>
        <MyIcon name={iconName} size={28} color={iconColor} />
      </View>
      {pill ? <Badge tone="neutral" label={pill} /> : null}
      <Text variant="h3" className={cn("text-center", titleClassName)}>
        {title}
      </Text>
      {message ? (
        <Text variant="caption" className={cn("text-center", messageClassName)}>
          {message}
        </Text>
      ) : null}
      {action ? (
        <Button
          label={action.label}
          variant="secondary"
          size="sm"
          leadingIcon={action.leadingIcon}
          onPress={action.onPress}
          testID={action.testID}
          className="mt-2"
        />
      ) : null}
    </View>
  );
}
