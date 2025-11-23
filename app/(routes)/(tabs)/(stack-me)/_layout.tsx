import { Stack } from 'expo-router/stack';

export default function StackMeLayout() {
  return (
    <Stack>
      <Stack.Screen name="myProfile" options={{ headerShown: false }} />
      <Stack.Screen
        name="settings"
        options={{
          headerShown: true,
          title: 'Settings',
          headerStyle: { backgroundColor: '#6844EE' },
          headerTintColor: 'white',
          headerTitleStyle: { color: 'white' },
        }}
      />
      <Stack.Screen
        name="account"
        options={{
          headerShown: true,
          title: 'Manage Profile',
          headerStyle: { backgroundColor: '#6844EE' },
          headerTintColor: 'white',
          headerTitleStyle: { color: 'white' },
        }}
      />
      <Stack.Screen
        name="about"
        options={{
          headerShown: true,
          title: 'About Us',
          headerStyle: { backgroundColor: '#6844EE' },
          headerTintColor: 'white',
          headerTitleStyle: { color: 'white' },
        }}
      />
      <Stack.Screen
        name="helpCenter"
        options={{
          headerShown: true,
          title: 'Help Center',
          headerStyle: { backgroundColor: '#6844EE' },
          headerTintColor: 'white',
          headerTitleStyle: { color: 'white' },
        }}
      />
    </Stack>
  );
}
