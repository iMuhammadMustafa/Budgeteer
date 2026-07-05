/**
 * Notification (toast) registry context. A single NotificationProvider (near the
 * root) owns the toast stack and renders the ToastHost; anywhere below can call
 * `useNotify()` to push non-blocking, auto-dismissing messages.
 *
 *   const { notify } = useNotify();
 *   notify({ type: "error", message: "Couldn't delete this category." });
 *
 * Distinct from the modal overlay registry (useConfirm/useAlert): toasts stack in
 * a corner, never block interaction, and disappear on their own.
 */
import { createContext, useContext } from "react";

export type NotifyType = "error" | "success" | "info" | "warning";

export interface NotifyOptions {
  type?: NotifyType;
  /** Optional bold heading above the message. */
  title?: string;
  message: string;
  /** Auto-dismiss delay in ms. `null` keeps it until dismissed. Defaults per type. */
  duration?: number | null;
}

export interface Toast {
  id: string;
  type: NotifyType;
  title?: string;
  message: string;
  duration: number | null;
}

export interface NotificationApi {
  /** Push a toast; returns its id (pass to `dismiss`). */
  notify: (opts: NotifyOptions) => string;
  dismiss: (id: string) => void;
}

export const NotificationContext = createContext<NotificationApi | null>(null);

const NOOP_API: NotificationApi = {
  notify: opts => {
    // No provider mounted (e.g. an isolated test render). Don't crash the caller —
    // this is a cross-cutting concern that must never take a screen down.
    if (__DEV__) console.warn("[notifications] useNotify() called with no NotificationProvider:", opts.message);
    return "";
  },
  dismiss: () => {},
};

export function useNotify(): NotificationApi {
  return useContext(NotificationContext) ?? NOOP_API;
}
