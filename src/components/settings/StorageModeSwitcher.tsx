import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useStorageMode } from '@/src/providers/StorageModeProvider';
import { StorageMode } from '@/src/services/storage/types';
import { getModeDisplayInfo, canSwitchToMode, getModeSwitchWarning } from '@/src/utils/storageMode';

const STORAGE_MODES: StorageMode[] = ['cloud', 'demo', 'local'];

export function StorageModeSwitcher() {
  const { storageMode, setStorageMode, isInitializing } = useStorageMode();
  const [switching, setSwitching] = useState(false);
  
  const handleModeSwitch = async (targetMode: StorageMode) => {
    if (!canSwitchToMode(storageMode, targetMode)) {
      return;
    }
    
    const warning = getModeSwitchWarning(storageMode, targetMode);
    
    if (warning) {
      Alert.alert(
        'Switch Storage Mode',
        `${warning}\n\nAre you sure you want to continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Switch', 
            style: 'destructive',
            onPress: () => performModeSwitch(targetMode)
          }
        ]
      );
    } else {
      await performModeSwitch(targetMode);
    }
  };
  
  const performModeSwitch = async (targetMode: StorageMode) => {
    setSwitching(true);
    try {
      await setStorageMode(targetMode);
      Alert.alert('Success', `Switched to ${getModeDisplayInfo(targetMode).name}`);
    } catch (error) {
      Alert.alert('Error', `Failed to switch to ${targetMode} mode: ${error}`);
    } finally {
      setSwitching(false);
    }
  };
  
  return (
    <View className="p-4">
      <Text className="text-xl font-bold mb-4 text-foreground">Storage Mode</Text>
      <Text className="text-base mb-6 text-foreground opacity-70">
        Choose how your data is stored and accessed
      </Text>
      
      <View className="space-y-3">
        {STORAGE_MODES.map((mode) => {
          const modeInfo = getModeDisplayInfo(mode);
          const isCurrentMode = storageMode === mode;
          const canSwitch = canSwitchToMode(storageMode, mode);
          
          return (
            <Pressable
              key={mode}
              className={`p-4 rounded-lg border-2 ${
                isCurrentMode 
                  ? 'border-primary bg-primary/10' 
                  : 'border-gray-200 bg-white'
              } ${!canSwitch ? 'opacity-50' : ''}`}
              onPress={() => handleModeSwitch(mode)}
              disabled={!canSwitch || switching || isInitializing}
            >
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">{modeInfo.icon}</Text>
                <View className="flex-1">
                  <Text className={`text-lg font-semibold ${
                    isCurrentMode ? 'text-primary' : 'text-foreground'
                  }`}>
                    {modeInfo.name}
                    {isCurrentMode && ' (Current)'}
                  </Text>
                  <Text className="text-sm text-foreground opacity-70">
                    {modeInfo.description}
                  </Text>
                </View>
                {switching && storageMode === mode && (
                  <Text className="text-sm text-blue-500">Switching...</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
      
      {(switching || isInitializing) && (
        <View className="mt-4 p-3 bg-blue-50 rounded-lg">
          <Text className="text-blue-600 text-center">
            {isInitializing ? 'Initializing storage mode...' : 'Switching storage mode...'}
          </Text>
        </View>
      )}
    </View>
  );
}