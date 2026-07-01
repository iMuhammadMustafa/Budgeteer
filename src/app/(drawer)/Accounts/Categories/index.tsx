import AccountCategoryForm, { initialState } from "@/src/components/forms/AccountCategoryForm";
import { MyTab } from "@/src/components/ui";
import { useAccountCategoryService } from "@/src/services/AccountCategories.Service";
import { useAccountService } from "@/src/services/Accounts.Service";
import { TableNames } from "@/src/types/database/TableNames";

export default function AccountCategoriesTab() {
  const accountCategoryService = useAccountCategoryService();
  const accountService = useAccountService();

  return (
    <MyTab
      title="Account Categories"
      detailHref="/Accounts/Categories/"
      queryKey={[TableNames.AccountCategories]}
      service={accountCategoryService}
      initialState={initialState}
      UpsertModal={(category: any) => <AccountCategoryForm category={category} />}
      dependencyConfig={{
        dependencyField: "categoryid",
        dependencyService: accountService,
        dependencyType: "Accounts",
        allowDeleteDependencies: false,
      }}
    />
  );
}
