import Button from "@/src/components/elements/Button";
import MyIcon from "@/src/components/elements/MyIcon";
import MyModal from "@/src/components/elements/MyModal";
import { RecurringStatusBadges } from "@/src/components/elements/RecurringStatusBadges";
import RecurringForm, { initialRecurringState } from "@/src/components/forms/RecurringForm";
import MyTab from "@/src/components/MyTab";
import { useRecurringService } from "@/src/services/Recurrings.Service";
import { TableNames } from "@/src/types/database/TableNames";
import { Recurring } from "@/src/types/database/Tables.Types";
import dayjs from "dayjs";
import { useState } from "react";
import { View } from "react-native";
import ThemedText from "@/src/components/elements/ThemedText";
import ThemedInput from "@/src/components/elements/ThemedInput";

export default function RecurringsScreen() {
  const recurringsService = useRecurringService();

  const { mutate: executeRecurring, isPending: isApplying } = recurringsService.useExecuteRecurring();
  const { mutate: skipRecurring, isPending: isSkipping } = recurringsService.useSkipRecurring();

  // State for modal to enter amount
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingRecurring, setPendingRecurring] = useState<Recurring | null>(null);
  const [mode, setMode] = useState<"plus" | "minus">("minus");
  const [amountInput, setAmountInput] = useState<string>("");

  const handleExecuteRecurring = (item: Recurring, amountOverride?: number) => {
    let finalAmount = item.amount;

    if (amountOverride !== undefined && !isNaN(amountOverride)) {
      finalAmount = mode === "plus" ? amountOverride : -amountOverride;
    }

    executeRecurring(
      {
        recurring: item,
        overrides: {
          amount: finalAmount ?? undefined,
          date: item.isdateflexible ? dayjs().toISOString() : undefined,
        },
      },
      {
        onSuccess: () => {
          setModalVisible(false);
          setAmountInput("");
          setPendingRecurring(null);
          setMode("minus");
        },
      },
    );
  };

  const handleSkipRecurring = (item: Recurring) => {
    skipRecurring(
      { recurring: item },
      {
        onSuccess: () => {
          console.log("Recurring skipped successfully");
        },
      },
    );
  };

  const renderRecurringItem = (item: Recurring, isSelected: boolean, onLongPress: () => void, onPress: () => void) => {
    // Only show skip button when the recurring has a fixed date schedule
    const canSkip = !item.isdateflexible && !!item.nextoccurrencedate && !!item.recurrencerule;

    return (
      <>
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <ThemedText variant="label" className="flex-1">{item.name}</ThemedText>
          </View>
          <ThemedText variant="caption" className="mb-2">{<RecurringDetails item={item} />}</ThemedText>
          <RecurringStatusBadges recurring={item} />
        </View>
        <View className="flex-row items-center gap-1 ml-2">
          {canSkip && (
            <Button
              variant="ghost"
              size="icon"
              hapticFeedback="warning"
              onPress={() => handleSkipRecurring(item)}
              disabled={isSkipping || isApplying}
              accessibilityLabel="Skip this occurrence"
              accessibilityHint="Advances the next date without creating a transaction"
              testID={`btn-skip-recurring-${item.id}`}
            >
              <MyIcon name="SkipForward" size={18} className="text-muted-foreground" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            hapticFeedback="light"
            onPress={() => {
              if (
                !item.amount ||
                item.amount === 0 ||
                item.isamountflexible ||
                (item.isamountflexible && item.isdateflexible)
              ) {
                setPendingRecurring(item);
                setMode(item.type === "Income" ? "plus" : "minus");
                setModalVisible(true);
              } else {
                handleExecuteRecurring(item);
              }
            }}
            disabled={isApplying || isSkipping}
            testID={`btn-execute-recurring-${item.id}`}
          >
            <MyIcon name="Check" size={20} className="text-foreground" />
          </Button>
        </View>
      </>
    );
  };
  const handleClose = () => {
    console.log("RequestingClose");
    setModalVisible(false);
    setAmountInput("");
    setPendingRecurring(null);
    setMode("minus");
  };
  return (
    <>
      <View className="flex-1 bg-background">
        <MyTab
          customRenderItem={renderRecurringItem}
          title="Recurring Transactions"
          detailsUrl={"/Recurrings/Upsert?id="}
          queryKey={[TableNames.Recurrings]}
          service={recurringsService}
          initialState={initialRecurringState}
          UpsertModal={item => <RecurringForm recurring={item} />}
        />
      </View>

      {modalVisible && (
        <MyModal isOpen={modalVisible} setIsOpen={setModalVisible} onClose={handleClose}>
          <View className="bg-card rounded-xl p-6 items-center">
            <ThemedText variant="heading" className="mb-2">
              {pendingRecurring?.isdateflexible && pendingRecurring?.isamountflexible
                ? "Execute Flexible Transaction"
                : "Enter Amount"}
            </ThemedText>
            {pendingRecurring?.isdateflexible && pendingRecurring?.isamountflexible && (
              <ThemedText variant="caption" className="text-sm mb-4 text-center">
                This transaction will be executed today with the amount you specify
              </ThemedText>
            )}
            <View className="w-full flex-row items-center mb-3">
              <ThemedInput
                className="flex-1 mr-2"
                keyboardType="numeric"
                value={amountInput}
                onChangeText={setAmountInput}
                placeholder="Amount"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                hapticFeedback="selection"
                className={`ml-2 p-2 rounded-md border min-w-[44px] min-h-[44px] justify-center items-center ${
                  pendingRecurring?.type === "Transfer"
                    ? "bg-sky-400 border-sky-400 opacity-70"
                    : mode === "plus"
                      ? "bg-green-500 border-green-500"
                      : "bg-red-500 border-red-500"
                }`}
                disabled={pendingRecurring?.type === "Transfer"}
                onPress={() => {
                  if (pendingRecurring?.type === "Transfer") return;
                  setMode(m => (m === "plus" ? "minus" : "plus"));
                }}
                testID="btn-recurring-mode-toggle"
              >
                {mode === "minus" ? (
                  <MyIcon name="Minus" size={24} className="text-gray-100" />
                ) : (
                  <MyIcon name="Plus" size={24} className="text-gray-100" />
                )}
              </Button>
            </View>
            <View className="flex-row justify-between w-full">
              <Button
                variant="secondary"
                size="md"
                className="flex-1 mx-1"
                onPress={() => {
                  setModalVisible(false);
                  setAmountInput("");
                  setPendingRecurring(null);
                }}
                label="Cancel"
                testID="btn-recurring-cancel"
              />
              <Button
                variant="primary"
                size="md"
                hapticFeedback="success"
                className="flex-1 mx-1"
                onPress={() => {
                  if (pendingRecurring && amountInput) {
                    const amount = parseFloat(amountInput);
                    if (amount > 0) {
                      handleExecuteRecurring(pendingRecurring, amount);
                    }
                  }
                }}
                disabled={
                  !pendingRecurring ||
                  !amountInput ||
                  isNaN(Number(amountInput)) ||
                  parseFloat(amountInput) <= 0 ||
                  isApplying
                }
                label="Apply"
                testID="btn-recurring-apply"
              />
            </View>
          </View>
        </MyModal>
      )}
    </>
  );
}

const RecurringDetails = ({ item }: { item: Recurring }) => {
  const autoApplyEnabled = item.autoapplyenabled || false;
  const isAmountFlexible = item.isamountflexible || false;
  const isDateFlexible = item.isdateflexible || false;
  const recurringType = item.recurringtype || "Standard";
  const intervalMonths = item.intervalmonths || 1;

  let details = "";

  // Show next occurrence or flexible date indicator
  if (isDateFlexible && isAmountFlexible) {
    details += "Fully Flexible (Date & Amount)";
  } else if (isDateFlexible) {
    details += "Flexible Date";
  } else {
    details += `Next: ${dayjs(item.nextoccurrencedate).format("MMM DD, YYYY")}`;
  }

  // Show amount or flexible amount indicator (only if not already shown as fully flexible)
  if (!isDateFlexible || !isAmountFlexible) {
    if (isAmountFlexible) {
      details += " | Flexible Amount";
    } else {
      details += ` | Amount: ${item.amount} ${item.currencycode}`;
    }
  }

  // Show recurring type if not standard
  if (recurringType !== "Standard") {
    details += ` | ${recurringType}`;
  }

  // Show auto-apply status
  if (autoApplyEnabled) {
    details += " | Auto-Apply";
  }

  // Show custom interval if not monthly
  if (intervalMonths > 1) {
    details += ` | Every ${intervalMonths} months`;
  }

  return details;
};
