import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useStorageMode } from '@/src/providers/StorageModeProvider';
import { getModeDisplayInfo } from '@/src/utils/storageMode';

interface StorageModeIndicatorProps {
  showLabel?: boolean;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export function StorageModeIndicator({ 
  showLabel = true, 
  onPress, 
  size = 'medium' 
}: StorageModeIndicatorProps) {
  const { storageMode, isInitializing } = useStorageMode();
  const modeInfo = getModeDisplayInfo(storageMode);
  
  const sizeClasses = {
    small: {
      container: 'px-2 py-1',
      icon: 'text-sm',
      text: 'text-xs'
    },
    medium: {
      container: 'px-3 py-2',
      icon: 'text-base',
      text: 'text-sm'
    },
    large: {
      container: 'px-4 py-3',
      icon: 'text-lg',
      text: 'text-base'
    }
  };
  
  const classes = sizeClasses[size];
  
  const content = (
    <View className={`flex-row items-center bg-gray-100 rounded-full ${classes.container}`}>
      <Text className={`${classes.icon} mr-1`}>
        {isInitializing ? '⏳' : modeInfo.icon}
      </Text>
      {showLabel && (
        <Text className={`${classes.text} font-medium text-gray-700`}>
          {isInitializing ? 'Switching...' : modeInfo.name}
        </Text>
      )}
    </View>
  );
  
  if (onPress) {
    return (
      <Pressable onPress={onPress} disabled={isInitializing}>
        {content}
      </Pressable>
    );
  }
  
  return content;
}