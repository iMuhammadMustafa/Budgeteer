import { Modal, Pressable, ScrollView } from "react-native";

export default function MyModal({ isOpen, setIsOpen, children }: any) {
  return (
    <Modal
      visible={isOpen}
      onDismiss={() => setIsOpen(false)}
      onRequestClose={() => setIsOpen(false)}
      transparent={true}
      animationType="fade"
      className="flex-1 justify-center items-center"
      // presentationStyle="pageSheet"
      // onBackButtonPress={() => setIsOpen(false)}
      // onRequestClose={() => setIsOpen(false)}
      // onBackdropPress={() => setIsOpen(false)}
      // className="rounded-md z-50 bg-white"
      // transparent
      // presentationClassName="bg-transparent"
    >
      <Pressable className="bg-black/50 flex-1 justify-center items-center cursor-auto">
        <Pressable className="flex-1 " onPress={e => e.stopPropagation()}>
          <ScrollView className="p-4 rounded-md border border-muted flex-grow-0 m-auto bg-card cursor-auto">
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
