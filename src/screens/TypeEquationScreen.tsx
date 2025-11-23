import React, { Component } from 'react';
import { View, KeyboardAvoidingView, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// Context & API Imports
import TextContext from '@/context/TextContext';
import { solveMathProblem } from '@/utils/openAiClient'; // Adjust path if needed
import { LatexEditor } from '@/src/components';

type Props = { latex?: string };

type State = {
  loading: boolean;
};

class TypeEquationScreen extends Component<Props, State> {
  // 1. Connect to your Context to save the result
  static contextType = TextContext;
  declare context: React.ContextType<typeof TextContext>;

  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
    };
  }

  // 2. This function triggers when "Solve with AI" is pressed in LatexEditor
  handleEquationSubmit = async (latexEquation: string) => {
    if (!latexEquation || latexEquation.trim() === '') {
      Alert.alert('Empty Input', 'Please type an equation first.');
      return;
    }

    this.setState({ loading: true });

    try {
      console.log('Solving Equation:', latexEquation);

      // A. Call the API (Returns the JSON Object)
      const resultObject = await solveMathProblem(latexEquation);

      // B. Save to Context
      // We JSON.stringify it because your context expects a string
      this.context.setText(JSON.stringify(resultObject));

      // C. Navigate to the Result Screen
      router.push('/(routes)/results/MathResult');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to get solution. Check your internet connection.');
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    return (
      <SafeAreaView className="bg-gray-100 flex-1">
        {/* Loading Overlay */}
        {this.state.loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#6d28d9" />
          </View>
        )}

        <KeyboardAvoidingView behavior="padding" className="flex-1">
          {/* 3. Pass the submit handler to the Editor */}
          <LatexEditor latex={this.props.latex} onSubmit={this.handleEquationSubmit} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TypeEquationScreen;
