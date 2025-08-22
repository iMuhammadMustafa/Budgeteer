/**
 * LazyFormSection component for performance optimization
 * Lazy loads form sections to improve initial render performance
 */

import React, { memo, Suspense, lazy, useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { FormSectionProps } from '@/src/types/components/forms.types';

interface LazyFormSectionProps extends Omit<FormSectionProps, 'children'> {
  /**
   * Function that returns a promise resolving to the section content
   */
  loadContent: () => Promise<React.ComponentType<any>>;
  
  /**
   * Props to pass to the loaded component
   */
  contentProps?: any;
  
  /**
   * Whether to load content immediately or wait for user interaction
   */
  loadImmediately?: boolean;
  
  /**
   * Custom loading component
   */
  loadingComponent?: React.ComponentType;
  
  /**
   * Custom error component
   */
  errorComponent?: React.ComponentType<{ error: Error; retry: () => void }>;
  
  /**
   * Callback when content is loaded
   */
  onContentLoaded?: () => void;
  
  /**
   * Callback when loading fails
   */
  onLoadError?: (error: Error) => void;
}

/**
 * Default loading component
 */
const DefaultLoadingComponent = memo(() => (
  <View className="flex-row items-center justify-center p-4">
    <ActivityIndicator size="small" color="#3b82f6" />
    <Text className="ml-2 text-gray-600">Loading section...</Text>
  </View>
));

/**
 * Default error component
 */
const DefaultErrorComponent = memo(({ error, retry }: { error: Error; retry: () => void }) => (
  <View className="p-4 border border-red-300 rounded-md bg-red-50">
    <Text className="text-red-700 font-medium mb-2">Failed to load section</Text>
    <Text className="text-red-600 text-sm mb-3">{error.message}</Text>
    <Pressable
      onPress={retry}
      className="px-3 py-2 bg-red-600 rounded-md"
    >
      <Text className="text-white text-sm font-medium">Retry</Text>
    </Pressable>
  </View>
));

/**
 * LazyFormSection component with performance optimizations
 */
function LazyFormSectionComponent({
  title,
  description,
  collapsible = false,
  defaultExpanded = true,
  loadContent,
  contentProps = {},
  loadImmediately = false,
  loadingComponent: LoadingComponent = DefaultLoadingComponent,
  errorComponent: ErrorComponent = DefaultErrorComponent,
  onContentLoaded,
  onLoadError,
  className = '',
}: LazyFormSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [LazyContent, setLazyContent] = useState<React.ComponentType<any> | null>(null);

  // Load content function
  const loadSectionContent = useCallback(async () => {
    if (isLoaded || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const ContentComponent = await loadContent();
      setLazyContent(() => ContentComponent);
      setIsLoaded(true);
      onContentLoaded?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load content');
      setError(error);
      onLoadError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [loadContent, isLoaded, isLoading, onContentLoaded, onLoadError]);

  // Load content immediately if requested
  useEffect(() => {
    if (loadImmediately) {
      loadSectionContent();
    }
  }, [loadImmediately, loadSectionContent]);

  // Load content when section is expanded
  useEffect(() => {
    if (isExpanded && !loadImmediately && !isLoaded && !isLoading) {
      loadSectionContent();
    }
  }, [isExpanded, loadImmediately, isLoaded, isLoading, loadSectionContent]);

  const toggleExpanded = useCallback(() => {
    if (collapsible) {
      setIsExpanded(prev => !prev);
    }
  }, [collapsible]);

  const retryLoad = useCallback(() => {
    setError(null);
    setIsLoaded(false);
    loadSectionContent();
  }, [loadSectionContent]);

  const sectionId = title ? `lazy-section-${title.toLowerCase().replace(/\s+/g, '-')}` : undefined;
  const descriptionId = description ? `${sectionId}-description` : undefined;

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
              <View className="flex-row items-center">
                {isLoading && <ActivityIndicator size="small" color="#6b7280" className="mr-2" />}
                <Text 
                  className="text-gray-600 text-lg"
                  accessibilityHidden={true}
                >
                  {isExpanded ? '−' : '+'}
                </Text>
              </View>
            </Pressable>
          ) : (
            <View className="flex-row items-center">
              <Text 
                className="text-lg font-semibold text-foreground mb-2 flex-1"
                accessibilityRole="heading"
                accessibilityLevel={2}
              >
                {title}
              </Text>
              {isLoading && <ActivityIndicator size="small" color="#6b7280" />}
            </View>
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
          accessibilityRole="group"
          accessibilityLabel={title ? `${title} section content` : 'Form section content'}
          accessibilityDescribedBy={descriptionId}
        >
          {error ? (
            <ErrorComponent error={error} retry={retryLoad} />
          ) : isLoading ? (
            <LoadingComponent />
          ) : isLoaded && LazyContent ? (
            <Suspense fallback={<LoadingComponent />}>
              <LazyContent {...contentProps} />
            </Suspense>
          ) : !loadImmediately ? (
            <Pressable
              onPress={loadSectionContent}
              className="p-4 border border-gray-300 rounded-md bg-gray-50"
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Load section content"
            >
              <Text className="text-center text-gray-700 font-medium">
                Tap to load content
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

// Memoize the component for better performance
const LazyFormSection = memo(LazyFormSectionComponent, (prevProps, nextProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.description === nextProps.description &&
    prevProps.collapsible === nextProps.collapsible &&
    prevProps.defaultExpanded === nextProps.defaultExpanded &&
    prevProps.loadImmediately === nextProps.loadImmediately &&
    prevProps.className === nextProps.className &&
    prevProps.loadContent === nextProps.loadContent &&
    prevProps.contentProps === nextProps.contentProps
  );
});

LazyFormSection.displayName = 'LazyFormSection';

export default LazyFormSection;

/**
 * Utility function to create a lazy-loaded form section
 */
export function createLazyFormSection<T = any>(
  importFunction: () => Promise<{ default: React.ComponentType<T> }>,
  options: {
    displayName?: string;
    preload?: boolean;
  } = {}
) {
  const { displayName = 'LazyFormSection', preload = false } = options;

  let preloadedComponent: React.ComponentType<T> | null = null;

  // Preload if requested
  if (preload) {
    importFunction().then(module => {
      preloadedComponent = module.default;
    }).catch(console.error);
  }

  const loadContent = async (): Promise<React.ComponentType<T>> => {
    if (preloadedComponent) {
      return preloadedComponent;
    }

    const module = await importFunction();
    preloadedComponent = module.default;
    return module.default;
  };

  const LazySection = (props: Omit<LazyFormSectionProps, 'loadContent'> & { contentProps?: T }) => (
    <LazyFormSection {...props} loadContent={loadContent} />
  );

  LazySection.displayName = displayName;
  LazySection.preload = () => loadContent();

  return LazySection;
}