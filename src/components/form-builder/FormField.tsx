/**
 * FormField — consistent wrapper for the form-builder field types, rendering the
 * new `ui/` inputs (Step 4 straight swap). The ui inputs own their label + error
 * display; this wrapper adds the optional description line and the inline switch
 * label, and bridges the legacy `addNew.renderForm` onto `Select`'s addNew via a
 * Dialog. The `FormFieldProps`/`FormFieldConfig` API is unchanged.
 *
 * Supports: text, number, select, date, textarea, switch, multiselect.
 */
import { FormFieldProps } from "@/src/types/components/forms.types";
import { memo, useCallback, useMemo, useState } from "react";
import { View } from "react-native";

import {
  DateTimePicker,
  Dialog,
  Input,
  Select,
  Switch,
  Text,
  type SelectOption,
} from "@/src/components/ui";

function FormFieldComponent<T>({ config, value, error, touched, onChange, onBlur, className = "" }: FormFieldProps<T>) {
  const { name, label, type, required = false, placeholder, options = [], disabled = false, description } = config;

  const hasError = Boolean(touched && error);
  const errorText = hasError ? error : undefined;
  const fieldTestID = `field-${String(name)}`;

  const handleChange = useCallback((newValue: any) => onChange(newValue), [onChange]);
  const handleBlur = useCallback(() => onBlur?.(), [onBlur]);

  // Map form OptionItem[] → ui SelectOption[] (id is the stable key; value carries the payload).
  const selectOptions: SelectOption[] = useMemo(
    () =>
      options.map(opt => ({
        id: String(opt.id),
        label: opt.label,
        value: opt.value,
        icon: opt.icon,
        iconColor: opt.color,
        // Forms attach a `.group` string to options when grouping is enabled.
        group: (opt as { group?: string }).group,
        disabled: opt.disabled,
      })),
    [options],
  );

  const optionById = useMemo(() => new Map(selectOptions.map((o, i) => [o.id, options[i]])), [selectOptions, options]);
  const idForValue = useMemo(() => {
    const match = options.find(o => o.value === value);
    return match ? String(match.id) : null;
  }, [options, value]);

  // Inline "Add New" entity creation (legacy addNew.renderForm) hosted in a Dialog.
  const [addingNew, setAddingNew] = useState(false);
  const addNew = config.addNew;

  const labelNode = (
    <Text variant="label" className="mb-[7px]">
      {label}
      {required ? <Text className="text-danger"> *</Text> : null}
    </Text>
  );

  const renderField = () => {
    switch (type) {
      case "text":
        return (
          <Input
            label={label}
            value={value === null || value === undefined ? "" : value.toString()}
            onChangeText={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            editable={!disabled}
            error={errorText}
            testID={fieldTestID}
          />
        );

      case "number":
        return (
          <Input
            label={label}
            value={value === null || value === undefined ? "" : value.toString()}
            onChangeText={handleChange}
            onBlur={() => {
              if (value === "" || value === null || value === undefined) onChange(null);
              else if (!isNaN(Number(value))) onChange(Number(value));
              handleBlur();
            }}
            keyboardType="numeric"
            placeholder={placeholder}
            editable={!disabled}
            error={errorText}
            testID={fieldTestID}
          />
        );

      case "textarea":
        return (
          <Input
            label={label}
            value={value?.toString() || ""}
            onChangeText={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            containerClassName="h-24 items-start py-2"
            editable={!disabled}
            error={errorText}
            testID={fieldTestID}
          />
        );

      case "select":
        return (
          <Select
            label={label}
            options={selectOptions}
            value={idForValue}
            onChange={next => {
              const id = Array.isArray(next) ? next[0] : next;
              const opt = id ? optionById.get(id) : null;
              handleChange(opt ? opt.value : null);
              handleBlur();
            }}
            groupBy={config.group ? o => o.group ?? "" : undefined}
            clearable={config.showClear}
            present={config.popUp ? "dialog" : undefined}
            addNew={addNew ? { label: addNew.label ?? "Add new", onPress: () => setAddingNew(true) } : undefined}
            disabled={disabled}
            error={errorText}
            placeholder={placeholder}
            testID={fieldTestID}
          />
        );

      case "multiselect": {
        const selectedIds = Array.isArray(value)
          ? options.filter(o => (value as any[]).includes(o.value)).map(o => String(o.id))
          : [];
        return (
          <Select
            label={label}
            multiple
            options={selectOptions}
            values={selectedIds}
            onChange={next => {
              const ids = Array.isArray(next) ? next : next ? [next] : [];
              handleChange(ids.map(id => optionById.get(id)?.value).filter(v => v !== undefined));
              handleBlur();
            }}
            clearable={config.showClear}
            present={config.popUp ? "dialog" : undefined}
            disabled={disabled}
            error={errorText}
            placeholder={placeholder}
            testID={fieldTestID}
          />
        );
      }

      case "date":
        return (
          <DateTimePicker
            label={label}
            value={value ? String(value) : null}
            onChange={iso => {
              handleChange(iso);
              handleBlur();
            }}
            present={config.popUp ? "dialog" : undefined}
            disabled={disabled}
            error={errorText}
            testID={fieldTestID}
          />
        );

      case "switch":
        return (
          <View className="flex-row items-center justify-between py-1">
            <Text className={required ? "font-medium" : undefined}>
              {label}
              {required ? <Text className="text-danger"> *</Text> : null}
            </Text>
            <Switch
              value={Boolean(value)}
              onValueChange={(newValue: boolean) => {
                handleChange(newValue);
                handleBlur();
              }}
              disabled={disabled}
              testID={`switch-${String(name)}`}
            />
          </View>
        );

      default:
        return (
          <>
            {labelNode}
            <Text className="rounded-lg border border-danger/30 bg-danger-soft p-3 text-danger">
              Unsupported field type: {type}
            </Text>
          </>
        );
    }
  };

  return (
    <View className={`my-2 ${className}`}>
      {renderField()}

      {description ? (
        <Text variant="caption" className="mt-1">
          {description}
        </Text>
      ) : null}

      {addNew ? (
        <Dialog visible={addingNew} onClose={() => setAddingNew(false)} title={addNew.entityType ? `Add ${addNew.entityType}` : "Add new"}>
          {addNew.renderForm({
            onSuccess: (item: any) => {
              addNew.onCreated?.(item);
              if (item && item.value !== undefined) handleChange(item.value);
              else if (item && item.id !== undefined) handleChange(item.id);
              setAddingNew(false);
            },
            onCancel: () => setAddingNew(false),
          })}
        </Dialog>
      ) : null}
    </View>
  );
}

const FormField = memo(FormFieldComponent) as typeof FormFieldComponent;

export default FormField;
