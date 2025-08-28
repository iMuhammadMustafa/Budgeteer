import React from "react";
import { View, Text, Platform } from "react-native";
import { AccountSelecterDropdown, MyCategoriesDropdown } from "@/src/components/DropDownField";
import TextInputField from "@/src/components/TextInputField";
import { Account, TransactionCategory } from "@/src/types/db/Tables.Types";

interface RecurringCreditCardFormProps {
  sourceAccountId: string;
  creditCardAccountId: string | null;
  categoryId: string | null;
  currencyCode: string;
  accounts: Account[] | undefined;
  categories: TransactionCategory[] | undefined;
  onSourceAccountChange: (accountId: string) => void;
  onCreditCardAccountChange: (accountId: string) => void;
  onCategoryChange: (categoryId: string | null) => void;
  onCurrencyCodeChange: (currencyCode: string) => void;
}

/**
 * Specialized form component for recurring credit card payment transactions
 */
export const RecurringCreditCardForm: React.FC<RecurringCreditCardFormProps> = ({
  sourceAccountId,
  creditCardAccountId,
  categoryId,
  currencyCode,
  accounts,
  categories,
  onSourceAccountChange,
  onCreditCardAccountChange,
  onCategoryChange,
  onCurrencyCodeChange,
}) => {
  // Filter accounts for credit cards (liability accounts)
  const creditCardAccounts = accounts?.filter(
    acc =>
      acc.category?.name?.toLowerCase().includes("liability") ||
      acc.category?.name?.toLowerCase().includes("credit") ||
      acc.category?.name?.toLowerCase().includes("card"),
  );

  // Filter accounts for payment source (exclude credit cards)
  const paymentAccounts = accounts?.filter(
    acc => !acc.category?.name?.toLowerCase().includes("liability") && acc.id !== creditCardAccountId,
  );

  return (
    <View className="space-y-4">
      <View className="bg-purple-50 p-4 rounded-md border border-purple-200">
        <Text className="text-purple-800 font-medium mb-2">Credit Card Payment Configuration</Text>
        <Text className="text-purple-600 text-sm">
          This will create a recurring transfer to pay your credit card balance. The payment amount will be
          calculated based on the current balance at execution time. If the credit card has a positive balance,
          the payment will be skipped.
        </Text>
      </View>

      <AccountSelecterDropdown
        label="Payment Source Account"
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
        accounts={paymentAccounts}
        isModal={Platform.OS !== "web"}
        groupBy="category.name"
      />

      <AccountSelecterDropdown
        label="Credit Card Account"
        selectedValue={creditCardAccountId}
        onSelect={account => {
          if (account) {
            onCreditCardAccountChange(account.id);
          }
        }}
        accounts={creditCardAccounts}
        isModal={Platform.OS !== "web"}
        groupBy="category.name"
      />

      <MyCategoriesDropdown
        label="Category (Required)"
        selectedValue={categoryId}
        categories={categories}
        onSelect={category => onCategoryChange(category?.id || null)}
        isModal={Platform.OS !== "web"}
        showClearButton={false}
      />

      <TextInputField
        label="Currency Code"
        value={currencyCode}
        onChange={onCurrencyCodeChange}
        placeholder="e.g., USD"
        maxLength={3}
      />

      {!creditCardAccounts?.length && (
        <View className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
          <Text className="text-yellow-800 font-medium">No Credit Card Accounts Found</Text>
          <Text className="text-yellow-600 text-sm">
            You need to create liability accounts for your credit cards first.
          </Text>
        </View>
      )}

      {sourceAccountId && creditCardAccountId && sourceAccountId === creditCardAccountId && (
        <View className="bg-red-50 p-4 rounded-md border border-red-200">
          <Text className="text-red-800 font-medium">Invalid Configuration</Text>
          <Text className="text-red-600 text-sm">Payment source and credit card accounts must be different.</Text>
        </View>
      )}

      <View className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <Text className="text-gray-800 font-medium mb-2">Payment Amount</Text>
        <Text className="text-gray-600 text-sm">
          The payment amount will be automatically calculated based on the current negative balance of the selected
          credit card account. If the balance is positive (credit), no payment will be made. The amount is transferred
          from the source account to reduce the credit card debt.
        </Text>
      </View>
    </View>
  );
};

export default RecurringCreditCardForm;
