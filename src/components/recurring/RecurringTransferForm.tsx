import React from 'react';
import { View, Text, Platform } from 'react-native';
import { AccountSelecterDropdown } from '@/src/components/DropDownField';
import TextInputField from '@/src/components/TextInputField';
import { Account } from '@/src/types/db/Tables.Types';

interface RecurringTransferFormProps {
  sourceAccountId: string;
  destinationAccountId: string | null;
  amount: number | null;
  currencyCode: string;
  accounts: Account[] | undefined;
  isAmountFlexible: boolean;
  onSourceAccountChange: (accountId: string) => void;
  onDestinationAccountChange: (accountId: string) => void;
  onAmountChange: (amount: number) => void;
  onCurrencyCodeChange: (currencyCode: string) => void;
}

/**
 * Specialized form component for recurring transfer transactions
 */
export const RecurringTransferForm: React.FC<RecurringTransferFormProps> = ({
  sourceAccountId,
  destinationAccountId,
  amount,
  currencyCode,
  accounts,
  isAmountFlexible,
  onSourceAccountChange,
  onDestinationAccountChange,
  onAmountChange,
  onCurrencyCodeChange,
}) => {
  // Filter out the selected source account from destination options
  const destinationAccounts = accounts?.filter(acc => acc.id !== sourceAccountId);

  return (
    <View className="space-y-4">
      <View className="bg-blue-50 p-4 rounded-md border border-blue-200">
        <Text className="text-blue-800 font-medium mb-2">Transfer Configuration</Text>
        <Text className="text-blue-600 text-sm">
          This will create a recurring transfer between two of your accounts. 
          Each execution will subtract the amount from the source account and add it to the destination account.
          The amount is always treated as positive regardless of input.
        </Text>
      </View>

      <AccountSelecterDropdown
        label="From Account (Source)"
        selectedValue={sourceAccountId}
        onSelect={account => {
          if (account) {
            onSourceAccountChange(account.id);
            // Auto-set currency based on source account
            if (account.currency) {
              onCurrencyCodeChange(account.currency);
            }
          }
        }}
        accounts={accounts}
        isModal={Platform.OS !== "web"}
        groupBy="category.name"
      />

      <AccountSelecterDropdown
        label="To Account (Destination)"
        selectedValue={destinationAccountId}
        onSelect={account => {
          if (account) {
            onDestinationAccountChange(account.id);
          }
        }}
        accounts={destinationAccounts}
        isModal={Platform.OS !== "web"}
        groupBy="category.name"
      />

      {!isAmountFlexible && (
        <TextInputField
          label="Transfer Amount"
          value={(amount ?? 0).toString()}
          onChange={text => {
            const numericValue = parseFloat(text) || 0;
            // Always use absolute value for transfers
            onAmountChange(Math.abs(numericValue));
          }}
          keyboardType="numeric"
          placeholder="e.g., 500.00"
        />
      )}

      <TextInputField
        label="Currency Code"
        value={currencyCode}
        onChange={onCurrencyCodeChange}
        placeholder="e.g., USD"
        maxLength={3}
      />

      {sourceAccountId && destinationAccountId && sourceAccountId === destinationAccountId && (
        <View className="bg-red-50 p-4 rounded-md border border-red-200">
          <Text className="text-red-800 font-medium">Invalid Configuration</Text>
          <Text className="text-red-600 text-sm">
            Source and destination accounts must be different.
          </Text>
        </View>
      )}
    </View>
  );
};

export default RecurringTransferForm;