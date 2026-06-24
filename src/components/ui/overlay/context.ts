/**
 * Overlay context — the registry API every overlay (Dialog / Sheet / Popover /
 * Select / useConfirm) talks to. The provider (src/providers/OverlayProvider.tsx)
 * supplies it and renders the registered nodes through a single portal root, so
 * overlays escape every parent stacking context (the fix for the legacy z-index
 * hacks). Mount the provider DEEP in the tree (under Theme/Storage/Auth/Query) so
 * overlay content — which renders at the host, not the call site — can still read
 * those contexts.
 */
import { createContext, useContext, type ReactNode } from "react";

export interface OverlayEntry {
  id: string;
  node: ReactNode;
  /** Invoked when this entry is the top of the stack and Esc / Android-back fires. */
  onRequestClose?: () => void;
}

export interface OverlayApi {
  /** Register an overlay node; returns its id. */
  mount: (entry: Omit<OverlayEntry, "id">) => string;
  /** Replace a mounted entry's node / handler (called as content re-renders). */
  update: (id: string, entry: Omit<OverlayEntry, "id">) => void;
  /** Remove an entry. */
  unmount: (id: string) => void;
}

export const OverlayContext = createContext<OverlayApi | null>(null);

export function useOverlayApi(): OverlayApi {
  const ctx = useContext(OverlayContext);
  if (!ctx) {
    throw new Error("useOverlayApi must be used within <OverlayProvider> — mount it in the root layout.");
  }
  return ctx;
}

export type { ReactNode };
