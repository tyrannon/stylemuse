import React from 'react';
import WardrobeUploadScreen from './screens/WardrobeUploadScreen';
import { ThemeProvider } from './contexts/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <WardrobeUploadScreen />
    </ThemeProvider>
  );
}
