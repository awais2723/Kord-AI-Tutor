import { Component } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AuthContext, AuthContextType } from '@/context';
import styles from '@/src/styles';

type Props = object;
type State = object;

class AccountScreen extends Component<Props, State> {
  static contextType = AuthContext;
  declare context: AuthContextType;

  render() {
    const { currentUser } = this.context;

    return (
      <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="p-4">
          {/* User Profile Section */}
          <View className="mb-6">
            <Text className="text-gray-500 font-semibold text-sm mb-3 uppercase tracking-wide">
              Account Information
            </Text>
            <View
              style={styles.shadow}
              className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-500 text-sm">Username</Text>
                <Text className="text-gray-800 font-semibold text-base capitalize flex-1 text-right ml-2">
                  {currentUser?.displayName || 'Not set'}
                </Text>
              </View>
              <View className="border-t border-gray-200 my-2" />
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-500 text-sm">Email</Text>
                <Text
                  className="text-gray-800 font-semibold text-base flex-1 text-right ml-2"
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {currentUser?.email}
                </Text>
              </View>
              <View className="border-t border-gray-200 my-2" />
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-500 text-sm">Email Verified</Text>
                <View className="flex-row items-center">
                  {currentUser?.emailVerified ? (
                    <>
                      <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                      <Text className="text-green-600 font-semibold text-sm ml-1">Yes</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="close-circle" size={18} color="#ef4444" />
                      <Text className="text-red-600 font-semibold text-sm ml-1">No</Text>
                    </>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }
}

export default AccountScreen;
