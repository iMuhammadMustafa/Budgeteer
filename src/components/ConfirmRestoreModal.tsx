import { Text, View } from "react-native";
import Button from "./elements/Button";
import MyModal from "./elements/MyModal";

export default function ConfirmRestoreModal({
    name,
    isOpen,
    setIsOpen,
    isPending,
    doRestore,
}: {
    name: string;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    isPending: boolean;
    doRestore: () => void;
}) {
    return (
        isOpen && (
            <MyModal
                isOpen={isOpen}
                setIsOpen={setIsOpen}
            >
                <View className="gap-3 p-4">
                    <Text className="text-lg font-bold">Restore {name}</Text>
                    <Text>Are you sure you want to restore {name}?</Text>
                    <Button label={isPending ? "Restoring..." : "Restore"} onPress={doRestore} />
                </View>
            </MyModal>
        )
    )
}    