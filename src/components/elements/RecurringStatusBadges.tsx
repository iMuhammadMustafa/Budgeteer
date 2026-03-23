import React from "react";
import { Text, View } from "react-native";
import MyIcon from "./MyIcon";

interface RecurringStatusBadgesProps {
  recurring: any;
  className?: string;
}

/**
 * Component to display status badges for enhanced recurring transactions
 */
export const RecurringStatusBadges: React.FC<RecurringStatusBadgesProps> = ({ recurring, className = "" }) => {
  // Use enhanced fields directly from the database
  const autoApplyEnabled = recurring.autoapplyenabled || false;
  const isAmountFlexible = recurring.isamountflexible || false;
  const isDateFlexible = recurring.isdateflexible || false;
  const recurringType = recurring.recurringtype || "Standard";

  return (
    <View className={`flex-row flex-wrap gap-1 ${className}`}>
      {/* Auto-Apply Badge */}
      {autoApplyEnabled && (
        <View className="bg-status-success-subtle px-2 py-0.5 rounded-full flex-row items-center">
          <MyIcon name="Zap" size={12} className="text-status-success mr-1" />
          <Text className="text-xs text-status-success font-medium">Auto</Text>
        </View>
      )}

      {/* Recurring Type Badge */}
      {recurringType !== "Standard" && (
        <View
          className={`px-2 py-0.5 rounded-full flex-row items-center ${
            recurringType === "Transfer" ? "bg-status-info-subtle" : "bg-primary/10"
          }`}
        >
          <MyIcon
            name={recurringType === "Transfer" ? "ArrowLeftRight" : "CreditCard"}
            size={12}
            className={`mr-1 ${recurringType === "Transfer" ? "text-status-info" : "text-primary"}`}
          />
          <Text className={`text-xs font-medium ${recurringType === "Transfer" ? "text-status-info" : "text-primary"}`}>
            {recurringType === "CreditCardPayment" ? "CC Pay" : recurringType}
          </Text>
        </View>
      )}

      {/* Flexible Amount Badge */}
      {isAmountFlexible && (
        <View className="bg-status-warning-subtle px-2 py-0.5 rounded-full flex-row items-center">
          <MyIcon name="DollarSign" size={12} className="text-status-warning mr-1" />
          <Text className="text-xs text-status-warning font-medium">Flex $</Text>
        </View>
      )}

      {/* Flexible Date Badge */}
      {isDateFlexible && (
        <View className="bg-status-warning-subtle px-2 py-0.5 rounded-full flex-row items-center">
          <MyIcon name="Calendar" size={12} className="text-status-warning mr-1" />
          <Text className="text-xs text-status-warning font-medium">Flex Date</Text>
        </View>
      )}

      {/* Inactive Badge */}
      {!recurring.isactive && (
        <View className="bg-muted px-2 py-0.5 rounded-full flex-row items-center">
          <MyIcon name="Pause" size={12} className="text-text-secondary mr-1" />
          <Text className="text-xs text-text-secondary font-medium">Inactive</Text>
        </View>
      )}
    </View>
  );
};

export default RecurringStatusBadges;
