import { View } from "react-native";
import { Button, ResponsiveModal, Text as ThemedText } from "@/src/components/ui";

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
    const handleClose = () => {
        setIsOpen(false);
    };

    const content = (
        <View className="gap-3 p-4">
            <ThemedText>Are you sure you want to restore {name}?</ThemedText>
            <Button label={isPending ? "Restoring..." : "Restore"} onPress={doRestore} />
        </View>
    );

    return (
        <ResponsiveModal visible={isOpen} onClose={handleClose} title={`Restore ${name}`}>
            {content}
        </ResponsiveModal>
    );
}
