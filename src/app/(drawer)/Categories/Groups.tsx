import MyTab from "@/src/components/MyTab";
import { useTransactionGroupService } from "@/src/services/TransactionGroups.Service";

export default function TransactionGroupsTab() {
  const groups = useTransactionGroupService();
  return (
    <MyTab
      title="Groups"
      upsertUrl={"Categories/Groups/Upsert?accountId="}
      queryKey={["transactiongroups"]}
      service={groups}
    />
  );
}
