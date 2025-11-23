import React, { Component } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useFocusEffect } from 'expo-router';

import TextContext from '@/context/TextContext';

// Hook wrapper to hide tab bar when this screen is focused
function HideTabBarWrapper({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation<NavigationProp<any>>();

  useFocusEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => parent?.setOptions({ tabBarStyle: undefined });
  });

  return <>{children}</>;
}

class ShowResultContent extends Component {
  static contextType = TextContext;
  declare context: React.ContextType<typeof TextContext>;

  render() {
    const { text } = this.context;

    return (
      <SafeAreaView className="flex-1 bg-white">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
          className="flex-1">
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 pt-4">
            <Text className="text-2xl font-bold text-violet-700 mb-4">Result</Text>

            <View className="border-2 border-violet-700 rounded-lg p-4 pb-4 mb-6 bg-gray-100">
              <Text className="text-base text-gray-800">{text}</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }
}

// Final exported screen
export default function ShowResultScreen() {
  return (
    <HideTabBarWrapper>
      <ShowResultContent />
    </HideTabBarWrapper>
  );
}
