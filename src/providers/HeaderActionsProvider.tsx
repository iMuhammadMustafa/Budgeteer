/**
 * HeaderActionsProvider — lets a screen surface page-level actions (currently a
 * refresh) in the shared Topbar without the Topbar knowing about any page.
 *
 * A screen calls `useHeaderRefresh(onRefresh, refreshing)`; the Topbar renders a
 * refresh control while that screen is focused, and it clears on blur so other
 * screens don't inherit a stale handler.
 */
import { useFocusEffect } from "expo-router";
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type HeaderRefresh = { onRefresh: () => void; refreshing?: boolean };

type HeaderActionsContextType = {
  refresh: HeaderRefresh | null;
  setRefresh: (r: HeaderRefresh | null) => void;
};

const HeaderActionsContext = createContext<HeaderActionsContextType>({
  refresh: null,
  setRefresh: () => {},
});

export default function HeaderActionsProvider({ children }: { children: ReactNode }) {
  const [refresh, setRefresh] = useState<HeaderRefresh | null>(null);
  const value = useMemo(() => ({ refresh, setRefresh }), [refresh]);
  return <HeaderActionsContext.Provider value={value}>{children}</HeaderActionsContext.Provider>;
}

export const useHeaderActions = () => useContext(HeaderActionsContext);

/**
 * Register a screen's refresh handler into the Topbar while it is focused.
 * `onRefresh` is held in a ref (so an unstable handler identity never causes a
 * re-subscribe loop); the effect only re-runs when presence or `refreshing`
 * changes, keeping the Topbar's spinner state in sync.
 */
export function useHeaderRefresh(onRefresh?: () => void, refreshing = false) {
  const { setRefresh } = useHeaderActions();
  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  });
  const hasRefresh = !!onRefresh;

  useFocusEffect(
    useCallback(() => {
      setRefresh(hasRefresh ? { onRefresh: () => onRefreshRef.current?.(), refreshing } : null);
      return () => setRefresh(null);
    }, [hasRefresh, refreshing, setRefresh]),
  );
}
