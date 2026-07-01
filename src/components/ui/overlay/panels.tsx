/**
 * Overlay panels — the three presentational hosts. Each fills the overlay layer
 * (`absolute inset-0`) with a scrim backdrop + a positioned surface, fading in on
 * mount (minimal motion; richer motion is backlogged). Roots are absolutely
 * positioned (not flex) so stacked overlays overlay each other instead of
 * splitting the layer.
 *
 * Scrolling: CenteredPanel/BottomPanel own the body ScrollView and bound it with
 * an explicit maxHeight (a `maxHeight`-only parent does NOT constrain a child
 * ScrollView in RN), so long content scrolls instead of clipping. Pass
 * `scrollable={false}` when the child manages its own scroll (e.g. Select).
 */
import { useEffect, useState, type ReactNode } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/providers/ThemeProvider";

export interface Anchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

const SURFACE_SHADOW = Platform.select<ViewStyle>({
  android: { elevation: 8 },
  default: { shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
});

// Reserve for a fixed header / sheet grab-handle when sizing the scrollable body.
const HEADER_RESERVE = 64;
const HANDLE_RESERVE = 26;

// iOS pads above the keyboard; Android resizes (matches the legacy modal); web no-ops.
const keyboardBehavior = Platform.OS === "ios" ? "padding" : Platform.OS === "android" ? "height" : undefined;

/** Shared placement math for anchored popovers — used by AnchoredPanel and Select. */
export function resolveAnchoredPlacement(anchor: Anchor, winW: number, winH: number, matchWidth: boolean, minWidth: number) {
  const gap = 4;
  const spaceBelow = winH - (anchor.y + anchor.height);
  const spaceAbove = anchor.y;
  const placeBelow = spaceBelow >= 220 || spaceBelow >= spaceAbove;
  const width = matchWidth ? Math.max(anchor.width, minWidth) : minWidth;
  const left = Math.max(8, Math.min(anchor.x, winW - width - 8));
  const maxHeight = Math.max(140, (placeBelow ? spaceBelow : spaceAbove) - gap - 12);
  const pos: ViewStyle = placeBelow ? { top: anchor.y + anchor.height + gap } : { bottom: winH - anchor.y + gap };
  return { left, width, maxHeight, placeBelow, pos };
}

/** Opacity fade-in wrapper (RN Animated — no reanimated dependency). */
export function Fade({ children, style, duration = 140 }: { children: ReactNode; style?: ViewStyle; duration?: number }) {
  const [opacity] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration, useNativeDriver: true }).start();
  }, [opacity, duration]);
  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}

