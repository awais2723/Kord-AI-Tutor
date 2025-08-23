import React, { useMemo } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Svg, Circle } from 'react-native-svg';

// Define the structure for an evaluated answer
interface EvaluatedAnswer {
  question: string;
  answer: string;
  score: number; // Score out of 5
}

const QuestionResultScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();

  const { totalScore, maxScore, results } = useMemo(() => {
    let parsedResults: EvaluatedAnswer[] = [];
    try {
      if (typeof params.results === 'string') {
        parsedResults = JSON.parse(params.results);
      }
    } catch (e) {
      console.error("Failed to parse result data:", e);
      Alert.alert("Error", "Could not load the quiz results.", [{ text: "OK", onPress: () => router.back() }]);
    }
    return {
      totalScore: Number(params.totalScore || 0),
      maxScore: Number(params.maxScore || 0),
      results: parsedResults,
    };
  }, [params]);

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const strokeDashoffset = 251.2 * (1 - percentage / 100); // Circumference * (1 - progress)

  const getPerformanceMessage = () => {
    if (percentage >= 90) return "Outstanding! 🌟";
    if (percentage >= 70) return "Excellent Effort! 🎉";
    if (percentage >= 50) return "Well Done! 👍";
    return "Good Attempt! Keep learning! 📚";
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
              <Text style={styles.statValue}>{totalScore}</Text>
              <Text style={styles.statLabel}>Your Score</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{maxScore}</Text>
              <Text style={styles.statLabel}>Max Score</Text>
            </View>
             <View style={styles.statItem}>
              <Text style={styles.statValue}>{results.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        <Text style={styles.breakdownTitle}>Answer Breakdown</Text>

        {results.map((item, index) => (
          <View key={index} style={styles.resultItem}>
            <Text style={styles.questionText}>{index + 1}. {item.question}</Text>
            <View style={styles.answerContainer}>
                <Text style={styles.userAnswerText}>{item.answer}</Text>
            </View>
            <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>Score: {item.score} / 5</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.finishButton} onPress={() => router.replace('/')}>
          <Text style={styles.finishButtonText}>Finish</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 24 },
  summaryCard: { backgroundColor: 'white', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  progressContainer: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  percentageText: { position: 'absolute', fontSize: 24, fontWeight: 'bold', color: '#4F46E5' },
  performanceMessage: { fontSize: 20, fontWeight: '600', color: '#1F2937', marginBottom: 20 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 16 },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  statLabel: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  breakdownTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  resultItem: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12 },
  questionText: { fontSize: 16, color: '#374151', marginBottom: 12, lineHeight: 22 },
  answerContainer: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8, marginBottom: 12 },
  userAnswerText: { fontSize: 15, color: '#374151', lineHeight: 20 },
  scoreBadge: { backgroundColor: '#E0E7FF', alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  scoreText: { fontSize: 14, color: '#4338CA', fontWeight: '600' },
  finishButton: { backgroundColor: '#4F46E5', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  finishButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default QuestionResultScreen;
