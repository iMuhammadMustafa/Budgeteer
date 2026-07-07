import { useState } from "react";
import { View } from "react-native";
import dayjs from "dayjs";

import { TableNames } from "@/src/types/database/TableNames";
import { Recurring } from "@/src/types/database/Tables.Types";
import { Button, GroupedInput, IconButton, MyTab, ResponsiveModal, Text as ThemedText } from "@/src/components/ui";
import RecurringForm, { initialRecurringState } from "@/src/components/forms/RecurringForm";
import { RecurringDetails } from "@/src/components/recurrings/RecurringStatusBadges";
import { queryKeys } from "@/src/services/queryKeys";
import { useRecurringService } from "@/src/services/Recurrings.Service";

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
        detailHref={"/Recurrings/"}
        queryKey={queryKeys.recurrings.all}
        service={recurringsService}
        initialState={initialRecurringState}
        UpsertModal={item => <RecurringForm recurring={item} />}
        icons={false}
        customAction={item => {
          const canSkip = !item.isdateflexible && !!item.nextoccurrencedate && !!item.recurrencerule;
          return (
            <>
              <IconButton
                icon="Check"
                variant="ghost"
                size="sm"
                haptic="light"
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
                accessibilityLabel="Execute recurring"
                testID={`btn-execute-recurring-${item.id}`}
              />
              <IconButton
                icon="SkipForward"
                variant="ghost"
                size="sm"
                haptic="warning"
                onPress={() => handleSkipRecurring(item)}
                disabled={!canSkip || isLoading}
                accessibilityLabel="Skip this occurrence"
                testID={`btn-skip-recurring-${item.id}`}
              />
            </>
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

  const content = (
    <View className="p-6 items-center">
      <View className="flex-row justify-between w-full gap-2">
        <GroupedInput
          mode={pendingRecurring?.type === "Income" ? "plus" : "minus"}
          amount={amount}
          onChange={setAmount}
          className="flex-1"
        />
        <Button
          variant="primary"
          size="md"
          haptic="success"
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
  );

  return (
    <ResponsiveModal visible={modalVisible} onClose={handleClose} title="Enter Amount" size="lg" scrollable={false}>
      {content}
    </ResponsiveModal>
  );
};
