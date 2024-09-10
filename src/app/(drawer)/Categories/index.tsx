import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Assuming Expo is used for icons
import { useGetCategories, useDeleteCategory } from '@/src/repositories/categories.service';
import Icon from '@/src/lib/IonIcons';
import { router } from 'expo-router';

const Categories = () => {
  const { data: categories, isLoading, error } = useGetCategories();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const { mutate: deleteCategory } = useDeleteCategory();

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  const handleLongPress = (id: string) => {
    setIsSelectionMode(true);
    setSelectedIds([id]);
  };

  const handlePress = (id: string) => {
    if (isSelectionMode) {
      setSelectedIds(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    }else{
      // Navigate to category detail page
      router.push(`/Categories/Upsert?categoryId=${id}`);

    }
  };

  const handleDelete = () => {
    selectedIds.forEach(id => deleteCategory(id));
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  const renderCategory = (category: any) => (
    <TouchableOpacity
      key={category.id}
      className={`flex-row items-center px-5 py-3 border-b border-gray-200 ${selectedIds.includes(category.id) ? 'bg-green-50' : 'bg-white'}`}
      onLongPress={() => handleLongPress(category.id)}
      onPress={() => handlePress(category.id)}
    >
      <View className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center mr-4">
        <Icon name={category.icon} size={24} color="#000" />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold">{category.name}</Text>
        {/* <Text className="text-sm text-gray-600">Budgeted: ${category.budget.toFixed(2)} (Monthly)</Text> */}
      </View>
    </TouchableOpacity>
  );

  return (
    <View className={`flex-1 bg-gray-100  ${Platform.OS === 'web' ? 'max-w' : ''}`}>
      <View className="flex-row justify-between items-center p-4 bg-white">
        <Text className="text-xl font-bold">Categories & Budget</Text>
        <TouchableOpacity>
          <Ionicons name="help-circle-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      <View className="flex-row border-b border-gray-200 bg-white">
        <TouchableOpacity className="flex-1 py-3 items-center border-b-2 border-green-500">
          <Text className="text-green-500">Budget Setup</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 py-3 items-center">
          <Text>Category Group</Text>
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1">
        <Text className="text-lg font-bold mt-4 ml-4 mb-2">EXPENSE</Text>
        {categories?.map(renderCategory)}
      </ScrollView>
      {isSelectionMode && (
        <TouchableOpacity
          className="absolute right-4 bottom-4 w-14 h-14 rounded-full bg-red-500 justify-center items-center"
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default Categories;
