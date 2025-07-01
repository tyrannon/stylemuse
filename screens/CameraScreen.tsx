import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCameraControls } from '../hooks/useCameraControls';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CameraScreenProps {
  onPhotoTaken: (photoUri: string) => void;
  onCancel: () => void;
  mode: 'wardrobe' | 'profile' | 'outfit';
  showGrid?: boolean;
  flashMode?: 'on' | 'off' | 'auto';
}

export const CameraScreen: React.FC<CameraScreenProps> = ({
  onPhotoTaken,
  onCancel,
  mode = 'wardrobe',
  showGrid = false,
  flashMode = 'off',
}) => {
  const {
    state,
    cameraRef,
    toggleFlash,
    flipCamera,
    setZoom,
    toggleGrid,
    setResolution,
    requestPermission,
    takePicture,
  } = useCameraControls();

  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    initializeCamera();
  }, []);

  const initializeCamera = async () => {
    try {
      if (!state.hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          Alert.alert(
            'Camera Permission Required',
            'StyleMuse needs camera access to take photos of your wardrobe items.',
            [
              { text: 'Cancel', onPress: onCancel },
              { text: 'Settings', onPress: () => {/* TODO: Open settings */} },
            ]
          );
          return;
        }
      }
      setIsInitializing(false);
    } catch (error) {
      console.error('Camera initialization error:', error);
      Alert.alert('Camera Error', 'Failed to initialize camera. Please try again.');
      onCancel();
    }
  };

  const handleTakePicture = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const photoUri = await takePicture();
      
      if (photoUri) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onPhotoTaken(photoUri);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Photo Error', 'Failed to capture photo. Please try again.');
      }
    } catch (error) {
      console.error('Photo capture error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Photo Error', 'Failed to capture photo. Please try again.');
    }
  };

  const handleFlashToggle = () => {
    toggleFlash();
    Haptics.selectionAsync();
  };

  const handleCameraFlip = () => {
    flipCamera();
    Haptics.selectionAsync();
  };

  const handleGridToggle = () => {
    toggleGrid();
    Haptics.selectionAsync();
  };

  const getFlashIcon = () => {
    switch (state.flashMode) {
      case 'on': return 'flash';
      case 'off': return 'flash-off';
      case 'auto': return 'flash-outline';
      default: return 'flash-off';
    }
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'wardrobe': return 'Add to Wardrobe';
      case 'profile': return 'Profile Photo';
      case 'outfit': return 'Outfit Photo';
      default: return 'Take Photo';
    }
  };

  if (isInitializing || !state.hasPermission) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="black" />
        <Text style={styles.loadingText}>Initializing Camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={state.cameraType}
        flash={state.flashMode}
        zoom={state.zoom}
      />
      
      {/* Grid Overlay */}
      {state.showGrid && (
        <View style={styles.gridOverlay}>
          <View style={styles.gridLine} />
          <View style={[styles.gridLine, { top: '66.66%' }]} />
          <View style={[styles.gridLine, { transform: [{ rotate: '90deg' }], left: '33.33%', top: '50%' }]} />
          <View style={[styles.gridLine, { transform: [{ rotate: '90deg' }], left: '66.66%', top: '50%' }]} />
        </View>
      )}
      
      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={onCancel}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
        
        <Text style={styles.modeTitle}>{getModeTitle()}</Text>
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleFlashToggle}
          activeOpacity={0.7}
        >
          <Ionicons name={getFlashIcon()} size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Side Controls */}
      <View style={styles.sideControls}>
        <TouchableOpacity
          style={styles.sideButton}
          onPress={handleCameraFlip}
          activeOpacity={0.7}
        >
          <Ionicons name="camera-reverse" size={24} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.sideButton}
          onPress={handleGridToggle}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="grid" 
            size={24} 
            color={state.showGrid ? "#007AFF" : "white"} 
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <View style={styles.captureContainer}>
          <TouchableOpacity
            style={[
              styles.captureButton,
              state.isCapturing && styles.captureButtonActive
            ]}
            onPress={handleTakePicture}
            disabled={state.isCapturing}
            activeOpacity={0.8}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mode-specific overlays */}
      {mode === 'wardrobe' && (
        <View style={styles.wardrobeOverlay}>
          <Text style={styles.overlayText}>
            Center the clothing item in the frame
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  camera: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    height: 1,
    width: '100%',
    top: '33.33%',
  },
  topControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  sideControls: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -60 }],
    zIndex: 2,
  },
  sideButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  bottomControls: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  captureContainer: {
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  captureButtonActive: {
    transform: [{ scale: 0.9 }],
    opacity: 0.8,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  wardrobeOverlay: {
    position: 'absolute',
    bottom: 140,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 12,
    zIndex: 2,
  },
  overlayText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default CameraScreen; 