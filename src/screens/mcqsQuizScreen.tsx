import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView } from 'react-native-gesture-handler';
import { router } from 'expo-router'; // This import is redundant if using useRouter()

// Define the structure of a single question
type McqQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
};

// Define the structure for a user's answer
type UserAnswer = {
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
};

// Define the type for the parameters expected by the /mcqsResult route
// This interface is still useful for documenting the shape of the params
// but it's not directly applied as a generic to useRouter() anymore.
type McqsResultParams = {
  score: number;
  totalQuestions: number;
  results: string; // JSON stringified array
};

const McqsQuizScreen = () => {
  const params = useLocalSearchParams();
  // Removed the generic type argument from useRouter() as it's not expected.
  const router = useRouter();
  console.log('Params received on McqsQuizScreen:', params);

  const { quizData, topic } = useMemo(() => {
    let parsedData: McqQuestion[] = [];
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
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  const currentQuestion = quizData[currentQuestionIndex];

  const handleOptionSelect = (option: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: option,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < quizData.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const results: UserAnswer[] = quizData.map((question, index) => {
      const selectedAnswer = selectedAnswers[index] || 'Not Answered';
      return {
        question: question.question,
        selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect: selectedAnswer.toLowerCase() === question.correctAnswer.toLowerCase(),
      };
    });

    const score = results.filter(r => r.isCorrect).length;

    // The router.push call remains the same, expo-router should infer its types.
    router.push({
      pathname: '/(routes)/results/mcqsResult',
      params: {
        score,
        totalQuestions: quizData.length,
        results: JSON.stringify(results),
      },
    });
  };

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>No quiz questions available.</Text>
      </SafeAreaView>
    );
  }

  const isLastQuestion = currentQuestionIndex === quizData.length - 1;
  const isAnswered = !!selectedAnswers[currentQuestionIndex];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.topicTitle}>{topic}</Text>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {quizData.length}
        </Text>

        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {currentQuestion.options?.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedAnswers[currentQuestionIndex] === option && styles.optionSelected,
              ]}
              onPress={() => handleOptionSelect(option)}>
              <Text
                style={[
                  styles.optionText,
                  selectedAnswers[currentQuestionIndex] === option && styles.optionTextSelected,
                ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.nextButton, !isAnswered && styles.disabledButton]}
          onPress={handleNext}
          disabled={!isAnswered}>
          <Text style={styles.nextButtonText}>
            {isLastQuestion ? 'Submit Quiz' : 'Next Question'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 20, flexGrow: 1 },
  topicTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4F46E5',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressText: { fontSize: 16, color: '#6C757D', textAlign: 'center', marginBottom: 30 },
  questionContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  questionText: { fontSize: 18, fontWeight: '500', color: '#212529', lineHeight: 26 },
  optionsContainer: { marginBottom: 20 },
  optionButton: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  optionSelected: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  optionText: { fontSize: 16, color: '#343A40', fontWeight: '500' },
  optionTextSelected: { color: '#FFFFFF' },
  nextButton: {
    backgroundColor: '#28A745',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  nextButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  disabledButton: { backgroundColor: '#AAB8C2' },
  errorText: { textAlign: 'center', marginTop: 50, fontSize: 18, color: 'red' },
});

export default McqsQuizScreen;
