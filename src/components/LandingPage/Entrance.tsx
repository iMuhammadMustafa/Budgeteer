import type { ReactNode } from "react";
import { Platform, View, type ViewProps } from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";

type EntranceProps = ViewProps & {
  /** Delay before the animation starts, in ms. */
  delay?: number;
  /** Animation duration, in ms. */
  duration?: number;
  /** Slide-in direction. */
  direction?: "down" | "right";
  /** Distance (px) the element travels before settling. */
  distance?: number;
  children?: ReactNode;
};

/**
 * Fade/slide entrance wrapper.
 *
 * Reanimated `entering` animations do not run on web in the current stack
 * (react-native-reanimated 4 + react-native-web + React 19). On first render the
 * element is hidden via inline `visibility: hidden` and is only meant to be
 * revealed inside `AnimatedComponent.componentDidMount`; that reveal never fires
 * here, so the content stays present-but-invisible (see WebSplit's blank right
 * panel). Rather than depend on the reanimated web runtime, we drive the same
 * fade + slide with a native CSS animation on web (RNW `animationKeyframes`),
 * which is self-contained and always settles in the visible end state.
 *
 * Native platforms keep the original reanimated `entering` animation.
 */
export default function Entrance({
  delay = 0,
  duration = 500,
  direction = "down",
  distance = 16,
  style,
  children,
  ...rest
}: EntranceProps) {
  if (Platform.OS === "web") {
    const dx = direction === "right" ? distance : 0;
    const dy = direction === "down" ? distance : 0;
    return (
      <View
        style={[
          style,
          {
            animationKeyframes: {
              "0%": { opacity: 0, transform: [{ translateX: dx }, { translateY: dy }] },
              "100%": { opacity: 1, transform: [{ translateX: 0 }, { translateY: 0 }] },
            },
            animationDuration: `${duration}ms`,
            animationDelay: `${delay}ms`,
            animationFillMode: "both",
            animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          } as any,
        ]}
        {...rest}
      >
        {children}
      </View>
    );
  }

  const builder = direction === "right" ? FadeInRight : FadeInDown;
  return (
    <Animated.View entering={builder.delay(delay).duration(duration)} style={style} {...rest}>
      {children}
    </Animated.View>
  );
}
