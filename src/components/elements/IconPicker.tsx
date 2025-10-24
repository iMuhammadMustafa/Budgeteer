import AsyncStorage from "@react-native-async-storage/async-storage";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, FlatList, Modal, Pressable, Text, View } from "react-native";
import MyIcon from "./MyIcon";
import TextInputField from "./TextInputField";

// TypeScript interfaces
interface IconPickerProps {
  label?: string;
  initialIcon?: string;
  onSelect: (iconName: string) => void;
}

interface IconItem {
  name: string;
  isRecent?: boolean;
  category?: string;
}

// Constants
const DEFAULT_ICON = "BadgeInfo";
const MAX_RECENT_ICONS = 10;
const RECENT_ICONS_KEY = "iconPicker_recentIcons";
const ICONS_PER_PAGE = 50; // Load icons in batches

// Lazy load icon names - only load when needed
let iconNamesCache: string[] | null = null;
const getIconNames = async (): Promise<string[]> => {
  if (iconNamesCache) {
    return iconNamesCache;
  }

  try {
    // Dynamically import icons only when needed
    const { icons } = await import("lucide-react-native");
    iconNamesCache = Object.keys(icons);
    return iconNamesCache;
  } catch (error) {
    console.warn("Failed to load icons:", error);
    return [];
  }
};

// Popular icons that load first for better UX
const POPULAR_ICONS = [
  "Home",
  "User",
  "Mail",
  "Phone",
  "Search",
  "Settings",
  "Heart",
  "Star",
  "Plus",
  "Minus",
  "Edit",
  "Trash",
  "Save",
  "Download",
  "Upload",
  "Share",
  "Lock",
  "Unlock",
  "Eye",
  "EyeOff",
  "Calendar",
  "Clock",
  "Map",
  "Camera",
  "Image",
  "File",
  "Folder",
  "Tag",
  "Bell",
  "Shield",
  "Key",
  "Gift",
];

// Icon categories for better organization
const ICON_CATEGORIES = {
  Popular: POPULAR_ICONS,
  Navigation: ["Home", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Menu", "X", "ChevronLeft", "ChevronRight"],
  Actions: ["Plus", "Minus", "Edit", "Trash", "Save", "Download", "Upload", "Share", "Copy", "Cut", "Paste"],
  Communication: ["Mail", "Phone", "MessageCircle", "Send", "Bell", "Mic", "MicOff", "Video", "VideoOff"],
  Files: ["File", "Folder", "FileText", "Image", "Music", "Video", "Archive", "Download", "Upload"],
  UI: ["Settings", "Search", "Filter", "Sort", "Grid", "List", "Eye", "EyeOff", "Lock", "Unlock"],
};

// Custom debounce hook with better performance
const useDebounce = (value: string, delay: number): string => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
};

// Optimized search function with early termination
const searchIcons = (icons: string[], searchTerm: string, maxResults: number = 200): string[] => {
  if (!searchTerm.trim()) return icons;

  const searchLower = searchTerm.toLowerCase();
  const results: string[] = [];
  const exactMatches: string[] = [];
  const startsWithMatches: string[] = [];
  const containsMatches: string[] = [];

  // Early termination when we have enough results
  for (const icon of icons) {
    if (results.length >= maxResults) break;

    const iconLower = icon.toLowerCase();

    if (iconLower === searchLower) {
      exactMatches.push(icon);
    } else if (iconLower.startsWith(searchLower)) {
      startsWithMatches.push(icon);
    } else if (iconLower.includes(searchLower)) {
      containsMatches.push(icon);
    }
  }

  // Return prioritized results
  return [...exactMatches, ...startsWithMatches, ...containsMatches].slice(0, maxResults);
};

// Custom responsive columns hook
const useResponsiveColumns = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  return useMemo(() => {
    const { width } = dimensions;
    if (width < 480) return 4; // Mobile
    if (width < 768) return 6; // Tablet portrait
    if (width < 1024) return 8; // Tablet landscape
    return 10; // Desktop
  }, [dimensions.width]);
};

