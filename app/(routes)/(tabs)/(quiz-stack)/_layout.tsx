import { Stack } from 'expo-router';

export default function StackQuizLayout() {
  return (
    <Stack
      screenOptions={{
        // Global styles for all screens in this stack
        headerStyle: { backgroundColor: '#6844EE' },
        headerTintColor: 'white',
        headerTitleStyle: { color: 'white', fontWeight: 'bold' },
        headerTitleAlign: 'center', // Optional: centers title on Android too
      }}>
      {/* 1. Index Screen 
        - headerShown: false (You likely have a custom UI here)
        - Tabs: VISIBLE (Because route name is 'index')
      */}
      <Stack.Screen name="index" options={{ headerShown: false }} />

     
      <Stack.Screen name="mcqsQuiz" options={{ title: 'MCQs Quiz' }} />

      <Stack.Screen name="questionQuiz" options={{ title: 'Short Questions Quiz' }} />

      <Stack.Screen name="mcqsResult" options={{ title: 'Result' }} />

      <Stack.Screen name="questionResult" options={{ title: 'Result' }} />
      <Stack.Screen name="editQuiz" options={{ title: 'Edit Quiz' }} />
    </Stack>
  );
}
