import React, { Component } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useNavigation } from 'expo-router';
import { NavigationProp, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

// Context & API
import TextContext from '@/context/TextContext';
import { solveMathProblem } from '@/utils/openAiClient';

// Components
import { LatexEditor } from '@/src/components';

// --- Wrapper to hide Tab Bar (Matches your existing pattern) ---
function ScreenWrapper({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation<NavigationProp<any>>();

  useFocusEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    navigation.setOptions({ headerShown: false });
    return () => parent?.setOptions({ tabBarStyle: undefined });
  });

  return <>{children}</>;
}

type Props = object;

type State = {
  loading: boolean;
  latexData: string;
};

class EditScannedLatexContent extends Component<Props, State> {
  static contextType = TextContext;
  declare context: React.ContextType<typeof TextContext>;

  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      latexData: '',
    };
  }

  componentDidMount() {
    // 1. Get the scanned text from Context
    const { text } = this.context;

    // Set it to state so LatexEditor can load it as the initial value
    // (Note: OCR might return plain text, but the editor will try to render it.
    // The user can then fix it using the keyboard).
    this.setState({ latexData: text });
  }

  // 2. Handle Submission (Same logic as TypeEquationScreen)
  handleEquationSubmit = async (latexEquation: string) => {
    if (!latexEquation || latexEquation.trim() === '') {
      Alert.alert('Empty Input', 'Please type an equation first.');
      return;
    }

    this.setState({ loading: true });

    try {
      console.log('Sending Scanned LaTeX to AI:', latexEquation);

      // A. Call the API
      const resultObject = await solveMathProblem(latexEquation);

      // B. Save result to Context (Stringified JSON)
      this.context.setText(JSON.stringify(resultObject));

      // C. Navigate to Result Screen
      router.push('/(routes)/results/MathResult');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to get solution. Check your internet connection.');
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { loading, latexData } = this.state;

    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        {/* --- Header Section (Matches EditScannedTextContent style) --- */}
        <View className="px-6 py-3 flex-row items-center justify-between bg-white border-b border-gray-100">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 -ml-2 rounded-full active:bg-gray-100">
            <Feather name="arrow-left" size={24} color="#4b5563" />
          </TouchableOpacity>

          <Text className="text-lg font-semibold text-slate-800">Edit Equation</Text>

          {/* Empty View to balance the header title centering */}
          <View style={{ width: 40 }} />
        </View>

        {/* --- Main Content --- */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1">
          {/* Loading Overlay */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <View className="bg-white p-5 rounded-2xl items-center shadow-lg">
                <ActivityIndicator size="large" color="#6d28d9" />
                <Text className="text-violet-700 font-bold mt-3">Solving Math...</Text>
              </View>
            </View>
          )}

          {/* The Latex Editor */}
          {/* We pass 'latexData' as the initial value and handle the submit */}
          <LatexEditor latex={latexData} onSubmit={this.handleEquationSubmit} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }
}

// Styles for the loading overlay
const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)', // Slightly darker dim for better focus
    zIndex: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Export wrapped component
export default function EditScannedLatexScreen() {
  return (
    <ScreenWrapper>
      <EditScannedLatexContent />
    </ScreenWrapper>
  );
}
