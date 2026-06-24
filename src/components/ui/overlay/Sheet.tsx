/**
 * Sheet — bottom sheet. Backdrop + Esc/back dismiss when `dismissable`.
 *
 *   <Sheet visible={open} onClose={() => setOpen(false)} title="Filters">
 *     …content…
 *   </Sheet>
 */
import { type ReactNode } from "react";

import { OverlayHeader } from "./OverlayHeader";
import { BottomPanel } from "./panels";
import { useOverlayPortal } from "./useOverlayPortal";

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  dismissable?: boolean;
  /** Scroll the body when it overflows (default true). */
  scrollable?: boolean;
  testID?: string;
}

export function Sheet({
  visible,
  onClose,
  title,
  children,
  dismissable = true,
  scrollable = true,
  testID = "sheet",
}: SheetProps) {
  const node = visible ? (
    <BottomPanel
      onClose={onClose}
      dismissable={dismissable}
      scrollable={scrollable}
      testID={testID}
      header={<OverlayHeader title={title} onClose={title && dismissable ? onClose : undefined} />}
    >
      {children}
    </BottomPanel>
  ) : null;

  useOverlayPortal(visible, node, dismissable ? onClose : undefined);
  return null;
}
