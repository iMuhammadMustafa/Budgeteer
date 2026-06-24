/**
 * OverlayProvider — owns the overlay registry + renders the single portal host.
 *
 * Mount it DEEP in the root layout (under Theme/Storage/Auth/Query) wrapping the
 * navigator: on native the host renders nodes at this position in the React tree,
 * so overlay content can read those contexts. Overlay content gets its data via
 * props, not screen-local context.
 */
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";

import { OverlayContext, type OverlayApi, type OverlayEntry } from "@/src/components/ui/overlay/context";
import { OverlayHost } from "@/src/components/ui/overlay/OverlayHost";

export default function OverlayProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<OverlayEntry[]>([]);
  const idRef = useRef(0);

  const mount = useCallback((entry: Omit<OverlayEntry, "id">) => {
    const id = `ov-${++idRef.current}`;
    setEntries(prev => [...prev, { id, ...entry }]);
    return id;
  }, []);

  const update = useCallback((id: string, entry: Omit<OverlayEntry, "id">) => {
    setEntries(prev => prev.map(it => (it.id === id ? { id, ...entry } : it)));
  }, []);

  const unmount = useCallback((id: string) => {
    setEntries(prev => prev.filter(it => it.id !== id));
  }, []);

  const api = useMemo<OverlayApi>(() => ({ mount, update, unmount }), [mount, update, unmount]);

  // closeTop is derived from the live `entries` prop inside the host, so it never
  // reads a stale stack (no effect-synced mirror).
  return (
    <OverlayContext.Provider value={api}>
      {children}
      <OverlayHost entries={entries} />
    </OverlayContext.Provider>
  );
}
