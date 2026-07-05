import { TableNames } from "@/src/types/database/TableNames";
import { queryKeys } from "@/src/services/queryKeys";
import { MyTab } from "@/src/components/ui";
import { useRecurringService } from "@/src/services/Recurrings.Service";

export default function RestoreRecurrings() {
  const service = useRecurringService();

  return (
    <MyTab
      title="Deleted Recurrings"
      showTitle={false}
      service={service}
      queryKey={queryKeys.recurrings.all}
      detailsUrl={"/" as any}
      showDeleted
      showRestore
      icons
    />
  );
}
