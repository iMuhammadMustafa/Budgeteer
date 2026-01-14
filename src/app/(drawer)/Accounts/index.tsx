import Button from "@/src/components/elements/Button";
import { AccountSelecterDropdown } from "@/src/components/elements/dropdown/DropdownField";
import MyModal from "@/src/components/elements/MyModal";
import TextInputField from "@/src/components/elements/TextInputField";
import AccountForm, { initialState } from "@/src/components/forms/AccountForm";
import MyTab from "@/src/components/MyTab";
import { useAccountCategoryService } from "@/src/services/AccountCategories.Service";
import { useAccountService } from "@/src/services/Accounts.Service";
import { useTransactionService } from "@/src/services/Transactions.Service";
import { TableNames } from "@/src/types/database/TableNames";
import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function AccountsIndex() {
  const accountService = useAccountService();
  const transactionService = useTransactionService();
  const accountCategoryService = useAccountCategoryService();

  const { data: accounts, isLoading, error } = accountService.useFindAll();
  const { data: totalBalanceData, isLoading: isLoadingTotalBalance } = accountService.useGetTotalAccountsBalance();
  const { data: accountCategories } = accountCategoryService.useFindAll();
  const { mutate: createTransaction, isPending: isCreating } = transactionService.useCreate();
  const { mutateAsync: updateAccountBalance } = accountService.useUpdateAccountBalance();

  const [modalState, setModalState] = useState<{ open: boolean; account: any | null }>({ open: false, account: null });
  const [amount, setAmount] = useState("");
  const [sourceAccountId, setSourceAccountId] = useState<string | null>(null);

  const openTransferModal = (account: any) => {
    setModalState({ open: true, account });
    setAmount("");
    setSourceAccountId(null);
  };

  const detailsContent = (item: any) =>
    `Balance: ${item?.balance?.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    })}`;

  const handleTransfer = () => {
    if (!modalState.account || !sourceAccountId || !amount || isNaN(Number(amount))) return;
    const amt = Math.abs(Number(amount));
    createTransaction({
      name: "Transfer",
      type: "Transfer",
      amount: -amt, // negative in source account
      accountid: sourceAccountId,
      transferaccountid: modalState.account.id,
      categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
      date: new Date().toISOString(),
      createdat: new Date().toISOString(),
    });
    setModalState({ open: false, account: null });
    setAmount("");
    setSourceAccountId(null);
  };

  // Handle account balance updates when transactions are moved
  const handleAccountBalanceUpdate = async (transactions: any[], oldAccountId: string, newAccountId: string) => {
    // Calculate total amount being moved
    const totalAmount = transactions.reduce((sum, transaction) => {
      return sum + (transaction.amount || 0);
    }, 0);

    // Update old account balance (subtract the amounts)
    await updateAccountBalance({ accountId: oldAccountId, amount: -totalAmount });

    // Update new account balance (add the amounts)
    await updateAccountBalance({ accountId: newAccountId, amount: totalAmount });
  };

  return (
    <>
      <MyTab
        title="Accounts"
        detailsUrl={"/Accounts/Upsert?accountId="}
        queryKey={[TableNames.Accounts]}
        service={accountService}
        groupBy={"category.name"}
        Footer={<FooterContent isLoadingTotalBalance={isLoadingTotalBalance} totalBalanceData={totalBalanceData} />}
        detailsContent={detailsContent}
        customAction={(item: any) => (
          <Button
            rightIcon="ArrowLeftRight"
            className="py-0 px-0"
            variant="ghost"
            onPress={() => openTransferModal(item)}
          />
        )}
        UpsertModal={(item: any) => <AccountForm account={item} />}
        initialState={initialState}
        dependencyConfig={{
          dependencyField: "accountid",
          dependencyService: transactionService,
          dependencyType: "Transactions",
          allowDeleteDependencies: true,
          onAfterUpdate: handleAccountBalanceUpdate,
        }}
      />
      {modalState.open && (
        <AccountTransferModal
          modalState={modalState}
          setModalState={setModalState}
          amount={amount}
          setAmount={setAmount}
          sourceAccountId={sourceAccountId}
          setSourceAccountId={setSourceAccountId}
          accounts={accounts}
          handleTransfer={handleTransfer}
          isCreating={isCreating}
        />
      )}
    </>
  );
}

const FooterContent = ({
  isLoadingTotalBalance,
  totalBalanceData,
}: {
  isLoadingTotalBalance: boolean;
  totalBalanceData: { totalbalance: number } | null | undefined;
}) => {
  if (isLoadingTotalBalance) {
    return <ActivityIndicator animating={true} className="my-1" />;
  }
  if (totalBalanceData) {
    return (
      <View className="bg-white border-t border-border items-center rounded-b-lg shadow-md">
        <Text className="font-md font-psemibold text-primary">Total Account Balance:</Text>
        <Text className="font-md font-pbold text-primary-focus text-foreground">
          {totalBalanceData.totalbalance.toLocaleString("en-US", {
            style: "currency",
            currency: "USD", // TODO: Make currency dynamic based on user settings
          })}
        </Text>
      </View>
    );
  }
  return null;
};

const AccountTransferModal = ({
  modalState,
  setModalState,
  amount,
  setAmount,
  sourceAccountId,
  setSourceAccountId,
  accounts,
  handleTransfer,
  isCreating,
}: {
  modalState: { open: boolean; account: any | null };
  setModalState: (state: { open: boolean; account: any | null }) => void;
  amount: string;
  setAmount: (amount: string) => void;
  sourceAccountId: string | null;
  setSourceAccountId: (id: string | null) => void;
  accounts: any[] | undefined;
  handleTransfer: () => void;
  isCreating: boolean;
}) => {
  return (
    <MyModal
      isOpen={modalState.open}
      setIsOpen={(open: boolean) => setModalState({ open, account: open ? modalState.account : null })}
    >
      <Text className="text-lg font-bold mb-2">Transfer to {modalState.account?.name}</Text>

      <TextInputField label="Amount" value={amount} onChange={setAmount} keyboardType="numeric" />
      <AccountSelecterDropdown
        label="Source"
        selectedValue={sourceAccountId}
        onSelect={item => setSourceAccountId(item?.id ?? null)}
        accounts={accounts?.filter(acc => acc.id !== modalState.account?.id)}
        isModal={true}
        groupBy="group"
      />
      <View className="flex-row gap-4">
        <Button
          label={isCreating ? "Transferring..." : "Submit Transfer"}
          onPress={handleTransfer}
          isValid={!!sourceAccountId && !!amount && !isNaN(Number(amount))}
          className="flex-1"
        />
      </View>
    </MyModal>
  );
};
