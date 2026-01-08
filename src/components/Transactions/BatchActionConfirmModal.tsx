import { TransactionsView } from "@/src/types/database/Tables.Types";
import { ActivityIndicator, Text, View } from "react-native";
import Button from "../elements/Button";
import MyModal from "../elements/MyModal";

export type BatchActionType = "delete" | "duplicate" | "update";

interface BatchActionConfirmModalProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    actionType: BatchActionType;
    selectedTransactions: TransactionsView[];
    isLoading: boolean;
    onConfirm: () => void;
    updateSummary?: string;
}

export default function BatchActionConfirmModal({
    isOpen,
    setIsOpen,
    actionType,
    selectedTransactions,
    isLoading,
    onConfirm,
    updateSummary,
}: BatchActionConfirmModalProps) {
    const totalAmount = selectedTransactions.reduce((sum, tx) => sum + (tx.amount ?? 0), 0);
    const currency = selectedTransactions[0]?.currency ?? "";

    const handleClose = () => {
        if (!isLoading) {
            setIsOpen(false);
        }
    };

    return (
        <MyModal isOpen={isOpen} setIsOpen={setIsOpen} onClose={handleClose} title="Confirm">
            <View className="p-4">
                <Text className="text-foreground text-base mb-4">
                    Are you sure you want to {actionType} {selectedTransactions.length} transaction{selectedTransactions.length > 1 ? "s" : ""}?
                </Text>

                {/* Transaction Summary */}
                <View className="bg-gray-100 rounded-md p-3 mb-4">
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-muted">Selected:</Text>
                        <Text className="text-foreground font-medium">{selectedTransactions.length} transactions</Text>
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-muted">Total Amount:</Text>
                        <Text className="text-foreground font-medium">
                            {totalAmount.toFixed(2)} {currency}
                        </Text>
                    </View>
                </View>

                {/* Update Summary - only shown for update actions */}
                {actionType === "update" && updateSummary && (
                    <View className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                        <Text className="text-blue-800 font-medium mb-1">Changes to apply:</Text>
                        <Text className="text-blue-700">{updateSummary}</Text>
                    </View>
                )}

                {/* Loading Indicator */}
                {isLoading && (
                    <View className="flex-row items-center justify-center mb-4">
                        <ActivityIndicator size="small" color="#3b82f6" />
                        <Text className="text-muted ml-2">Processing...</Text>
                    </View>
                )}

                {/* Action Buttons */}
                <View className="flex-row justify-end gap-2">
                    <Button variant="outline" onPress={handleClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button variant={actionType === "delete" ? "destructive" : "primary"} onPress={onConfirm} disabled={isLoading} loading={isLoading}>
                        {isLoading ? "Loading..." : actionType.charAt(0).toUpperCase() + actionType.slice(1)}
                    </Button>
                </View>
            </View>
        </MyModal>
    );
}
