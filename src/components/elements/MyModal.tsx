import { useEffect, useRef } from "react";
import { BackHandler, Modal, Platform, Pressable, ScrollView } from "react-native";

const modalStack: number[] = [];
let nextModalId = 1;
//The stack isn't actually being used atm but it's working so it's fine

export default function MyModal({
  isOpen,
  setIsOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onClose?: () => void;
  children: React.ReactNode;
}) {
  const idRef = useRef<number>(nextModalId++);

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (modalStack[modalStack.length - 1] !== idRef.current) return;
      if (e.key === "Escape") {
        e.stopImmediatePropagation?.();
        e.stopPropagation();
        e.preventDefault();
        setIsOpen(false);
      }
    };
    if (Platform.OS === "web") {
      window.addEventListener("keydown", handleEscKey);
    }

    const handleBackButton = () => {
      if (modalStack[modalStack.length - 1] !== idRef.current) return false;
      if (isOpen) {
        setIsOpen(false);
        return true;
      }
      return false;
    };

    const backHandler =
      Platform.OS === "android" ? BackHandler.addEventListener("hardwareBackPress", handleBackButton) : undefined;

    return () => {
      const idx = modalStack.indexOf(idRef.current);
      if (idx !== -1) modalStack.splice(idx, 1);
      if (backHandler) {
        backHandler.remove();
      }

      if (Platform.OS === "web") {
        window.removeEventListener("keydown", handleEscKey);
      }
    };
  }, [isOpen, setIsOpen]);

  return (
    <Modal
      visible={isOpen}
      onDismiss={() => {
        console.log("Fkkk");
        if (onClose) onClose();
        setIsOpen(false);
      }}
      onRequestClose={() => {
        if (onClose) onClose();
        setIsOpen(false);
      }}
      transparent={true}
      animationType="fade"
      className="flex-1 justify-center items-center"
    >
      <Pressable className="flex-1 bg-black/50 justify-center items-center" onPress={() => setIsOpen(false)}>
        <Pressable
          className="max-h-[80%] w-[90%] bg-card rounded-md border border-muted"
          onPress={e => e.stopPropagation()}
        >
          <ScrollView className="flex-grow" contentContainerStyle={{ padding: 16 }}>
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
