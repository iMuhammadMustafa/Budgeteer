import { Text } from "react-native";

export default function TransactionAmount({
    amount,
    currency,
    color
}: {
    amount: number,
    currency?: string | null
    color?: string
}) {
    const amountString = amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return (
        <Text className={`${color ? `text-${color}` : amount > 0 ? "text-success-500" : "text-danger-500"}`}>
            {amount > 0 ? `+` : ``}
            {amountString} {currency}
        </Text>
    )
}