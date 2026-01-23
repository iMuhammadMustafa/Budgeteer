import MyTab from "@/src/components/MyTab";
import { useRecurringService } from "@/src/services/Recurrings.Service";
import { TableNames } from "@/src/types/database/TableNames";

export default function RestoreRecurrings() {
  const service = useRecurringService();

  return (
    <MyTab
      title="Deleted Recurrings"
      service={service}
      queryKey={[TableNames.Recurrings]}
      detailsUrl={"/" as any}
      showDeleted
      showRestore
      icons
    />
  );
}
