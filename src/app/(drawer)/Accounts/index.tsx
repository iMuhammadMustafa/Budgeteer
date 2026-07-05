import { AccountSelecterDropdown, Button, GroupedInput, IconButton, MyTab, ResponsiveModal } from "@/src/components/ui";
import AccountForm, { initialState } from "@/src/components/forms/AccountForm";
import SavingsBucketsList from "@/src/components/SavingsBucketsList";
import { useAccountService } from "@/src/services/Accounts.Service";
import { useSavingsBucketService } from "@/src/services/SavingsBuckets.Service";
import { useTransactionService } from "@/src/services/Transactions.Service";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";
import { TableNames } from "@/src/types/database/TableNames";
import { queryKeys } from "@/src/services/queryKeys";
import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function AccountsIndex() {
  const accountService = useAccountService();
  const transactionService = useTransactionService();
  const { formatCurrency } = usePrimaryCurrency();

  const {
    accounts,
    totalBalanceData,
    isLoadingTotalBalance,
    isCreating,
    bucketsByAccountId,
    isLoadingBucketsByAccountId,
    modalState,
    setModalState,
    bucketsModal,
    setBucketsModal,
    amount,
    setAmount,
    sourceAccountId,
    setSourceAccountId,
    openTransferModal,
    handleTransfer,
    handleAccountBalanceUpdate,
    detailsContent,
  } = useAccountsViewModel();

  return (
    <>
      <MyTab
        title="Accounts"
        detailHref={"/Accounts/"}
        queryKey={queryKeys.accounts.all}
        service={accountService}
        groupBy={"category.name"}
        Footer={
          <FooterContent
            isLoadingTotalBalance={isLoadingTotalBalance}
            totalBalanceData={totalBalanceData}
            formatCurrency={formatCurrency}
          />
        }
        detailsContent={detailsContent}
        isPageLoading={isLoadingBucketsByAccountId}
        customFindAll={accountService.useFindAllWithCategory}
        customAction={(item: any) => (
          <View className="flex-row items-center gap-2">
            <IconButton
              testID={`transfer-btn-${item.id}`}
              icon="ArrowLeftRight"
              size="md"
              variant="ghost"
              onPress={() => openTransferModal(item)}
              accessibilityLabel="Transfer"
            />
            <IconButton
              testID={`buckets-btn-${item.id}`}
              icon="PiggyBank"
              size="md"
              variant="ghost"
              onPress={() => setBucketsModal({ open: true, account: item })}
              accessibilityLabel="Savings Buckets"
            />
          </View>
        )}
        itemChildren={(item: any) => (
          <SavingsBucketsList
            compact
            accountId={item.id}
            accountBalance={item.balance}
            buckets={bucketsByAccountId ? bucketsByAccountId[item.id] || [] : []}
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
      <ResponsiveModal
        visible={bucketsModal.open && !!bucketsModal.account}
        onClose={() => setBucketsModal({ open: false, account: null })}
        title={bucketsModal.account ? `${bucketsModal.account.name} - Savings Buckets` : "Savings Buckets"}
        size="lg"
        scrollable={false}
      >
        {bucketsModal.account && (
          <View className="p-2">
            <SavingsBucketsList accountId={bucketsModal.account.id} accountBalance={bucketsModal.account.balance} />
          </View>
        )}
      </ResponsiveModal>
    </>
  );
}

const FooterContent = ({
  isLoadingTotalBalance,
  totalBalanceData,
  formatCurrency,
}: {
  isLoadingTotalBalance: boolean;
  totalBalanceData: { totalbalance: number } | null | undefined;
  formatCurrency: (amount: number) => string;
}) => {
  if (isLoadingTotalBalance) {
    return <ActivityIndicator animating={true} />;
  }
  if (totalBalanceData) {
    return (
      <View className="items-center">
        <Text className="font-sans-semibold text-sm text-primary-deep">Total Account Balance:</Text>
        <Text className="font-mono-semibold text-2xl text-primary mt-[3px]">
          {formatCurrency(totalBalanceData.totalbalance)}
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
  amount: number;
  setAmount: (amount: number) => void;
  sourceAccountId: string | null;
  setSourceAccountId: (id: string | null) => void;
  accounts: any[] | undefined;
  handleTransfer: () => void;
  isCreating: boolean;
}) => {
  const handleClose = () => setModalState({ open: false, account: null });

  const content = (
    <View className="p-4">
      <View className="flex-row gap-2 my-2">
        <GroupedInput
          inputTestID="transfer-amount-input"
          placeholder="Amount"
          amount={amount}
          mode="plus"
          allowNegativeFlip={false}
          onChange={setAmount}
          className="flex-1"
        />
        <AccountSelecterDropdown
          label="Source"
          selectedValue={sourceAccountId}
          onSelect={item => setSourceAccountId(item?.id ?? null)}
          accounts={accounts?.filter(acc => acc.id !== modalState.account?.id)}
          isModal={true}
          groupBy="group"
        />
      </View>

      <View className="flex-row gap-4">
        <Button
          testID="transfer-submit-btn"
          label={isCreating ? "Transferring..." : "Submit Transfer"}
          onPress={handleTransfer}
          disabled={!(!!sourceAccountId && !!amount && !isNaN(Number(amount)))}
          className="flex-1"
        />
      </View>
    </View>
  );

  return (
    <ResponsiveModal
      visible={modalState.open}
      onClose={handleClose}
      title={`Transfer to ${modalState.account?.name ?? ""}`}
      size="lg"
      scrollable={false}
    >
      {content}
    </ResponsiveModal>
  );
};

const useAccountsViewModel = () => {
  const accountService = useAccountService();
  const transactionService = useTransactionService();
  const bucketService = useSavingsBucketService();
  const { formatCurrency } = usePrimaryCurrency();

  const { data: accounts, isLoading, error } = accountService.useFindAllWithCategory();
  const { data: totalBalanceData, isLoading: isLoadingTotalBalance } = accountService.useGetTotalAccountsBalance();
  const { mutate: upsertTransaction, isPending: isCreating } = transactionService.useUpsert();
  const { mutateAsync: updateAccountBalance } = accountService.useUpdateAccountBalance();

  const { data: bucketsByAccountId, isLoading: isLoadingBucketsByAccountId } =
    bucketService.useFindAllGroupedByAccount();

  const [modalState, setModalState] = useState<{ open: boolean; account: any | null }>({ open: false, account: null });
  const [bucketsModal, setBucketsModal] = useState<{ open: boolean; account: any | null }>({
    open: false,
    account: null,
  });
  const [amount, setAmount] = useState(0);
  const [sourceAccountId, setSourceAccountId] = useState<string | null>(null);

  const openTransferModal = (account: any) => {
    setModalState({ open: true, account });
    setAmount(0);
    setSourceAccountId(null);
  };

  const detailsContent = (item: any) => `Balance: ${formatCurrency(item.balance, false)}`;

  const handleTransfer = () => {
    if (!modalState.account || !sourceAccountId || !amount || isNaN(Number(amount))) return;
    const amt = Math.abs(Number(amount));
    upsertTransaction({
      form: {
        name: "Transfer",
        type: "Transfer",
        amount: -amt, // negative in source account
        accountid: sourceAccountId,
        transferaccountid: modalState.account.id,
        categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
        date: new Date().toISOString(),
        createdat: new Date().toISOString(),
      },
    });
    setModalState({ open: false, account: null });
    setAmount(0);
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
  return {
    accounts,
    isLoading,
    error,
    totalBalanceData,
    isLoadingTotalBalance,
    upsertTransaction,
    isCreating,
    updateAccountBalance,
    bucketsByAccountId,
    isLoadingBucketsByAccountId,
    modalState,
    setModalState,
    bucketsModal,
    setBucketsModal,
    amount,
    setAmount,
    sourceAccountId,
    setSourceAccountId,
    openTransferModal,
    handleTransfer,
    handleAccountBalanceUpdate,
    detailsContent,
  };
};
