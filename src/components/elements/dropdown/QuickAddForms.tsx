import { Text, View } from "react-native";

import AccountCategoryForm, {
  initialState as accountCategoryInitialState,
} from "@/src/components/forms/AccountCategoryForm";
import AccountForm, { initialState as accountInitialState } from "@/src/components/forms/AccountForm";
import TransactionCategoryForm, {
  initialState as transactionCategoryInitialState,
} from "@/src/components/forms/TransactionCategoryForm";
import TransactionGroupForm, {
  initialState as transactionGroupInitialState,
} from "@/src/components/forms/TransactionGroupForm";

interface QuickAddFormRendererProps {
  entityType: "Account" | "AccountCategory" | "TransactionCategory" | "TransactionGroup";
  onSuccess: (item: any) => void;
  onCancel: () => void;
}

export function QuickAddFormRenderer({ entityType, onSuccess, onCancel }: QuickAddFormRendererProps) {
  switch (entityType) {
    case "Account":
      return <AccountForm account={accountInitialState} onSuccess={onSuccess} onCancel={onCancel} />;
    case "AccountCategory":
      return <AccountCategoryForm category={accountCategoryInitialState} onSuccess={onSuccess} onCancel={onCancel} />;
    case "TransactionCategory":
      return (
        <TransactionCategoryForm category={transactionCategoryInitialState} onSuccess={onSuccess} onCancel={onCancel} />
      );
    case "TransactionGroup":
      return <TransactionGroupForm group={transactionGroupInitialState} onSuccess={onSuccess} onCancel={onCancel} />;
    default:
      return (
        <View className="p-4">
          <Text className="text-red-500">Unknown entity type: {entityType}</Text>
        </View>
      );
  }
}
