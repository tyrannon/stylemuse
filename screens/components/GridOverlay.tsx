import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface GridOverlayProps {
  mode: 'wardrobe' | 'profile' | 'outfit';
}

export const GridOverlay: React.FC<GridOverlayProps> = ({ mode }) => {
  const renderGridLines = () => {
    const lines = [];
    
    // Rule of thirds grid
    const thirdWidth = screenWidth / 3;
    const thirdHeight = screenHeight / 3;
    
    // Vertical lines
    for (let i = 1; i < 3; i++) {
      lines.push(
        <View
          key={`v${i}`}
          style={[
            styles.gridLine,
            styles.verticalLine,
            { left: thirdWidth * i }
          ]}
        />
      );
    }
    
    // Horizontal lines
    for (let i = 1; i < 3; i++) {
      lines.push(
        <View
          key={`h${i}`}
          style={[
            styles.gridLine,
            styles.horizontalLine,
            { top: thirdHeight * i }
          ]}
        />
      );
    }
    
    // Mode-specific guides
    if (mode === 'wardrobe') {
      // Clothing-specific guides
      lines.push(
        <View key="wardrobe-center" style={styles.wardrobeCenterGuide} />
      );
    } else if (mode === 'profile') {
      // Face/body composition guides
      lines.push(
        <View key="profile-face" style={styles.profileFaceGuide} />
      );
    } else if (mode === 'outfit') {
      // Full-body outfit guides
      lines.push(
        <View key="outfit-body" style={styles.outfitBodyGuide} />
      );
    }
    
    return lines;
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {renderGridLines()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  verticalLine: {
    width: 1,
    height: '100%',
  },
  horizontalLine: {
    height: 1,
    width: '100%',
  },
  wardrobeCenterGuide: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 200,
    height: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderStyle: 'dashed',
    borderRadius: 100,
    transform: [{ translateX: -100 }, { translateY: -100 }],
  },
  profileFaceGuide: {
    position: 'absolute',
    top: '25%',
    left: '50%',
    width: 150,
    height: 150,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderStyle: 'dashed',
    borderRadius: 75,
    transform: [{ translateX: -75 }, { translateY: -75 }],
  },
  outfitBodyGuide: {
    position: 'absolute',
    top: '10%',
    left: '50%',
    width: 120,
    height: 300,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderStyle: 'dashed',
    transform: [{ translateX: -60 }],
  },
}); 