/**
 * useOverlayPortal — bridges a declarative `visible` + `node` to the imperative
 * overlay registry. Mounts the node when active, keeps it fresh as the caller
 * re-renders, and unmounts when hidden or on unmount.
 */
import { useEffect, useRef, type ReactNode } from "react";

import { useOverlayApi } from "./context";

export function useOverlayPortal(active: boolean, node: ReactNode, onRequestClose?: () => void) {
  const api = useOverlayApi();
  const idRef = useRef<string | null>(null);

  // Mount / update / unmount on every render based on `active`. No dep array on
  // purpose: re-running each render keeps `node` (which captures live props) fresh.
  useEffect(() => {
    if (active) {
      if (idRef.current == null) idRef.current = api.mount({ node, onRequestClose });
      else api.update(idRef.current, { node, onRequestClose });
    } else if (idRef.current != null) {
      api.unmount(idRef.current);
      idRef.current = null;
    }
  });

  // Safety net: drop the entry if the caller unmounts while still active.
  useEffect(
    () => () => {
      if (idRef.current != null) {
        api.unmount(idRef.current);
        idRef.current = null;
      }
    },
    [api],
  );
}
