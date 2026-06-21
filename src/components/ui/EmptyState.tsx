/**
 * EmptyState — no-data placeholder (icon tile + title + optional subtitle / pill
 * / action). Neutral tone. Use ErrorState for failures. Both are thin wrappers
 * over the shared internal StatePlaceholder.
 */
import { useTheme } from "@/src/providers/ThemeProvider";
import { StatePlaceholder } from "./internal/StatePlaceholder";

export interface EmptyStateProps {
  iconName: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  pill?: string;
  action?: { label: string; onPress: () => void; testID?: string };
  className?: string;
  testID?: string;
}

export function EmptyState({ iconName, iconColor, title, subtitle, pill, action, className, testID = "empty-state" }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <StatePlaceholder
      iconName={iconName}
      iconColor={iconColor ?? colors.inkFaint}
      tileClassName="bg-surface-alt"
      title={title}
      message={subtitle}
      messageClassName="max-w-[280px]"
      pill={pill}
      action={action}
      className={className}
      testID={testID}
    />
  );
}
