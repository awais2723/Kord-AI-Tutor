import React, { Component } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  View,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useNavigation } from 'expo-router';
import { NavigationProp, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

import TextContext from '@/context/TextContext';
import { solveProblem } from '../../utils/openAiClient';

// Wrapper to hide bottom tab bar and default header
function ScreenWrapper({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation<NavigationProp<any>>();

  useFocusEffect(() => {
    const parent = navigation.getParent();
    // Hide Tabs
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    // Hide Default Header
    navigation.setOptions({ headerShown: false });

    return () => parent?.setOptions({ tabBarStyle: undefined });
  });

  // Inject navigation prop
  return React.cloneElement(children as React.ReactElement, { navigation });
}

interface Props {
  navigation: NavigationProp<any>;
}

type State = {
  loading: boolean;
  message: string;
  editedText: string;
};

class EditScannedTextContent extends Component<Props, State> {
  static contextType = TextContext;
  declare context: React.ContextType<typeof TextContext>;

  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      message: '',
      editedText: '',
    };
  }

  componentDidMount() {
    const { text } = this.context;
    this.setState({ editedText: text });
  }

  handleShare = async () => {
    const { editedText } = this.state;
    try {
      await Share.share({ message: editedText });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  handleSubmit = async () => {
    const { editedText } = this.state;
    const { setText } = this.context;

    if (!editedText.trim()) {
      this.setState({ message: 'Text cannot be empty' });
      return;
    }

    this.setState({ loading: true, message: '' });

    try {
      const result = await solveProblem(editedText);
      console.log('AI Response:', result);
      setText(result);
      router.push('/showResult');
    } catch (err) {
      this.setState({ message: 'Failed to solve problem. Please try again.' });
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { loading, message, editedText } = this.state;
    const { navigation } = this.props;

    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        {/* Header Section */}
        <View className="px-6 py-2 flex-row items-center justify-between bg-white border-b border-gray-100">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 -ml-2 rounded-full active:bg-gray-100">
            <Feather name="arrow-left" size={24} color="#4b5563" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-slate-800">Edit Text</Text>
          <TouchableOpacity
            onPress={this.handleShare}
            className="p-2 -mr-2 rounded-full active:bg-gray-100">
            <Feather name="share" size={22} color="#4b5563" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          // Offset helps prevent header from being pushed off screen on iOS
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          className="flex-1">
          <View className="flex-1 px-5 pt-4 pb-4">
            {/* Title / Instructions */}
            <Text className="text-sm font-bold text-violet-600 uppercase tracking-wider mb-2">
              Review & Edit
            </Text>

            {/* Editor Area */}
            <View className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-4">
              <TextInput
                multiline
                textAlignVertical="top" // Important for Android
                value={editedText}
                onChangeText={val => this.setState({ editedText: val })}
                className="flex-1 text-base text-slate-800 leading-relaxed font-regular"
                placeholder="Type your text here..."
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Error Message */}
            {message !== '' && (
              <View className="bg-red-50 p-3 rounded-lg mb-4 flex-row items-center">
                <Feather name="alert-circle" size={18} color="#ef4444" style={{ marginRight: 8 }} />
                <Text className="text-red-600 font-medium">{message}</Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              onPress={this.handleSubmit}
              disabled={loading}
              className={`w-full py-4 rounded-xl flex-row justify-center items-center shadow-lg shadow-violet-200 ${
                loading ? 'bg-violet-400' : 'bg-violet-600'
              }`}
              activeOpacity={0.8}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="check-circle" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text className="text-white text-base font-bold">Submit for Solution</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }
}

export default function EditScannedTextScreen() {
  return (
    <ScreenWrapper>
      <EditScannedTextContent navigation={undefined as any} />
    </ScreenWrapper>
  );
}
