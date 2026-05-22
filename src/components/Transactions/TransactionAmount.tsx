import ThemedText from "@/src/components/elements/ThemedText";
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
        <ThemedText className={`${color ? `text-${color}` : amount > 0 ? "text-success-500" : "text-danger-500"}`}>
            {formatCurrency(amount, showSigned)}
        </ThemedText>
    )
}