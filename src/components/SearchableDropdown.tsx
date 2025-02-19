import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  LayoutChangeEvent,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SearchableDropdownItem } from "../types/components/DropdownField.types";
import { UseQueryResult } from "@tanstack/react-query";

type SearchableDropdownType = {
  label: string;
  className?: string;
  initalValue?: string | null;
  placeholder?: string | null;
  searchSetter?: any;
  result?: SearchableDropdownItem[];
  searchAction: (searchText: string) => Promise<SearchableDropdownItem[]> | SearchableDropdownItem[];
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
  const [textLayout, setTextLayout] = useState<{ top: number; height: number; width: number }>({
    top: 0,
    height: 0,
    width: 0,
  });

  useEffect(() => {
    setInputText(initalValue);
    console.log("initalValue", initalValue);
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
  }, [inputText, ignoreFetch]);

  useEffect(() => {
    const applySearch = async () => {
      if (!ignoreFetch && depouncedText && depouncedText.length > 0) {
        setIsLoading(true);

        console.log(depouncedText);
        const data = await searchAction(depouncedText);
        setSuggestions(data);
        setIsLoading(false);
      } else {
        setSuggestions([]);
      }
    };
    applySearch();
  }, [depouncedText]);

  const handleChange = (val: string) => {
    setIgnoreFetch(false);
    onChange(val);
    setInputText(val);
  };
  const handleSelectSuggestion = (item: SearchableDropdownItem) => {
    setIgnoreFetch(true);
    setInputText(item.label);
    onSelectItem(item);
    setSuggestions([]);
  };

  const onLayoutChange = (event: LayoutChangeEvent) => {
    const { height, width, y } = event.nativeEvent.layout;
    setTextLayout({ height, width, top: y });
  };

  const handleOutsidePress = () => {
    if (suggestions.length === 0 && onPress) {
      let values = onPress() as SearchableDropdownItem[];
      setSuggestions(values);
    } else {
      // Clear suggestions and dismiss keyboard
      setSuggestions([]);
      // Keyboard.dismiss();
    }
  };

  return (
    <>
      <Pressable onPress={handleOutsidePress} style={{ flex: 1 }}>
        <View className={`my-1 ${className ?? ""} `}>
          <Text className="text-foreground">{label}</Text>
          <TextInput
            className="p-3 mb-4  border border-gray-400 rounded-md bg-white text-black"
            value={inputText ?? ""}
            placeholder={placeholder ?? "Type to search.."}
            onChangeText={handleChange}
            onLayout={onLayoutChange}
          />
        </View>
      </Pressable>

      {isLoading ? (
        <ActivityIndicator
          className=" absolute z-10 bg-white"
          style={{ top: textLayout.top + textLayout.height + 1, width: textLayout.width }}
        />
      ) : (
        suggestions &&
        suggestions.length > 0 && (
          <View
            className={`absolute z-10 bg-white p-2 m-2 `}
            style={{ top: textLayout.top + textLayout.height + 1, width: textLayout.width }}
          >
            <FlatList
              data={suggestions}
              keyExtractor={item => item.id ?? item.label}
              renderItem={({ item }) => (
                <TouchableOpacity className="border-b border-gray-100 p-2" onPress={() => handleSelectSuggestion(item)}>
                  <Text>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )
      )}
    </>
  );
}
