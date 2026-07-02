import { Text as ThemedText } from "@/src/components/ui";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";

export default function TransactionAmount({
    amount,
    color,
    showSigned = true
}: {
    amount: number,
    color?: string,
    showSigned?: boolean
}) {
    const { formatCurrency } = usePrimaryCurrency();
    return (
        <ThemedText className={`font-mono-semibold ${color ? `text-${color}` : amount > 0 ? "text-income" : "text-expense"}`}>
            {formatCurrency(amount, showSigned)}
        </ThemedText>
    )
}