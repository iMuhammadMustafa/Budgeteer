import { TableNames } from "@/src/types/database/TableNames";
import { queryKeys } from "@/src/services/queryKeys";
import { MyTab } from "@/src/components/ui";
import { useTransactionCategoryService } from "@/src/services/TransactionCategories.Service";

export default function RestoreTransactionCategories() {
  const service = useTransactionCategoryService();

  return (
    <MyTab
      title="Deleted Transaction Categories"
      showTitle={false}
      service={service}
      queryKey={queryKeys.transactionCategories.all}
      detailsUrl={"/Categories?categoryId=" as any}
      showDeleted
      showRestore
      icons
    />
  );
}
