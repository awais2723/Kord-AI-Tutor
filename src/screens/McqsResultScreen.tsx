import React, { useMemo } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Svg, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

// Define the structure for a user's answer
interface UserAnswer {
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

const McqsResultScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();

  const { score, totalQuestions, results } = useMemo(() => {
    let parsedResults: UserAnswer[] = [];
    try {
      if (typeof params.results === 'string') {
        parsedResults = JSON.parse(params.results);
      }
    } catch (e) {
      console.error('Failed to parse result data:', e);
      Alert.alert('Error', 'Could not load the quiz results.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
    return {
      score: Number(params.score || 0),
      totalQuestions: Number(params.totalQuestions || 0),
      results: parsedResults,
    };
  }, [params]);

  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const strokeDashoffset = 251.2 * (1 - percentage / 100); // Circumference * (1 - progress)

  const getPerformanceMessage = () => {
    if (percentage >= 90) return 'Excellent Work! 🏆';
    if (percentage >= 70) return 'Great Job! 👍';
    if (percentage >= 50) return 'Good Effort! 😊';
    return 'Keep Practicing! 💪';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Quiz Results</Text>

        <View style={styles.summaryCard}>
          <View style={styles.progressContainer}>
            <Svg width="120" height="120" viewBox="0 0 100 100">
              <Circle cx="50" cy="50" r="40" stroke="#E5E7EB" strokeWidth="10" fill="transparent" />
              <Circle
                cx="50"
                cy="50"
                r="40"
                stroke="#4F46E5"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray="251.2" // 2 * PI * 40
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </Svg>
            <Text style={styles.percentageText}>{percentage}%</Text>
          </View>
          <Text style={styles.performanceMessage}>{getPerformanceMessage()}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{score}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalQuestions - score}</Text>
              <Text style={styles.statLabel}>Incorrect</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalQuestions}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        <Text style={styles.breakdownTitle}>Answer Breakdown</Text>

        {results.map((item, index) => (
          <View key={index} style={styles.resultItem}>
            <Text style={styles.questionText}>
              {index + 1}. {item.question}
            </Text>
            <View style={[styles.answerRow, !item.isCorrect && styles.incorrectAnswerRow]}>
              <Ionicons
                name={item.isCorrect ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={item.isCorrect ? '#10B981' : '#EF4444'}
              />
              <Text style={styles.userAnswerText}>{item.selectedAnswer}</Text>
            </View>
            {!item.isCorrect && (
              <View style={[styles.answerRow, styles.correctAnswerRow]}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.correctAnswerText}>{item.correctAnswer}</Text>
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.finishButton} onPress={() => router.replace('/')}>
          <Text style={styles.finishButtonText}>Finish</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// Using StyleSheet for better performance and organization
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 20 },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  progressContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  percentageText: { position: 'absolute', fontSize: 24, fontWeight: 'bold', color: '#4F46E5' },
  performanceMessage: { fontSize: 20, fontWeight: '600', color: '#1F2937', marginBottom: 20 },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  statLabel: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  breakdownTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  resultItem: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12 },
  questionText: { fontSize: 16, color: '#374151', marginBottom: 12, lineHeight: 22 },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  incorrectAnswerRow: { backgroundColor: '#FEE2E2' },
  correctAnswerRow: { backgroundColor: '#D1FAE5', marginTop: 8 },
  userAnswerText: { fontSize: 15, color: '#374151', marginLeft: 8, flex: 1 },
  correctAnswerText: { fontSize: 15, color: '#065F46', marginLeft: 8, flex: 1, fontWeight: '500' },
  finishButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  finishButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default McqsResultScreen;
