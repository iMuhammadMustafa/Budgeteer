/**
 * Skeleton primitives — compose any loading placeholder from these.
 *   <SkeletonBlock width="60%" height={12} />
 *   <SkeletonGroup count={4} />            // list of transaction-shaped rows
 */
import { Fragment, type ReactNode } from "react";
import { type DimensionValue, type StyleProp, View, type ViewStyle } from "react-native";

import { Pulse } from "./Pulse";

export interface SkeletonBlockProps {
  width: DimensionValue;
  height: number;
  radius?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

/** A single token-colored rounded rectangle (no animation of its own). */
export function SkeletonBlock({ width, height, radius = 6, className = "", style }: SkeletonBlockProps) {
  return <View className={`bg-surface-alt ${className}`} style={[{ width, height, borderRadius: radius }, style]} />;
}

/** Transaction-shaped row: icon circle + two text lines + trailing amount. */
export function SkeletonRow() {
  return (
    <View className="flex-row items-center px-[15px] py-[13px]">
      <SkeletonBlock width={42} height={42} radius={12} />
      <View className="ml-[13px] flex-1 gap-2">
        <SkeletonBlock width="55%" height={12} />
        <SkeletonBlock width="35%" height={10} />
      </View>
      <SkeletonBlock width={64} height={14} />
    </View>
  );
}

export interface SkeletonGroupProps {
  count?: number;
  renderRow?: (index: number) => ReactNode;
  duration?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Wraps N rows in a single Pulse envelope. */
export function SkeletonGroup({ count = 3, renderRow, duration, className = "", style, testID = "skeleton" }: SkeletonGroupProps) {
  return (
    <Pulse duration={duration} style={style} testID={testID}>
      <View className={className}>
        {Array.from({ length: count }).map((_, i) => (
          <Fragment key={i}>{renderRow ? renderRow(i) : <SkeletonRow />}</Fragment>
        ))}
      </View>
    </Pulse>
  );
}
