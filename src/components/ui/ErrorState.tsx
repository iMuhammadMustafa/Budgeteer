/**
 * ErrorState — failure placeholder (renamed/restyled from the old ErrorLoader).
 * Expense-tinted tone; retry button only renders when `onRefresh` is provided.
 * Thin wrapper over the shared internal StatePlaceholder.
 */
import { useTheme } from "@/src/providers/ThemeProvider";
import { StatePlaceholder } from "./internal/StatePlaceholder";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRefresh?: () => void;
  iconName?: string;
  /** testID for the root container (default: "error-state"). */
  testID?: string;
  /** testID for the retry button (default: "btn-error-retry"). */
  retryTestID?: string;
  className?: string;
}

export function ErrorState({
  title = "Failed to load data",
  message,
  onRefresh,
  iconName = "CircleAlert",
  testID = "error-state",
  retryTestID = "btn-error-retry",
  className,
}: ErrorStateProps) {
  const { colors } = useTheme();
  return (
    <StatePlaceholder
      iconName={iconName}
      iconColor={colors.expense}
      tileClassName="bg-expense-soft"
      title={title}
      titleClassName="text-expense"
      message={message}
      action={onRefresh ? { label: "Retry", onPress: onRefresh, leadingIcon: "RefreshCcw", testID: retryTestID } : undefined}
      className={className}
      testID={testID}
    />
  );
}
