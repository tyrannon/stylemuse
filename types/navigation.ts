/**
 * Navigation type definitions for StyleMuse app
 */

import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

// Root Stack Navigation
export type RootStackParamList = {
  Onboarding: undefined;
  MainApp: undefined;
  StreakCalendar: undefined;
  GamificationTest?: undefined;
  CardCollection?: undefined;
};

// Navigation prop types
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Route prop types
export type RootStackRouteProp<T extends keyof RootStackParamList> = RouteProp<
  RootStackParamList,
  T
>;

// Screen prop types
export type ScreenProps<T extends keyof RootStackParamList> = {
  navigation: NativeStackNavigationProp<RootStackParamList, T>;
  route: RouteProp<RootStackParamList, T>;
};