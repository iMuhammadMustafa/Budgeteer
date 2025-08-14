import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StorageMode } from '@/src/services/storage/types';

interface ModeOnboardingProps {
  mode: StorageMode;
  onComplete: () => void;
}

export function ModeOnboarding({ mode, onComplete }: ModeOnboardingProps) {
  const getOnboardingContent = () => {
    switch (mode) {
      case 'cloud':
        return {
          title: 'Welcome to Cloud Mode! ☁️',
          description: 'Your data is securely stored in the cloud and synced across all your devices.',
          features: [
            '✅ Data synced across devices',
            '✅ Automatic backups',
            '✅ Access from anywhere',
            '✅ Collaborative features'
          ],
          tips: [
            'Your data is automatically saved as you work',
            'You can access your budget from any device',
            'All changes are synced in real-time'
          ]
        };
      
      case 'demo':
        return {
          title: 'Welcome to Demo Mode! 🎮',
          description: 'Explore all features with sample data. Perfect for trying out the app!',
          features: [
            '✅ Pre-loaded sample data',
            '✅ All features available',
            '✅ No account required',
            '✅ Safe to experiment'
          ],
          tips: [
            'All data is temporary and will reset when you restart',
            'Feel free to experiment with all features',
            'Create an account when ready to save your real data'
          ]
        };
      
      case 'local':
        return {
          title: 'Welcome to Local Mode! 💾',
          description: 'Your data is stored locally on your device for complete privacy and offline access.',
          features: [
            '✅ Complete privacy',
            '✅ Works offline',
            '✅ Fast performance',
            '✅ No internet required'
          ],
          tips: [
            'Your data stays on this device only',
            'Works perfectly without internet connection',
            'Remember to backup your data regularly'
          ]
        };
      
      default:
        return {
          title: 'Welcome!',
          description: 'Get started with Budgeteer',
          features: [],
          tips: []
        };
    }
  };

  const content = getOnboardingContent();

  return (
    <View className="flex-1 justify-center p-6 bg-white">
      <View className="max-w-md mx-auto">
        <Text className="text-3xl font-bold text-center mb-4 text-foreground">
          {content.title}
        </Text>
        
        <Text className="text-lg text-center mb-8 text-foreground opacity-70">
          {content.description}
        </Text>
        
        <View className="mb-8">
          <Text className="text-xl font-semibold mb-4 text-foreground">Features:</Text>
          {content.features.map((feature, index) => (
            <Text key={index} className="text-lg mb-2 text-foreground">
              {feature}
            </Text>
          ))}
        </View>
        
        <View className="mb-8">
          <Text className="text-xl font-semibold mb-4 text-foreground">Tips:</Text>
          {content.tips.map((tip, index) => (
            <Text key={index} className="text-base mb-2 text-foreground opacity-80">
              • {tip}
            </Text>
          ))}
        </View>
        
        <Pressable
          className="bg-primary p-4 rounded-lg items-center"
          onPress={onComplete}
        >
          <Text className="text-foreground font-semibold text-lg">
            Get Started
          </Text>
        </Pressable>
      </View>
    </View>
  );
}