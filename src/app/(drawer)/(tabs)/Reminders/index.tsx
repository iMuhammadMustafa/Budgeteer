import { Text, View, Pressable, Modal, TextInput, StyleSheet } from "react-native";
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
  const [pendingReminderId, setPendingReminderId] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState<string>("");

  const handleExecuteReminder = (id: string, amountOverride?: number) => {
    if (!tenantId) {
      console.error("Tenant ID not found");
      return;
    }
    executeReminder(
      { id, amount: amountOverride },
      {
        onSuccess: () => {
          setModalVisible(false);
          setAmountInput("");
          setPendingReminderId(null);
          // Invalidation is handled within the useExecuteReminderAction's onSuccess
        },
        onError: (error: Error) => {
          console.error("Error executing reminder:", id, error.message);
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
              setPendingReminderId(item.id);
              setModalVisible(true);
            } else {
              handleExecuteReminder(item.id);
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
          setPendingReminderId(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Amount</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={amountInput}
              onChangeText={setAmountInput}
              placeholder="Amount"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setAmountInput("");
                  setPendingReminderId(null);
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.applyButton]}
                onPress={() => {
                  if (pendingReminderId && parseFloat(amountInput) > 0) {
                    handleExecuteReminder(pendingReminderId, parseFloat(amountInput));
                  }
                }}
                disabled={
                  !pendingReminderId ||
                  !amountInput ||
                  isNaN(Number(amountInput)) ||
                  parseFloat(amountInput) <= 0 ||
                  isApplying
                }
              >
                <Text style={styles.buttonText}>Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 24,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    width: "100%",
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: "#ccc",
  },
  applyButton: {
    backgroundColor: "#007bff",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
