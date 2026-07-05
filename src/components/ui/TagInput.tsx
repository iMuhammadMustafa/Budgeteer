/**
 * TagInput — free-form tag entry as removable chips. Typing text and pressing
 * comma or Enter (or blurring) commits the current text as a chip; tapping a
 * chip's × removes it, and Backspace on an empty field pops the last chip.
 * Values are trimmed, de-duped (case-insensitive), and emitted as a string[]
 * via `onChange`, matching the shape the transaction/recurring forms persist.
 *
 *   <TagInput label="Tags" value={tags} onChange={setTags} />
 */
import { useState } from "react";
import { Platform, TextInput, View } from "react-native";

import { useTheme } from "@/src/providers/ThemeProvider";
import { Chip } from "./Chip";
import { Text } from "./Text";
import { cn } from "./utils/cn";

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  onBlur?: () => void;
  className?: string;
  testID?: string;
}

export function TagInput({
  value,
  onChange,
  label,
  placeholder = "Add a tag…",
  error,
  onBlur,
  className,
  testID = "tag-input",
}: TagInputProps) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState("");

  const commit = (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    // Case-insensitive de-dupe; keep the first-entered casing.
    if (value.some(t => t.toLowerCase() === tag.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  };

  const handleChangeText = (text: string) => {
    // A comma anywhere in the incoming text commits the segment(s) before it,
    // so pasting "a, b, c" splits cleanly and typing a comma finishes a chip.
    if (text.includes(",")) {
      const parts = text.split(",");
      const tail = parts.pop() ?? "";
      parts.forEach(commit);
      setDraft(tail);
      return;
    }
    setDraft(text);
  };

  const removeAt = (index: number) => onChange(value.filter((_, i) => i !== index));

  const handleKeyPress = (e: { nativeEvent: { key: string } }) => {
    if (e.nativeEvent.key === "Backspace" && draft === "" && value.length > 0) {
      removeAt(value.length - 1);
    }
  };

  const handleBlur = () => {
    commit(draft);
    onBlur?.();
  };

  return (
    <View className={cn("w-full", className)}>
      {label ? (
        <Text variant="label" className="mb-[7px]">
          {label}
        </Text>
      ) : null}
      <View
        className={cn(
          "flex-row flex-wrap items-center gap-2 rounded-lg border bg-surface px-3 py-2.5",
          error ? "border-danger" : "border-border",
        )}
      >
        {value.map((tag, index) => (
          <Chip key={`${tag}-${index}`} label={tag} onRemove={() => removeAt(index)} testID={`${testID}-chip-${index}`} />
        ))}
        <TextInput
          value={draft}
          onChangeText={handleChangeText}
          onKeyPress={handleKeyPress}
          onSubmitEditing={() => commit(draft)}
          onBlur={handleBlur}
          blurOnSubmit={false}
          placeholder={value.length === 0 ? placeholder : ""}
          placeholderTextColor={colors.inkFaint}
          selectionColor={colors.primary}
          returnKeyType="done"
          testID={`${testID}-field`}
          className="min-w-[80px] flex-1 p-0 font-sans text-body text-ink"
          style={Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : undefined}
        />
      </View>
      {error ? <Text className="mt-[5px] font-sans text-xs text-danger">{error}</Text> : null}
    </View>
  );
}
