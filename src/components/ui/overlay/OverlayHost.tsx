/**
 * OverlayHost — renders the registered overlay stack through a single root.
 *   • web   → React-DOM portal to document.body (escapes every stacking context)
 *   • native → one transparent RN <Modal> (guarantees top-most; gives Android back)
 * Esc (web) / hardware back (native) dismiss only the TOP entry.
 */
import { Fragment, useEffect, type ReactNode } from "react";
import { Modal, Platform, View, type ViewStyle } from "react-native";

import type { OverlayEntry } from "./context";

// react-dom is only present/used on web; load it lazily so native never touches it.
let createPortal: ((node: ReactNode, container: Element) => ReactNode) | undefined;
if (Platform.OS === "web") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  createPortal = require("react-dom").createPortal;
}

const WEB_ROOT_STYLE = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 } as unknown as ViewStyle;

export function OverlayHost({ entries }: { entries: OverlayEntry[] }) {
  const active = entries.length > 0;
  // Derive from the live prop (re-created when the stack changes) so we never
  // dismiss a stale top entry.
  const closeTop = () => entries[entries.length - 1]?.onRequestClose?.();

  // Web Esc → close top (capture phase so it beats other listeners; native uses Modal.onRequestClose).
  useEffect(() => {
    if (Platform.OS !== "web" || !active || typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        entries[entries.length - 1]?.onRequestClose?.();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [active, entries]);

  const content = entries.map(e => <Fragment key={e.id}>{e.node}</Fragment>);

  if (Platform.OS === "web") {
    if (!active || !createPortal || typeof document === "undefined") return null;
    // `box-none`: the fixed full-viewport root must not itself capture pointer/wheel
    // events (it lives on document.body, outside the app's scroll container, so
    // capturing here would lock page scroll behind anchored popovers). Only real
    // child surfaces — dialog/sheet backdrops and popover panels — capture events.
    return createPortal(
      <View style={WEB_ROOT_STYLE} pointerEvents="box-none">
        {content}
      </View>,
      document.body,
    );
  }

  return (
    <Modal
      visible={active}
      transparent
      animationType="none"
      onRequestClose={closeTop}
      // Draw edge-to-edge under the Android status + navigation bars so the scrim
      // and bottom sheet fill those areas instead of leaving a transparent gap.
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View className="flex-1">{content}</View>
    </Modal>
  );
}
