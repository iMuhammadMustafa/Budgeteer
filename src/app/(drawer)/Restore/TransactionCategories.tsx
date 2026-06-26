import { MyTab } from "@/src/components/ui";
import { useTransactionCategoryService } from "@/src/services/TransactionCategories.Service";
import { TableNames } from "@/src/types/database/TableNames";

export default function RestoreTransactionCategories() {
  const service = useTransactionCategoryService();

  return (
    <MyTab
      title="Deleted Transaction Categories"
      service={service}
      queryKey={[TableNames.TransactionCategories]}
      detailsUrl={"/Categories?categoryId=" as any}
      showDeleted
      showRestore
      icons
    />
  );
}
