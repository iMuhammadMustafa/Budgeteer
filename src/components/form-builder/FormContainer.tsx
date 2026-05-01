import Button from "@/src/components/elements/Button";
import { FormContainerProps } from "@/src/types/components/forms.types";
import { memo, useCallback } from "react";
import { Text, View } from "react-native";

/**
 * FormContainer component provides consistent layout, submission handling, and loading states
 * for all forms in the application. It includes form validation display, submit/reset buttons,
 * and responsive design with accessibility support.
 *
 * Performance optimizations:
 * - Memoized with React.memo to prevent unnecessary re-renders
 * - useCallback for event handlers to maintain referential equality
 */
function FormContainerComponent({
  children,
  onSubmit,
  isValid,
  isLoading,
  submitLabel = "Save",
  showReset = false,
  onReset,
  className = "",
}: FormContainerProps) {
  const handleSubmit = useCallback(() => {
    if (!isLoading && isValid) {
      onSubmit();
    }
  }, [isLoading, isValid, onSubmit]);

  const handleReset = useCallback(() => {
    if (!isLoading && onReset) {
      onReset();
    }
  }, [isLoading, onReset]);

  const handleKeyPress = useCallback(
    (event: any) => {
      // Handle Enter key for form submission
      if (event.nativeEvent?.key === "Enter" && !event.nativeEvent?.shiftKey) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <View
      className={`p-5 ${className}`}
      accessible={true}
      accessibilityRole="list"
      accessibilityLabel="Form container"
      accessibilityState={{
        busy: isLoading,
        disabled: isLoading,
      }}
      // @ts-expect-error onKeyDown is web-only
      onKeyDown={handleKeyPress}
    >
      {/* Form Content */}
      <View className="flex-1 mb-4">{children}</View>

      {/* Form Actions */}
      <View className="flex-row justify-end space-x-3 mt-4 -z-10">
        {showReset && onReset && (
          <Button
            variant="outline"
            size="md"
            onPress={handleReset}
            disabled={isLoading}
            label="Reset"
            accessibilityHint="Clears all form fields and resets to initial values"
            testID="btn-form-reset"
          />
        )}

        <Button
          label={isLoading ? "Saving..." : submitLabel}
          onPress={handleSubmit}
          isValid={isValid && !isLoading}
          accessibilityHint={
            !isValid
              ? "Form has validation errors that need to be fixed before submission"
              : isLoading
                ? "Form is currently being submitted"
                : "Submit the form with current values"
          }
          accessibilityState={{
            busy: isLoading,
            disabled: !isValid || isLoading,
          }}
        />
      </View>

      {/* Loading Overlay */}
      {isLoading && (
        <View
          className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center"
          accessible={true}
          accessibilityLabel="Form is loading"
          accessibilityLiveRegion="polite"
        >
          <View className="bg-surface p-4 rounded-lg shadow-lg">
            <Text className="text-text-secondary font-medium">Processing...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// Memoize the component with custom comparison function
const FormContainer = memo(FormContainerComponent, (prevProps, nextProps) => {
  // Custom comparison to optimize re-renders
  return (
    prevProps.isValid === nextProps.isValid &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.submitLabel === nextProps.submitLabel &&
    prevProps.showReset === nextProps.showReset &&
    prevProps.className === nextProps.className &&
    prevProps.onSubmit === nextProps.onSubmit &&
    prevProps.onReset === nextProps.onReset
    // children comparison is handled by React's default shallow comparison
  );
});

FormContainer.displayName = "FormContainer";

export default FormContainer;
