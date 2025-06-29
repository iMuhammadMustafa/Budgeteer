import { Text, View, Pressable, Modal, TextInput, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { Tab } from "@/src/components/MyTabs";
import {
  useListReminders,
  useDeleteReminder,
  useExecuteReminderAction,
} from "@/src/services/repositories/Reminders.Repository";
import { TableNames } from "@/src/types/db/TableNames";
import { Reminder } from "@/src/types/db/Tables.Types";
import dayjs from "dayjs";
import MyIcon from "@/src/utils/Icons.Helper";
import { router, Href } from "expo-router";
import { useAuth } from "@/src/providers/AuthProvider";
import { queryClient } from "@/src/providers/QueryProvider";
import { useState } from "react";

export default function RemindersScreen() {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;

  const { mutate: executeReminder, isPending: isApplying } = useExecuteReminderAction();

  // State for modal to enter amount
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingReminder, setPendingReminder] = useState<Reminder | null>(null);
  const [mode, setMode] = useState<"plus" | "minus">("minus");
  const [amountInput, setAmountInput] = useState<string>("");

  const handleExecuteReminder = (item: Reminder, amountOverride?: number) => {
    let finalAmount = item.amount;

    if (amountOverride !== undefined && !isNaN(amountOverride)) {
      finalAmount = mode === "plus" ? amountOverride : -amountOverride;
    }

    executeReminder(
      { item, amount: finalAmount ?? 0 },
      {
        onSuccess: () => {
          setModalVisible(false);
          setAmountInput("");
          setPendingReminder(null);
          setMode("minus");
        },
        onError: (error: Error) => {
          console.error("Error executing reminder:", item.id, error.message);
        },
      },
    );
  };

  const customReminderDetails = (item: Reminder) => {
    let details = `Next: ${dayjs(item.nextoccurrencedate).format("MMM DD, YYYY")} | Amount: ${item.amount} ${item.currencycode}`;
    if (item.recurrencerule) {
      const parts = item.recurrencerule.split(";");
      const freq = parts.find(p => p.startsWith("FREQ="))?.split("=")[1];
      const interval = parts.find(p => p.startsWith("INTERVAL="))?.split("=")[1];
      if (freq) {
        details += ` | Every ${interval || 1} ${freq.toLowerCase().slice(0, -2)}(s)`;
      }
    }
    return details;
  };

  // Custom render function for list items to include the "Apply Transaction" button
  const renderReminderItem = (item: Reminder, isSelected: boolean, onLongPress: () => void, onPress: () => void) => {
    return (
      <Pressable
        key={item.id}
        className={`flex-row items-center px-5 py-3 border-b border-gray-200 text-foreground ${isSelected ? "bg-info-100" : "bg-background"}`}
        onLongPress={onLongPress}
        onPress={onPress}
      >
        <View className={`w-8 h-8 rounded-full justify-center items-center mr-4 bg-primary-500`}>
          <MyIcon name="BellRing" size={18} className="text-white" />
        </View>
        <View className="flex-1">
          <Text className="text-md text-foreground font-semibold">{item.name}</Text>
          <Text className="text-sm text-muted-foreground">{customReminderDetails(item)}</Text>
          {item.description && <Text className="text-xs text-muted-foreground mt-1">{item.description}</Text>}
        </View>
        <Pressable
          onPress={e => {
            e.stopPropagation();
            if (!item.amount || item.amount === 0) {
              setPendingReminder(item);
              setMode(item.type === "Income" ? "plus" : "minus");
              setModalVisible(true);
            } else {
              handleExecuteReminder(item);
            }
          }}
          disabled={isApplying}
          className="p-2  rounded-md ml-2"
        >
          <MyIcon name="Check" size={20} className="text-foreground" />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <>
      <Tab
        title="Recurring Reminders"
        queryKey={[TableNames.Reminders, tenantId]}
        useGet={() => useListReminders()}
        useDelete={useDeleteReminder}
        upsertUrl={"/Reminders/Upsert?id=" as any}
        selectable={true}
        customRenderItem={renderReminderItem}
      />
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false);
          setAmountInput("");
          setPendingReminder(null);
          setMode("minus");
        }}
      >
        <View className="flex-1 bg-black/40 justify-center items-center">
          <View className="bg-white rounded-xl p-6 w-4/5 items-center">
            <Text className="text-lg font-bold mb-4">Enter Amount</Text>
            <View className="w-full flex-row items-center mb-3">
              <TextInput
                className="flex-1 border border-gray-300 rounded-md p-2 text-base mr-2"
                keyboardType="numeric"
                value={amountInput}
                onChangeText={setAmountInput}
                placeholder="Amount"
                autoFocus
              />
              <Pressable
                className={`ml-2 p-2 rounded-md border min-w-[44px] min-h-[44px] justify-center items-center ${
                  pendingReminder?.type === "Transfer"
                    ? "bg-sky-400 border-sky-400 opacity-70"
                    : mode === "plus"
                      ? "bg-green-500 border-green-500"
                      : "bg-red-500 border-red-500"
                }`}
                disabled={pendingReminder?.type === "Transfer"}
                onPress={() => {
                  if (pendingReminder?.type === "Transfer") return;
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                  setMode(m => (m === "plus" ? "minus" : "plus"));
                }}
              >
                {mode === "minus" ? (
                  <MyIcon name="Minus" size={24} className="text-gray-100" />
                ) : (
                  <MyIcon name="Plus" size={24} className="text-gray-100" />
                )}
              </Pressable>
            </View>
            <View className="flex-row justify-between w-full">
              <Pressable
                className="flex-1 p-3 rounded-md items-center mx-1 bg-gray-300"
                onPress={() => {
                  setModalVisible(false);
                  setAmountInput("");
                  setPendingReminder(null);
                }}
              >
                <Text className="font-bold text-white">Cancel</Text>
              </Pressable>
              <Pressable
                className="flex-1 p-3 rounded-md items-center mx-1 bg-blue-600"
                onPress={() => {
                  if (pendingReminder && amountInput) {
                    const amount = parseFloat(amountInput);
                    if (amount > 0) {
                      handleExecuteReminder(pendingReminder, amount);
                    }
                  }
                }}
                disabled={
                  !pendingReminder ||
                  !amountInput ||
                  isNaN(Number(amountInput)) ||
                  parseFloat(amountInput) <= 0 ||
                  isApplying
                }
              >
                <Text className="font-bold text-white">Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
