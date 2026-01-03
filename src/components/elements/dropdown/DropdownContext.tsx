import React, { createContext, useCallback, useContext, useRef } from "react";
import { BackHandler, Platform } from "react-native";

interface DropdownStackItem {
  id: string;
  onClose: () => void;
}

interface DropdownContextValue {
  registerDropdown: (id: string, onClose: () => void) => void;
  unregisterDropdown: (id: string) => void;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

export function DropdownProvider({ children }: { children: React.ReactNode }) {
  const stackRef = useRef<DropdownStackItem[]>([]);
  const isClosingRef = useRef(false);

  const closeTopmost = useCallback(() => {
    if (stackRef.current.length === 0 || isClosingRef.current) return false;
    isClosingRef.current = true;
    const topItem = stackRef.current.pop();
    topItem?.onClose();
    Promise.resolve().then(() => {
      isClosingRef.current = false;
    });
    return true;
  }, []);

  const registerDropdown = useCallback((id: string, onClose: () => void) => {
    stackRef.current = stackRef.current.filter(item => item.id !== id);
    stackRef.current.push({ id, onClose });
  }, []);

  const unregisterDropdown = useCallback((id: string) => {
    stackRef.current = stackRef.current.filter(item => item.id !== id);
  }, []);

  React.useEffect(() => {
    if (Platform.OS !== "web") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stackRef.current.length > 0 && !isClosingRef.current) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        (e as any).__handled = true;
        closeTopmost();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [closeTopmost]);

  React.useEffect(() => {
    if (Platform.OS !== "android") return;

    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (stackRef.current.length > 0) {
        closeTopmost();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [closeTopmost]);

  return (
    <DropdownContext.Provider value={{ registerDropdown, unregisterDropdown }}>{children}</DropdownContext.Provider>
  );
}

export function useDropdownRegistration(id: string, isOpen: boolean, onClose: () => void) {
  const context = useContext(DropdownContext);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  React.useEffect(() => {
    if (!context) return;

    if (!isOpen) {
      context.unregisterDropdown(id);
      return;
    }

    context.registerDropdown(id, () => onCloseRef.current());
    return () => context.unregisterDropdown(id);
  }, [id, isOpen, context]);
}
