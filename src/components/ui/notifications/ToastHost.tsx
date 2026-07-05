/**
 * ToastHost — renders the toast stack for NotificationProvider.
 *   • web    → React-DOM portal to document.body (fixed, above modals)
 *   • native → an absolutely-positioned overlay at the provider's tree position
 * The container is non-blocking (box-none / pointer-events skip); only the toast
 * cards themselves capture taps (for the close button).
 */
import { useEffect, type ReactNode } from "react";
import { Platform, Pressable, useWindowDimensions, View, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MyIcon from "@/src/components/elements/MyIcon";
import { useTheme } from "@/src/providers/ThemeProvider";

import { Text } from "../Text";
import type { NotifyType, Toast } from "./context";

let createPortal: ((node: ReactNode, container: Element) => ReactNode) | undefined;
if (Platform.OS === "web") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  createPortal = require("react-dom").createPortal;
}

// Sits above the overlay portal (zIndex 1000) so toasts are never hidden behind a modal.
const WEB_ROOT_STYLE = { position: "fixed", top: 0, left: 0, right: 0, zIndex: 1100 } as unknown as ViewStyle;

const ICON: Record<NotifyType, string> = {
  error: "CircleAlert",
  success: "CircleCheck",
  warning: "TriangleAlert",
  info: "Info",
};

const TEXT_TONE: Record<NotifyType, string> = {
  error: "text-danger",
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
};

function toneColor(colors: ReturnType<typeof useTheme>["colors"], type: NotifyType) {
  return type === "error" ? colors.danger : type === "success" ? colors.success : type === "warning" ? colors.warning : colors.info;
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-8);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 160 });
    translateY.value = withTiming(0, { duration: 160 });
  }, [opacity, translateY]);
  const anim = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));

  return (
    <Animated.View style={anim} pointerEvents="auto" className="w-full">
      <View
        testID={`toast-${toast.type}`}
        accessibilityRole="alert"
        className="w-full flex-row items-start gap-3 rounded-xl border border-border bg-surface p-3.5"
        style={{
          boxShadow: "0px 6px 20px rgba(0,0,0,0.14)",
          borderLeftWidth: 4,
          borderLeftColor: toneColor(colors, toast.type),
        }}
      >
        <View className="mt-0.5">
          <MyIcon name={ICON[toast.type]} size={18} color={toneColor(colors, toast.type)} />
        </View>
        <View className="flex-1">
          {toast.title ? (
            <Text variant="label" className={`mb-0.5 ${TEXT_TONE[toast.type]}`}>
              {toast.title}
            </Text>
          ) : null}
          <Text variant="caption" className="text-ink-mute">
            {toast.message}
          </Text>
        </View>
        <Pressable
          onPress={() => onDismiss(toast.id)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
          testID={`toast-dismiss-${toast.id}`}
          className="-mr-1 -mt-1 p-1 active:opacity-70"
        >
          <MyIcon name="X" size={16} color={colors.inkMute} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

export function ToastHost({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWide = width >= 640;

  if (toasts.length === 0) return null;

  const stack = (
    <View
      pointerEvents="box-none"
      style={{ paddingTop: insets.top + 12, paddingHorizontal: 16 }}
      className={isWide ? "items-end" : "items-center"}
    >
      <View pointerEvents="box-none" className="w-full gap-2" style={{ maxWidth: 400 }}>
        {toasts.map(t => (
          <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </View>
    </View>
  );

  if (Platform.OS === "web") {
    if (!createPortal || typeof document === "undefined") return null;
    return createPortal(
      <View style={WEB_ROOT_STYLE} pointerEvents="box-none">
        {stack}
      </View>,
      document.body,
    );
  }

  return (
    <View pointerEvents="box-none" style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1100 }}>
      {stack}
    </View>
  );
}
