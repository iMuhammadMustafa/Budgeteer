import { useEffect } from "react";
import { BackHandler, Platform } from "react-native";

/**
 * Hook that registers a callback for the hardware back button (Android)
 * and the Escape key (web). The handler is only active when `isActive` is true.
 *
 * @param isActive  – Whether the back/escape handler should be listening.
 * @param onBack    – Callback to invoke. Return `true` (or void) to consume the event
 *                    (prevent default back navigation), `false` to let it propagate.
 */
export default function useBackAction(
  isActive: boolean,
  onBack: () => boolean | void,
) {
  useEffect(() => {
    if (!isActive) return;

    // Wrap to normalise the return value (void → true = consumed)
    const handler = (): boolean => {
      const result = onBack();
      return result !== false;
    };

    // Web: Escape key
    // Only stop propagation if the handler actually consumed the event.
    // Uses stopImmediatePropagation so that when multiple listeners exist
    // on the same target (e.g. stacked modals), only the one that handles
    // the event prevents the rest from firing.
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const consumed = handler();
        if (consumed) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      }
    };

    if (Platform.OS === "web") {
      window.addEventListener("keydown", handleEscKey);
    }

    // Android: hardware back button
    const backHandler =
      Platform.OS === "android"
        ? BackHandler.addEventListener("hardwareBackPress", handler)
        : undefined;

    return () => {
      if (Platform.OS === "web") {
        window.removeEventListener("keydown", handleEscKey);
      }
      backHandler?.remove();
    };
  }, [isActive, onBack]);
}
