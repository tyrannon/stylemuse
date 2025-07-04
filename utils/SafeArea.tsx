import React from 'react';
import { SafeAreaView, ViewStyle, Platform, StatusBar } from 'react-native';

interface SafeAreaProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const SafeArea: React.FC<SafeAreaProps> = ({ children, style }) => {
  return (
    <SafeAreaView 
      style={[
        {
          flex: 1,
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        },
        style
      ]}
    >
      {children}
    </SafeAreaView>
  );
};