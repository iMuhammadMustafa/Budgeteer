import { useWindowDimensions, View } from "react-native";
import { Button, Dialog, Sheet, Text as ThemedText } from "@/src/components/ui";

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
    const { width } = useWindowDimensions();
    const useSheet = width < 768;

    const handleClose = () => {
        setIsOpen(false);
    };

    const content = (
        <View className="gap-3 p-4">
            <ThemedText>Are you sure you want to restore {name}?</ThemedText>
            <Button label={isPending ? "Restoring..." : "Restore"} onPress={doRestore} />
        </View>
    );

    return useSheet ? (
        <Sheet visible={isOpen} onClose={handleClose} title={`Restore ${name}`}>
            {content}
        </Sheet>
    ) : (
        <Dialog visible={isOpen} onClose={handleClose} title={`Restore ${name}`}>
            {content}
        </Dialog>
    );
}
