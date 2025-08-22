import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, TextInput, Switch } from 'react-native';
import { FormFieldProps, OptionItem } from '@/src/types/components/forms.types';
import DropdownField from '../DropDownField';
import MyDateTimePicker from '../MyDateTimePicker';
import dayjs from 'dayjs';

/**
 * FormField component provides a consistent wrapper for different field types
 * with error display, validation states, and accessibility support.
 * Supports: text, number, select, date, textarea, switch field types.
 */
function FormFieldComponent<T>({
  config,
  value,
  error,
  touched,
  onChange,
  onBlur,
  className = '',
}: FormFieldProps<T>) {
  const {
    name,
    label,
    type,
    required = false,
    placeholder,
    options = [],
    disabled = false,
    description,
  } = config;

  const hasError = touched && error;
  
  // Memoize computed values to prevent unnecessary recalculations
  const fieldId = useMemo(() => `field-${String(name)}`, [name]);
  const errorId = useMemo(() => `${fieldId}-error`, [fieldId]);
  const descriptionId = useMemo(() => `${fieldId}-description`, [fieldId]);
  
  // Enhanced accessibility attributes
  const accessibilityDescribedBy = useMemo(() => {
    const describedByIds = [];
    if (description) describedByIds.push(descriptionId);
    if (hasError) describedByIds.push(errorId);
    return describedByIds.length > 0 ? describedByIds.join(' ') : undefined;
  }, [description, hasError, descriptionId, errorId]);

  const handleChange = useCallback((newValue: any) => {
    onChange(newValue);
  }, [onChange]);

  const handleBlur = useCallback(() => {
    if (onBlur) {
      onBlur();
    }
  }, [onBlur]);

  const renderField = () => {
    const baseAccessibilityProps = {
      accessible: true,
      accessibilityLabel: label + (required ? ' (required)' : ''),
      accessibilityRequired: required,
      accessibilityInvalid: Boolean(hasError),
      accessibilityDescribedBy: accessibilityDescribedBy,
      accessibilityState: {
        invalid: Boolean(hasError),
        required: required,
        disabled: disabled,
      },
      accessibilityHint: hasError 
        ? `This field has an error: ${error}` 
        : description 
          ? description 
          : undefined,
    };

    switch (type) {
      case 'text':
      case 'number':
        return (
          <TextInput
            {...baseAccessibilityProps}
            className={`text-black border rounded-md p-3 ${
              hasError 
                ? 'border-red-500 bg-red-50' 
                : disabled 
                  ? 'border-gray-200 bg-gray-100' 
                  : 'border-gray-300 bg-white'
            }`}
            value={value?.toString() || ''}
            onChangeText={handleChange}
            onBlur={handleBlur}
            keyboardType={type === 'number' ? 'numeric' : 'default'}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            editable={!disabled}
            aria-disabled={disabled}
          />
        );

      case 'textarea':
        return (
          <TextInput
            {...baseAccessibilityProps}
            className={`text-black border rounded-md p-3 h-20 ${
              hasError 
                ? 'border-red-500 bg-red-50' 
                : disabled 
                  ? 'border-gray-200 bg-gray-100' 
                  : 'border-gray-300 bg-white'
            }`}
            value={value?.toString() || ''}
            onChangeText={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            multiline={true}
            textAlignVertical="top"
            editable={!disabled}
            aria-disabled={disabled}
          />
        );

      case 'select':
        return (
          <View>
            <DropdownField
              label={label}
              selectedValue={value}
              options={options}
              onSelect={(item: OptionItem | null) => {
                handleChange(item?.value || null);
                handleBlur();
              }}
              isModal={true}
            />
          </View>
        );

      case 'date':
        return (
          <MyDateTimePicker
            label=""
            date={value ? dayjs(value) : null}
            onChange={(dateString: string | null) => {
              handleChange(dateString);
              handleBlur();
            }}
            isModal={true}
          />
        );

      case 'switch':
        return (
          <View className="flex-row items-center justify-between py-2">
            <Switch
              {...baseAccessibilityProps}
              value={Boolean(value)}
              onValueChange={(newValue: boolean) => {
                handleChange(newValue);
                handleBlur();
              }}
              disabled={disabled}
              trackColor={{ 
                false: disabled ? '#e5e7eb' : '#d1d5db', 
                true: disabled ? '#93c5fd' : '#3b82f6' 
              }}
              thumbColor={disabled ? '#9ca3af' : '#ffffff'}
            />
          </View>
        );

      case 'multiselect':
        // For now, render as text input - can be enhanced later
        return (
          <TextInput
            {...baseAccessibilityProps}
            className={`text-black border rounded-md p-3 ${
              hasError 
                ? 'border-red-500 bg-red-50' 
                : disabled 
                  ? 'border-gray-200 bg-gray-100' 
                  : 'border-gray-300 bg-white'
            }`}
            value={Array.isArray(value) ? value.join(', ') : value?.toString() || ''}
            onChangeText={(text) => handleChange(text.split(', ').filter(Boolean))}
            onBlur={handleBlur}
            placeholder={placeholder || 'Enter values separated by commas'}
            placeholderTextColor="#9ca3af"
            editable={!disabled}
            aria-disabled={disabled}
          />
        );

      default:
        return (
          <Text className="text-red-500 p-3 border border-red-300 rounded-md bg-red-50">
            Unsupported field type: {type}
          </Text>
        );
    }
  };

  return (
    <View className={`my-2 ${className}`}>
      {/* Field Label */}
      {label && type !== 'switch' && (
        <Text 
          className={`text-foreground mb-1 ${required ? 'font-medium' : ''}`}
          accessibilityRole="text"
        >
          {label}
          {required && <Text className="text-red-500 ml-1">*</Text>}
        </Text>
      )}

      {/* Switch fields have inline labels */}
      {type === 'switch' && (
        <View className="flex-row items-center justify-between">
          <Text 
            className={`text-foreground ${required ? 'font-medium' : ''}`}
            accessibilityRole="text"
          >
            {label}
            {required && <Text className="text-red-500 ml-1">*</Text>}
          </Text>
          {renderField()}
        </View>
      )}

      {/* Non-switch fields */}
      {type !== 'switch' && renderField()}

      {/* Field Description */}
      {description && (
        <Text 
          id={descriptionId}
          className="text-gray-600 text-sm mt-1"
          accessibilityRole="text"
        >
          {description}
        </Text>
      )}

      {/* Error Message */}
      {hasError && (
        <Text 
          id={errorId}
          className="text-red-500 text-sm mt-1"
          accessibilityRole="text"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
    </View>
  );
}

// Memoize the component with custom comparison function for better performance
const FormField = memo(FormFieldComponent, (prevProps, nextProps) => {
  // Custom comparison to optimize re-renders
  return (
    prevProps.value === nextProps.value &&
    prevProps.error === nextProps.error &&
    prevProps.touched === nextProps.touched &&
    prevProps.config === nextProps.config &&
    prevProps.onChange === nextProps.onChange &&
    prevProps.onBlur === nextProps.onBlur &&
    prevProps.className === nextProps.className
  );
}) as typeof FormFieldComponent;

FormField.displayName = 'FormField';

export default FormField;