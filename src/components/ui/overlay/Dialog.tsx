/**
 * Dialog — centered modal card. Backdrop + Esc/back dismiss when `dismissable`.
 *
 *   <Dialog visible={open} onClose={() => setOpen(false)} title="Edit account">
 *     …form…
 *   </Dialog>
 */
import { type ReactNode } from "react";

import { OverlayHeader } from "./OverlayHeader";
import { CenteredPanel } from "./panels";
import { useOverlayPortal } from "./useOverlayPortal";

export interface DialogProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  dismissable?: boolean;
  size?: "sm" | "md" | "lg";
  /** Scroll the body when it overflows (default true). Set false for self-scrolling content. */
  scrollable?: boolean;
  testID?: string;
}

export function Dialog({
  visible,
  onClose,
  title,
  children,
  dismissable = true,
  size = "md",
  scrollable = true,
  testID = "dialog",
}: DialogProps) {
  const node = visible ? (
    <CenteredPanel
      onClose={onClose}
      dismissable={dismissable}
      size={size}
      scrollable={scrollable}
      testID={testID}
      header={<OverlayHeader title={title} onClose={title && dismissable ? onClose : undefined} />}
    >
      {children}
    </CenteredPanel>
  ) : null;

  useOverlayPortal(visible, node, dismissable ? onClose : undefined);
  return null;
}
