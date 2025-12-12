import { Text, View } from "react-native";
import Button from "./Button";
import MyModal from "./MyModal";

interface ConfirmDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "primary" | "secondary" | "destructive";
}

/**
 * Cross-platform Confirmation Dialog Component
 * Replacement for React Native's Alert.alert() with buttons that works on web
 */
export default function ConfirmDialog({
  isOpen,
  setIsOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "primary",
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    setIsOpen(false);
  };

  return (
    <MyModal isOpen={isOpen} setIsOpen={setIsOpen} onClose={handleCancel}>
      <View className="p-4">
        <Text className="text-xl font-bold text-foreground mb-4">{title}</Text>
        <Text className="text-sm text-muted-foreground mb-6 whitespace-pre-line">{message}</Text>
        <View className="flex-row justify-end gap-2">
          <Button label={cancelText} onPress={handleCancel} variant="secondary" size="md" />
          <Button label={confirmText} onPress={handleConfirm} variant={confirmVariant} size="md" />
        </View>
      </View>
    </MyModal>
  );
}
