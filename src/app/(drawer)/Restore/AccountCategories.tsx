import ConfirmRestoreModal from "@/src/components/ConfirmRestoreModal";
import Button from "@/src/components/elements/Button";
import MyTab from "@/src/components/MyTab";
import { useAccountCategoryService } from "@/src/services/AccountCategories.Service";
import { TableNames } from "@/src/types/database/TableNames";
import { useState } from "react";

export default function RestoreAccountCategories() {
  const service = useAccountCategoryService();
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
        title="Deleted Account Categories"
        service={service}
        queryKey={[TableNames.AccountCategories]}
        detailsUrl={"/Categories?categoryId=" as any}
        customAction={(item: any) => <Button rightIcon="RotateCcw" variant="ghost" onPress={() => openConfirm(item)} />}
        showDeleted
      />
      <ConfirmRestoreModal
        name="Account Category"
        isOpen={confirm.open}
        setIsOpen={(open: boolean) => setConfirm({ open, item: open ? confirm.item : null })}
        isPending={isPending}
        doRestore={doRestore}
      />
    </>
  );
}
