import MyTab from "@/src/components/MyTab";
import { useAccountCategoryService } from "@/src/services/AccountCategories.Service";

export default function AccountCategoriesTab() {
  const accountCategoryService = useAccountCategoryService();
  return (
    <MyTab
      title="Account Categories"
      upsertUrl={"/Accounts/Categories/Upsert?accountId="}
      queryKey={["accountcategories"]}
      service={accountCategoryService}
    />
  );
}