/** Full-layer scrim; tap dismisses when `dismissable`. `transparent` for popovers. */
export function Backdrop({
  onPress,
  dismissable = true,
  transparent = false,
}: {
  onPress?: () => void;
  dismissable?: boolean;
  transparent?: boolean;
}) {
  const { isDark } = useTheme();
  const scrim = transparent ? "transparent" : isDark ? "rgba(0,0,0,0.6)" : "rgba(10,10,12,0.45)";
  return (
    <Pressable
      className="absolute inset-0"
      style={{ backgroundColor: scrim }}
      onPress={dismissable ? onPress : undefined}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

function PanelBody({ children, scrollable, padded, maxHeight }: { children: ReactNode; scrollable: boolean; padded: boolean; maxHeight: number }) {
  const inner = <View className={padded ? "px-5 py-4" : undefined}>{children}</View>;
  if (!scrollable) return inner;
  return (
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator style={{ maxHeight }}>
      {inner}
    </ScrollView>
  );
}

/** Centered dialog card. `header` renders fixed above the (optionally scrollable) body. */
export function CenteredPanel({
  header,
  children,
  onClose,
  dismissable = true,
  scrollable = true,
  padded = true,
  size = "md",
  testID = "dialog",
}: {
  header?: ReactNode;
  children: ReactNode;
  onClose?: () => void;
  dismissable?: boolean;
  scrollable?: boolean;
  padded?: boolean;
  size?: "sm" | "md" | "lg";
  testID?: string;
}) {
  const { height, width } = useWindowDimensions();
  // sm/lg are deliberately close to md — most dialogs host multi-field forms, not
  // simple confirms, so even the "small" size needs room to breathe. Capped by the
  // viewport (92%) so these stay sane on narrow desktop windows just above the
  // Sheet breakpoint.
  const targetWidth = size === "sm" ? 440 : size === "lg" ? 760 : 580;
  const maxWidth = Math.min(targetWidth, width * 0.92);
  const panelMax = height * 0.85;
  const bodyMax = panelMax - (header ? HEADER_RESERVE : 0);
  return (
    <View className="absolute inset-0 items-center justify-center p-5">
      <Backdrop onPress={onClose} dismissable={dismissable} />
      <KeyboardAvoidingView behavior={keyboardBehavior} style={{ width: "100%", maxWidth }}>
        <Fade>
          <View
            testID={testID}
            accessibilityViewIsModal
            className="overflow-hidden rounded-xl border border-border bg-surface"
            style={[SURFACE_SHADOW, { maxHeight: panelMax }]}
          >
            {header}
            <PanelBody scrollable={scrollable} padded={padded} maxHeight={bodyMax}>
              {children}
            </PanelBody>
          </View>
        </Fade>
      </KeyboardAvoidingView>
    </View>
  );
}

/** Bottom sheet. Slides come later (motion backlog) — minimal fade for now. */
export function BottomPanel({
  header,
  children,
  onClose,
  dismissable = true,
  scrollable = true,
  padded = true,
  testID = "sheet",
}: {
  header?: ReactNode;
  children: ReactNode;
  onClose?: () => void;
  dismissable?: boolean;
  scrollable?: boolean;
  padded?: boolean;
  testID?: string;
}) {
  const { height } = useWindowDimensions();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const panelMax = height * 0.9;
  const bodyMax = panelMax - HANDLE_RESERVE - (header ? HEADER_RESERVE : 0) - insets.bottom;
  return (
    <View className="absolute inset-0 justify-end">
      <Backdrop onPress={onClose} dismissable={dismissable} />
      <KeyboardAvoidingView behavior={keyboardBehavior}>
        <Fade style={{ width: "100%" }}>
          <View
            testID={testID}
            accessibilityViewIsModal
            className="w-full overflow-hidden rounded-t-2xl border border-border bg-surface"
            style={[SURFACE_SHADOW, { maxHeight: panelMax, paddingBottom: insets.bottom }]}
          >
            <View className="items-center pb-1 pt-2.5">
              <View style={{ height: 4, width: 36, borderRadius: 999, backgroundColor: colors.borderStrong }} />
            </View>
            {header}
            <PanelBody scrollable={scrollable} padded={padded} maxHeight={bodyMax}>
              {children}
            </PanelBody>
          </View>
        </Fade>
      </KeyboardAvoidingView>
    </View>
  );
}

/** Anchored popover (dropdown). Opens below the trigger, flips above if cramped.
 * The child manages its own scroll bounded to the panel's maxHeight. */
export function AnchoredPanel({
  children,
  onClose,
  anchor,
  matchWidth = true,
  minWidth = 180,
  testID = "popover",
}: {
  children: ReactNode;
  onClose?: () => void;
  anchor: Anchor;
  matchWidth?: boolean;
  minWidth?: number;
  testID?: string;
}) {
  const { width: winW, height: winH } = useWindowDimensions();
  const { left, width, maxHeight, pos } = resolveAnchoredPlacement(anchor, winW, winH, matchWidth, minWidth);

  return (
    <View className="absolute inset-0">
      <Backdrop onPress={onClose} transparent />
      <Fade style={{ position: "absolute", left, width, maxHeight, ...pos }}>
        <View
          testID={testID}
          className="overflow-hidden rounded-xl border border-border bg-surface"
          style={[SURFACE_SHADOW, { maxHeight }]}
        >
          {children}
        </View>
      </Fade>
    </View>
  );
}
