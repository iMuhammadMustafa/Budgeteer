import { TableNames } from "@/src/types/database/TableNames";
import { queryKeys } from "@/src/services/queryKeys";
import { MyTab } from "@/src/components/ui";
import { useTransactionService } from "@/src/services/Transactions.Service";

export default function RestoreTransactions() {
  const service = useTransactionService();

  return (
    <MyTab
      title="Deleted Transactions"
      showTitle={false}
      service={service}
      queryKey={queryKeys.transactions.all}
      detailsUrl={"/Transactions/Upsert?transactionId=" as any}
      showDeleted
      showRestore
    />
  );
}
