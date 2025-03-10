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
      <ScrollView className="flex-1 bg-black/50">
        <View className="p-4 rounded-md border border-muted flex-1 m-auto bg-card cursor-auto custom-scrollbar">
          {children}
        </View>
      </ScrollView>
    </Modal>
  );
}
