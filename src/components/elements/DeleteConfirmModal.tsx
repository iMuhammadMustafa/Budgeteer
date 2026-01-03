import { useState } from "react";
import { Text, View } from "react-native";
import Button from "./Button";
import DropdownField from "./dropdown/DropdownField";
import MyModal from "./MyModal";

interface DeleteConfirmModalProps<TModel> {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  itemToDelete: TModel | null;
  itemName: string;
  dependencyCount?: number;
  dependencyType?: string;
  replacementItems?: TModel[];
  replacementItemLabel?: (item: TModel) => string;
  onConfirm: (replacementItemId?: string, alsoDeleteDependencies?: boolean) => void;
  allowDeleteDependencies?: boolean;
}

export default function DeleteConfirmModal<TModel extends { id: string; name?: string }>({
  isOpen,
  setIsOpen,
  itemToDelete,
  itemName,
  dependencyCount = 0,
  dependencyType = "items",
  replacementItems = [],
  replacementItemLabel,
  onConfirm,
  allowDeleteDependencies = false,
}: DeleteConfirmModalProps<TModel>) {
  const [selectedReplacementId, setSelectedReplacementId] = useState<string | undefined>();
  const [deleteWithDependencies, setDeleteWithDependencies] = useState(false);

  const hasDependencies = dependencyCount > 0;
  const showReplacementDropdown = hasDependencies && !deleteWithDependencies;

  const handleConfirm = () => {
    if (showReplacementDropdown && !selectedReplacementId) {
      return; // Don't allow deletion without selecting replacement
    }
    onConfirm(selectedReplacementId, deleteWithDependencies);
    setIsOpen(false);
    setSelectedReplacementId(undefined);
    setDeleteWithDependencies(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setSelectedReplacementId(undefined);
    setDeleteWithDependencies(false);
  };

  const getLabel = (item: TModel): string => {
    if (replacementItemLabel) return replacementItemLabel(item);
    return item.name || item.id;
  };

  return (
    <MyModal isOpen={isOpen} setIsOpen={setIsOpen} onClose={handleCancel}>
      <View className="p-4">
        <Text className="text-xl font-bold text-foreground mb-4">Confirm Deletion</Text>

        <Text className="text-foreground mb-4">
          Are you sure you want to delete &quot;{itemToDelete?.name || itemName}&quot;?
        </Text>

        {hasDependencies && (
          <View className="mb-4">
            <Text className="text-foreground font-semibold mb-2">
              This {itemName} has {dependencyCount} associated {dependencyType}.
            </Text>

            {allowDeleteDependencies && (
              <View className="mb-4">
                <Button
                  variant={deleteWithDependencies ? "secondary" : "outline"}
                  onPress={() => setDeleteWithDependencies(!deleteWithDependencies)}
                  className="mb-2"
                >
                  {deleteWithDependencies ? "✓ " : ""}Also delete all {dependencyType}
                </Button>
              </View>
            )}

            {showReplacementDropdown && (
              <View className="z-50">
                <Text className="text-foreground mb-2">
                  Please select a {itemName} to move the {dependencyType} to:
                </Text>
                <DropdownField
                  label=""
                  options={replacementItems.map(item => ({
                    label: getLabel(item),
                    id: item.id,
                    name: getLabel(item),
                    value: item.id,
                  }))}
                  selectedValue={selectedReplacementId}
                  onSelect={(item: any) => setSelectedReplacementId(item?.id)}
                />
              </View>
            )}
          </View>
        )}

        <View className="flex-row justify-end gap-2 mt-4 -z-10">
          <Button variant="outline" onPress={handleCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onPress={handleConfirm}
            disabled={showReplacementDropdown && !selectedReplacementId}
          >
            Delete
          </Button>
        </View>
      </View>
    </MyModal>
  );
}
