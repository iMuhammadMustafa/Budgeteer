import { useEffect, useRef } from "react";
import { Animated, ViewStyle } from "react-native";

type Props = {
  children?: React.ReactNode;
  style?: ViewStyle | any;
  duration?: number; // total cycle ms
  minOpacity?: number;
  maxOpacity?: number;
};

export default function Pulse({ children, style, duration = 2000, minOpacity = 0.4, maxOpacity = 1 }: Props) {
  const opacity = useRef(new Animated.Value(maxOpacity)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: minOpacity,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: maxOpacity,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity, duration, minOpacity, maxOpacity]);

  return <Animated.View style={[{ opacity }, style]}>{children}</Animated.View>;
}
