/**
 * Shared haptic utility (extracted from the old Button so any component can use
 * it). No-ops safely where haptics are unavailable (web / unsupported devices).
 */
import * as Haptics from "expo-haptics";

export type HapticType = "light" | "medium" | "heavy" | "selection" | "success" | "error" | "warning";

export async function triggerHaptic(type: HapticType = "light"): Promise<void> {
  try {
    switch (type) {
      case "light":
        return await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      case "medium":
        return await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      case "heavy":
        return await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      case "selection":
        return await Haptics.selectionAsync();
      case "success":
        return await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      case "error":
        return await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      case "warning":
        return await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  } catch {
    // haptics unsupported here — ignore
  }
}
