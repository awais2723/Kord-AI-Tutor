import { MD3DarkTheme, MD3LightTheme, MD3Theme as PaperTheme } from 'react-native-paper';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
  Theme as NavigationTheme,
} from '@react-navigation/native';
import { Colors } from './Colors';

export type CombinedTheme = PaperTheme & NavigationTheme;

export const AppLightTheme: CombinedTheme = {
  ...MD3LightTheme,
  ...NavigationLightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...NavigationLightTheme.colors,
    primary: Colors.light.primary,
    background: Colors.light.background,
    text: Colors.light.text,
    card: Colors.light.background,
    border: Colors.light.border,
    notification: Colors.light.error,
  },
};

export const AppDarkTheme: CombinedTheme = {
  ...MD3DarkTheme,
  ...NavigationDarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...NavigationDarkTheme.colors,
    primary: Colors.dark.primary,
    background: Colors.dark.background,
    text: Colors.dark.text,
    card: Colors.dark.background,
    border: Colors.dark.border,
    notification: Colors.dark.primary,
  },
};
