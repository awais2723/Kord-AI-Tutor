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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';

import { SERVER_END_POINT } from '@/constants';

const quizTypes = ['Short Questions', 'MCQs'];
const difficulties = ['Easy', 'Medium', 'Hard'];

// Define types for better type safety (optional but good practice)
type Props = {
  navigation: {
    navigate: (screen: string, params?: object) => void;
  };
};

type State = {
  explanation: string;
  selectedQuizType: string;
  selectedDifficulty: string;
  isLoading: boolean;
};

class TakeQuizScreen extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      explanation: '',
      selectedQuizType: '',
      selectedDifficulty: '',
      isLoading: false,
    };
  }

  handleQuizTypeSelect = (type: string) => {
    this.setState({ selectedQuizType: type });
  };

  handleDifficultySelect = (level: string) => {
    this.setState({ selectedDifficulty: level });
  };

  // ======================================================================
  // 1. HELPER: FETCH QUIZ DATA FROM SERVER
  // ======================================================================
  fetchQuizData = async () => {
    const { explanation, selectedQuizType, selectedDifficulty } = this.state;

    // Validation
    if (!explanation.trim() || !selectedQuizType || !selectedDifficulty) {
      Alert.alert(
        'Incomplete Information',
        'Please provide a topic and select a quiz type and difficulty.'
      );
      return null;
    }

    this.setState({ isLoading: true });

    try {
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
        throw new Error(data.error || 'An unknown server error occurred.');
      }

      const quizData = data.quiz;

      if (!quizData) {
        throw new Error('Quiz data not found in server response.');
      }

      return quizData; // Return the data to the caller
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not generate the quiz.');
      return null;
    } finally {
      this.setState({ isLoading: false });
    }
  };

  // ======================================================================
  // 2. ACTION: START INTERACTIVE QUIZ
  // ======================================================================
  handleStartQuiz = async () => {
    const quizData = await this.fetchQuizData();
    if (!quizData) return; // Stop if fetching failed

    const { selectedQuizType, explanation } = this.state;
    const pathname = selectedQuizType === 'MCQs' ? '/mcqsQuiz' : '/questionQuiz';

    router.push({
      pathname,
      params: {
        quizData: JSON.stringify(quizData),
        topic: explanation,
      },
    });
  };

  // ======================================================================
  // 3. ACTION: EXPORT / PRINT PDF (New Feature)
  // ======================================================================
  handleExportQuiz = async () => {
    const quizData = await this.fetchQuizData();
    if (!quizData) return; // Stop if fetching failed

    const { selectedQuizType, explanation } = this.state;

    // Navigate to the new Editor/Print Screen
    router.push({
      pathname: './editQuiz', // Ensure you create this file
      params: {
        quizData: JSON.stringify(quizData),
        topic: explanation,
        quizType: selectedQuizType,
      },
    });
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
    const { explanation, selectedQuizType, selectedDifficulty, isLoading } = this.state;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create a Quiz</Text>

          <Text style={styles.label}>Topic</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., Photosynthesis, Newton's Laws"
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

            {/* BUTTON SECTION */}
            <View style={styles.buttonContainer}>
              {isLoading ? (
                <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
              ) : (
                <>
                  {/* Button 1: Start Interactive Quiz */}
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={this.handleStartQuiz}
                    disabled={isLoading}>
                    <Text style={styles.startButtonText}>Start Interactive Quiz</Text>
                  </TouchableOpacity>

                  {/* Button 2: Export PDF (New) */}
                  <TouchableOpacity
                    style={[styles.startButton, styles.exportButton]}
                    onPress={this.handleExportQuiz}
                    disabled={isLoading}>
                    <Text style={styles.startButtonText}>Edit & Print PDF</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
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

  // Button Styles
  buttonContainer: {
    marginTop: 40,
    gap: 15, // Adds space between the two buttons
  },
  startButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  // Distinct style for the Export button (Green)
  exportButton: {
    backgroundColor: '#10B981',
  },
  startButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
});

export default TakeQuizScreen;
