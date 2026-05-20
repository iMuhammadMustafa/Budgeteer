import ThemedText from "@/src/components/elements/ThemedText";
import { formatMoney } from "@/src/utils/currency";

export default function TransactionAmount({
    amount,
    currency,
    color
}: {
    amount: number,
    currency?: string | null
    color?: string
}) {
    return (
        <ThemedText className={`${color ? `text-${color}` : amount > 0 ? "text-success-500" : "text-danger-500"}`}>
            {formatMoney(amount, currency, { signed: true })}
        </ThemedText>
    )
}