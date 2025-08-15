import { Component } from 'react';
import { View, TouchableOpacity, Image, Text } from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons'; // or 'react-native-vector-icons'
import { router } from 'expo-router';

import { AuthContext, AuthContextType } from '@/context';
import styles from '@/src/styles';
import { doSignOut } from '@/firebase/auth';
import { solveProblem } from '../../utils/openAiClient';

type Props = object;

class MyProfileScreen extends Component<Props> {
  static contextType = AuthContext;
  declare context: AuthContextType;

  handleSettings = async () => {
    console.log('settings clicked');
  };

  handleHelpCenter = () => {
    console.log('Navigate to Help Center');
  };

  handleAboutUs = () => {
    console.log('Navigate to About Us');
    // const auth = getAuth();
  };

  handleLogout = () => {
    console.log('User logged out');
    try {
      doSignOut();
      router.push('/login'); // navigate to login screen after logout
    } catch (error) {
      console.error('Logout failed:', error);
    }
    // Add logout logic here
  };

  render() {
    const { currentUser } = this.context;

    return (
      <View className="bg-sky-50 flex-1 pt-10">
        {/* Top Profile */}
        <View className="w-full h-20 p-2 flex-row items-center">
          <TouchableOpacity>
            <Image
              source={require('../assets/images/profilePlaceholder.jpg')}
              className="w-14 h-14 rounded-full"
            />
          </TouchableOpacity>
          <Text className="text-black font-bold text-xl ml-4 capitalize">
            {currentUser?.displayName}
          </Text>
          <View className=" w-18 ml-auto mr-2 flex-row items-center border-2 border-primary rounded-md p-1">
            <Text className="text-black font-bold text-lg mr-2">10</Text>
            <Image source={require('../assets/images/gem.png')} className="w-6 h-6" />
          </View>
        </View>

        {/* Premium Card */}
        <View className="items-center">
          <View style={styles.shadow} className="w-11/12 h-48 mt-4">
            <Image
              source={require('../assets/images/premiumPicture.jpg')}
              className="w-full h-full rounded-2xl shadow-2xl"
            />
            <TouchableOpacity className="bg-yellow-300 absolute bottom-3 w-48 h-8 rounded-2xl justify-center items-center self-center">
              <Text className="text-black font-bold text-lg">Upgrade to Premium</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Options */}
        <View className="w-11/12 self-center mt-6 space-y-2">
          <TouchableOpacity
            className="bg-white p-3 rounded-xl shadow-md flex-row items-center"
            onPress={this.handleSettings}>
            <Ionicons name="settings-outline" size={20} color="black" />
            <Text className="text-lg text-black ml-4">Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white p-4 rounded-xl shadow-md flex-row items-center"
            onPress={this.handleHelpCenter}>
            <Feather name="help-circle" size={20} color="black" />
            <Text className="text-lg text-black ml-4">Help Center</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white p-4 rounded-xl shadow-md flex-row items-center"
            onPress={this.handleAboutUs}>
            <MaterialIcons name="info-outline" size={20} color="black" />
            <Text className="text-lg text-black ml-4">About Us</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View className="mt-12 mb-10  items-center">
          <TouchableOpacity
            className="bg-white px-6 py-3 rounded-2xl shadow-md flex-row items-center"
            onPress={this.handleLogout}>
            <Feather name="log-out" size={22} color="black" />
            <Text className="text-lg text-black font-semibold ml-3">Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

export default MyProfileScreen;
