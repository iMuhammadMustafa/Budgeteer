import React from 'react';
import { View, Text } from 'react-native';
import { Recurring } from '@/src/types/recurring';
import MyIcon from '@/src/utils/Icons.Helper';

interface RecurringStatusBadgesProps {
  recurring: Recurring;
  className?: string;
}

/**
 * Component to display status badges for enhanced recurring transactions
 */
export const RecurringStatusBadges: React.FC<RecurringStatusBadgesProps> = ({
  recurring,
  className = ''
}) => {
  // Use enhanced fields directly from the database
  const autoApplyEnabled = recurring.autoapplyenabled || false;
  const isAmountFlexible = recurring.isamountflexible || false;
  const isDateFlexible = recurring.isdateflexible || false;
  const recurringType = recurring.recurringtype || "Standard";

  return (
    <View className={`flex-row flex-wrap gap-1 ${className}`}>
      {/* Auto-Apply Badge */}
      {autoApplyEnabled && (
        <View className="bg-green-100 px-2 py-1 rounded-full flex-row items-center">
          <MyIcon name="Zap" size={12} className="text-green-800 mr-1" />
          <Text className="text-xs text-green-800 font-medium">Auto</Text>
        </View>
      )}

      {/* Recurring Type Badge */}
      {recurringType !== "Standard" && (
        <View className={`px-2 py-1 rounded-full flex-row items-center ${
          recurringType === "Transfer" ? "bg-blue-100" : "bg-purple-100"
        }`}>
          <MyIcon 
            name={recurringType === "Transfer" ? "ArrowLeftRight" : "CreditCard"} 
            size={12} 
            className={`mr-1 ${
              recurringType === "Transfer" ? "text-blue-800" : "text-purple-800"
            }`} 
          />
          <Text className={`text-xs font-medium ${
            recurringType === "Transfer" ? "text-blue-800" : "text-purple-800"
          }`}>
            {recurringType === "CreditCardPayment" ? "CC Pay" : recurringType}
          </Text>
        </View>
      )}

      {/* Flexible Amount Badge */}
      {isAmountFlexible && (
        <View className="bg-orange-100 px-2 py-1 rounded-full flex-row items-center">
          <MyIcon name="DollarSign" size={12} className="text-orange-800 mr-1" />
          <Text className="text-xs text-orange-800 font-medium">Flex $</Text>
        </View>
      )}

      {/* Flexible Date Badge */}
      {isDateFlexible && (
        <View className="bg-yellow-100 px-2 py-1 rounded-full flex-row items-center">
          <MyIcon name="Calendar" size={12} className="text-yellow-800 mr-1" />
          <Text className="text-xs text-yellow-800 font-medium">Flex Date</Text>
        </View>
      )}

      {/* Inactive Badge */}
      {!recurring.isactive && (
        <View className="bg-gray-100 px-2 py-1 rounded-full flex-row items-center">
          <MyIcon name="Pause" size={12} className="text-gray-600 mr-1" />
          <Text className="text-xs text-gray-600 font-medium">Inactive</Text>
        </View>
      )}
    </View>
  );
};

/**
 * Get the appropriate icon for a recurring transaction based on its type and status
 */
export const getRecurringIcon = (recurring: Recurring): { name: string; color: string } => {
  // Use enhanced fields directly from the database
  const autoApplyEnabled = recurring.autoapplyenabled || false;
  const recurringType = recurring.recurringtype || "Standard";

  // Determine icon and color based on recurring type and auto-apply status
  if (recurringType === "Transfer") {
    return { name: "ArrowLeftRight", color: "bg-blue-500" };
  } else if (recurringType === "CreditCardPayment") {
    return { name: "CreditCard", color: "bg-purple-500" };
  } else if (autoApplyEnabled) {
    return { name: "Zap", color: "bg-green-500" };
  } else {
    return { name: "BellRing", color: "bg-primary-500" };
  }
};

/**
 * Parse enhanced recurring transaction data - now returns data directly from enhanced fields
 */
export const parseRecurringData = (recurring: Recurring) => {
  // Return enhanced fields directly from the database
  return {
    autoApplyEnabled: recurring.autoapplyenabled || false,
    isAmountFlexible: recurring.isamountflexible || false,
    isDateFlexible: recurring.isdateflexible || false,
    recurringType: recurring.recurringtype || "Standard" as const,
    transferAccountId: recurring.transferaccountid || null,
  };
};

export default RecurringStatusBadges;