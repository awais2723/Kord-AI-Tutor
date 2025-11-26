import { Stack } from 'expo-router/stack';

export default function StackLayout() {
  return (
    <Stack>
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen
        name="scanQuestion"
        options={{
          headerShown: true,
          title: 'Scan Question',
          headerStyle: { backgroundColor: '#6844EE' },
          headerTintColor: 'white',
          headerTitleStyle: { color: 'white' },
        }}
      />
      {/* <Stack.Screen
        name="editScannedText"
        options={{
          headerShown: true,
          title: 'Edit Text',
          headerStyle: { backgroundColor: '#6844EE' },
          headerTintColor: 'white',
          headerTitleStyle: { color: 'white' },
        }}
      /> */}

      <Stack.Screen
        name="showResult"
        options={{
          headerShown: true,
          title: 'Result',
          headerStyle: { backgroundColor: '#6844EE' },
          headerTintColor: 'white',
          headerTitleStyle: { color: 'white' },
        }}
      />

      <Stack.Screen
        name="scanEquation"
        options={{
          headerShown: true,
          title: 'Scan Equation',
          headerStyle: { backgroundColor: '#6844EE' },
          headerTintColor: 'white',
          headerTitleStyle: { color: 'white' },
        }}
      />
      <Stack.Screen
        name="scanToPdf"
        options={{
          headerShown: true,
          title: 'Scan To PDF',
          headerStyle: { backgroundColor: '#6844EE' },
          headerTintColor: 'white',
          headerTitleStyle: { color: 'white' },
        }}
      />
      <Stack.Screen
        name="pdfPreview"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
