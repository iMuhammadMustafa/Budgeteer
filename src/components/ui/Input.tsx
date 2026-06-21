/**
 * Input — labeled text field with an optional leading icon and error state.
 * Wraps TextInput so NativeWind classes + themed placeholder/selection apply.
 *
 *   <Input label="Note" placeholder="Add a note…" value={v} onChangeText={setV} />
 *   <Input label="Email" iconName="Mail" error={errors.email} />
 */
import type { LucideIcon } from "lucide-react-native";
import { Platform, TextInput, type TextInputProps, View } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import { useTheme } from "@/src/providers/ThemeProvider";
import { cn } from "./utils/cn";
import { Text } from "./Text";

export interface InputProps extends Omit<TextInputProps, "className"> {
  label?: string;
  iconName?: string;
  icon?: LucideIcon;
  error?: string;
  className?: string;
  containerClassName?: string;
}

export function Input({
  label,
  iconName,
  icon: Icon,
  error,
  className = "",
  containerClassName = "",
  testID = "input",
  style,
  ...props
}: InputProps) {
  const { colors } = useTheme();
  return (
    <View className="w-full">
      {label ? (
        <Text variant="label" className="mb-[7px]">
          {label}
        </Text>
      ) : null}
      <View
        className={cn(
          "flex-row items-center rounded-lg border bg-surface px-3 py-3",
          error ? "border-danger" : "border-border",
          containerClassName,
        )}
      >
        {iconName ? (
          <MyIcon name={iconName} size={16} color={colors.inkFaint} style={{ marginRight: 9 }} />
        ) : Icon ? (
          <Icon size={16} color={colors.inkFaint} strokeWidth={2} style={{ marginRight: 9 }} />
        ) : null}
        <TextInput
          placeholderTextColor={colors.inkFaint}
          selectionColor={colors.primary}
          testID={testID}
          className={cn("flex-1 p-0 font-sans text-body text-ink", className)}
          // Drop the browser's default focus ring on web; the container's border conveys focus.
          style={[Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : null, style]}
          {...props}
        />
      </View>
      {error ? <Text className="mt-[5px] font-sans text-xs text-danger">{error}</Text> : null}
    </View>
  );
}
