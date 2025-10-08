import TransactionCategoryForm, { initialState } from "@/src/components/forms/TransactionCategoryForm";
import MyTab from "@/src/components/MyTab";
import { useTransactionCategoryService } from "@/src/services/TransactionCategories.Service";

export default function TransactionGroupsTab() {
  const categories = useTransactionCategoryService();
  return (
    <MyTab
      title="Transaction Categories"
      detailsUrl={"/Categories/Upsert?accountId="}
      queryKey={["transactionCategories"]}
      service={categories}
      groupBy="group.name"
      UpsertModal={item => <TransactionCategoryForm category={item} />}
      initialState={initialState}
    />
  );
}
