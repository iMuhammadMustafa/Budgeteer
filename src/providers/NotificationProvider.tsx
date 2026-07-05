/**
 * NotificationProvider — owns the toast stack + renders the ToastHost.
 *
 * Mount near the root (under ThemeProvider, so toasts can read theme colors) but
 * ABOVE the navigator so `useNotify()` is available on every screen. Toasts are
 * non-blocking and auto-dismiss; see ./notifications/context for the API.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { NotificationContext, type NotificationApi, type Toast } from "@/src/components/ui/notifications/context";
import { ToastHost } from "@/src/components/ui/notifications/ToastHost";

// Errors linger a little longer than confirmations; capped stack keeps things sane.
const DEFAULT_DURATION: Record<string, number> = { error: 7000, warning: 6000, success: 4000, info: 4000 };
const MAX_TOASTS = 4;

export default function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const notify = useCallback<NotificationApi["notify"]>(
    opts => {
      const type = opts.type ?? "info";
      const id = `toast-${++idRef.current}`;
      const duration = opts.duration === undefined ? DEFAULT_DURATION[type] : opts.duration;
      setToasts(prev => [...prev, { id, type, title: opts.title, message: opts.message, duration }].slice(-MAX_TOASTS));
      if (duration != null) {
        timers.current.set(id, setTimeout(() => dismiss(id), duration));
      }
      return id;
    },
    [dismiss],
  );

  // Clear any pending timers on unmount.
  useEffect(() => {
    const map = timers.current;
    return () => map.forEach(clearTimeout);
  }, []);

  const api = useMemo<NotificationApi>(() => ({ notify, dismiss }), [notify, dismiss]);

  return (
    <NotificationContext.Provider value={api}>
      {children}
      <ToastHost toasts={toasts} onDismiss={dismiss} />
    </NotificationContext.Provider>
  );
}
