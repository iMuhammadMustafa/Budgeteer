import { Text as ThemedText, triggerHaptic } from "@/src/components/ui";
import { FormSectionProps } from "@/src/types/components/forms.types";
import { memo, useCallback, useMemo, useState } from "react";
import { Pressable, View } from "react-native";

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
  actionBtn,
  className = "",
}: FormSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = useCallback(() => {
    if (collapsible) {
      setIsExpanded(prev => !prev);
    }
  }, [collapsible]);

  // Memoize computed values to prevent unnecessary recalculations
  const sectionId = useMemo(() => (title ? `section-${title.toLowerCase().replace(/\s+/g, "-")}` : undefined), [title]);
  const descriptionId = useMemo(() => (description ? `${sectionId}-description` : undefined), [description, sectionId]);

  return (
    <View className={`my-4 ${className}`}>
      {/* Section Header */}
      {title && (
        <View className="mb-3">
          {collapsible ? (
            <Pressable
              onPress={() => {
                triggerHaptic("selection");
                toggleExpanded();
              }}
              className="flex-row items-center justify-between rounded-lg border border-border bg-surface-alt p-2 active:opacity-80"
              accessibilityRole="button"
              accessibilityLabel={`${title} section, ${isExpanded ? "expanded" : "collapsed"}`}
              accessibilityHint={`Tap to ${isExpanded ? "collapse" : "expand"} this section`}
              accessibilityState={{ expanded: isExpanded }}
              testID={`btn-section-${title?.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <ThemedText variant="h3" accessibilityRole="header">
                {title}
              </ThemedText>
              <ThemedText variant="caption" className="text-lg" aria-hidden={true}>
                {isExpanded ? "−" : "+"}
              </ThemedText>
            </Pressable>
          ) : (
            <ThemedText variant="h3" className="mb-2" accessibilityRole="header">
              {title}
            </ThemedText>
          )}
        </View>
      )}

      {/* Section Description */}
      <View className="flex-row items-center justify-between">
        {description && (
          <ThemedText variant="caption" id={descriptionId} className="text-sm mb-3" accessibilityRole="text">
            {description}
          </ThemedText>
        )}
        {actionBtn && actionBtn}
      </View>
      {/* Section Content */}
      {(!collapsible || isExpanded) && (
        <View
          className="space-y-2"
          accessible={true}
          accessibilityRole="list"
          accessibilityLabel={title ? `${title} section content` : "Form section content"}
          // @ts-expect-error accessibilityDescribedBy is web/aria only
          accessibilityDescribedBy={descriptionId}
        >
          {children}
        </View>
      )}
    </View>
  );
}

// Memoize the component with custom comparison function for better performance
// const FormSection = memo(FormSectionComponent, (prevProps, nextProps) => {
//   // Custom comparison to optimize re-renders
//   return (
//     prevProps.title === nextProps.title &&
//     prevProps.collapsible === nextProps.collapsible &&
//     prevProps.defaultExpanded === nextProps.defaultExpanded &&
//     prevProps.description === nextProps.description &&
//     prevProps.className === nextProps.className
//     // children comparison is handled by React's default shallow comparison
//   );
// });
const FormSection = memo(FormSectionComponent);

export default FormSection;
