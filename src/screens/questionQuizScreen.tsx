import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView } from 'react-native-gesture-handler';

// Define the structure of a single question
interface ShortQuestion {
  question: string;
  correctAnswer: string;
}

// Define the structure for a user's answer
interface UserAnswer {
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

const QuestionQuizScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();

  const { quizData, topic } = useMemo(() => {
    let parsedData: ShortQuestion[] = [];
    try {
      if (typeof params.quizData === 'string') {
        parsedData = JSON.parse(params.quizData);
      }
    } catch (e) {
      console.error("Failed to parse quiz data:", e);
      Alert.alert("Error", "Could not load the quiz data.", [{ text: "OK", onPress: () => router.back() }]);
    }
    return {
      quizData: parsedData,
      topic: typeof params.topic === 'string' ? params.topic : 'Quiz'
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
    if (currentQuestionIndex < quizData.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const results: UserAnswer[] = quizData.map((question, index) => {
      const selectedAnswer = userAnswers[index]?.trim() || "Not Answered";
      return {
        question: question.question,
        selectedAnswer: selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect: selectedAnswer.toLowerCase() === question.correctAnswer.toLowerCase(),
      };
    });

    const score = results.filter(r => r.isCorrect).length;

    // router.replace({
    //   pathname: '/results',
    //   params: {
    //     score: score,
    //     totalQuestions: quizData.length,
    //     results: JSON.stringify(results),
    //   },
    // });
  };

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>No quiz questions available.</Text>
      </SafeAreaView>
    );
  }

  const isLastQuestion = currentQuestionIndex === quizData.length - 1;
  const isAnswered = userAnswers[currentQuestionIndex]?.trim();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.topicTitle}>{topic}</Text>
          <Text style={styles.progressText}>
            Question {currentQuestionIndex + 1} of {quizData.length}
          </Text>

          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
          </View>

          <TextInput
            style={styles.textInput}
            placeholder="Type your answer here..."
            value={userAnswers[currentQuestionIndex] || ''}
            onChangeText={handleAnswerChange}
            multiline
          />

          <View style={styles.flexSpacer} />

          <TouchableOpacity
            style={[styles.nextButton, !isAnswered && styles.disabledButton]}
            onPress={handleNext}
            disabled={!isAnswered}>
            <Text style={styles.nextButtonText}>
              {isLastQuestion ? 'Submit Quiz' : 'Next Question'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 20, flexGrow: 1 },
  topicTitle: { fontSize: 28, fontWeight: 'bold', color: '#4F46E5', textAlign: 'center', marginBottom: 10 },
  progressText: { fontSize: 16, color: '#6C757D', textAlign: 'center', marginBottom: 30 },
  questionContainer: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, marginBottom: 30, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 2 },
  questionText: { fontSize: 18, fontWeight: '500', color: '#212529', lineHeight: 26 },
  textInput: { borderWidth: 1, borderColor: '#DEE2E6', backgroundColor: '#FFFFFF', borderRadius: 10, padding: 15, fontSize: 16, minHeight: 120, textAlignVertical: 'top' },
  nextButton: { backgroundColor: '#28A745', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  nextButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  disabledButton: { backgroundColor: '#AAB8C2' },
  errorText: { textAlign: 'center', marginTop: 50, fontSize: 18, color: 'red' },
  flexSpacer: { flex: 1, minHeight: 20 },
});

export default QuestionQuizScreen;
