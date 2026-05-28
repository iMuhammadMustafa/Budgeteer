import { useAuth } from "@/src/providers/AuthProvider";
import { SearchableDropdownItem } from "@/src/types/components/DropdownField.Types";
import useBackAction from "@/src/utils/useBackAction";
import { usePathname } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ActivityIndicator, FlatList, LayoutChangeEvent, Platform, Text, TextInput, View } from "react-native";
import Button from "./Button";

type SearchableDropdownType = {
  label: string;
  className?: string;
  initalValue?: string | null;
  placeholder?: string | null;
  searchSetter?: any;
  result?: SearchableDropdownItem[];
  searchAction: (searchText: string, tenantId: string) => Promise<SearchableDropdownItem[]> | SearchableDropdownItem[];
  onChange: (item: any) => void;
  onSelectItem: (item: any) => void;
  onPress?: () => Promise<SearchableDropdownItem[]> | SearchableDropdownItem[];
};

export default function SearchableDropdown({
  label,
  className,
  initalValue = "",
  placeholder = null,
  searchAction,
  searchSetter,
  result,
  onChange,
  onSelectItem,
  onPress,
}: SearchableDropdownType) {
  const [inputText, setInputText] = useState<string | null>(initalValue);
  const [depouncedText, setDepouncedText] = useState<string>("");
  const [ignoreFetch, setIgnoreFetch] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchableDropdownItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [textLayout, setTextLayout] = useState<{ top: number; height: number; width: number; left: number }>({
    top: 0,
    height: 0,
    width: 0,
    left: 0,
  });
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownIdRef = useRef<string>(`dropdown-${Date.now()}-${Math.random()}`);
  const inputRef = useRef<TextInput>(null);

  // Use a ref to hold the latest searchAction to avoid triggering effects on every render
  const searchActionRef = useRef(searchAction);
  searchActionRef.current = searchAction;

  const { session } = useAuth();

  const showSuggestions = isFocused && suggestions.length > 0;

  useEffect(() => {
    setInputText(initalValue);
  }, [initalValue]);

  const pathname = usePathname();
  useEffect(() => {
    setIsFocused(false);
    setSuggestions([]);
    inputRef.current?.blur();
  }, [pathname]);

  // Handle outside click on web for SearchableDropdown
  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (!showSuggestions && !(isLoading && isFocused)) return;

    const handleOutsideClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest(`[data-dropdown-id="${dropdownIdRef.current}"]`)) {
        return;
      }
      setIsFocused(false);
      setSuggestions([]);
      inputRef.current?.blur();
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [showSuggestions, isLoading, isFocused]);

  useEffect(() => {
    if (ignoreFetch) {
      return;
    }
    const timer = setTimeout(() => {
      if (inputText && inputText !== initalValue) {
        setDepouncedText(inputText);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputText, ignoreFetch, initalValue]);

  useEffect(() => {
    const applySearch = async () => {
      if (!ignoreFetch && depouncedText && depouncedText.length > 0) {
        setIsLoading(true);

        const tenantId = session?.user?.user_metadata?.tenantid;
        const data = await searchActionRef.current(depouncedText, tenantId as string);
        setSuggestions(data);
        setIsLoading(false);
      } else {
        setSuggestions([]);
      }
    };
    applySearch();
  }, [depouncedText, ignoreFetch, session?.user?.user_metadata?.tenantid]);

  const handleChange = useCallback(
    (val: string) => {
      setIgnoreFetch(false);
      onChange(val);
      setInputText(val);
    },
    [onChange],
  );

  const handleSelectSuggestion = useCallback(
    (item: SearchableDropdownItem) => {
      // Cancel any pending blur timeout so the dropdown doesn't re-close after selection
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
      setIgnoreFetch(true);
      setInputText(item.label);
      onSelectItem(item);
    },
    [onSelectItem],
  );

  const wrapperRef = useRef<View>(null);

  const updateLayout = useCallback(() => {
    if (Platform.OS === "web" && inputRef.current) {
      const target = inputRef.current as any;
      if (target?.getBoundingClientRect) {
        const rect = target.getBoundingClientRect();
        setTextLayout({ height: rect.height, width: rect.width, top: rect.top, left: rect.left });
      }
    }
  }, []);

  const onLayoutChange = useCallback((event: LayoutChangeEvent) => {
    const { height, width, y, x } = event.nativeEvent.layout;
    if (Platform.OS === "web") {
      const target = event.target as any;
      if (target?.getBoundingClientRect) {
        const rect = target.getBoundingClientRect();
        setTextLayout({ height, width, top: rect.top, left: rect.left });
        return;
      }
    }
    setTextLayout({ height, width, top: y, left: x });
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || (!showSuggestions && !(isLoading && isFocused))) return;

    updateLayout();

    const handleScrollOrResize = () => updateLayout();

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [showSuggestions, isLoading, isFocused, updateLayout]);

  const handleFocus = useCallback(() => {
    // Cancel any pending blur timeout (e.g. if user re-focuses quickly)
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    updateLayout();
    setIsFocused(true);
  }, [updateLayout]);

  const handleBlur = useCallback(() => {
    // Use a small delay so that tapping a suggestion item fires before we clear
    blurTimeoutRef.current = setTimeout(() => {
      setIsFocused(false);
      setSuggestions([]);
    }, 200);
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  // Handle back button (Android) and Escape key (web) to close suggestions
  const dismissDropdown = useCallback(() => {
    setIsFocused(false);
    setSuggestions([]);
    inputRef.current?.blur();
  }, []);

  useBackAction(isFocused, dismissDropdown);

  return (
    <>
      <View
        ref={wrapperRef}
        className={`${className ?? ""} flex-1`}
        // @ts-ignore
        dataSet={{ dropdownId: dropdownIdRef.current }}
      >
        <Text className="text-foreground">{label}</Text>
        <TextInput
          ref={inputRef}
          className="p-3 mb-4 border border-input-border rounded-md bg-input-bg text-foreground"
          value={inputText ?? ""}
          placeholder={placeholder ?? "Type to search.."}
          onChangeText={handleChange}
          onLayout={onLayoutChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </View>

      {isLoading && isFocused
        ? (() => {
            const indicator = (
              <ActivityIndicator
                className="absolute bg-surface"
                style={{
                  position: Platform.OS === "web" ? ("fixed" as any) : ("absolute" as any),
                  top: textLayout.top + textLayout.height + 1,
                  left: textLayout.left,
                  width: textLayout.width,
                  zIndex: 99999,
                }}
              />
            );
            return Platform.OS === "web" && typeof document !== "undefined"
              ? createPortal(indicator, document.body)
              : indicator;
          })()
        : showSuggestions &&
          (() => {
            const list = (
              <View
                className="bg-surface p-2 my-1 rounded-lg shadow-lg border border-border-default"
                style={{
                  position: Platform.OS === "web" ? ("fixed" as any) : ("absolute" as any),
                  top: textLayout.top + textLayout.height + 1,
                  left: textLayout.left,
                  width: textLayout.width,
                  zIndex: 99999,
                }}
              >
                <FlatList
                  data={suggestions}
                  keyExtractor={(item, index) => item.id ?? item.label + index}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="border-b border-border-subtle p-2 rounded-none justify-start"
                      onPress={() => handleSelectSuggestion(item)}
                      testID={`suggestion-${item.id ?? item.label}`}
                    >
                      <Text>{item.label}</Text>
                    </Button>
                  )}
                />
              </View>
            );
            return Platform.OS === "web" && typeof document !== "undefined" ? createPortal(list, document.body) : list;
          })()}
    </>
  );
}
