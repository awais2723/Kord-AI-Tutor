import React, { Component } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TextContext from '@/context/TextContext';
import { solveProblem } from '../../utils/openAiClient';
import { router, useNavigation } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

// Wrapper to hide bottom tab bar
function HideTabBarWrapper({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation();

  useFocusEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => parent?.setOptions({ tabBarStyle: undefined });
  });

  return <>{children}</>;
}

type Props = {};

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
      this.setState({ message: 'Failed to solve problem.' });
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { loading, message, editedText } = this.state;

    return (
      <SafeAreaView className="flex-1 bg-white">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
          className="flex-1">
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 pt-4">
            <Text className="text-2xl font-bold text-violet-700 mb-4">Edit Scanned Text</Text>

            <TextInput
              multiline
              numberOfLines={12}
              value={editedText}
              onChangeText={val => this.setState({ editedText: val })}
              className="border-2 border-violet-700 rounded-lg p-3 text-base text-gray-800 h-72 mb-4"
            />

            {message !== '' && <Text className="text-center text-red-500 my-2">{message}</Text>}

            <TouchableOpacity
              onPress={this.handleSubmit}
              disabled={loading}
              className="bg-violet-700 rounded-md py-3 mt-2">
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-center text-lg font-semibold">Submit</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }
}

export default function EditScannedTextScreen() {
  return (
    <HideTabBarWrapper>
      <EditScannedTextContent />
    </HideTabBarWrapper>
  );
}
