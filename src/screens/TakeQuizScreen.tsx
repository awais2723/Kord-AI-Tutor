import React, { Component } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const quizTypes = ['Short Questions', 'MCQs'];
const difficulties = ['Easy', 'Medium', 'Hard'];

type Props = object;

type State = {
  explanation: string;
  selectedQuizType: string;
  selectedDifficulty: string;
};

class TakeQuizScreen extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      explanation: '',
      selectedQuizType: '',
      selectedDifficulty: '',
    };
  }

  handleQuizTypeSelect = (type: string) => {
    this.setState({ selectedQuizType: type });
  };

  handleDifficultySelect = (level: string) => {
    this.setState({ selectedDifficulty: level });
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
    const { explanation, selectedQuizType, selectedDifficulty } = this.state;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Take a Quiz</Text>

          <Text style={styles.label}>Topic</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Type your topic or explanation..."
            multiline
            value={explanation}
            onChangeText={text => this.setState({ explanation: text })}
          />

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0} // Adjust this as needed
          >
            <Text style={styles.label}>Quiz Type</Text>
            <View style={styles.optionRow}>
              {this.renderOption(quizTypes, selectedQuizType, this.handleQuizTypeSelect)}
            </View>

            <Text style={styles.label}>Difficulty</Text>
            <View style={styles.optionRow}>
              {this.renderOption(difficulties, selectedDifficulty, this.handleDifficultySelect)}
            </View>

            <TouchableOpacity style={styles.startButton}>
              <Text style={styles.startButtonText}>Start Quiz</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#4F46E5',
    textAlign: 'center',
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 25,
    marginBottom: 10,
    color: '#111827',
  },
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
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
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
  optionSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#FFF',
  },
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
  startButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default TakeQuizScreen;
