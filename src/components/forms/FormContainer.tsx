import { View, Text, Pressable } from 'react-native';
import { FormContainerProps } from '@/src/types/components/forms.types';
import Button from '../Button';

/**
 * FormContainer component provides consistent layout, submission handling, and loading states
 * for all forms in the application. It includes form validation display, submit/reset buttons,
 * and responsive design with accessibility support.
 */
export default function FormContainer({
  children,
  onSubmit,
  isValid,
  isLoading,
  submitLabel = 'Save',
  showReset = false,
  onReset,
  className = '',
}: FormContainerProps) {
  const handleSubmit = () => {
    if (!isLoading && isValid) {
      onSubmit();
    }
  };

  const handleReset = () => {
    if (!isLoading && onReset) {
      onReset();
    }
  };

  const handleKeyPress = (event: any) => {
    // Handle Enter key for form submission
    if (event.nativeEvent?.key === 'Enter' && !event.nativeEvent?.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <View
      className={`p-5 ${className}`}
      accessible={true}
      accessibilityRole="form"
      accessibilityLabel="Form container"
      onKeyPress={handleKeyPress}
    >
      {/* Form Content */}
      <View className="flex-1 mb-4">
        {children}
      </View>

      {/* Form Actions */}
      <View className="flex-row justify-end space-x-3 mt-4">
        {showReset && onReset && (
          <Pressable
            className="px-4 py-2 border border-gray-300 rounded-md bg-white"
            onPress={handleReset}
            disabled={isLoading}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Reset form"
            accessibilityHint="Clears all form fields and resets to initial values"
          >
            <Text className={`text-center font-medium ${isLoading ? 'text-gray-400' : 'text-gray-700'}`}>
              Reset
            </Text>
          </Pressable>
        )}

        <Button
          label={isLoading ? 'Saving...' : submitLabel}
          onPress={handleSubmit}
          isValid={isValid && !isLoading}
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
          <View className="bg-white p-4 rounded-lg shadow-lg">
            <Text className="text-gray-700 font-medium">Processing...</Text>
          </View>
        </View>
      )}
    </View>
  );
}