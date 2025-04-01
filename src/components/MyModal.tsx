import { Modal, Pressable, ScrollView, View } from "react-native";

export default function MyModal({ isOpen, setIsOpen, children }: any) {
  return (
    <Modal
      visible={isOpen}
      onDismiss={() => setIsOpen(false)}
      onRequestClose={() => setIsOpen(false)}
      transparent={true}
      animationType="fade"
      className="flex-1 justify-center items-center"
    >
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View className="max-h-[80%] w-[90%] bg-card rounded-md border border-muted">
          <ScrollView className="flex-grow" contentContainerStyle={{ padding: 16 }}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
