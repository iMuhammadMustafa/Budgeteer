/**
 * ResponsiveModal — Sheet on narrow screens, Dialog above the breakpoint.
 * This is the `width < 768 ? Sheet : Dialog` pattern that was hand-rolled at
 * every call site (upsert forms, confirms, batch actions) — one component now
 * owns the breakpoint check.
 *
 *   <ResponsiveModal visible={open} onClose={() => setOpen(false)} title="Edit account">
 *     …content…
 *   </ResponsiveModal>
 */
import { type ReactNode } from "react";
import { useWindowDimensions } from "react-native";

import { Dialog } from "./Dialog";
import { Sheet } from "./Sheet";

export interface ResponsiveModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  dismissable?: boolean;
  /** Scroll the body when it overflows (default true). Set false for self-scrolling content. */
  scrollable?: boolean;
  /** Dialog width above the breakpoint; ignored on the Sheet (narrow) side. */
  size?: "sm" | "md" | "lg";
  testID?: string;
  /** Width below which a Sheet is used instead of a Dialog (default 768). */
  breakpoint?: number;
}

export function ResponsiveModal({
  visible,
  onClose,
  title,
  children,
  dismissable = true,
  scrollable = true,
  size = "md",
  testID,
  breakpoint = 768,
}: ResponsiveModalProps) {
  const { width } = useWindowDimensions();
  const useSheet = width < breakpoint;

  return useSheet ? (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={title}
      dismissable={dismissable}
      scrollable={scrollable}
      testID={testID ?? "sheet"}
    >
      {children}
    </Sheet>
  ) : (
    <Dialog
      visible={visible}
      onClose={onClose}
      title={title}
      dismissable={dismissable}
      scrollable={scrollable}
      size={size}
      testID={testID ?? "dialog"}
    >
      {children}
    </Dialog>
  );
}
