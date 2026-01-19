import { useEffect, useRef } from "react";
import { BackHandler, Dimensions, KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from "react-native";
import MyIcon from "./MyIcon";

const modalStack: number[] = [];
let nextModalId = 1;
//The stack isn't actually being used atm but it's working so it's fine

export default function MyModal({
  isOpen,
  setIsOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onClose?: () => void;
  children: React.ReactNode;
  title?: string;
  animationType?: "fade" | "slide";
}) {
  const idRef = useRef<number>(nextModalId++);

  useEffect(() => {
    const currentId = idRef.current;
    const handleEscKey = (e: KeyboardEvent) => {
      if (modalStack[modalStack.length - 1] !== currentId) return;
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
      if (modalStack[modalStack.length - 1] !== currentId) return false;
      if (isOpen) {
        setIsOpen(false);
        return true;
      }
      return false;
    };

    const backHandler =
      Platform.OS === "android" ? BackHandler.addEventListener("hardwareBackPress", handleBackButton) : undefined;

    return () => {
      const idx = modalStack.indexOf(currentId);
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
      <View className="flex-1 bg-black/50 justify-center items-center">
        <Pressable
          className="absolute inset-0"
          onPress={e => {
            e.stopPropagation();
            if (onClose) onClose();
          }}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={Platform.OS !== "web" ? {
            width: '90%',
            maxWidth: 500,
            maxHeight: '80%',
            minHeight: Dimensions.get('window').height * 0.5,
          } : undefined}
          className={Platform.OS === "web" ? "w-[90%] max-w-[500px] max-h-[80%] bg-card rounded-md border border-muted" : "bg-card rounded-md border border-muted"}
        >
          <View className="bg-white rounded-lg overflow-hidden flex-1">
            {title && (
              <View className="flex-row items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
                <Text className="font-semibold text-dark">{title}</Text>
                <Pressable onPress={onClose} className="p-1">
                  <MyIcon name="X" size={20} className="text-gray-500" />
                </Pressable>
              </View>
            )}
            <View className="flex-1">
              {children}
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

interface ModalWrapperProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  animationType?: "fade" | "slide";
}

export function ModalWrapper({ visible, onClose, title, children, animationType = "fade" }: ModalWrapperProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={Platform.OS !== "web" ? onClose : undefined}
    >
      <View className="flex-1 bg-black/50 justify-center items-center">
        <Pressable className="absolute inset-0" onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={Platform.OS !== "web" ? {
            width: '90%',
            maxWidth: 500,
            maxHeight: '80%',
            minHeight: Dimensions.get('window').height * 0.5,
          } : undefined}
          className={Platform.OS === "web" ? "w-[90%] max-w-[500px] max-h-[80%]" : ""}
        >
          <View className="bg-white rounded-lg overflow-hidden flex-1">
            <View className="flex-row items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
              <Text className="font-semibold text-dark">{title}</Text>
              <Pressable onPress={onClose} className="p-1">
                <MyIcon name="X" size={20} className="text-gray-500" />
              </Pressable>
            </View>
            <View className="flex-1">
              {children}
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
