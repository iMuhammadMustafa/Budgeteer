import AmountInput from "@/src/components/elements/AmountInput";
import Button from "@/src/components/elements/Button";
import MyModal from "@/src/components/elements/MyModal";
import { RecurringDetails } from "@/src/components/elements/RecurringStatusBadges";
import ThemedText from "@/src/components/elements/ThemedText";
import RecurringForm, { initialRecurringState } from "@/src/components/forms/RecurringForm";
import { MyTab } from "@/src/components/ui";
import { useRecurringService } from "@/src/services/Recurrings.Service";
import { TableNames } from "@/src/types/database/TableNames";
import { Recurring } from "@/src/types/database/Tables.Types";
import dayjs from "dayjs";
import { useState } from "react";
import { View } from "react-native";

export default function RecurringsScreen() {
  const {
    recurringsService,
    setPendingRecurring,
    modalVisible,
    setModalVisible,
    pendingRecurring,
    handleExecuteRecurring,
    handleSkipRecurring,
    handleClose,
    isLoading,
  } = useRecurringsViewModel();

  return (
    <>
      <MyTab
        customRenderItem={item => (
          <View className="flex-1">
            <ThemedText variant="label" className="flex-1 font-semibold mb-1">
              {item.name}
            </ThemedText>
            <RecurringDetails item={item} />
          </View>
        )}
        title="Recurring Transactions"
        detailsUrl={"/Recurrings/Upsert?id="}
        queryKey={[TableNames.Recurrings]}
        service={recurringsService}
        initialState={initialRecurringState}
        UpsertModal={item => <RecurringForm recurring={item} />}
        icons={false}
        customAction={item => {
          const canSkip = !item.isdateflexible && !!item.nextoccurrencedate && !!item.recurrencerule;
          return (
            <View className="flex-row items-center gap-1">
              <Button
                rightIcon="Check"
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
                    setModalVisible(true);
                  } else {
                    handleExecuteRecurring(item);
                  }
                }}
                disabled={isLoading}
                testID={`btn-execute-recurring-${item.id}`}
                iconSize={20}
                className="p-0 m-0"
              />
              <Button
                rightIcon="SkipForward"
                variant="ghost"
                size="icon"
                hapticFeedback="warning"
                onPress={() => handleSkipRecurring(item)}
                disabled={!canSkip || isLoading}
                accessibilityLabel="Skip this occurrence"
                accessibilityHint="Advances the next date without creating a transaction"
                testID={`btn-skip-recurring-${item.id}`}
                iconSize={20}
                className="p-0 m-0"
              />
            </View>
          );
        }}
      />

      {modalVisible && (
        <RecurringModal
          modalVisible={modalVisible}
          setModalVisible={setModalVisible}
          pendingRecurring={pendingRecurring}
          handleExecuteRecurring={handleExecuteRecurring}
          handleClose={handleClose}
          isLoading={isLoading}
        />
      )}
    </>
  );
}

const useRecurringsViewModel = () => {
  const recurringsService = useRecurringService();

  const { mutate: executeRecurring, isPending: isApplying } = recurringsService.useExecuteRecurring();
  const { mutate: skipRecurring, isPending: isSkipping } = recurringsService.useSkipRecurring();
  const isLoading = isApplying || isSkipping;

  const [modalVisible, setModalVisible] = useState(false);
  const [pendingRecurring, setPendingRecurring] = useState<Recurring | null>(null);

  const handleExecuteRecurring = (item: Recurring, amountOverride?: number) => {
    let finalAmount = item.amount;

    if (amountOverride !== undefined && !isNaN(amountOverride)) {
      finalAmount = amountOverride;
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
          setPendingRecurring(null);
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

  const handleClose = () => {
    setModalVisible(false);
    setPendingRecurring(null);
  };

  return {
    recurringsService,
    setPendingRecurring,
    modalVisible,
    setModalVisible,
    pendingRecurring,
    handleExecuteRecurring,
    handleSkipRecurring,
    handleClose,
    isLoading,
  };
};

const RecurringModal = ({
  modalVisible,
  setModalVisible,
  pendingRecurring,
  handleExecuteRecurring,
  handleClose,
  isLoading,
}: {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  pendingRecurring: Recurring | null;
  handleExecuteRecurring: (recurring: Recurring, amount: number) => void;
  handleClose: () => void;
  isLoading: boolean;
}) => {
  const [amount, setAmount] = useState<number>(0);
  return (
    <MyModal isOpen={modalVisible} setIsOpen={setModalVisible} onClose={handleClose}>
      <View className="bg-card rounded-xl p-6 items-center">
        <ThemedText variant="heading" className="mb-2">
          Enter Amount
        </ThemedText>
        <View className="flex-row justify-between w-full gap-2">
          <AmountInput
            mode={pendingRecurring?.type === "Income" ? "plus" : "minus"}
            amount={amount}
            onChange={setAmount}
            className="flex-1"
          />
          <Button
            variant="primary"
            size="md"
            hapticFeedback="success"
            onPress={() => {
              if (pendingRecurring) {
                handleExecuteRecurring(pendingRecurring, amount);
              }
            }}
            disabled={isLoading}
            label="Apply"
            testID="btn-recurring-apply"
          />
        </View>
      </View>
    </MyModal>
  );
};
