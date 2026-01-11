import React from 'react';
import { Tabs } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

// Define the Routes where you want the Tab Bar to be VISIBLE
const ROUTES_TO_SHOW_TAB_BAR = [
  'index', // The main screen of a stack
  'home', 
  'myProfile', 
];

type TabBarIconProps = {
  focused: boolean;
  color: string;
  size: number;
};

const HomeIcon = ({ focused, color, size }: TabBarIconProps) => (
  <FontAwesome size={focused ? size + 8 : size + 4} name="home" color={color} />
);

const QuizIcon = ({ focused, color, size }: TabBarIconProps) => (
  <MaterialIcons size={focused ? size + 8 : size + 4} name="assignment" color={color} />
);

const MeIcon = ({ focused, color, size }: TabBarIconProps) => (
  <AntDesign size={focused ? size + 2 : size} name="meh" color={color} />
);

export default function TabLayout() {
  // Helper function to determine visibility dynamically
  const getTabBarStyle = (route: any) => {
    // 1. Get the name of the screen currently active inside the stack
    const routeName = getFocusedRouteNameFromRoute(route) ?? 'index';

    // 2. Check if this screen is in our "Allowed List"
    if (ROUTES_TO_SHOW_TAB_BAR.includes(routeName)) {
      return styles.tabBarStyle; // Show the custom floating bar
    }

    // 3. Otherwise, hide it
    return { display: 'none' };
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6844EE',
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: styles.tabBarLabelStyle,
      }}>
      <Tabs.Screen
        name="(stack-home)"
        options={({ route }: any) => ({
          tabBarLabel: 'Home',
          tabBarIcon: HomeIcon,
          // Calculate style dynamically based on the active child route
          tabBarStyle: getTabBarStyle(route),
        })}
      />

      <Tabs.Screen
        name="(quiz-stack)"
        options={({ route }: any) => ({
          tabBarLabel: 'Take Quiz',
          tabBarIcon: QuizIcon,
          tabBarStyle: getTabBarStyle(route),
        })}
      />

      <Tabs.Screen
        name="(stack-me)"
        options={({ route }: any) => ({
          tabBarLabel: 'Me',
          tabBarIcon: MeIcon,
          tabBarStyle: getTabBarStyle(route),
        })}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarStyle: {
    position: 'absolute',
    bottom: 5,
    backgroundColor: 'white',
    borderRadius: 10,
    borderTopColor: 'transparent',
    height: 58,
    width: '95%',
    left: '2.5%',
    right: '2.5%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 3,
  },
});
