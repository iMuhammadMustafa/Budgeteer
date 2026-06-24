/**
 * Popover — anchored dropdown panel pinned to a trigger (opens below, flips above
 * when cramped). The caller measures its trigger and passes the `anchor` rect
 * (see Select for the pattern). Outside-tap / Esc / back dismiss.
 */
import { type ReactNode } from "react";

import { AnchoredPanel, type Anchor } from "./panels";
import { useOverlayPortal } from "./useOverlayPortal";

export interface PopoverProps {
  visible: boolean;
  onClose: () => void;
  /** Trigger rect in window coordinates; popover stays closed until provided. */
  anchor: Anchor | null;
  children: ReactNode;
  matchWidth?: boolean;
  testID?: string;
}

export function Popover({ visible, onClose, anchor, children, matchWidth = true, testID = "popover" }: PopoverProps) {
  const active = Boolean(visible && anchor);
  const node =
    active && anchor ? (
      <AnchoredPanel onClose={onClose} anchor={anchor} matchWidth={matchWidth} testID={testID}>
        {children}
      </AnchoredPanel>
    ) : null;

  useOverlayPortal(active, node, onClose);
  return null;
}
