/**
 * CalculatorModal — the full calculator UI. Renders as a bottom Sheet on narrow
 * viewports (thumb-reachable keypad) and a centered Dialog on wide ones. Web
 * keyboard shortcuts (digits/operators, Enter=, Backspace, Esc, Ctrl+C/V) are
 * wired only while visible. Dismissing always clears the expression.
 */
import { Pressable, ScrollView, View } from "react-native";

import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { Dialog } from "../overlay/Dialog";
import { Sheet } from "../overlay/Sheet";
import { Text } from "../Text";
import { cn } from "../utils/cn";
import { BUTTON_ROWS, type CalcButtonDef, useCalculator } from "./useCalculator";

export interface CalculatorProps {
  onSubmit: (value: string) => void;
  initialValue?: number;
  triggerTestID?: string;
}

function buttonStyle(name: string): { box: string; text: string } {
  if (name === "equals") return { box: "bg-primary", text: "text-white" };
  if (["add", "subtract", "multiply", "divide"].includes(name)) return { box: "bg-primary/10", text: "text-primary" };
  if (/^[0-9]$/.test(name) || name === "dot") return { box: "bg-surface-alt", text: "text-ink" };
  return { box: "bg-surface border border-border", text: "text-ink-mute" };
}

export function Calculator({ onSubmit, initialValue, triggerTestID = "btn-open-calculator" }: CalculatorProps) {
  const { useSheet, visible, setVisible, handleClose, handleSubmit, history, expression, error, result, press } =
    useCalculator(onSubmit, initialValue);

  const content = (
    <View className="gap-3">
      <View className="h-24 rounded-xl border border-border bg-surface p-2">
        <ScrollView className="custom-scrollbar">
          {history.map((line, i) => (
            <Text key={i} className="text-right text-sm text-ink-mute" selectable={false}>
              {line}
            </Text>
          ))}
        </ScrollView>
      </View>

      <View className="rounded-xl border border-border bg-surface px-4 py-3">
        <Text className="text-right font-mono text-body text-ink-mute" numberOfLines={1} selectable={false}>
          {expression}
        </Text>
        <Text
          className={cn("text-right font-mono-semibold text-h2", error ? "text-danger" : "text-ink")}
          numberOfLines={1}
          selectable={false}
        >
          {error ? "Error" : result}
        </Text>
      </View>

      <View className="gap-2">
        {BUTTON_ROWS.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row gap-2">
            {row.map((button: CalcButtonDef) => {
              const style = buttonStyle(button.name);
              return (
                <Pressable
                  key={button.name}
                  onPress={() => press(button.name)}
                  testID={`calc-btn-${button.name}`}
                  className={cn("h-14 flex-1 items-center justify-center rounded-lg active:opacity-80", style.box)}
                >
                  <Text className={cn("text-body-lg", style.text)} selectable={false}>
                    {button.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View className="mt-1 flex-row justify-end gap-3">
        <Button label="Close" variant="outline" onPress={handleClose} testID="calc-btn-close" />
        <Button label="Submit" onPress={handleSubmit} testID="calc-btn-submit" />
      </View>
    </View>
  );

  const overlay = useSheet ? (
    <Sheet visible={visible} onClose={handleClose} title="Calculator">
      {content}
    </Sheet>
  ) : (
    <Dialog visible={visible} onClose={handleClose} title="Calculator" size="sm">
      {content}
    </Dialog>
  );

  return (
    <>
      <IconButton
        icon="Calculator"
        variant="surface"
        accessibilityLabel="Open calculator"
        onPress={() => setVisible(true)}
        testID={triggerTestID}
      />
      {overlay}
    </>
  );
}
