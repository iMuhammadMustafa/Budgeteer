import TransactionGroupForm, { initialState } from "@/src/components/forms/TransactionGroupForm";
import MyTab from "@/src/components/MyTab";
import { useTransactionGroupService } from "@/src/services/TransactionGroups.Service";
import { TableNames } from "@/src/types/database/TableNames";

export default function TransactionGroupsTab() {
  const groups = useTransactionGroupService();
  return (
    <MyTab
      title="Groups"
      detailsUrl={"Categories/Groups/Upsert?accountId="}
      queryKey={[TableNames.TransactionGroups]}
      service={groups}
      UpsertModal={item => <TransactionGroupForm group={item} />}
      initialState={initialState}
    />
  );
}
