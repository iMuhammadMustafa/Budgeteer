import { MyTab } from "@/src/components/ui";
import { useTransactionGroupService } from "@/src/services/TransactionGroups.Service";
import { TableNames } from "@/src/types/database/TableNames";

export default function RestoreTransactionGroups() {
  const service = useTransactionGroupService();

  return (
    <MyTab
      title="Deleted Transaction Groups"
      service={service}
      queryKey={[TableNames.TransactionGroups]}
      detailsUrl={"/" as any}
      showDeleted
      showRestore
      icons
    />
  );
}
