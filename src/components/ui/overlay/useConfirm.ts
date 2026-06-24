/**
 * useConfirm / useAlert — imperative confirm + alert dialogs over the overlay
 * registry, so the many "are you sure?" call sites collapse to one await:
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ title: "Delete?", message: "This can't be undone.", tone: "danger" })) { … }
 *
 *   const alert = useAlert();
 *   await alert({ title: "Saved", message: "Your changes are saved." });
 */
import { useCallback } from "react";

import { useOverlayApi } from "./context";
import { ConfirmContent } from "./ConfirmContent";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
}

export interface AlertOptions {
  title?: string;
  message: string;
  buttonLabel?: string;
}

export function useConfirm() {
  const api = useOverlayApi();
  return useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>(resolve => {
        let id = "";
        const done = (result: boolean) => {
          api.unmount(id);
          resolve(result);
        };
        id = api.mount({
          node: ConfirmContent({ ...opts, onConfirm: () => done(true), onCancel: () => done(false) }),
          onRequestClose: () => done(false),
        });
      }),
    [api],
  );
}

export function useAlert() {
  const api = useOverlayApi();
  return useCallback(
    (opts: AlertOptions) =>
      new Promise<void>(resolve => {
        let id = "";
        const done = () => {
          api.unmount(id);
          resolve();
        };
        id = api.mount({
          node: ConfirmContent({
            title: opts.title,
            message: opts.message,
            confirmLabel: opts.buttonLabel ?? "OK",
            onConfirm: done,
          }),
          onRequestClose: done,
        });
      }),
    [api],
  );
}
