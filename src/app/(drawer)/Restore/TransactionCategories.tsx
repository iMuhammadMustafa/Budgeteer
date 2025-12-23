import Button from "@/src/components/elements/Button";
import MyModal from "@/src/components/elements/MyModal";
import MyTab from "@/src/components/MyTab";
import { useTransactionCategoryService } from "@/src/services/TransactionCategories.Service";
import { TableNames } from "@/src/types/database/TableNames";
import { useState } from "react";
import { Text, View } from "react-native";

export default function RestoreTransactionCategories() {
  const service = useTransactionCategoryService();
  const { mutate: restore, isPending } = service.useRestore();
  const [confirm, setConfirm] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });

  const openConfirm = (item: any) => setConfirm({ open: true, item });
  const doRestore = () => {
    if (!confirm.item) return;
    restore({ id: confirm.item.id, item: confirm.item });
    setConfirm({ open: false, item: null });
  };

  return (
    <>
      <MyTab
        title="Deleted Transaction Categories"
        service={service}
        queryKey={[TableNames.TransactionCategories]}
        detailsUrl={"/Categories?categoryId=" as any}
        showDeleted
        customAction={(item: any) => <Button rightIcon="RotateCcw" variant="ghost" onPress={() => openConfirm(item)} />}
        icons
      />
      {confirm.open && (
        <MyModal
          isOpen={confirm.open}
          setIsOpen={(open: boolean) => setConfirm({ open, item: open ? confirm.item : null })}
        >
          <View className="gap-3">
            <Text className="text-lg font-bold">Restore Transaction Category</Text>
            <Text>Are you sure you want to restore {confirm.item?.name}?</Text>
            <Button label={isPending ? "Restoring..." : "Restore"} onPress={doRestore} />
          </View>
        </MyModal>
      )}
    </>
  );
}
