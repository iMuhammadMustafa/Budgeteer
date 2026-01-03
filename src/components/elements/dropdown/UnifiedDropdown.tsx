import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { AddNewConfig, DropDownProps, OptionItem } from "@/src/types/components/DropdownField.Types";
import MyIcon from "../MyIcon";
import { useDropdownRegistration } from "./DropdownContext";
import { QuickAddFormRenderer } from "./QuickAddForms";

const SCREEN_HEIGHT = Dimensions.get("window").height;

/**
 * UnifiedDropdown - A cross-platform dropdown component that:
 * 1. Uses Modal for proper z-index handling (no CSS hacks needed)
 * 2. Supports nested dropdowns with proper Escape/Back handling
 * 3. Has an "Add New" feature that opens a quick form modal
 * 4. Works consistently across web, iOS, and Android
 */
function UnifiedDropdownComponent({
  options,
  onSelect,
  selectedValue,
  label,
  isModal: forceModal,
  groupBy,
  addNew,
  showClear = false,
  onClear,
  error,
  touched,
  placeholder,
  className = "",
  disabled = false,
}: DropDownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddNewOpen, setIsAddNewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [buttonLayout, setButtonLayout] = useState({ height: 0, width: 0, top: 0, y: 0, x: 0 });
  const dropdownIdRef = useRef<string>(`dropdown-${Date.now()}-${Math.random()}`);

  // Use modal on mobile, allow override
  const useModalMode = forceModal ?? Platform.OS !== "web";

  // Find selected item from options
  const selectedItem = useMemo(() => {
    if (!selectedValue || !options) return null;
    return options.find(opt => opt.id === selectedValue) ?? null;
  }, [selectedValue, options]);

  // Group options if groupBy is specified
  const groupedData = useMemo(() => {
    if (!groupBy) return options;
    return [...new Set(options.map(option => option.group))];
  }, [options, groupBy]);

  // Filter options by search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(
      opt =>
        opt.label.toLowerCase().includes(query) ||
        opt.details?.toLowerCase().includes(query) ||
        opt.group?.toLowerCase().includes(query),
    );
  }, [options, searchQuery]);

  // Filtered grouped data
  const filteredGroupedData = useMemo(() => {
    if (!groupBy) return filteredOptions;
    return [...new Set(filteredOptions.map(option => option.group))];
  }, [filteredOptions, groupBy]);

  // Close handler for context registration
  const handleClose = useCallback(() => {
    if (isAddNewOpen) {
      setIsAddNewOpen(false);
    } else if (isOpen) {
      setIsOpen(false);
    }
  }, [isOpen, isAddNewOpen]);

  // Register with dropdown context for proper ESC/Back handling
  useDropdownRegistration(dropdownIdRef.current, isOpen || isAddNewOpen, handleClose);

  // Handle outside click on web
  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (!isOpen || useModalMode) return;

    const handleOutsideClick = (e: MouseEvent) => {
      // Check if click is inside the dropdown
      const target = e.target as HTMLElement;
      if (target.closest(`[data-dropdown-id="${dropdownIdRef.current}"]`)) {
        return;
      }
      setIsOpen(false);
    };

    // Delay to prevent immediate close on the same click that opened it
    const timer = setTimeout(() => {
      document.addEventListener("click", handleOutsideClick);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [isOpen, useModalMode]);

  const handleToggle = useCallback(() => {
    if (disabled) return;
    setIsOpen(prev => !prev);
    setSearchQuery("");
  }, [disabled]);

  const handleSelect = useCallback(
    (item: OptionItem) => {
      onSelect(item);
      setIsOpen(false);
      setSearchQuery("");
    },
    [onSelect],
  );

  const handleClear = useCallback(() => {
    onSelect(null);
    onClear?.();
  }, [onSelect, onClear]);

  const handleAddNew = useCallback(() => {
    setIsAddNewOpen(true);
  }, []);

  const handleAddNewSuccess = useCallback(
    (newItem: any) => {
      setIsAddNewOpen(false);
      setIsOpen(false);
      addNew?.onCreated?.(newItem);
    },
    [addNew],
  );

  const handleAddNewCancel = useCallback(() => {
    setIsAddNewOpen(false);
  }, []);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { height, width, y, x } = event.nativeEvent.layout;
    // For web, we need to get the absolute position
    if (Platform.OS === "web") {
      const target = event.target as any;
      if (target?.getBoundingClientRect) {
        const rect = target.getBoundingClientRect();
        setButtonLayout({ height, width, top: rect.top, y: rect.top, x: rect.left });
        return;
      }
    }
    setButtonLayout({ height, width, top: y, y, x });
  }, []);

  const showError = error && touched;

  return (
    <View className={`my-1 flex-1 relative ${className}`}>
      {/* Trigger Button */}
      <View
        onLayout={handleLayout}
        // @ts-ignore - data attribute for web
        dataSet={{ dropdownId: dropdownIdRef.current }}
      >
        <Pressable
          className={`flex-row items-center justify-between p-3 rounded border ${
            showError ? "border-red-500" : "border-gray-300"
          } ${disabled ? "bg-gray-100" : "bg-white"}`}
          onPress={handleToggle}
          disabled={disabled}
        >
          <View className="flex-row items-center flex-1 gap-2">
            {selectedItem?.icon && (
              <MyIcon name={selectedItem.icon} className={selectedItem.iconColorClass ?? "text-gray-600"} size={18} />
            )}
            <Text
              className={`flex-1 ${selectedItem ? "text-dark" : "text-gray-400"} ${disabled ? "text-gray-400" : ""}`}
              numberOfLines={1}
            >
              {selectedItem?.label ?? placeholder ?? label}
            </Text>
          </View>

          <View className="flex-row items-center gap-1">
            {showClear && selectedItem && (
              <Pressable
                onPress={e => {
                  e.stopPropagation?.();
                  handleClear();
                }}
                className="p-1"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MyIcon name="X" size={16} className="text-gray-400" />
              </Pressable>
            )}
            {addNew && (
              <Pressable
                onPress={e => {
                  e.stopPropagation?.();
                  handleAddNew();
                }}
                className="p-1 ml-1"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MyIcon name="Plus" size={16} className="text-primary" />
              </Pressable>
            )}
            <MyIcon name={isOpen ? "ChevronUp" : "ChevronDown"} size={18} className="text-gray-400" />
          </View>
        </Pressable>
      </View>

      {/* Error Message */}
      {showError && <Text className="text-red-500 text-xs mt-1">{error}</Text>}

      {/* Dropdown List */}
      {isOpen && (
        <DropdownList
          isModal={useModalMode}
          options={filteredOptions}
          groupedData={filteredGroupedData}
          groupBy={groupBy}
          buttonLayout={buttonLayout}
          onSelect={handleSelect}
          onClose={() => setIsOpen(false)}
          selectedValue={selectedValue}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showSearch={options.length > 5}
          addNew={addNew}
          onAddNew={handleAddNew}
          title={label}
        />
      )}

      {/* Add New Modal */}
      {isAddNewOpen && addNew && (
        <AddNewModal config={addNew} onSuccess={handleAddNewSuccess} onCancel={handleAddNewCancel} />
      )}
    </View>
  );
}

