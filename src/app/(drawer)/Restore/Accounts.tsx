import { TableNames } from "@/src/types/database/TableNames";
import { MyTab } from "@/src/components/ui";
import { useAccountService } from "@/src/services/Accounts.Service";

export default function RestoreAccounts() {
  const service = useAccountService();

  return (
    <MyTab
      title="Deleted Accounts"
      showTitle={false}
      service={service}
      queryKey={[TableNames.Accounts]}
      detailsUrl={"/Accounts/Upsert?accountId=" as any}
      groupBy={"category.name"}
      showDeleted
      showRestore
      icons
    />
  );
}
