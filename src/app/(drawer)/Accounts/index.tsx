import { useCallback, useState } from "react";
import { TabView } from "react-native-tab-view";
import { TableNames } from "@/src/types/db/TableNames";
import { Tab, TabBar, TabHeader } from "@/src/components/MyTabs";
import { Text, View, ActivityIndicator, Pressable } from "react-native";
import Button from "@/src/components/Button";
import MyModal from "@/src/components/MyModal";
import TextInputField from "@/src/components/TextInputField";
import { AccountSelecterDropdown } from "@/src/components/DropDownField";
import MyIcon from "@/src/utils/Icons.Helper";
import { useAccountService } from "@/src/services/Accounts.Service";
import { useTransactionService } from "@/src/services/Transactions.Service";
import { useAccountCategoryService } from "@/src/services/AccountCategories.Service";

export default function Accounts() {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "first", title: "Accounts" },
    { key: "second", title: "Categories" },
  ]);

  const renderScene = useCallback(({ route }: any) => {
    switch (route.key) {
      case "first":
        return <AccountsRoute />;
      case "second":
        return <AccountsCategoriesRoute />;
      default:
        return <AccountsRoute />;
    }
  }, []);

  return (
    <TabView
      navigationState={{ index, routes }}
      tabBarPosition="top"
      onIndexChange={setIndex}
      className="bg-background"
      lazy={true}
      renderScene={renderScene}
      renderTabBar={props => (
        <TabBar>
          <Bar {...props} setIndex={setIndex} />
        </TabBar>
      )}
    />
  );
}

const Bar = (props: any) => (
  <>
    <TabHeader title="Accounts" isSelected={props.navigationState.index === 0} onPress={() => props.setIndex(0)} />
    <TabHeader title="Categories" isSelected={props.navigationState.index === 1} onPress={() => props.setIndex(1)} />
  </>
);

const AccountsRoute = () => {
  const accountService = useAccountService();
  const transactionService = useTransactionService();
  const { data: totalBalanceData, isLoading: isLoadingTotalBalance } = accountService.getTotalAccountsBalance();
  const { data: accounts, isLoading: isLoadingAccounts } = accountService.findAll();
  const { mutate: createTransaction, isPending: isCreating } = transactionService.create();
  const [modalState, setModalState] = useState<{ open: boolean; account: any | null }>({ open: false, account: null });
  const [amount, setAmount] = useState("");
  const [sourceAccountId, setSourceAccountId] = useState<string | null>(null);

  const FooterContent = () => {
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

  // Prefill modal when opened
  const openTransferModal = (account: any) => {
    setModalState({ open: true, account });
    setAmount("");
    setSourceAccountId(null);
  };

  // "Pay Off" handler
  const handlePayOff = () => {
    if (modalState.account) {
      setAmount(Math.abs(Number(modalState.account.balance)).toString());
    }
  };

  // Submit transfer
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

  // Custom render for each account row
  const customRenderItem = (item: any, isSelected: boolean, onLongPress: () => void, onPress: () => void) => (
    <View key={item.id} className="flex-row p-2 px-4">
      <Pressable className={`flex-1`} onLongPress={onLongPress} onPress={onPress}>
        <View className="flex-row items-center">
          <View className={`w-8 h-8 rounded-full justify-center items-center mr-4 bg-${item.iconColor}`}>
            {/* eslint-disable-next-line @typescript-eslint/no-var-requires */}
            {item.icon && <MyIcon name={item.icon} size={18} className="color-card-foreground" />}
          </View>
          <View className="flex-1">
            <Text className="text-md text-foreground">{item.name}</Text>
            <Text className="text-md text-foreground">{`Balance: ${item.balance.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}`}</Text>
          </View>
        </View>
      </Pressable>
      <Pressable onPress={() => openTransferModal(item)}>
        <MyIcon name="ArrowRightLeft" size={20} className="text-foreground" />
      </Pressable>
    </View>
  );

  return (
    <>
      <Tab
        title="Accounts"
        queryKey={[TableNames.Accounts]}
        useGet={accountService.findAll}
        customMapping={(item: any) => ({
          ...item,
          details: item.balance.toLocaleString("en-US", {
            style: "currency",
            currency: "USD", // TODO: Make currency dynamic
          }),
        })}
        customDetails={item =>
          `Balance: ${item.balance.toLocaleString("en-US", {
            style: "currency",
            currency: "USD", // TODO: Make currency dynamic
          })}`
        }
        useDelete={accountService.delete}
        upsertUrl={"/Accounts/Upsert?accountId="}
        groupedBy={"category.name"}
        Footer={<FooterContent />}
        customRenderItem={customRenderItem}
      />
      <MyModal
        isOpen={modalState.open}
        setIsOpen={(open: boolean) => setModalState({ open, account: open ? modalState.account : null })}
      >
        <Text className="text-lg font-bold mb-2">Transfer to {modalState.account?.name}</Text>
        <Button label="Pay Off" onPress={handlePayOff} />
        <TextInputField label="Amount" value={amount} onChange={setAmount} keyboardType="numeric" />
        <AccountSelecterDropdown
          label="Source"
          selectedValue={sourceAccountId}
          onSelect={item => setSourceAccountId(item?.id ?? null)}
          accounts={accounts?.filter(acc => acc.id !== modalState.account?.id)}
          isModal={true}
          groupBy="group"
        />

        <Button
          label={isCreating ? "Transferring..." : "Submit Transfer"}
          onPress={handleTransfer}
          isValid={!!sourceAccountId && !!amount && !isNaN(Number(amount))}
        />
      </MyModal>
    </>
  );
};

const AccountsCategoriesRoute = () => {
  const accountCategoryService = useAccountCategoryService();

  console.log("Account Categories Route Loaded");

  return (
    <Tab
      title="Categories"
      queryKey={[TableNames.AccountCategories]}
      useGet={accountCategoryService.findAll}
      useDelete={accountCategoryService.delete}
      upsertUrl={"/Accounts/Categories/Upsert?categoryId="}
    />
  );
};
