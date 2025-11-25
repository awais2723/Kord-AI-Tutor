import React, { Component } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { router, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import TextContext from '@/context/TextContext';

// Hook wrapper to hide tab bar and default header
function ScreenWrapper({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation<NavigationProp<any>>();

  useFocusEffect(() => {
    const parent = navigation.getParent();

    // Hide Bottom Tab Bar
    parent?.setOptions({ tabBarStyle: { display: 'none' } });

    // Hide Default Header
    navigation.setOptions({ headerShown: false });

    return () => {
      parent?.setOptions({ tabBarStyle: undefined });
      // We don't necessarily need to reset headerShown as it's per-screen usually
    };
  });

  return React.cloneElement(children as React.ReactElement, { navigation });
}

interface Props {
  navigation: NavigationProp<any>;
}

class ShowResultContent extends Component<Props> {
  static contextType = TextContext;
  declare context: React.ContextType<typeof TextContext>;

  handleShare = async () => {
    const { text } = this.context;
    try {
      await Share.share({ message: text });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  render() {
    const { text } = this.context;
    const { navigation } = this.props;

    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <View className="px-6 py-2 flex-row items-center justify-between bg-white border-b border-gray-100">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 -ml-2 rounded-full active:bg-gray-100">
            <Feather name="arrow-left" size={24} color="#4b5563" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-slate-800">Scan Result</Text>
          <TouchableOpacity
            onPress={this.handleShare}
            className="p-2 -mr-2 rounded-full active:bg-gray-100">
            <Feather name="share" size={22} color="#4b5563" />
          </TouchableOpacity>
        </View>

        <View className="flex-1">
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 150 }}
            className="px-5 pt-6"
            showsVerticalScrollIndicator={false}>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm font-bold text-violet-600 uppercase tracking-wider">
                Solution
              </Text>
            </View>

            {/* Result Card */}
            <View className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <Text className="text-base text-slate-700 leading-relaxed font-regular">
                {text || 'No text content found.'}
              </Text>
            </View>
          </ScrollView>

          {/* Floating Bottom Button */}
          <View className="absolute bottom-0 left-0 right-0 p-6 bg-slate-50/90 blur-sm">
            <TouchableOpacity
              onPress={() => router.replace('/home')}
              className="w-full bg-violet-600 py-4 rounded-xl flex-row justify-center items-center shadow-lg shadow-violet-200"
              activeOpacity={0.8}>
              <Feather name="home" size={20} color="white" style={{ marginRight: 8 }} />
              <Text className="text-white text-base font-bold">Go Back Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }
}

export default function ShowResultScreen() {
  return (
    <ScreenWrapper>
      <ShowResultContent navigation={undefined as any} />
    </ScreenWrapper>
  );
}

