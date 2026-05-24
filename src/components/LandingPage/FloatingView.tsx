import { useEffect } from "react";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";

export default function FloatingView({
  children,
  amplitude = 11,
  duration = 3000,
  style,
  className,
}: {
  children: React.ReactNode;
  amplitude?: number;
  duration?: number;
  style?: any;
  className?: string;
}) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(withTiming(-amplitude, { duration }), withTiming(amplitude, { duration })),
      -1,
      true,
    );
  }, [amplitude, duration, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View className={className} style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
