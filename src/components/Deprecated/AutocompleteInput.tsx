import React, { useState, useEffect } from "react";
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";

// Mock function to simulate fetching suggestions from a backend
const fetchSuggestions = async (text: string): Promise<string[]> => {
  // In a real app, this would be an API call
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  return ["Apple", "Banana", "Cherry", "Date", "Elderberry"].filter(item =>
    item.toLowerCase().includes(text.toLowerCase()),
  );
};

export default function AutocompleteInput() {
  const [inputText, setInputText] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedText, setDebouncedText] = useState(inputText);
  const [ignoreFetch, setIgnoreFetch] = useState(false);

  // Debounce effect to delay the input text
  useEffect(() => {
    if (ignoreFetch) {
      return; // Skip fetching suggestions if a suggestion was clicked
    }

    const handler = setTimeout(() => {
      setDebouncedText(inputText);
    }, 300); // 300ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [inputText, ignoreFetch]);

  useEffect(() => {
    const getSuggestions = async () => {
      if (debouncedText.length > 0 && !ignoreFetch) {
        setIsLoading(true);
        const fetchedSuggestions = await fetchSuggestions(debouncedText);
        setSuggestions(fetchedSuggestions);
        setIsLoading(false);
      } else {
        setSuggestions([]);
      }
    };

    getSuggestions();
  }, [debouncedText, ignoreFetch]);

  const handleSelectSuggestion = (item: string) => {
    setIgnoreFetch(true); // Disable fetching for this input change
    setInputText(item);
    setSuggestions([]);
  };

  // Reset ignoreFetch when user types again
  const handleInputChange = (text: string) => {
    setIgnoreFetch(false); // Re-enable fetching
    setInputText(text);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={inputText}
        onChangeText={handleInputChange}
        placeholder="Type to search..."
      />
      {isLoading ? (
        <ActivityIndicator style={styles.loadingIndicator} />
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSelectSuggestion(item)}>
              <Text>{item}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  loadingIndicator: {
    marginTop: 10,
  },
});
