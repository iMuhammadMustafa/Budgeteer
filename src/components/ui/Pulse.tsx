/**
 * Pulse — opacity-breathing wrapper for skeletons. Reanimated-backed loop so it
 * runs on the UI thread and doesn't fight NativeWind classes.
 */
import { useEffect, type ReactNode } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { cn } from "./utils/cn";

export interface PulseProps {
  children: ReactNode;
  duration?: number;
  minOpacity?: number;
  maxOpacity?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function Pulse({
  children,
  duration = 1600,
  minOpacity = 0.4,
  maxOpacity = 1,
  style,
  className,
  testID = "pulse",
}: PulseProps) {
  const opacity = useSharedValue(maxOpacity);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(minOpacity, { duration: duration / 2 }),
        withTiming(maxOpacity, { duration: duration / 2 }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(opacity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, minOpacity, maxOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View testID={testID} className={cn(className)} style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}
