import Button from "@/src/components/elements/Button";
import MyModal from "@/src/components/elements/MyModal";
import { useTransactionService } from "@/src/services/Transactions.Service";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";

export default function RestoreTransactions() {
  const service = useTransactionService();
  const { mutate: restoreTx, isPending } = service.useRestore();
  const [confirm, setConfirm] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });

  const filters = { deleted: true } as const;
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = service.useFindDeleted({
    limit: 10,
  });

  const items = useMemo(() => (data ? data.pages.flat() : []), [data]);

  const openConfirm = (item: any) => setConfirm({ open: true, item });
  const doRestore = () => {
    if (!confirm.item) return;
    restoreTx({ id: confirm.item.transactionid ?? confirm.item.id, item: confirm.item });
    setConfirm({ open: false, item: null });
  };

  if (isLoading) return <ActivityIndicator className="my-4" />;

  return (
    <>
      <FlatList
        data={items}
        keyExtractor={(item: any) => item.id}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        renderItem={({ item }: any) => (
          <View className="flex-row items-center py-2 border-b border-gray-200 px-5 rounded-none">
            <View className="flex-1">
              <Text className="text-md text-foreground">{item.name}</Text>
              <Text className="text-md text-foreground">{item.amount}</Text>
            </View>
            <Button variant="ghost" rightIcon="RotateCcw" onPress={() => openConfirm(item)} />
          </View>
        )}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator className="my-3" /> : null}
      />

      {confirm.open && (
        <MyModal
          isOpen={confirm.open}
          setIsOpen={(open: boolean) => setConfirm({ open, item: open ? confirm.item : null })}
        >
          <View className="gap-3">
            <Text className="text-lg font-bold">Restore Transaction</Text>
            <Text>Are you sure you want to restore {confirm.item?.name}?</Text>
            <Button label={isPending ? "Restoring..." : "Restore"} onPress={doRestore} />
          </View>
        </MyModal>
      )}
    </>
  );
}