// Memoized icon item component for better performance
const IconItemComponent = memo(
  ({ item, isSelected, onSelect }: { item: IconItem; isSelected: boolean; onSelect: (iconName: string) => void }) => {
    const handlePress = useCallback(() => onSelect(item.name), [onSelect, item.name]);

    return (
      <Pressable
        onPress={handlePress}
        className={`
        flex-1 p-2 m-1 rounded-lg border-2 min-h-[80px]
        ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"}
        ${item.isRecent ? "ring-2 ring-green-200" : ""}
      `}
        accessibilityRole="button"
        accessibilityLabel={`Select ${item.name} icon`}
        accessibilityHint={item.isRecent ? "Recently used icon" : undefined}
      >
        <View className="flex-1 justify-center items-center">
          <MyIcon name={item.name} size={24} color={isSelected ? "#3b82f6" : "#374151"} />
          <Text
            className={`
            text-xs mt-1 text-center font-medium
            ${isSelected ? "text-blue-600" : "text-gray-600"}
          `}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.name}
          </Text>
          {item.isRecent && <View className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />}
        </View>
      </Pressable>
    );
  },
);

function IconPickerComponent({ label = "Icon", initialIcon = DEFAULT_ICON, onSelect }: IconPickerProps) {
  // State management
  const [selectedIcon, setSelectedIcon] = useState<string>(initialIcon || DEFAULT_ICON);
  const [searchText, setSearchText] = useState<string>("");
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [recentIcons, setRecentIcons] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [availableIcons, setAvailableIcons] = useState<string[]>(POPULAR_ICONS);
  const [hasLoadedAllIcons, setHasLoadedAllIcons] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("Popular");

  // Refs
  const flatListRef = useRef<FlatList>(null);

  // Custom hooks
  const debouncedSearchText = useDebounce(searchText, 300);
  const numColumns = useResponsiveColumns();

  // Initialize component and load recent icons
  useEffect(() => {
    setSelectedIcon(initialIcon || DEFAULT_ICON);
    loadRecentIcons();
  }, [initialIcon]);

  // Load recent icons from storage
  const loadRecentIcons = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_ICONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentIcons(parsed);
      }
    } catch (error) {
      console.warn("Failed to load recent icons:", error);
    }
  }, []);

  // Save recent icons to storage
  const saveRecentIcons = useCallback(async (icons: string[]) => {
    try {
      await AsyncStorage.setItem(RECENT_ICONS_KEY, JSON.stringify(icons));
    } catch (error) {
      console.warn("Failed to save recent icons:", error);
    }
  }, []);

  // Load all icons when modal opens
  const loadAllIcons = useCallback(async () => {
    if (hasLoadedAllIcons) return;

    setIsLoading(true);
    try {
      const allIconNames = await getIconNames();
      setAvailableIcons(allIconNames);
      setHasLoadedAllIcons(true);
    } catch (error) {
      console.warn("Failed to load all icons:", error);
    } finally {
      setIsLoading(false);
    }
  }, [hasLoadedAllIcons]);

  // Filtered icons with performance optimization
  const filteredIcons = useMemo(() => {
    let baseIcons: string[] = [];

    // Determine base icon set
    if (debouncedSearchText.trim()) {
      // For search, use all available icons
      baseIcons = availableIcons;
    } else if (selectedCategory === "Recent" && recentIcons.length > 0) {
      // Show recent icons
      baseIcons = recentIcons.filter(name => availableIcons.includes(name));
    } else if (selectedCategory === "All") {
      // Show all icons - no limit for "All" category
      baseIcons = availableIcons;
    } else {
      // Show category icons
      const categoryIcons = ICON_CATEGORIES[selectedCategory as keyof typeof ICON_CATEGORIES] || [];
      baseIcons = categoryIcons.filter(name => availableIcons.includes(name));
    }

    let filtered: IconItem[] = [];

    if (!debouncedSearchText.trim()) {
      // No search - show category or recent icons
      filtered = baseIcons.map((name: string) => ({
        name,
        isRecent: recentIcons.includes(name),
        category: selectedCategory,
      }));
    } else {
      // Use optimized search with early termination
      // Show more results for "All" category search
      const searchLimit = selectedCategory === "All" ? 500 : 100;
      const searchResults = searchIcons(baseIcons, debouncedSearchText, searchLimit);

      filtered = searchResults.map((name: string) => ({
        name,
        isRecent: recentIcons.includes(name),
        category: selectedCategory,
      }));

      // Sort to prioritize recent icons but keep search ranking
      filtered.sort((a: IconItem, b: IconItem) => {
        if (a.isRecent && !b.isRecent) return -1;
        if (!a.isRecent && b.isRecent) return 1;
        return 0; // Keep original search order
      });
    }

    return filtered;
  }, [debouncedSearchText, recentIcons, availableIcons, selectedCategory]);

  // Handle icon selection
  const handleIconSelect = useCallback(
    (iconName: string) => {
      setSelectedIcon(iconName);
      onSelect(iconName);

      // Update recent icons
      const newRecentIcons = [iconName, ...recentIcons.filter(name => name !== iconName)].slice(0, MAX_RECENT_ICONS);
      setRecentIcons(newRecentIcons);
      saveRecentIcons(newRecentIcons);

      setIsModalVisible(false);
      setSearchText("");
    },
    [onSelect, recentIcons, saveRecentIcons],
  );

  // Handle search text change
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchText(text);

      // If user types exact icon name, auto-select it
      if (availableIcons.includes(text)) {
        setSelectedIcon(text);
        onSelect(text);
      }
    },
    [onSelect, availableIcons],
  );

  // Handle modal open - load all icons when needed
  const handleModalOpen = useCallback(() => {
    setIsModalVisible(true);
    if (!hasLoadedAllIcons) {
      loadAllIcons();
    }
  }, [hasLoadedAllIcons, loadAllIcons]);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setIsModalVisible(false);
    setSearchText("");
    setSelectedCategory("Popular");
  }, []);

  // Optimized item layout for FlatList - fixed size for better performance
  const getItemLayout = useCallback(
    (_data: any, index: number) => {
      const ITEM_HEIGHT = 100; // Fixed height for each item
      const row = Math.floor(index / numColumns);
      return {
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * row,
        index,
      };
    },
    [numColumns],
  );

  // Key extractor for better FlatList performance
  const keyExtractor = useCallback((item: IconItem) => item.name, []);

  // Optimized render function to prevent unnecessary re-renders
  const renderIconItem = useCallback(
    ({ item }: { item: IconItem }) => (
      <IconItemComponent item={item} isSelected={item.name === selectedIcon} onSelect={handleIconSelect} />
    ),
    [selectedIcon, handleIconSelect],
  );

  // Render loading skeleton
  const renderLoadingSkeleton = useCallback(() => {
    const skeletonItems = Array.from({ length: numColumns * 3 }, (_, index) => (
      <View key={`skeleton-${index}`} className="flex-1 p-2 m-1 rounded-lg bg-gray-200 min-h-[80px] animate-pulse" />
    ));

    return <View className="flex-row flex-wrap">{skeletonItems}</View>;
  }, [numColumns]);

  return (
    <View className="w-full">
      {/* Label */}
      {/* <Text className="text-base font-medium text-gray-700 mb-2">{label}</Text> */}

      {/* Icon selector button */}
      <Pressable
        className="
          p-3 rounded-md border border-gray-300 bg-white
          flex-row items-center justify-center
          hover:border-gray-400 hover:bg-gray-50
          focus:border-blue-500 focus:ring-2 focus:ring-blue-200
        "
        onPress={handleModalOpen}
        accessibilityRole="button"
        accessibilityLabel={`Selected icon: ${selectedIcon}. Tap to change icon`}
        accessibilityHint="Opens icon picker modal"
      >
        <MyIcon name={selectedIcon} size={24} className="text-foreground" />
        <Text className="ml-2 text-gray-700 font-medium">{selectedIcon}</Text>
      </Pressable>

      {/* Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleModalClose}
        accessibilityViewIsModal={true}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center p-4"
          onPress={handleModalClose}
          accessibilityRole="button"
          accessibilityLabel="Close icon picker"
        >
          <Pressable
            className="w-full max-w-4xl bg-white rounded-xl shadow-2xl max-h-[80%]"
            onPress={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <View className="p-4 border-b border-gray-200">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-xl font-bold text-gray-800">Choose an Icon</Text>
                <Pressable
                  onPress={handleModalClose}
                  className="p-2 rounded-full hover:bg-gray-100"
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <MyIcon name="X" size={20} color="#6b7280" />
                </Pressable>
              </View>

              {/* Search input */}
              <TextInputField
                label="Search icons"
                value={searchText}
                onChange={handleSearchChange}
                placeholder="Type to search icons..."
                className="mb-3"
              />

              {/* Category tabs */}
              {!searchText && (
                <View className="mb-3">
                  <View className="flex-row flex-wrap">
                    {(recentIcons.length > 0 ? ["Recent"] : [])
                      .concat(Object.keys(ICON_CATEGORIES))
                      .concat(hasLoadedAllIcons ? ["All"] : [])
                      .map(category => (
                        <Pressable
                          key={category}
                          onPress={() => setSelectedCategory(category)}
                          className={`
                            px-3 py-1.5 mr-2 mb-2 rounded-full border
                            ${
                              selectedCategory === category
                                ? "bg-blue-500 border-blue-500"
                                : "bg-white border-gray-300 hover:border-gray-400"
                            }
                          `}
                        >
                          <Text
                            className={`
                              text-sm font-medium
                              ${selectedCategory === category ? "text-white" : "text-gray-700"}
                            `}
                          >
                            {category}
                          </Text>
                        </Pressable>
                      ))}
                  </View>
                </View>
              )}

              {/* Stats */}
              <Text className="text-sm text-gray-500">
                {isLoading
                  ? "Loading..."
                  : searchText
                    ? `${filteredIcons.length} icons found`
                    : `${filteredIcons.length} icons in ${selectedCategory}`}
                {recentIcons.length > 0 && ` • ${recentIcons.length} recent`}
                {selectedCategory === "All" && !searchText && !isLoading && (
                  <Text className="text-xs text-blue-600 block mt-1">
                    📋 Showing all {availableIcons.length} available icons
                  </Text>
                )}
              </Text>
            </View>

            {/* Icon grid */}
            <View className="flex-1 p-4">
              {isLoading ? (
                renderLoadingSkeleton()
              ) : filteredIcons.length === 0 ? (
                <View className="flex-1 justify-center items-center py-8">
                  <MyIcon name="Search" size={48} color="#9ca3af" />
                  <Text className="text-gray-500 text-lg font-medium mt-4">No icons found</Text>
                  <Text className="text-gray-400 text-sm mt-1">Try a different search term</Text>
                </View>
              ) : (
                <FlatList
                  ref={flatListRef}
                  data={filteredIcons}
                  renderItem={renderIconItem}
                  keyExtractor={keyExtractor}
                  numColumns={numColumns}
                  key={`${numColumns}-${hasLoadedAllIcons}`} // Force re-render when columns or data changes
                  getItemLayout={getItemLayout}
                  initialNumToRender={Math.min(numColumns * (selectedCategory === "All" ? 4 : 3), 24)} // Slightly more for "All"
                  maxToRenderPerBatch={numColumns * (selectedCategory === "All" ? 3 : 2)} // Larger batches for "All"
                  windowSize={selectedCategory === "All" ? 5 : 3} // Larger window for "All"
                  removeClippedSubviews={true}
                  updateCellsBatchingPeriod={50} // Faster updates
                  showsVerticalScrollIndicator={true}
                  bounces={false} // Disable bouncing for smoother performance
                  contentContainerStyle={{
                    padding: 8,
                    paddingBottom: 20,
                  }}
                  columnWrapperStyle={
                    numColumns > 1
                      ? {
                          justifyContent: "space-between",
                        }
                      : undefined
                  }
                  onEndReachedThreshold={0.8} // Load more when 80% scrolled
                  ListFooterComponent={
                    isLoading ? (
                      <View className="py-4">
                        <Text className="text-center text-gray-500">Loading more icons...</Text>
                      </View>
                    ) : null
                  }
                />
              )}
            </View>

            {/* Footer with recent icons info */}
            {recentIcons.length > 0 && !searchText && (
              <View className="p-4 border-t border-gray-200 bg-gray-50">
                <Text className="text-sm text-gray-600">
                  💡 Recent icons are marked with a green dot and appear first
                </Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// Memoized component with proper comparison
const IconPicker = memo(IconPickerComponent, (prevProps, nextProps) => {
  return (
    prevProps.label === nextProps.label &&
    prevProps.initialIcon === nextProps.initialIcon &&
    prevProps.onSelect === nextProps.onSelect
  );
});

export default IconPicker;
