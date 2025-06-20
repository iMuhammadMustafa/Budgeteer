import { Text, View, Pressable } from "react-native";
import { Tab } from "@/src/components/MyTabs";
import {
  useListReminders,
  useDeleteReminder,
  useExecuteReminderAction, // Changed from useApplyReminderTransaction
} from "@/src/services/repositories/Reminders.Repository";
import { TableNames } from "@/src/types/db/TableNames";
import { Reminder } from "@/src/types/db/Tables.Types";
import dayjs from "dayjs";
import MyIcon from "@/src/utils/Icons.Helper";
import { router, Href } from "expo-router";
import { useAuth } from "@/src/providers/AuthProvider";
import { queryClient } from "@/src/providers/QueryProvider";

export default function RemindersScreen() {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;

  const { mutate: executeReminder, isPending: isApplying } = useExecuteReminderAction();

  const handleExecuteReminder = (id: string) => {
    if (!tenantId) {
      console.error("Tenant ID not found");
      return;
    }
    executeReminder(id, {
      onSuccess: () => {
        console.log("Reminder executed successfully, transaction created and reminder updated:", id);
        // Invalidation is handled within the useExecuteReminderAction's onSuccess
      },
      onError: (error: Error) => {
        // Added Error type
        console.error("Error executing reminder:", id, error.message);
        // Optionally, show a user-facing error message (e.g., using a toast)
      },
    });
  };

  const customReminderDetails = (item: Reminder) => {
    let details = `Next: ${dayjs(item.nextoccurrencedate).format("MMM DD, YYYY")} | Amount: ${item.amount} ${item.currencycode}`;
    if (item.recurrencerule) {
      // Basic parsing for display, can be improved
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
            e.stopPropagation(); // Prevent triggering the item's onPress
            handleExecuteReminder(item.id); // Changed to handleExecuteReminder
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
    <Tab
      title="Recurring Reminders"
      queryKey={[TableNames.Reminders, tenantId]}
      useGet={() => useListReminders()}
      useDelete={useDeleteReminder}
      upsertUrl={"/Reminders/Upsert?id=" as any} // Path to the creation/edit page
      selectable={true} // Enable long press for delete
      // customDetails={customReminderDetails} // Using custom renderItem instead
      customRenderItem={renderReminderItem} // Pass the custom render function
      // Grouping can be added later if needed, e.g., by is_active or nextoccurrencedate
    />
  );
}
