/**
 * DeleteConfirmModal — ui-based replacement for the legacy
 * `src/components/elements/DeleteConfirmModal`. Identical props + behavior;
 * uses ui Sheet/Dialog + ui Select instead of legacy overlay/form primitives.
 */
import { useState } from "react";
import { View } from "react-native";
import { Button, ResponsiveModal, Select, Text } from "@/src/components/ui";

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
    if (showReplacementDropdown && !selectedReplacementId) return;
    onConfirm(selectedReplacementId, deleteWithDependencies);
    setIsOpen(false);
    setSelectedReplacementId(undefined);
    setDeleteWithDependencies(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedReplacementId(undefined);
    setDeleteWithDependencies(false);
  };

  const getLabel = (item: TModel): string => {
    if (replacementItemLabel) return replacementItemLabel(item);
    return item.name || item.id;
  };

  const content = (
    <View className="p-4">
      <Text variant="body" className="mb-4">
        Are you sure you want to delete &quot;{itemToDelete?.name || itemName}&quot;?
      </Text>

      {hasDependencies && (
        <View className="mb-4">
          <Text variant="label" className="mb-2">
            This {itemName} has {dependencyCount} associated {dependencyType}.
          </Text>

          {allowDeleteDependencies && (
            <View className="mb-4">
              <Button
                variant={deleteWithDependencies ? "secondary" : "outline"}
                onPress={() => setDeleteWithDependencies(prev => !prev)}
                label={`${deleteWithDependencies ? "✓ " : ""}Also delete all ${dependencyType}`}
                className="mb-2"
              />
            </View>
          )}

          {showReplacementDropdown && (
            <>
              <Text variant="label" className="mb-2">
                Please select a {itemName} to move the {dependencyType} to:
              </Text>
              <Select
                label=""
                options={replacementItems.map(item => ({
                  id: item.id,
                  label: getLabel(item),
                }))}
                value={selectedReplacementId ?? null}
                onChange={next => setSelectedReplacementId(typeof next === "string" ? next : undefined)}
              />
            </>
          )}
        </View>
      )}

      <View className="flex-row justify-end gap-2 mt-4">
        <Button variant="outline" onPress={handleClose} label="Cancel" />
        <Button
          variant="destructive"
          onPress={handleConfirm}
          disabled={showReplacementDropdown && !selectedReplacementId}
          label="Delete"
        />
      </View>
    </View>
  );

  return (
    <ResponsiveModal visible={isOpen} onClose={handleClose} title="Confirm Deletion">
      {content}
    </ResponsiveModal>
  );
}
