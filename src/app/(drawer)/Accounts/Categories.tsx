import AccountCategoryForm, { initialState } from "@/src/components/forms/AccountCategoryForm";
import MyTab from "@/src/components/MyTab";
import { useAccountCategoryService } from "@/src/services/AccountCategories.Service";

export default function AccountCategoriesTab() {
  const accountCategoryService = useAccountCategoryService();
  return (
    <MyTab
      title="Account Categories"
      detailsUrl={"/Accounts/Categories/Upsert?accountId="}
      queryKey={["accountcategories"]}
      service={accountCategoryService}
      initialState={initialState}
      UpsertModal={(category: any) => <AccountCategoryForm category={category} />}
    />
  );
}
