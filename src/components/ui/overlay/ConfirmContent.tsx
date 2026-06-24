/**
 * ConfirmContent — the card body for useConfirm / useAlert. Invoked as a factory
 * (not rendered as <ConfirmContent/>), so it must stay hook-free; the components
 * it returns run their own hooks when React mounts them in the overlay host.
 */
import { View } from "react-native";

import { Button } from "../Button";
import { Text } from "../Text";
import { CenteredPanel } from "./panels";

export function ConfirmContent({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  onConfirm,
  onCancel,
}: {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  onConfirm: () => void;
  onCancel?: () => void;
}) {
  return (
    <CenteredPanel onClose={onCancel ?? onConfirm} size="sm" scrollable={false} padded={false} testID="confirm-dialog">
      <View className="gap-2.5 px-5 py-5">
        {title ? <Text variant="h3">{title}</Text> : null}
        <Text variant="body" className="text-ink-mute">
          {message}
        </Text>
        <View className="mt-3 flex-row justify-end gap-2">
          {onCancel ? (
            <Button label={cancelLabel} variant="ghost" size="sm" onPress={onCancel} testID="confirm-cancel" />
          ) : null}
          <Button
            label={confirmLabel}
            variant={tone === "danger" ? "destructive" : "primary"}
            size="sm"
            onPress={onConfirm}
            testID="confirm-ok"
          />
        </View>
      </View>
    </CenteredPanel>
  );
}
