import { queryClient } from "@/src/providers/QueryProvider";
import { TableNames } from "@/src/types/db/TableNames";

function useAccounts() {}

export default function Accounts() {
  // const queryClient = useQueryClient();
  const { data: accounts, isLoading, error } = useGetAccounts();
  const { data: categories, isLoading: isCategoriesLoading, error: categoriesError } = useGetAccountCategories();

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "first", title: "Accounts" },
    { key: "second", title: "Categories" },
  ]);
  const { mutate: deleteAccount } = useDeleteAccount();
  const { mutate: deleteCategory } = useDeleteAccountCategory();

  const refershAccounts = async () => {
    await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
  };
  const refreshCategories = async () => {
    await queryClient.invalidateQueries({ queryKey: [TableNames.AccountCategories] });
  };

  return (
    <TabView
      navigationState={{ index, routes }}
      tabBarPosition="top"
      lazy={true}
      renderScene={SceneMap({
        first: () => (
          <Tab
            title="Accounts"
            items={accounts?.map(account => ({
              ...account,
              details: `${account.owner} - Balance: ${account.balance.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}`,
            }))}
            isLoading={isLoading}
            error={error}
            deleteItem={deleteAccount}
            upsertUrl={"/Accounts/Upsert?accountId="}
            selectable
            refreshQueries={refershAccounts}
          />
        ),
        second: () => (
          <Tab
            title="Categories"
            items={categories}
            isLoading={isLoading}
            error={error}
            deleteItem={deleteCategory}
            upsertUrl={"/Accounts/Categories/Upsert?categoryId="}
            refreshQueries={refreshCategories}
          />
        ),
      })}
      onIndexChange={setIndex}
      className="bg-background"
      renderTabBar={props => {
        return (
          <View className={`bg-background  ${Platform.OS === "web" ? "max-w" : ""}`}>
            <View className="flex-row border-b mt-3 border-gray-200 bg-background">
              <TabHeader title="Accounts" isSelected={props.navigationState.index === 0} onPress={() => setIndex(0)} />
              <TabHeader
                title="Categories"
                isSelected={props.navigationState.index === 1}
                onPress={() => setIndex(1)}
              />
            </View>
          </View>
        );
      }}
    />
  );
}
