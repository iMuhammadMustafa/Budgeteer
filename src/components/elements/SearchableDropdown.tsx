import { useAuth } from "@/src/providers/AuthProvider";
import { SearchableDropdownItem } from "@/src/types/components/DropdownField.Types";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  LayoutChangeEvent,
  Text,
  TextInput,
  View,
} from "react-native";
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
  const [textLayout, setTextLayout] = useState<{ top: number; height: number; width: number }>({
    top: 0,
    height: 0,
    width: 0,
  });
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use a ref to hold the latest searchAction to avoid triggering effects on every render
  const searchActionRef = useRef(searchAction);
  searchActionRef.current = searchAction;

  const { session } = useAuth();

  useEffect(() => {
    setInputText(initalValue);
  }, [initalValue]);

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
      setSuggestions([]);
    },
    [onSelectItem],
  );

  const onLayoutChange = useCallback((event: LayoutChangeEvent) => {
    const { height, width, y } = event.nativeEvent.layout;
    setTextLayout({ height, width, top: y });
  }, []);

  const handleFocus = useCallback(() => {
    // Cancel any pending blur timeout (e.g. if user re-focuses quickly)
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setIsFocused(true);
  }, []);

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

  const showSuggestions = isFocused && suggestions.length > 0;

  return (
    <>
      <View className={`my-1 ${className ?? ""} flex-1`}>
        <Text className="text-foreground">{label}</Text>
        <TextInput
          className="p-3 mb-4 border border-input-border rounded-md bg-input-bg text-foreground"
          value={inputText ?? ""}
          placeholder={placeholder ?? "Type to search.."}
          onChangeText={handleChange}
          onLayout={onLayoutChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </View>

      {isLoading && isFocused ? (
        <ActivityIndicator
          className=" absolute z-10 bg-surface"
          style={{ top: textLayout.top + textLayout.height + 1, width: textLayout.width }}
        />
      ) : (
        showSuggestions && (
          <View
            className={`absolute z-10 bg-surface p-2 m-2`}
            style={{ top: textLayout.top + textLayout.height + 1, width: textLayout.width }}
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
        )
      )}
    </>
  );
}
