import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { soundService } from '../services/SoundService';

interface SoundButtonProps extends TouchableOpacityProps {
  onPress?: () => void;
  soundType?: 'tap' | 'success' | 'error';
}

export const SoundButton: React.FC<SoundButtonProps> = ({
  onPress,
  soundType = 'tap',
  children,
  ...props
}) => {
  const handlePress = async () => {
    // Play sound based on type
    switch (soundType) {
      case 'tap':
        await soundService.playButtonTap();
        break;
      case 'success':
        await soundService.playSuccess();
        break;
      case 'error':
        await soundService.playError();
        break;
    }

    // Call original onPress
    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity {...props} onPress={handlePress}>
      {children}
    </TouchableOpacity>
  );
};