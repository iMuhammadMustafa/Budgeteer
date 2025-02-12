import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, StyleSheet, FlatList } from 'react-native';

const SearchableDropdown = ({ options, selectedValue, onSelect, label }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (value) => {
    onSelect(value);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={styles.selectedValue}>
          {selectedValue ? options.find(option => option.value === selectedValue)?.label : 'Select an option'}
        </Text>
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.dropdownContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => handleSelect(item.value)}
              >
                <Text>{item.label}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No options found</Text>}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    position: 'relative',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  button: {
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  selectedValue: {
    fontSize: 16,
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#fff',
    maxHeight: 200,
    zIndex: 1000,
  },
  searchInput: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  emptyText: {
    padding: 12,
    textAlign: 'center',
    color: '#aaa',
  },
});

export default SearchableDropdown;
