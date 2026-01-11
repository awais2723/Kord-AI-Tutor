import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
  Switch,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons'; // Modern Icons

// --- INTERFACES ---
interface QuestionItem {
  question: string;
  options?: string[];
  correctAnswer?: string;
  estimatedLines?: number; // New field for Short Questions
}

type EditorParams = {
  quizData?: string;
  topic?: string;
  quizType?: string;
};

export default function QuizEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<EditorParams>();

  // --- STATE ---
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [quizType, setQuizType] = useState<string>('');

  // Header Config
  const [paperTitle, setPaperTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [className, setClassName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [rules, setRules] = useState('');

  // Toggles
  const [showName, setShowName] = useState(true);
  const [showRegNo, setShowRegNo] = useState(true);
  const [showSettings, setShowSettings] = useState(true);

  // --- INITIALIZATION ---
  useEffect(() => {
    try {
      const parseParam = (param: string | string[] | undefined) =>
        Array.isArray(param) ? param[0] : param;

      // Load Questions
      const rawData = parseParam(params.quizData);
      if (rawData) {
        const parsedData = JSON.parse(rawData);
        // Ensure every question has a default line count if missing
        const normalizedData = parsedData.map((q: QuestionItem) => ({
          ...q,
          estimatedLines: q.estimatedLines || 4, // Default to 4 lines
        }));
        setQuestions(normalizedData);
      }

      // Load Metadata
      const rawTopic = parseParam(params.topic) || '';
      setPaperTitle(`${rawTopic} Test`);
      setSubject(rawTopic);

      const rawType = parseParam(params.quizType);
      if (rawType) setQuizType(rawType);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to load quiz data');
    }
  }, []);

  // --- HANDLERS ---

  // 1. Edit Question Text
  const handleQuestionEdit = (text: string, index: number) => {
    const updated = [...questions];
    updated[index].question = text;
    setQuestions(updated);
  };

  // 2. Edit MCQ Option Text
  const handleOptionEdit = (text: string, questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options) {
      updated[questionIndex].options![optionIndex] = text;
      setQuestions(updated);
    }
  };

  // 3. Change Line Count (Short Questions)
  const adjustLines = (index: number, change: number) => {
    const updated = [...questions];
    const currentLines = updated[index].estimatedLines || 4;
    const newLines = Math.max(2, Math.min(15, currentLines + change)); // Min 2, Max 15 lines
    updated[index].estimatedLines = newLines;
    setQuestions(updated);
  };

  // --- PDF GENERATION ---
  const generateHtml = () => {
    // Helper to build header rows
    let headerRows = '';
    if (showName || showRegNo) {
      headerRows += '<tr>';
      if (showName && showRegNo) {
        headerRows += '<td style="width: 50%"><strong>Name:</strong> _______________________</td>';
        headerRows += '<td style="width: 50%"><strong>Reg. No:</strong> ________________</td>';
      } else if (showName)
        headerRows +=
          '<td colspan="2"><strong>Name:</strong> ___________________________________________</td>';
      else
        headerRows +=
          '<td colspan="2"><strong>Reg. No:</strong> ________________________________________</td>';
      headerRows += '</tr>';
    }
    if (className || subject) {
      headerRows += '<tr>';
      headerRows += `<td style="width: 50%"><strong>Class:</strong> ${className}</td>`;
      headerRows += `<td style="width: 50%"><strong>Subject:</strong> ${subject}</td>`;
      headerRows += '</tr>';
    }
    if (teacherName)
      headerRows += `<tr><td colspan="2"><strong>Teacher:</strong> ${teacherName}</td></tr>`;

    // Rules
    let rulesHtml = '';
    if (rules.trim()) {
      const rulesList = rules
        .split('\n')
        .filter(r => r.trim() !== '')
        .map(r => `<li>${r}</li>`)
        .join('');
      rulesHtml = `<div class="rules-box"><strong>Instructions:</strong><ul>${rulesList}</ul></div>`;
    }

    // Questions
    const questionsHtml = questions
      .map((q, i) => {
        let content = '';

        if (quizType === 'MCQs') {
          content = `
          <div class="question-block">
            <p class="question-text"><strong>Q${i + 1}:</strong> ${q.question}</p>
            <div class="options-grid">
              ${(q.options || [])
                .map(
                  opt => `
                <div class="option-item"><span class="circle"></span> ${opt}</div>
              `
                )
                .join('')}
            </div>
          </div>
        `;
        } else {
          // Dynamic Height Calculation: 1 line approx 25px + padding
          const heightPx = (q.estimatedLines || 4) * 30;
          content = `
          <div class="question-block">
            <p class="question-text"><strong>Q${i + 1}:</strong> ${q.question}</p>
            <div class="writing-space" style="height: ${heightPx}px;"></div>
          </div>
        `;
        }
        return content;
      })
      .join('');

    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #111; }
            h1 { text-align: center; margin-bottom: 20px; font-size: 22px; text-transform: uppercase; letter-spacing: 1px; }
            .info-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            .info-table td { padding: 10px; border: 1px solid #333; font-size: 14px; }
            .rules-box { font-size: 12px; margin-bottom: 35px; border: 1px dashed #666; padding: 12px; background-color: #f9f9f9; }
            .rules-box ul { margin: 5px 0 0 20px; padding: 0; }
            
            .question-block { margin-bottom: 35px; page-break-inside: avoid; }
            .question-text { font-size: 16px; margin-bottom: 12px; font-weight: 600; line-height: 1.4; }
            
            /* MCQs */
            .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-left: 15px; }
            .option-item { font-size: 14px; display: flex; align-items: center; }
            .circle { width: 12px; height: 12px; border: 1px solid #000; border-radius: 50%; margin-right: 8px; flex-shrink: 0; }
            
            /* Short Qs */
            .writing-space { border-bottom: 1px dashed #bbb; width: 100%; margin-top: 5px; position: relative; }
            /* Add faint lines purely for visuals if desired, but dashed border is usually cleaner for printing */
          </style>
        </head>
        <body>
          <h1>${paperTitle}</h1>
          <table class="info-table">${headerRows}</table>
          ${rulesHtml}
          <div class="questions-container">${questionsHtml}</div>
        </body>
      </html>
    `;
  };

  const handlePrint = async () => {
    if (!paperTitle.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for the question paper.');
      return;
    }
    try {
      const html = generateHtml();
      const { uri } = await Print.printToFileAsync({ html });
      if (Platform.OS === 'android') {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      } else {
        await Print.printAsync({ html });
      }
    } catch (err: any) {
      Alert.alert('Printing Error', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Quiz Editor</Text>
          <Text style={styles.headerSubtitle}>{quizType} Mode</Text>
        </View>
        <TouchableOpacity onPress={handlePrint} style={styles.printBtn}>
          <Ionicons name="print-outline" size={20} color="#FFF" style={{ marginRight: 6 }} />
          <Text style={styles.printBtnText}>Save PDF</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        {/* --- SETTINGS TOGGLE --- */}
        <TouchableOpacity
          style={styles.settingsToggle}
          onPress={() => setShowSettings(!showSettings)}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="settings-sharp" size={18} color="#4F46E5" />
            <Text style={styles.settingsToggleText}>Paper Configuration</Text>
          </View>
          <Ionicons name={showSettings ? 'chevron-up' : 'chevron-down'} size={20} color="#6B7280" />
        </TouchableOpacity>

        {showSettings && (
          <View style={styles.settingsCard}>
            <Text style={styles.inputLabel}>
              Paper Title <Text style={styles.req}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={paperTitle}
              onChangeText={setPaperTitle}
              placeholder="e.g. Final Exam"
            />

            <View style={styles.row}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Name Field</Text>
                <Switch
                  value={showName}
                  onValueChange={setShowName}
                  trackColor={{ false: '#D1D5DB', true: '#818CF8' }}
                  thumbColor={showName ? '#4F46E5' : '#f4f3f4'}
                />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Reg. No</Text>
                <Switch
                  value={showRegNo}
                  onValueChange={setShowRegNo}
                  trackColor={{ false: '#D1D5DB', true: '#818CF8' }}
                  thumbColor={showRegNo ? '#4F46E5' : '#f4f3f4'}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputLabel}>Class</Text>
                <TextInput
                  style={styles.input}
                  value={className}
                  onChangeText={setClassName}
                  placeholder="10th"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.inputLabel}>Subject</Text>
                <TextInput
                  style={styles.input}
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="Math"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Teacher Name</Text>
            <TextInput
              style={styles.input}
              value={teacherName}
              onChangeText={setTeacherName}
              placeholder="Optional"
            />

            <Text style={styles.inputLabel}>Instructions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={rules}
              onChangeText={setRules}
              multiline
              placeholder={'- No cheating\n- Use Blue Pen'}
            />
          </View>
        )}

        {/* --- QUESTIONS LIST --- */}
        <View style={styles.divider}>
          <Text style={styles.dividerText}>QUESTIONS ({questions.length})</Text>
          <View style={styles.dividerLine} />
        </View>

        {questions.map((item, index) => (
          <View key={index} style={styles.qCard}>
            {/* Question Header */}
            <View style={styles.qCardHeader}>
              <View style={styles.qBadge}>
                <Text style={styles.qBadgeText}>Q{index + 1}</Text>
              </View>
              {/* Short Question Stepper */}
              {quizType !== 'MCQs' && (
                <View style={styles.stepperContainer}>
                  <Text style={styles.stepperLabel}>Lines:</Text>
                  <TouchableOpacity onPress={() => adjustLines(index, -1)} style={styles.stepBtn}>
                    <Ionicons name="remove" size={16} color="#374151" />
                  </TouchableOpacity>
                  <Text style={styles.stepValue}>{item.estimatedLines || 4}</Text>
                  <TouchableOpacity onPress={() => adjustLines(index, 1)} style={styles.stepBtn}>
                    <Ionicons name="add" size={16} color="#374151" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Question Input */}
            <TextInput
              style={styles.qInput}
              multiline
              value={item.question}
              onChangeText={text => handleQuestionEdit(text, index)}
              placeholder="Enter question text here..."
            />

            {/* MCQ Options (Editable) */}
            {quizType === 'MCQs' && item.options && (
              <View style={styles.optionsContainer}>
                {item.options.map((opt, optIndex) => (
                  <View key={optIndex} style={styles.optionRow}>
                    <Ionicons name="radio-button-off" size={20} color="#9CA3AF" />
                    <TextInput
                      style={styles.optionInput}
                      value={opt}
                      onChangeText={text => handleOptionEdit(text, index, optIndex)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' }, // Very light blue-gray background

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  headerSubtitle: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  printBtn: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  printBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  list: { padding: 16 },

  // Settings
  settingsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  settingsToggleText: { color: '#4F46E5', fontWeight: '700', marginLeft: 8 },

  settingsCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 6, marginTop: 12 },
  req: { color: '#EF4444' },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  row: { flexDirection: 'row', alignItems: 'center' },

  // Toggles
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 4,
    marginTop: 10,
  },
  switchLabel: { fontSize: 13, fontWeight: '600', color: '#475569' },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginRight: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },

  // Question Card
  qCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#64748B',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  qCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  qBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  qBadgeText: { color: '#4F46E5', fontWeight: '800', fontSize: 12 },

  qInput: {
    fontSize: 16,
    color: '#1E293B',
    lineHeight: 24,
    fontWeight: '500',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
    marginBottom: 15,
  },

  // Options (MCQ)
  optionsContainer: { marginTop: 5 },
  optionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  optionInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#334155',
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // Stepper (Short Answer)
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    padding: 4,
  },
  stepperLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 8,
    marginRight: 4,
  },
  stepBtn: {
    backgroundColor: '#FFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    elevation: 1,
  },
  stepValue: { paddingHorizontal: 10, fontSize: 13, fontWeight: '700', color: '#334155' },
});
