import { icons } from "lucide-react-native";
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
}

// Constants
const DEFAULT_ICON = "BadgeInfo";
const ICON_NAMES = Object.keys(icons);
const MAX_RECENT_ICONS = 10;

// Custom debounce hook
const useDebounce = (value: string, delay: number): string => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
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

function IconPickerComponent({ label = "Icon", initialIcon = DEFAULT_ICON, onSelect }: IconPickerProps) {
  // State management
  const [selectedIcon, setSelectedIcon] = useState<string>(initialIcon || DEFAULT_ICON);
  const [searchText, setSearchText] = useState<string>("");
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [recentIcons, setRecentIcons] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Refs
  const flatListRef = useRef<FlatList>(null);

  // Custom hooks
  const debouncedSearchText = useDebounce(searchText, 300);
  const numColumns = useResponsiveColumns();

  // Initialize component
  useEffect(() => {
    const iconToSet = initialIcon || DEFAULT_ICON;
    setSelectedIcon(iconToSet);
    onSelect(iconToSet);
  }, [initialIcon, onSelect]);

  // Filtered icons with performance optimization
  const filteredIcons = useMemo(() => {
    setIsLoading(true);

    let filtered: IconItem[] = [];

    if (!debouncedSearchText.trim()) {
      // Show recent icons first when no search
      const recentIconItems: IconItem[] = recentIcons.map(name => ({ name, isRecent: true }));
      const otherIcons: IconItem[] = ICON_NAMES.filter(name => !recentIcons.includes(name)).map(name => ({
        name,
        isRecent: false,
      }));

      filtered = [...recentIconItems, ...otherIcons];
    } else {
      // Filter based on search text
      const searchLower = debouncedSearchText.toLowerCase();
      filtered = ICON_NAMES.filter(name => name.toLowerCase().includes(searchLower))
        .map(name => ({
          name,
          isRecent: recentIcons.includes(name),
        }))
        .sort((a, b) => {
          // Prioritize recent icons in search results
          if (a.isRecent && !b.isRecent) return -1;
          if (!a.isRecent && b.isRecent) return 1;

          // Prioritize exact matches
          const aExact = a.name.toLowerCase() === searchLower;
          const bExact = b.name.toLowerCase() === searchLower;
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;

          // Prioritize starts with
          const aStarts = a.name.toLowerCase().startsWith(searchLower);
          const bStarts = b.name.toLowerCase().startsWith(searchLower);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;

          return a.name.localeCompare(b.name);
        });
    }

    setTimeout(() => setIsLoading(false), 100);
    return filtered;
  }, [debouncedSearchText, recentIcons]);

  // Handle icon selection
  const handleIconSelect = useCallback(
    (iconName: string) => {
      setSelectedIcon(iconName);
      onSelect(iconName);

      // Update recent icons
      setRecentIcons(prev => {
        const newRecent = [iconName, ...prev.filter(name => name !== iconName)].slice(0, MAX_RECENT_ICONS);
        return newRecent;
      });

      setIsModalVisible(false);
      setSearchText("");
    },
    [onSelect],
  );

  // Handle search text change
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchText(text);

      // If user types exact icon name, auto-select it
      if (ICON_NAMES.includes(text)) {
        setSelectedIcon(text);
        onSelect(text);
      }
    },
    [onSelect],
  );

  // Handle modal open
  const handleModalOpen = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setIsModalVisible(false);
    setSearchText("");
  }, []);

  // Optimized item layout for FlatList
  const getItemLayout = useCallback(
    (data: any, index: number) => {
      const itemSize = Math.floor(100 / numColumns);
      return {
        length: itemSize,
        offset: itemSize * Math.floor(index / numColumns),
        index,
      };
    },
    [numColumns],
  );

  // Render icon item
  const renderIconItem = useCallback(
    ({ item }: { item: IconItem }) => {
      const isSelected = item.name === selectedIcon;

      return (
        <Pressable
          key={item.name}
          onPress={() => handleIconSelect(item.name)}
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
                className="mb-0"
              />

              {/* Stats */}
              <Text className="text-sm text-gray-500 mt-2">
                {isLoading ? "Searching..." : `${filteredIcons.length} icons found`}
                {recentIcons.length > 0 && ` • ${recentIcons.length} recent`}
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
                  numColumns={numColumns}
                  key={numColumns} // Force re-render when columns change
                  getItemLayout={getItemLayout}
                  initialNumToRender={numColumns * 5}
                  maxToRenderPerBatch={numColumns * 5}
                  windowSize={10}
                  removeClippedSubviews={true}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={{
                    padding: 8,
                  }}
                  columnWrapperStyle={
                    numColumns > 1
                      ? {
                          justifyContent: "space-between",
                        }
                      : undefined
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
