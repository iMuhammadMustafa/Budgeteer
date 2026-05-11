import { useCallback, useEffect, useRef } from "react";
import { Dimensions, KeyboardAvoidingView, Modal, Platform, Pressable, View } from "react-native";
import useBackAction from "@/src/utils/useBackAction";
import Button from "./Button";
import MyIcon from "./MyIcon";
import ThemedText from "./ThemedText";


const modalStack: number[] = [];
let nextModalId = 1;

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

  // Register / unregister on the modal stack
  useEffect(() => {
    const currentId = idRef.current;
    if (isOpen) {
      modalStack.push(currentId);
    }
    return () => {
      const idx = modalStack.indexOf(currentId);
      if (idx !== -1) modalStack.splice(idx, 1);
    };
  }, [isOpen]);

  // Dismiss only if this modal is the top of the stack
  const handleDismiss = useCallback(() => {
    if (modalStack[modalStack.length - 1] !== idRef.current) return false;
    if (onClose) onClose();
    setIsOpen(false);
    return true;
  }, [setIsOpen, onClose]);

  useBackAction(isOpen, handleDismiss);

  return (
    <Modal
      visible={isOpen}
      onDismiss={() => {
        if (onClose) onClose();
        setIsOpen(false);
      }}
      onRequestClose={Platform.OS !== "web" ? handleDismiss : undefined}
      transparent={true}
      animationType="fade"
      className="flex-1 justify-center items-center"
    >
      <View className="flex-1 bg-black/50 justify-center items-center">
        {/* Backdrop: fills the screen behind the modal; tapping it dismisses */}
        <Pressable
          className="absolute inset-0 cursor-auto"
          onPress={e => {
            e.stopPropagation();
            handleDismiss();
          }}
        />
        {/* Content container: stopPropagation prevents taps inside from reaching the backdrop */}
        <Pressable
          onPress={e => e.stopPropagation()}
          style={Platform.OS !== "web" ? {
            width: '90%',
            maxWidth: 500,
            maxHeight: '80%',
            minHeight: Dimensions.get('window').height * 0.5,
          } : undefined}
          className={`cursor-auto ${Platform.OS === "web" ? "w-[90%] max-w-[600px] max-h-[80%] bg-card rounded-md border border-muted" : "bg-card rounded-md border border-muted"}`}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
          >
            <View className="bg-surface rounded-lg overflow-hidden flex-1">
              {title && (
                <View className="flex-row items-center justify-between p-3 border-b border-border-default bg-surface-elevated">
                  <ThemedText variant="subheading">{title}</ThemedText>
                  <Button
                    variant="ghost"
                    size="icon"
                    onPress={() => { if (onClose) onClose(); }}
                    accessibilityLabel="Close modal"
                    testID="btn-modal-close"
                  >
                    <MyIcon name="X" size={20} className="text-text-secondary" />
                  </Button>
                </View>
              )}
              <View className="flex-1">
                {children}
              </View>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
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
        <Pressable
          onPress={e => e.stopPropagation()}
          style={Platform.OS !== "web" ? {
            width: '90%',
            maxWidth: 500,
            maxHeight: '80%',
            minHeight: Dimensions.get('window').height * 0.5,
          } : undefined}
          className={Platform.OS === "web" ? "w-[90%] max-w-[500px] max-h-[80%]" : ""}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
          >
            <View className="bg-surface rounded-lg overflow-hidden flex-1">
              <View className="flex-row items-center justify-between p-3 border-b border-border-default bg-surface-elevated">
                <ThemedText variant="subheading">{title}</ThemedText>
                <Button
                  variant="ghost"
                  size="icon"
                  onPress={onClose}
                  accessibilityLabel="Close modal"
                  testID="btn-modal-wrapper-close"
                >
                  <MyIcon name="X" size={20} className="text-text-secondary" />
                </Button>
              </View>
              <View className="flex-1">
                {children}
              </View>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </View>
    </Modal>
  );
}
