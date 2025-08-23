import React, { memo, useState, useCallback, useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { FormSectionProps } from "@/src/types/components/forms.types";

/**
 * FormSection component provides a way to group related form fields
 * with optional collapsible functionality, consistent spacing, and accessibility support.
 */
function FormSectionComponent({
  title,
  children,
  collapsible = false,
  defaultExpanded = true,
  description,
  className = "",
}: FormSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = useCallback(() => {
    if (collapsible) {
      setIsExpanded(prev => !prev);
    }
  }, [collapsible]);

  // Memoize computed values to prevent unnecessary recalculations
  const sectionId = useMemo(() => 
    title ? `section-${title.toLowerCase().replace(/\s+/g, '-')}` : undefined, 
    [title]
  );
  const descriptionId = useMemo(() => 
    description ? `${sectionId}-description` : undefined, 
    [description, sectionId]
  );

  return (
    <View className={`my-4 ${className}`}>
      {/* Section Header */}
      {title && (
        <View className="mb-3">
          {collapsible ? (
            <Pressable
              onPress={toggleExpanded}
              className="flex-row items-center justify-between p-2 rounded-md bg-gray-50 border border-gray-200"
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`${title} section, ${isExpanded ? 'expanded' : 'collapsed'}`}
              accessibilityHint={`Tap to ${isExpanded ? 'collapse' : 'expand'} this section`}
              accessibilityState={{ expanded: isExpanded }}
            >
              <Text
                className="text-lg font-semibold text-foreground"
                accessibilityRole="heading"
                accessibilityLevel={2}
              >
                {title}
              </Text>
              <Text 
                className="text-gray-600 text-lg"
                accessibilityHidden={true}
              >
                {isExpanded ? '−' : '+'}
              </Text>
            </Pressable>
          ) : (
            <Text
              className="text-lg font-semibold text-foreground mb-2"
              accessibilityRole="heading"
              accessibilityLevel={2}
            >
              {title}
            </Text>
          )}
        </View>
      )}

      {/* Section Description */}
      {description && (
        <Text 
          id={descriptionId}
          className="text-gray-600 text-sm mb-3"
          accessibilityRole="text"
        >
          {description}
        </Text>
      )}

      {/* Section Content */}
      {(!collapsible || isExpanded) && (
        <View
          className="space-y-2"
          accessible={true}
          accessibilityRole="list"
          accessibilityLabel={title ? `${title} section content` : "Form section content"}
          accessibilityDescribedBy={descriptionId}
        >
          {children}
        </View>
      )}
    </View>
  );
}

// Memoize the component with custom comparison function for better performance
const FormSection = memo(FormSectionComponent, (prevProps, nextProps) => {
  // Custom comparison to optimize re-renders
  return (
    prevProps.title === nextProps.title &&
    prevProps.collapsible === nextProps.collapsible &&
    prevProps.defaultExpanded === nextProps.defaultExpanded &&
    prevProps.description === nextProps.description &&
    prevProps.className === nextProps.className
    // children comparison is handled by React's default shallow comparison
  );
});

FormSection.displayName = 'FormSection';

export default FormSection;