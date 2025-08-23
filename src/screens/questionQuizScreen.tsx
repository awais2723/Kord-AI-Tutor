import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView } from 'react-native-gesture-handler';
import { SERVER_END_POINT } from '@/constants';

// Define the structure of a single question
interface Question {
  question: string;
}

// Define the structure for a user's answer with AI evaluation
interface EvaluatedAnswer {
  question: string;
  answer: string;
  score: number; // Score out of 5 from AI
}

const QuestionQuizScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const { quizData, topic } = useMemo(() => {
    let parsedData: Question[] = [];
    try {
      if (typeof params.quizData === 'string') {
        parsedData = JSON.parse(params.quizData);
      }
    } catch (e) {
      console.error('Failed to parse quiz data:', e);
      Alert.alert('Error', 'Could not load the quiz data.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
    return {
      quizData: parsedData,
      topic: typeof params.topic === 'string' ? params.topic : 'Quiz',
    };
  }, [params.quizData, params.topic]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});

  const currentQuestion = quizData[currentQuestionIndex];

  const handleAnswerChange = (text: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: text,
    }));
  };

  const handleNext = () => {
    if (!userAnswers[currentQuestionIndex]?.trim()) {
      Alert.alert('Empty Answer', 'Please provide an answer before proceeding.');
      return;
    }
    if (currentQuestionIndex < quizData.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!userAnswers[currentQuestionIndex]?.trim()) {
      Alert.alert('Empty Answer', 'Please provide an answer to the final question.');
      return;
    }
    setIsLoading(true);

    // Prepare the data payload with all questions and answers
    const answersPayload = quizData.map((question, index) => ({
      question: question.question,
      answer: userAnswers[index] || 'Not Answered',
    }));

    try {
      // Send all answers to the new backend endpoint in a single request
      // IMPORTANT: Replace with your actual server URL
      const response = await fetch(`${SERVER_END_POINT}/evaluate-answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers: answersPayload }),
      });

      if (!response.ok) {
        // Handle HTTP errors like 500, 400 etc.
        const errorData = await response
          .json()
          .catch(() => ({ error: 'An unknown server error occurred.' }));
        throw new Error(errorData.error || `Server responded with status: ${response.status}`);
      }

      // The backend now returns the fully evaluated results
      const evaluatedResults: EvaluatedAnswer[] = await response.json();

      // Calculate total score from the results and navigate
      const totalScore = evaluatedResults.reduce((sum, r) => sum + r.score, 0);
      const maxScore = quizData.length * 5;

      router.push({
        pathname: '/questionResult',
        params: {
          totalScore,
          maxScore,
          results: JSON.stringify(evaluatedResults),
        },
      });
    } catch (error) {
      console.error('Failed to evaluate answers:', error);
      Alert.alert(
        'Evaluation Error',
        error instanceof Error ? error.message : 'An unknown error occurred. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Evaluating your answers...</Text>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>No quiz questions available.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.topicTitle}>{topic}</Text>
          <Text
            style={
              styles.questionCounter
            }>{`Question ${currentQuestionIndex + 1} of ${quizData.length}`}</Text>

          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
          </View>

          <TextInput
            style={styles.textInput}
            placeholder="Type your answer here..."
            placeholderTextColor="#9CA3AF"
            multiline
            value={userAnswers[currentQuestionIndex] || ''}
            onChangeText={handleAnswerChange}
          />

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentQuestionIndex === quizData.length - 1 ? 'Submit' : 'Next'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  topicTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  questionCounter: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  questionText: { fontSize: 18, color: '#374151', lineHeight: 26 },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
  },
  nextButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  nextButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  errorText: { textAlign: 'center', marginTop: 50, fontSize: 18, color: '#EF4444' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: { marginTop: 16, fontSize: 18, color: '#4F46E5', fontWeight: '600' },
});

export default QuestionQuizScreen;
