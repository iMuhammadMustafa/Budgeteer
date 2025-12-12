import { useState } from "react";

interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "primary" | "secondary" | "destructive";
}

/**
 * Hook for managing dialog state
 * Provides utilities for showing alerts and confirmations
 */
export function useDialog() {
  const [alertState, setAlertState] = useState<DialogState>({
    isOpen: false,
    title: "",
    message: "",
  });

  const [confirmState, setConfirmState] = useState<DialogState>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const showAlert = (title: string, message: string, onConfirm?: () => void, confirmText?: string) => {
    setAlertState({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText,
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      onCancel?: () => void;
      confirmText?: string;
      cancelText?: string;
      confirmVariant?: "primary" | "secondary" | "destructive";
    },
  ) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      onConfirm,
      onCancel: options?.onCancel,
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
      confirmVariant: options?.confirmVariant,
    });
  };

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  };

  const closeConfirm = () => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  };

  return {
    alertState,
    confirmState,
    showAlert,
    showConfirm,
    closeAlert,
    closeConfirm,
  };
}
