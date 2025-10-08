import TransactionGroupForm, { initialState } from "@/src/components/forms/TransactionGroupForm";
import MyTab from "@/src/components/MyTab";
import { useTransactionGroupService } from "@/src/services/TransactionGroups.Service";

export default function TransactionGroupsTab() {
  const groups = useTransactionGroupService();
  return (
    <MyTab
      title="Groups"
      detailsUrl={"Categories/Groups/Upsert?accountId="}
      queryKey={["transactiongroups"]}
      service={groups}
      UpsertModal={item => <TransactionGroupForm group={item} />}
      initialState={initialState}
    />
  );
}
