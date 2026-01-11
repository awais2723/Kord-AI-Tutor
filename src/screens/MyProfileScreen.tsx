import React, { Component } from 'react';
import { View, TouchableOpacity, Image, Text, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { AuthContext, AuthContextType } from '@/context';
import { doSignOut } from '@/firebase/auth';

type Props = object;

class MyProfileScreen extends Component<Props> {
  static contextType = AuthContext;
  declare context: AuthContextType;

  // --- Navigation Handlers ---
  handleSettings = () => router.push('/settings');
  handleHelpCenter = () => router.push('/helpCenter');
  handleAboutUs = () => router.push('/about');

  handleLogout = () => {
    console.log('User logged out');
    try {
      doSignOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // --- Helper to Render Menu Items to keep JSX clean ---
  renderMenuItem = (icon: any, label: string, onPress: () => void, isLast: boolean = false) => (
    <TouchableOpacity
      className={`flex-row items-center p-4 bg-white ${!isLast ? 'border-b border-gray-100' : ''}`}
      onPress={onPress}
      activeOpacity={0.7}>
      <View className="w-8 items-center justify-center">{icon}</View>
      <Text className="flex-1 text-base text-slate-700 font-medium ml-3">{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
    </TouchableOpacity>
  );

  render() {
    const { currentUser } = this.context;

    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* ======================= */}
          {/* 1. HEADER SECTION       */}
          {/* ======================= */}
          <View className="items-center mt-20 mb-8">
            <View className="relative">
              <Image
                source={require('../assets/images/profilePlaceholder.jpg')}
                className="w-24 h-24 rounded-full border-4 border-white shadow-sm"
              />
              <View className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-2 border-white" />
            </View>

            <Text className="text-slate-800 font-bold text-2xl mt-4 capitalize">
              {currentUser?.displayName || 'User'}
            </Text>

            <Text className="text-slate-400 text-sm mb-6">{currentUser?.email}</Text>

            {/* Gem Badge */}
            {/* <View className="flex-row items-center bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100">
              <Text className="text-indigo-600 font-bold text-base mr-2">10</Text>
              <Image
                source={require('../assets/images/gem.png')}
                className="w-5 h-5"
                resizeMode="contain"
              />
            </View> */}
          </View>

        
          {/* <View className="mx-5 mb-6">
            <View className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-4 flex-row items-center shadow-md">
              <View className="bg-white/20 p-3 rounded-full">
                <MaterialIcons name="workspace-premium" size={24} color="white" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-white font-bold text-lg">Go Premium</Text>
                <Text className="text-white/80 text-xs">Unlock all features today!</Text>
              </View>
              <Feather name="arrow-right" size={20} color="white" />
            </View>
          </View> 
          */}

          {/* ======================= */}
          {/* 3. MENU OPTIONS GROUP   */}
          {/* ======================= */}
          <View className="mx-5 bg-white rounded-2xl overflow-hidden shadow-sm mb-6">
            {this.renderMenuItem(
              <Ionicons name="settings-outline" size={22} color="#475569" />,
              'Settings',
              this.handleSettings
            )}

            {this.renderMenuItem(
              <Feather name="help-circle" size={22} color="#475569" />,
              'Help Center',
              this.handleHelpCenter
            )}

            {this.renderMenuItem(
              <MaterialIcons name="info-outline" size={22} color="#475569" />,
              'About Us',
              this.handleAboutUs,
              true // isLast item (removes border)
            )}
          </View>

          {/* ======================= */}
          {/* 4. LOGOUT BUTTON        */}
          {/* ======================= */}
          <View className="mx-5 mt-10">
            <TouchableOpacity
              className="bg-white p-4 rounded-2xl shadow-sm flex-row items-center justify-center border border-red-50"
              onPress={this.handleLogout}
              activeOpacity={0.8}>
              <Feather name="log-out" size={20} color="#EF4444" />
              <Text className="text-red-500 font-bold text-lg ml-3">Log Out</Text>
            </TouchableOpacity>

            <Text className="text-center text-slate-300 text-xs mt-4">App Version 1.0.0</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

export default MyProfileScreen;
