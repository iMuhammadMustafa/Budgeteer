import { Text, View } from "react-native";
import Button from "./Button";
import MyModal from "./MyModal";

interface AlertDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
}

/**
 * Cross-platform Alert Dialog Component
 * Replacement for React Native's Alert.alert() that works on web
 */
export default function AlertDialog({
  isOpen,
  setIsOpen,
  title,
  message,
  onConfirm,
  confirmText = "OK",
}: AlertDialogProps) {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    setIsOpen(false);
  };

  return (
    <MyModal isOpen={isOpen} setIsOpen={setIsOpen}>
      <View className="p-4">
        <Text className="text-xl font-bold text-foreground mb-4">{title}</Text>
        <Text className="text-sm text-muted-foreground mb-6 whitespace-pre-line">{message}</Text>
        <View className="flex-row justify-end gap-2">
          <Button label={confirmText} onPress={handleConfirm} variant="primary" size="md" />
        </View>
      </View>
    </MyModal>
  );
}
