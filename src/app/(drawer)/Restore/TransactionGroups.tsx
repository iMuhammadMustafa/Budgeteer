import { TableNames } from "@/src/types/database/TableNames";
import { MyTab } from "@/src/components/ui";
import { useTransactionGroupService } from "@/src/services/TransactionGroups.Service";

export default function RestoreTransactionGroups() {
  const service = useTransactionGroupService();

  return (
    <MyTab
      title="Deleted Transaction Groups"
      showTitle={false}
      service={service}
      queryKey={[TableNames.TransactionGroups]}
      detailsUrl={"/" as any}
      showDeleted
      showRestore
      icons
    />
  );
}
