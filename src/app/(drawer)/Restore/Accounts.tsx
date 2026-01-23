import MyTab from "@/src/components/MyTab";
import { useAccountService } from "@/src/services/Accounts.Service";
import { TableNames } from "@/src/types/database/TableNames";

export default function RestoreAccounts() {
  const service = useAccountService();

  return (
    <MyTab
      title="Deleted Accounts"
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
