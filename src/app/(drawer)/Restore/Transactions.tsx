import { TableNames } from "@/src/types/database/TableNames";
import { MyTab } from "@/src/components/ui";
import { useTransactionService } from "@/src/services/Transactions.Service";

export default function RestoreTransactions() {
  const service = useTransactionService();

  return (
    <MyTab
      title="Deleted Transactions"
      showTitle={false}
      service={service}
      queryKey={[TableNames.Transactions]}
      detailsUrl={"/Transactions/Upsert?transactionId=" as any}
      showDeleted
      showRestore
    />
  );
}
