/**
 * usePressableAction — shared press/haptic/disabled logic for Button & IconButton
 * (and any future pressable primitive). Keeps the two components as distinct
 * ergonomics while removing the duplicated press handlers.
 *
 *   const { isDisabled, handlePress, handleLongPress } = usePressableAction({
 *     onPress, onLongPress, disabled, loading, haptic,
 *   });
 */
import { triggerHaptic, type HapticType } from "./haptic";

export interface PressableActionConfig {
  onPress: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Haptic on press; `false` to silence. Default "light". */
  haptic?: HapticType | false;
  /** Haptic on long-press (only when `onLongPress` is set). Default "medium". */
  longPressHaptic?: HapticType;
}

export interface PressableAction {
  /** disabled OR loading — the effective interaction-blocked state. */
  isDisabled: boolean;
  handlePress: () => void;
  handleLongPress: (() => void) | undefined;
}

export function usePressableAction({
  onPress,
  onLongPress,
  disabled = false,
  loading = false,
  haptic = "light",
  longPressHaptic = "medium",
}: PressableActionConfig): PressableAction {
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (isDisabled) return;
    if (haptic) triggerHaptic(haptic);
    onPress();
  };

  const handleLongPress = onLongPress
    ? () => {
        if (isDisabled) return;
        if (haptic) triggerHaptic(longPressHaptic);
        onLongPress();
      }
    : undefined;

  return { isDisabled, handlePress, handleLongPress };
}
