import MyTab from "@/src/components/MyTab";
import { useTransactionService } from "@/src/services/Transactions.Service";
import { TableNames } from "@/src/types/database/TableNames";

export default function RestoreTransactions() {
  const service = useTransactionService();

  return (
    <MyTab
      title="Deleted Transactions"
      service={service}
      queryKey={[TableNames.Transactions]}
      detailsUrl={"/Transactions/Upsert?transactionId=" as any}
      showDeleted
      showRestore
    />
  );
}
