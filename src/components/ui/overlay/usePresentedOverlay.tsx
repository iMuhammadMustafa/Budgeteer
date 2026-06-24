/**
 * usePresentedOverlay — shared "trigger → presented overlay" plumbing for pickers
 * (ColorPicker, IconPicker, …). Resolves `present` responsively (popover ≥640px,
 * sheet below), measures the trigger for popovers, re-measures on web scroll/resize,
 * and wraps the caller's content in the right panel. The caller supplies a
 * `renderContent(close)` and spreads `triggerRef` + `openOverlay` onto its trigger.
 *
 * (Select.tsx predates this and inlines the same logic; it can adopt this later.)
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Platform, useWindowDimensions, View } from "react-native";

import { OverlayHeader } from "./OverlayHeader";
import { AnchoredPanel, BottomPanel, CenteredPanel, resolveAnchoredPlacement, type Anchor } from "./panels";
import { useOverlayPortal } from "./useOverlayPortal";

export type OverlayPresent = "auto" | "popover" | "sheet" | "dialog";

const AUTO_POPOVER_MIN_WIDTH = 640;

export function usePresentedOverlay({
  present = "auto",
  title,
  matchTriggerWidth = true,
  renderContent,
  onClose,
}: {
  present?: OverlayPresent;
  title?: string;
  matchTriggerWidth?: boolean;
  /** Builds the overlay body. `contentMaxHeight` is the height available for a scrollable list. */
  renderContent: (close: () => void, contentMaxHeight: number) => ReactNode;
  /** Fired on every close path (select / backdrop / Esc / back) — e.g. to reset a search query. */
  onClose?: () => void;
}) {
  const { width: winW, height: winH } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const triggerRef = useRef<View>(null);
  const resolved = present === "auto" ? (winW >= AUTO_POPOVER_MIN_WIDTH ? "popover" : "sheet") : present;

  // Available height for the caller's scrollable content (placement-aware for popovers).
  const placement = resolved === "popover" && anchor ? resolveAnchoredPlacement(anchor, winW, winH, matchTriggerWidth, 180) : null;
  const contentMaxHeight = resolved === "popover" ? (placement?.maxHeight ?? 280) : Math.round(winH * 0.6);

  const mountedRef = useRef(true);
  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  const close = () => {
    setOpen(false);
    onClose?.();
  };
  const measure = (then?: () => void) =>
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      // measureInWindow resolves async on native — bail if we unmounted meanwhile.
      if (!mountedRef.current) return;
      setAnchor({ x, y, width, height });
      then?.();
    });
  const openOverlay = () => {
    if (resolved === "popover") measure(() => setOpen(true));
    else setOpen(true);
  };

  // Web: keep an open popover pinned to its trigger as the page scrolls / resizes.
  useEffect(() => {
    if (Platform.OS !== "web" || !open || resolved !== "popover" || typeof window === "undefined") return;
    const remeasure = () => measure();
    window.addEventListener("scroll", remeasure, true);
    window.addEventListener("resize", remeasure);
    return () => {
      window.removeEventListener("scroll", remeasure, true);
      window.removeEventListener("resize", remeasure);
    };
  }, [open, resolved]);

  const header = title ? <OverlayHeader title={title} onClose={close} /> : undefined;
  let node: ReactNode = null;
  if (open) {
    const content = renderContent(close, contentMaxHeight);
    if (resolved === "popover" && anchor) {
      node = (
        <AnchoredPanel onClose={close} anchor={anchor} matchWidth={matchTriggerWidth}>
          {content}
        </AnchoredPanel>
      );
    } else if (resolved === "sheet") {
      node = (
        <BottomPanel onClose={close} header={header} scrollable={false} padded={false}>
          {content}
        </BottomPanel>
      );
    } else {
      node = (
        <CenteredPanel onClose={close} header={header} scrollable={false} padded={false}>
          {content}
        </CenteredPanel>
      );
    }
  }
  useOverlayPortal(open && (resolved !== "popover" || !!anchor), node, close);

  return { triggerRef, openOverlay, close, isOpen: open, present: resolved, contentMaxHeight };
}
