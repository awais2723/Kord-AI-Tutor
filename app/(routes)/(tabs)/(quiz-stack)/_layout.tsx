import { Stack } from 'expo-router/stack';

export default function StackQuizLayout() {
  return (
    <Stack>
      <Stack.Screen name="quiz" options={{ headerShown: false }} />
      <Stack.Screen
        name="mcqsQuiz"
        options={{
          headerShown: true,
          title: 'Mcqs Quiz',
          headerStyle: { backgroundColor: '#6844EE' },
          headerTintColor: 'white',
          headerTitleStyle: { color: 'white' },
        }}
      />
      <Stack.Screen
        name="questionQuiz"
        options={{
          headerShown: true,
          title: 'Short Questions Quiz',
          headerStyle: { backgroundColor: '#6844EE' },
          headerTintColor: 'white',
          headerTitleStyle: { color: 'white' },
        }}
      />
      <Stack.Screen
        name="mcqsResult"
        options={{
          headerShown: true,
          title: 'Result',
          headerStyle: { backgroundColor: '#6844EE' },
          headerTintColor: 'white',
          headerTitleStyle: { color: 'white' },
        }}
      />

      <Stack.Screen
        name="questionResult"
        options={{
          headerShown: true,
          title: 'Result',
          headerStyle: { backgroundColor: '#6844EE' },
          headerTintColor: 'white',
          headerTitleStyle: { color: 'white' },
        }}
      />
    </Stack>
  );
}
