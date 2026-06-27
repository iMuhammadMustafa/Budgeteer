import { View } from "react-native";
import { Text as ThemedText, Button } from "@/src/components/ui";
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
                    <ThemedText variant="h3">Restore {name}</ThemedText>
                    <ThemedText>Are you sure you want to restore {name}?</ThemedText>
                    <Button label={isPending ? "Restoring..." : "Restore"} onPress={doRestore} />
                </View>
            </MyModal>
        )
    )
}    