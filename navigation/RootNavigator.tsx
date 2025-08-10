import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WardrobeUploadScreen from '../screens/WardrobeUploadScreen';
import { OnboardingNavigator } from '../components/onboarding/OnboardingNavigator';

export type RootStackParamList = {
  Onboarding: undefined;
  MainApp: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  initialRouteName: keyof RootStackParamList;
  onOnboardingComplete: (data: any) => void;
}

export function RootNavigator({ initialRouteName, onOnboardingComplete }: RootNavigatorProps) {
  return (
    <Stack.Navigator 
      initialRouteName={initialRouteName} 
      screenOptions={{ 
        headerShown: false,
        animation: 'none' // Disable animations since we have custom navigation in WardrobeUploadScreen
      }}
    >
      <Stack.Screen 
        name="Onboarding" 
        component={() => <OnboardingNavigator onComplete={onOnboardingComplete} />}
      />
      <Stack.Screen 
        name="MainApp" 
        component={WardrobeUploadScreen}
      />
    </Stack.Navigator>
  );
}