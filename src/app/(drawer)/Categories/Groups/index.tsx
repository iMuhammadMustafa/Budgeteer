import TransactionGroupForm, { initialState } from "@/src/components/forms/TransactionGroupForm";
import { MyTab } from "@/src/components/ui";
import { useTransactionCategoryService } from "@/src/services/TransactionCategories.Service";
import { useTransactionGroupService } from "@/src/services/TransactionGroups.Service";
import { TableNames } from "@/src/types/database/TableNames";
import { queryKeys } from "@/src/services/queryKeys";

export default function TransactionGroupsTab() {
  const groups = useTransactionGroupService();
  const categories = useTransactionCategoryService();

  return (
    <MyTab
      title="Groups"
      detailHref="/Categories/Groups/"
      queryKey={queryKeys.transactionGroups.all}
      service={groups}
      UpsertModal={item => <TransactionGroupForm group={item} />}
      initialState={initialState}
      dependencyConfig={{
        dependencyField: "groupid",
        dependencyService: categories,
        dependencyType: "Transaction Categories",
        allowDeleteDependencies: false,
      }}
    />
  );
}
