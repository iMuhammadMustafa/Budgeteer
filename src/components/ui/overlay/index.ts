/** Overlay core — public surface for the design system barrel. */
export { OverlayContext, useOverlayApi, type OverlayApi, type OverlayEntry } from "./context";
export { OverlayHost } from "./OverlayHost";
export { useOverlayPortal } from "./useOverlayPortal";
export { Backdrop, Fade, CenteredPanel, BottomPanel, AnchoredPanel, type Anchor } from "./panels";
export { OverlayHeader } from "./OverlayHeader";
export { Dialog, type DialogProps } from "./Dialog";
export { Sheet, type SheetProps } from "./Sheet";
export { Popover, type PopoverProps } from "./Popover";
export { useConfirm, useAlert, type ConfirmOptions, type AlertOptions } from "./useConfirm";
