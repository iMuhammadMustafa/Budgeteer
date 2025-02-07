export const getTransactionProp = (type: string | null) => {
  const transactionProp = { iconName: "CircleHelp", color: "error-100", textColor: "foreground", size: 20 };
  if (type === "Income") {
    transactionProp.iconName = "Plus";
    transactionProp.color = "success-100";
    transactionProp.textColor = "success-500";
  } else if (type === "Expense") {
    transactionProp.iconName = "Minus";
    transactionProp.color = "error-100";
    transactionProp.textColor = "error-500";
  } else if (type === "Transfer") {
    transactionProp.iconName = "ArrowLeftRight";
    transactionProp.color = "info-100";
    transactionProp.textColor = "info-500";
  } else if (type === "Adjustment" || type === "Refund") {
    transactionProp.iconName = "Wrench";
    transactionProp.color = "warning-100";
    transactionProp.textColor = "warning-500";
  } else if (type === "Initial") {
    transactionProp.iconName = "Wallet";
    transactionProp.color = "info-100";
    transactionProp.textColor = "info-500";
  }
  return transactionProp;
};