/**
 * DropdownList - Renders the dropdown options either inline or in a modal
 */
interface DropdownListProps {
  isModal: boolean;
  options: OptionItem[];
  groupedData: OptionItem[] | (string | undefined)[];
  groupBy?: string;
  buttonLayout: { height: number; width: number; top: number; y: number; x: number };
  onSelect: (item: OptionItem) => void;
  onClose: () => void;
  selectedValue?: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showSearch: boolean;
  addNew?: AddNewConfig;
  onAddNew: () => void;
  title: string;
}

function DropdownList({
  isModal,
  options,
  groupedData,
  groupBy,
  buttonLayout,
  onSelect,
  onClose,
  selectedValue,
  searchQuery,
  onSearchChange,
  showSearch,
  addNew,
  onAddNew,
  title,
}: DropdownListProps) {
  const listContent = (
    <>
      {/* Search Input */}
      {showSearch && (
        <Pressable onPress={e => e.stopPropagation?.()} className="p-2 border-b border-gray-200">
          <TextInput
            className="p-2 bg-gray-50 rounded border border-gray-200 text-black"
            placeholder="Search..."
            value={searchQuery}
            onChangeText={onSearchChange}
            autoFocus={isModal}
            placeholderTextColor="#9CA3AF"
            onFocus={e => e.stopPropagation?.()}
          />
        </Pressable>
      )}

      {/* Add New Button at top */}
      {addNew && (
        <Pressable onPress={onAddNew} className="flex-row items-center gap-2 p-3 border-b border-gray-200 bg-gray-50">
          <MyIcon name={addNew.icon ?? "Plus"} size={18} className="text-primary" />
          <Text className="text-primary font-medium">{addNew.label ?? `Add New ${addNew.entityType}`}</Text>
        </Pressable>
      )}

      {/* Options List */}
      <FlatList<OptionItem | string | undefined>
        data={groupBy ? groupedData : options}
        keyExtractor={(item, index) =>
          typeof item === "string" ? `group-${item}-${index}` : (item?.id ?? `option-${index}`)
        }
        renderItem={({ item }) => {
          if (typeof item === "string") {
            // Group header
            return (
              <>
                <Text className="p-2 bg-gray-100 text-gray-600 text-sm font-medium">{item ?? "Other"}</Text>
                <View className="flex-row flex-wrap justify-center">
                  {options
                    .filter(opt => opt.group === item)
                    .map(opt => (
                      <DropdownOption
                        key={opt.id}
                        option={opt}
                        isModal={isModal}
                        isSelected={opt.id === selectedValue}
                        onPress={() => onSelect(opt)}
                        isGrouped
                      />
                    ))}
                </View>
              </>
            );
          }
          if (!item) return null;
          return (
            <DropdownOption
              option={item}
              isModal={isModal}
              isSelected={item.id === selectedValue}
              onPress={() => onSelect(item)}
            />
          );
        }}
        className={isModal ? "max-h-[300px]" : "max-h-48"}
        showsVerticalScrollIndicator
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View className="p-4 items-center">
            <Text className="text-gray-400">No options found</Text>
          </View>
        }
      />
    </>
  );

  if (isModal) {
    return (
      <Modal visible transparent animationType="fade" onRequestClose={onClose}>
        <Pressable className="flex-1 bg-black/50 justify-center items-center" onPress={onClose}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="w-[90%] max-w-md">
            <Pressable className="bg-white rounded-lg overflow-hidden max-h-[70%]" onPress={e => e.stopPropagation?.()}>
              {/* Modal Header */}
              <View className="flex-row items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
                <Text className="font-semibold text-dark">{title}</Text>
                <Pressable onPress={onClose} className="p-1">
                  <MyIcon name="X" size={20} className="text-gray-500" />
                </Pressable>
              </View>
              {listContent}
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    );
  }

  // Inline dropdown for web
  const maxHeight = Math.min(SCREEN_HEIGHT - buttonLayout.y - buttonLayout.height - 20, 250);

  return (
    <View
      className="absolute bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
      style={{
        top: buttonLayout.height + 4,
        left: 0,
        right: 0,
        maxHeight,
        zIndex: 9999,
      }}
    >
      {listContent}
    </View>
  );
}

