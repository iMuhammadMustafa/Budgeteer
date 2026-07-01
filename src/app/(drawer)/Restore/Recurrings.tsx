import { TableNames } from "@/src/types/database/TableNames";
import { MyTab } from "@/src/components/ui";
import { useRecurringService } from "@/src/services/Recurrings.Service";

export default function RestoreRecurrings() {
  const service = useRecurringService();

  return (
    <MyTab
      title="Deleted Recurrings"
      showTitle={false}
      service={service}
      queryKey={[TableNames.Recurrings]}
      detailsUrl={"/" as any}
      showDeleted
      showRestore
      icons
    />
  );
}
