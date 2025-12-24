import { View } from "react-native";
import PeriodControls from "./PeriodControls";

export default function ChartsContainer({
  label,
  onPrev,
  onNext,
  isPeriodControl,
  children,
}: {
  label: string;
  onPrev?: () => void;
  onNext?: () => void;
  isPeriodControl?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-2 py-1 my-1 bg-card m-auto rounded-md border border-muted">
      {children}
      {isPeriodControl && onPrev && onNext && <PeriodControls label={label} onPrev={onPrev} onNext={onNext} />}
    </View>
  );
}
