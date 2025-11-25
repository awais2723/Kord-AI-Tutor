import React, { Component } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator, // <-- IMPORT
  Alert, // <-- IMPORT
} from 'react-native';
import { router } from 'expo-router';

import { SERVER_END_POINT } from '@/constants';

const quizTypes = ['Short Questions', 'MCQs'];
const difficulties = ['Easy', 'Medium', 'Hard'];

// Define a more specific type for navigation props for better type safety
type Props = {
  navigation: {
    navigate: (screen: string, params?: object) => void;
  };
};

type State = {
  explanation: string;
  selectedQuizType: string;
  selectedDifficulty: string;
  isLoading: boolean; // <-- ADD LOADING STATE
};

class TakeQuizScreen extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      explanation: '',
      selectedQuizType: '',
      selectedDifficulty: '',
      isLoading: false, // <-- INITIALIZE LOADING STATE
    };
  }

  handleQuizTypeSelect = (type: string) => {
    this.setState({ selectedQuizType: type });
  };

  handleDifficultySelect = (level: string) => {
    this.setState({ selectedDifficulty: level });
  };

  // ======================================================================
  // START: NEW FUNCTION TO HANDLE STARTING THE QUIZ
  // ======================================================================
  handleStartQuiz = async () => {
    const { explanation, selectedQuizType, selectedDifficulty } = this.state;
    const { navigation } = this.props;

    // 1. Validate that all inputs are filled
    if (!explanation.trim() || !selectedQuizType || !selectedDifficulty) {
      Alert.alert(
        'Incomplete Information',
        'Please provide a topic and select a quiz type and difficulty.'
      );
      return;
    }

    this.setState({ isLoading: true });

    try {
      // 2. Make the API call to your Flask server
      // IMPORTANT: Ensure this IP address matches the one your server is running on.
      const response = await fetch(`${SERVER_END_POINT}/generate-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: explanation,
          quizType: selectedQuizType,
          difficulty: selectedDifficulty,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle server-side errors (e.g., 400, 500)
        throw new Error(data.error || 'An unknown server error occurred.');
      }

      const quizData = data.quiz;

      if (!quizData) {
        throw new Error('Quiz data not found in server response.');
      } // Or however you get the quiz data

      // Determine the correct pathname based on the selected quiz type
      const pathname = selectedQuizType === 'MCQs' ? '/mcqsQuiz' : '/questionQuiz';

      // Use the router to push to the correct screen
      router.push({
        pathname,
        params: {
          // Ensure you are stringifying the correct variable
          quizData: JSON.stringify(quizData),
          topic: explanation,
        },
      });

      console.log('Navigating with quiz data:', quizData);
      console.log(data.quiz);
    } catch (error) {
      // 4. Show an alert if there is an error
      console.error('Failed to generate quiz:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Could not generate the quiz. Please try again.'
      );
    } finally {
      // 5. Always set loading back to false
      this.setState({ isLoading: false });
    }
  };

  renderOption = (options: string[], selectedValue: string, onSelect: (val: string) => void) =>
    options.map(item => (
      <TouchableOpacity
        key={item}
        style={[styles.optionButton, selectedValue === item && styles.optionSelected]}
        onPress={() => onSelect(item)}>
        <Text style={[styles.optionText, selectedValue === item && styles.optionTextSelected]}>
          {item}
        </Text>
      </TouchableOpacity>
    ));

  render() {
    const { explanation, selectedQuizType, selectedDifficulty, isLoading } = this.state; // <-- GET isLoading FROM STATE

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Take a Quiz</Text>

          <Text style={styles.label}>Topic</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., Photosynthesis,"
            multiline
            value={explanation}
            onChangeText={text => this.setState({ explanation: text })}
          />

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
            <Text style={styles.label}>Quiz Type</Text>
            <View style={styles.optionRow}>
              {this.renderOption(quizTypes, selectedQuizType, this.handleQuizTypeSelect)}
            </View>

            <Text style={styles.label}>Difficulty</Text>
            <View style={styles.optionRow}>
              {this.renderOption(difficulties, selectedDifficulty, this.handleDifficultySelect)}
            </View>

            <TouchableOpacity
              style={[styles.startButton, isLoading && styles.disabledButton]}
              onPress={this.handleStartQuiz}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.startButtonText}>Start Quiz</Text>
              )}
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  // ... (no changes to other styles)
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#4F46E5',
    textAlign: 'center',
    marginBottom: 25,
  },
  label: { fontSize: 16, fontWeight: '600', marginTop: 25, marginBottom: 10, color: '#111827' },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#FFFFFF',
  },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  optionSelected: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  optionText: { fontSize: 14, color: '#374151', fontWeight: '600' },
  optionTextSelected: { color: '#FFF' },
  startButton: {
    backgroundColor: '#4F46E5',
    marginTop: 60,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  startButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  // ADD THIS STYLE FOR THE DISABLED BUTTON STATE
  disabledButton: {
    backgroundColor: '#9CA3AF', // A muted gray color
  },
});

export default TakeQuizScreen;
