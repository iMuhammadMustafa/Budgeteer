import { TableNames } from "@/src/types/database/TableNames";
import { MyTab } from "@/src/components/ui";
import { useAccountCategoryService } from "@/src/services/AccountCategories.Service";

export default function RestoreAccountCategories() {
  const service = useAccountCategoryService();

  return (
    <MyTab
      title="Deleted Account Categories"
      showTitle={false}
      service={service}
      queryKey={[TableNames.AccountCategories]}
      detailsUrl={"/Categories?categoryId=" as any}
      showDeleted
      showRestore
    />
  );
}
