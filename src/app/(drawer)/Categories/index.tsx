import { useMemo } from "react";

import { MyTab } from "@/src/components/ui";
import TransactionCategoryForm, { initialState } from "@/src/components/forms/TransactionCategoryForm";
import { useConfigurationService } from "@/src/services/Configurations.Service";
import { queryKeys } from "@/src/services/queryKeys";
import {
  SYSTEM_CATEGORY_DELETE_MESSAGE,
  useTransactionCategoryService,
} from "@/src/services/TransactionCategories.Service";
import { useTransactionService } from "@/src/services/Transactions.Service";

export default function TransactionGroupsTab() {
  const categories = useTransactionCategoryService();
  const transactions = useTransactionService();
  const configurations = useConfigurationService();

  const { data: systemCategoryIds } = configurations.useSystemCategoryIds();
  const protectedIds = useMemo(() => new Set(systemCategoryIds ?? []), [systemCategoryIds]);

  return (
    <MyTab
      title="Transaction Categories"
      detailHref="/Categories/"
      queryKey={queryKeys.transactionCategories.all}
      service={categories}
      groupBy="group.name"
      groupStyle="plain"
      customFindAll={categories.useFindAllWithGroup}
      UpsertModal={item => <TransactionCategoryForm category={item} />}
      initialState={initialState}
      dependencyConfig={{
        dependencyField: "categoryid",
        dependencyService: transactions,
        dependencyType: "Transactions",
        allowDeleteDependencies: true,
      }}
      isItemProtected={item => protectedIds.has(item.id)}
      protectedMessage={SYSTEM_CATEGORY_DELETE_MESSAGE}
      columns={1}
    />
  );
}
