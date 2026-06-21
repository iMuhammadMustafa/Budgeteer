/**
 * Pager — ‹ label › stepper for month/week/period navigation
 * (Transactions month, chart pagers).
 *
 *   <Pager label="October 2026" onPrev={prevMonth} onNext={nextMonth} />
 */
import { View } from "react-native";

import { IconButton } from "./IconButton";
import { Text } from "./Text";
import { cn } from "./utils/cn";

export interface PagerProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  disablePrev?: boolean;
  disableNext?: boolean;
  className?: string;
  testID?: string;
}

export function Pager({ label, onPrev, onNext, disablePrev, disableNext, className, testID = "pager" }: PagerProps) {
  return (
    <View testID={testID} className={cn("flex-row items-center justify-center gap-2", className)}>
      <IconButton
        icon="ChevronLeft"
        variant="ghost"
        size="sm"
        accessibilityLabel="Previous"
        onPress={onPrev}
        disabled={disablePrev}
      />
      <Text selectable={false} className="min-w-[120px] text-center font-sans-semibold text-body text-ink">
        {label}
      </Text>
      <IconButton
        icon="ChevronRight"
        variant="ghost"
        size="sm"
        accessibilityLabel="Next"
        onPress={onNext}
        disabled={disableNext}
      />
    </View>
  );
}
