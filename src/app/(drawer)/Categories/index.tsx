import TransactionCategoryForm, { initialState } from "@/src/components/forms/TransactionCategoryForm";
import { MyTab } from "@/src/components/ui";
import { useTransactionCategoryService } from "@/src/services/TransactionCategories.Service";
import { useTransactionService } from "@/src/services/Transactions.Service";
import { TableNames } from "@/src/types/database/TableNames";
import { queryKeys } from "@/src/services/queryKeys";

export default function TransactionGroupsTab() {
  const categories = useTransactionCategoryService();
  const transactions = useTransactionService();

  return (
    <MyTab
      title="Transaction Categories"
      detailHref="/Categories/"
      queryKey={queryKeys.transactionCategories.all}
      service={categories}
      groupBy="group.name"
      customFindAll={categories.useFindAllWithGroup}
      UpsertModal={item => <TransactionCategoryForm category={item} />}
      initialState={initialState}
      dependencyConfig={{
        dependencyField: "categoryid",
        dependencyService: transactions,
        dependencyType: "Transactions",
        allowDeleteDependencies: true,
      }}
      columns={1}
    />
  );
}