/**
 * DropdownOption - Individual option item
 */
interface DropdownOptionProps {
  option: OptionItem;
  isModal: boolean;
  isSelected: boolean;
  onPress: () => void;
  isGrouped?: boolean;
}

function DropdownOptionComponent({ option, isModal, isSelected, onPress, isGrouped }: DropdownOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={option.disabled}
      className={`p-3 ${isSelected ? "bg-primary/10" : ""} ${option.disabled ? "opacity-50" : ""} ${
        isGrouped ? "w-1/3 min-w-[100px] items-center" : "border-b border-gray-100"
      }`}
    >
      <View className={`flex-row items-center ${isGrouped ? "justify-center" : ""} gap-2`}>
        {option.icon && (
          <View className="w-6 items-center">
            <MyIcon name={option.icon} size={18} className={option.iconColorClass ?? "text-gray-600"} />
          </View>
        )}
        <View className={isGrouped ? "" : "flex-1"}>
          <Text
            className={`${
              option.disabled ? "text-gray-400" : option.textColorClass ? `text-${option.textColorClass}` : "text-dark"
            } ${isSelected ? "font-medium" : ""}`}
            numberOfLines={1}
          >
            {option.label}
          </Text>
          {option.details && (
            <Text className="text-gray-500 text-xs" numberOfLines={1}>
              {option.details}
            </Text>
          )}
        </View>
        {isSelected && <MyIcon name="Check" size={16} className="text-primary" />}
      </View>
    </Pressable>
  );
}

const DropdownOption = memo(DropdownOptionComponent);

/**
 * AddNewModal - Modal for creating new entities
 */
interface AddNewModalProps {
  config: AddNewConfig;
  onSuccess: (item: any) => void;
  onCancel: () => void;
}

function AddNewModal({ config, onSuccess, onCancel }: AddNewModalProps) {
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={onCancel}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <Pressable className="bg-white rounded-t-xl max-h-[85%]" onPress={e => e.stopPropagation?.()}>
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="font-semibold text-lg text-dark">Add New {config.entityType}</Text>
              <Pressable onPress={onCancel} className="p-1">
                <MyIcon name="X" size={24} className="text-gray-500" />
              </Pressable>
            </View>

            {/* Form Content */}
            <ScrollView className="p-4" keyboardShouldPersistTaps="handled">
              {config.renderForm ? (
                config.renderForm({ onSuccess, onCancel })
              ) : (
                <QuickAddFormRenderer entityType={config.entityType} onSuccess={onSuccess} onCancel={onCancel} />
              )}
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

// Memoize the main component
const UnifiedDropdown = memo(UnifiedDropdownComponent);

export default UnifiedDropdown;
