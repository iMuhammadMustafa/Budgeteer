import MyTab from "@/src/components/MyTab";
import { useAccountCategoryService } from "@/src/services/AccountCategories.Service";
import { TableNames } from "@/src/types/database/TableNames";

export default function RestoreAccountCategories() {
  const service = useAccountCategoryService();

  return (
    <MyTab
      title="Deleted Account Categories"
      service={service}
      queryKey={[TableNames.AccountCategories]}
      detailsUrl={"/Categories?categoryId=" as any}
      showDeleted
      showRestore
    />
  );
}
