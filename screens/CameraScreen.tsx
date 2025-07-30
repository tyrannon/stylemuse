import React, { useState, useEffect, useRef } from 'react';
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
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { CrashPreventionWrapper, safeHaptics } from '../utils/CrashPreventionWrapper';
import { useCameraControls } from '../hooks/useCameraControls';
import { detectMultipleClothingItems } from '../utils/openai';
import { UnifiedLoadingOverlay } from '../components/UnifiedLoadingOverlay';
import { useUnifiedLoading, LOADING_CONFIGS } from '../hooks/useUnifiedLoading';
import { useTheme } from '../contexts/ThemeContext';
import { ExpoCompatibleTerminatorOverlay } from '../components/ExpoCompatibleTerminatorOverlay';
import { ExpoCompatibleTargetsScroller } from '../components/ExpoCompatibleTargetsScroller';
import { TerminatorProvider, useTerminator } from '../contexts/TerminatorContext';
import { emergencyFlags } from '../utils/EmergencyFeatureFlags';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CameraScreenProps {
  onPhotoTaken: (photoUri: string) => void;
  onCancel: () => void;
  mode: 'wardrobe' | 'profile' | 'outfit';
  showGrid?: boolean;
  flashMode?: 'on' | 'off' | 'auto';
  onMultiItemDetected?: (items: any[]) => void;
  defaultMultiItemMode?: boolean;
  defaultTerminatorMode?: boolean;
}

// Internal camera component that uses Terminator context
const CameraScreenInternal: React.FC<CameraScreenProps> = ({
  onPhotoTaken,
  onCancel,
  mode = 'wardrobe',
  showGrid = false,
  flashMode = 'off',
  onMultiItemDetected,
  defaultMultiItemMode = false,
  defaultTerminatorMode = false,
}) => {
  // Access Terminator context
  const {
    activateTerminator,
    deactivateTerminator,
    triggerDetection,
    reportDetectionSuccess,
    reportDetectionFailure,
    getCurrentState,
    getDetectedItems,
    shouldShowBoundingBoxes,
    shouldShowTargetsScroller,
    isSystemActive,
  } = useTerminator();
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

  const { theme } = useTheme();
  const unifiedLoading = useUnifiedLoading();
  const [isInitializing, setIsInitializing] = useState(true);
  const [multiItemMode, setMultiItemMode] = useState(defaultMultiItemMode); // Use prop default
  const [isProcessingMultiItem, setIsProcessingMultiItem] = useState(false);
  const [terminatorMode, setTerminatorMode] = useState(defaultTerminatorMode);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const styles = createStyles(theme);

  useEffect(() => {
    initializeCamera();
    
    // CRITICAL FIX: Cleanup on unmount to prevent crashes
    return () => {
      CrashPreventionWrapper.reset();
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }
      deactivateTerminator();
    };
  }, [deactivateTerminator]);

  // CRITICAL FIX: Safe terminator initialization with emergency checks
  useEffect(() => {
    const initializeTerminator = async () => {
      try {
        const isEnabled = !emergencyFlags.isTerminatorCameraDisabled();
        
        if (!isEnabled) {
          console.warn('SAFETY: Terminator camera disabled by emergency flags');
          setTerminatorMode(false);
          return;
        }

        await CrashPreventionWrapper.safeAsync(async () => {
          if (terminatorMode && isCameraReady) {
            console.log('Safely activating Terminator system');
            activateTerminator();
          } else if (!terminatorMode && isSystemActive()) {
            console.log('Safely deactivating Terminator system');
            deactivateTerminator();
          }
        });
      } catch (error) {
        console.error('CRITICAL: Terminator initialization failed:', error);
        await emergencyFlags.reportCrash('terminator');
        setTerminatorMode(false);
      }
    };

    initializeTerminator();
  }, [terminatorMode, isCameraReady, activateTerminator, deactivateTerminator, isSystemActive]);

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
    // CRITICAL FIX: Use safe wrapper to prevent crashes
    await CrashPreventionWrapper.safeAsync(async () => {
      safeHaptics.impact('Medium');
      const photoUri = await takePicture();
      
      if (photoUri) {
        if (multiItemMode && onMultiItemDetected) {
          await handleMultiItemDetection(photoUri);
        } else {
          safeHaptics.notification('Success');
          onPhotoTaken(photoUri);
        }
      } else {
        safeHaptics.notification('Error');
        Alert.alert('Photo Error', 'Failed to capture photo. Please try again.');
      }
    }, {
      onError: (error) => {
        CrashPreventionWrapper.safeLog('Photo capture error:', error);
        safeHaptics.notification('Error');
        Alert.alert('Photo Error', 'Failed to capture photo. Please try again.');
      }
    });
  };

  // CRITICAL FIX: Safe smart detection to prevent Hermes crashes
  const triggerSmartDetection = async () => {
    await CrashPreventionWrapper.safeAsync(async () => {
      if (!cameraRef.current || getCurrentState() === 'detecting') {
        CrashPreventionWrapper.safeLog('Smart detection: Camera not ready or already detecting');
        return;
      }
      
      CrashPreventionWrapper.safeLog('Smart detection: TAP TRIGGERED - Starting detection');
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
        flash: 'off',
        skipProcessing: true,
      });
      
      if (photo && photo.base64) {
        CrashPreventionWrapper.safeLog('Smart detection: Photo captured, triggering detection');
        triggerDetection(photo.base64);
        
        const result = await detectMultipleClothingItems(photo.base64);
        
        if (result.success && result.items && result.items.length > 0) {
          CrashPreventionWrapper.safeLog('Smart detection: AI detected items:', result.items.length);
          
          const formattedItems = result.items.map((item: any, index: number) => ({
            id: 'tracked-' + Date.now() + '-' + index, // Safe string concatenation
            label: item.itemType || 'Item',
            confidence: (item.confidence || 50) / 100,
            boundingBox: {
              x: item.boundingBox?.top_left?.[0] || 10,
              y: item.boundingBox?.top_left?.[1] || 10,
              width: Math.abs((item.boundingBox?.bottom_right?.[0] || 90) - (item.boundingBox?.top_left?.[0] || 10)),
              height: Math.abs((item.boundingBox?.bottom_right?.[1] || 90) - (item.boundingBox?.top_left?.[1] || 10)),
            },
            category: 'top' as const,
          }));
          
          reportDetectionSuccess(formattedItems);
          
        } else {
          CrashPreventionWrapper.safeLog('Smart detection: No items detected');
          reportDetectionFailure('No items detected');
        }
      }
    }, {
      onError: (error) => {
        CrashPreventionWrapper.safeLog('Smart detection error:', error);
        reportDetectionFailure('Detection failed');
      }
    });
  };

  // Cleanup tracking intervals
  const stopTracking = () => {
    if (trackingIntervalRef.current) {
      console.log('🎯 Tracking: 🛑 Stopping tracking');
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
  };

  // Handle camera tap for detection trigger
  const handleCameraTap = () => {
    if (terminatorMode && getCurrentState() === 'scanning') {
      triggerSmartDetection();
    }
  };


  const handleMultiItemDetection = async (photoUri: string) => {
    setIsProcessingMultiItem(true);
    
    // Start with initial loading config
    const initialSteps = LOADING_CONFIGS.MULTI_ITEM_DETECTION.steps!.map(step => ({ ...step, completed: false }));
    unifiedLoading.showLoading({
      ...LOADING_CONFIGS.MULTI_ITEM_DETECTION,
      steps: initialSteps
    });
    
    try {
      // CRITICAL FIX: Simplified loading without setTimeout chains
      console.log('Processing image data...');
      const response = await fetch(photoUri);
      const blob = await response.blob();
      
      // Mark step 1 complete
      let updatedSteps = [...initialSteps];
      updatedSteps[0] = { ...updatedSteps[0], completed: true };
      unifiedLoading.updateSteps(updatedSteps);
      
      // Step 2: Processing
      console.log('Initializing detection...');
      
      // Mark step 2 complete
      updatedSteps[1] = { ...updatedSteps[1], completed: true };
      unifiedLoading.updateSteps(updatedSteps);
      
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          resolve(base64String.split(',')[1]); // Remove data:image/jpeg;base64, prefix
        };
        reader.readAsDataURL(blob);
      });

      // Step 3: AI Detection - CRITICAL FIX: No setTimeout delays
      console.log('Running AI detection...');
      
      // Mark step 3 complete
      updatedSteps[2] = { ...updatedSteps[2], completed: true };
      unifiedLoading.updateSteps(updatedSteps);
      
      // CRITICAL FIX: Direct API call without artificial delays
      const result = await detectMultipleClothingItems(base64);
      
      // Step 4: Processing results
      console.log('Processing results...');
      
      // Mark step 4 complete
      updatedSteps[3] = { ...updatedSteps[3], completed: true };
      unifiedLoading.updateSteps(updatedSteps);
      
      console.log('📊 Multi-item detection result:', result);
      console.log('🔢 Items found:', result.items?.length || 0);
      
      if (result.success !== false && result.items && result.items.length > 0) {
        // Step 6: Detecting and pairing shoe sets
        console.log('👟 Detecting and pairing shoe sets...');
        const shoeItems = result.items.filter((item: any) => 
          item.itemType?.toLowerCase().includes('shoe') || 
          item.itemType?.toLowerCase().includes('sneaker') || 
          item.itemType?.toLowerCase().includes('boot') ||
          item.itemType?.toLowerCase().includes('sandal') ||
          item.itemType?.toLowerCase().includes('heel')
        );
        
        // CRITICAL FIX: Complete all steps without setTimeout delays
        updatedSteps[4] = { ...updatedSteps[4], completed: true };
        updatedSteps[5] = { ...updatedSteps[5], completed: true };
        updatedSteps[6] = { ...updatedSteps[6], completed: true };
        updatedSteps[7] = { ...updatedSteps[7], completed: true };
        updatedSteps[8] = { ...updatedSteps[8], completed: true };
        unifiedLoading.updateSteps(updatedSteps);
        
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        if (shoeItems.length > 1) {
          console.log(`🎉 Successfully detected ${shoeItems.length} shoes!`);
        }
        
        onMultiItemDetected!(result.items.map((item: any) => ({
          ...item,
          originalImageUri: photoUri
        })));
      } else {
        // Fallback to single-item mode
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          'Multi-Item Detection',
          'No multiple items detected. Would you like to save as a single item?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Save Single', onPress: () => onPhotoTaken(photoUri) }
          ]
        );
      }
    } catch (error) {
      console.error('Multi-item detection error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Detection Error',
        'Multi-item detection failed. Would you like to save as a single item?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save Single', onPress: () => onPhotoTaken(photoUri) }
        ]
      );
    } finally {
      setIsProcessingMultiItem(false);
      unifiedLoading.hideLoading();
    }
  };

  const handleMultiItemToggle = () => {
    setMultiItemMode(!multiItemMode);
    Haptics.selectionAsync();
  };

  const handleTerminatorToggle = () => {
    setTerminatorMode(!terminatorMode);
    Haptics.selectionAsync();
    if (!terminatorMode) {
      console.log('🎯 Terminator Vision Mode: ACTIVATED');
    } else {
      console.log('🎯 Terminator Vision Mode: DEACTIVATED');
    }
  };

  const handleCameraReady = () => {
    console.log('🎯 DETROIT SMASH: 📷 Camera is now READY! Setting isCameraReady to true');
    setIsCameraReady(true);
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
    if (multiItemMode && mode === 'wardrobe') {
      return 'Multi-Item Mode';
    }
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
      
      {/* Camera View - Hide when processing multi-item */}
      <TouchableOpacity
        style={styles.cameraContainer}
        onPress={handleCameraTap}
        activeOpacity={1.0}
        disabled={!terminatorMode}
      >
        <CameraView
          ref={cameraRef}
          style={[styles.camera, isProcessingMultiItem && styles.hiddenCamera]}
          facing={state.cameraType}
          flash={state.flashMode}
          zoom={state.zoom}
          onCameraReady={handleCameraReady}
        />
      </TouchableOpacity>
      
      {/* Grid Overlay */}
      {state.showGrid && (
        <View style={styles.gridOverlay}>
          <View style={styles.gridLine} />
          <View style={[styles.gridLine, { top: '66.66%' }]} />
          <View style={[styles.gridLine, { transform: [{ rotate: '90deg' }], left: '33.33%', top: '50%' }]} />
          <View style={[styles.gridLine, { transform: [{ rotate: '90deg' }], left: '66.66%', top: '50%' }]} />
        </View>
      )}
      
      {/* Debug State Display */}
      {terminatorMode && (
        <View style={{
          position: 'absolute',
          top: 50,
          left: 20,
          right: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 10,
          borderRadius: 8,
          zIndex: 1001
        }}>
          <Text style={{ color: '#00FF00', fontFamily: 'Courier New', fontSize: 12 }}>
            🎯 DEBUG: State={getCurrentState()} | Items={getDetectedItems().length} | ShowBoxes={shouldShowBoundingBoxes().toString()} | ShowScroller={shouldShowTargetsScroller().toString()}
          </Text>
        </View>
      )}

      {/* Expo Compatible Terminator Vision Overlay */}
      {terminatorMode && shouldShowBoundingBoxes() && (
        <ExpoCompatibleTerminatorOverlay
          cameraWidth={screenWidth}
          cameraHeight={screenHeight}
        />
      )}
      
      {/* Expo Compatible Targets Acquired Scroller */}
      {terminatorMode && shouldShowTargetsScroller() && (
        <ExpoCompatibleTargetsScroller />
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
            color={state.showGrid ? theme.colors.primary : "white"} 
          />
        </TouchableOpacity>
        
        {mode === 'wardrobe' && onMultiItemDetected && (
          <TouchableOpacity
            style={[styles.sideButton, multiItemMode && styles.sideButtonActive]}
            onPress={handleMultiItemToggle}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="layers" 
              size={24} 
              color={multiItemMode ? theme.colors.accent : "white"} 
            />
          </TouchableOpacity>
        )}
        
        {mode === 'wardrobe' && (
          <TouchableOpacity
            style={[styles.sideButton, terminatorMode && styles.terminatorButtonActive]}
            onPress={handleTerminatorToggle}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.terminatorIcon,
              { color: terminatorMode ? '#00FF00' : 'white' }
            ]}>
              🎯
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom Controls - Hide shutter button in Terminator mode */}
      {!terminatorMode && (
        <View style={styles.bottomControls}>
          <View style={styles.captureContainer}>
            <TouchableOpacity
              style={[
                styles.captureButton,
                (state.isCapturing || isProcessingMultiItem) && styles.captureButtonActive
              ]}
              onPress={handleTakePicture}
              disabled={state.isCapturing || isProcessingMultiItem}
              activeOpacity={0.8}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            {isProcessingMultiItem && (
              <Text style={styles.processingText}>Detecting items...</Text>
            )}
          </View>
        </View>
      )}

      {/* Mode-specific overlays */}
      {mode === 'wardrobe' && (
        <View style={styles.wardrobeOverlay}>
          <Text style={styles.overlayText}>
            {multiItemMode 
              ? 'Position multiple items in frame (e.g. both shoes, multiple clothes)'
              : 'Center the clothing item in the frame'
            }
          </Text>
          {multiItemMode && (
            <Text style={styles.overlaySubtext}>
              AI will detect each shoe, shirt, pants, etc. separately
            </Text>
          )}
        </View>
      )}

      {/* Unified Loading Overlay */}
      <UnifiedLoadingOverlay
        visible={unifiedLoading.isLoading}
        title={unifiedLoading.loadingConfig?.title || ''}
        subtitle={unifiedLoading.loadingConfig?.subtitle}
        steps={unifiedLoading.loadingConfig?.steps}
        style={unifiedLoading.loadingConfig?.style}
      />
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black', // Keep black for camera
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'black', // Keep black for camera loading
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white', // Keep white for camera overlay
    fontSize: 16,
    fontWeight: '500',
  },
  cameraContainer: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
  },
  camera: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
  },
  hiddenCamera: {
    opacity: 0,
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Keep as is for grid visibility
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
    backgroundColor: theme.colors.overlay, // Use theme overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeTitle: {
    color: 'white', // Keep white for camera overlay
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
    backgroundColor: theme.colors.overlay, // Use theme overlay
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  sideButtonActive: {
    backgroundColor: `${theme.colors.accent}30`, // Use theme accent with 30% opacity
    borderWidth: 2,
    borderColor: theme.colors.accent, // Use theme accent
  },
  terminatorButtonActive: {
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    borderWidth: 2,
    borderColor: '#00FF00',
  },
  terminatorIcon: {
    fontSize: 20,
    fontWeight: 'bold',
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
    backgroundColor: 'white', // Keep white for camera capture button
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.8)', // Keep as is for camera
  },
  captureButtonActive: {
    transform: [{ scale: 0.9 }],
    opacity: 0.8,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white', // Keep white for camera capture button
  },
  wardrobeOverlay: {
    position: 'absolute',
    bottom: 140,
    left: 20,
    right: 20,
    backgroundColor: theme.colors.overlay, // Use theme overlay
    borderRadius: 8,
    padding: 12,
    zIndex: 2,
  },
  overlayText: {
    color: 'white', // Keep white for camera overlay
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  overlaySubtext: {
    color: 'rgba(255, 255, 255, 0.8)', // Keep as is for camera overlay
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  processingText: {
    color: 'white', // Keep white for camera overlay
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
});

// CRITICAL FIX: Main wrapper component with crash protection
export const CameraScreen: React.FC<CameraScreenProps> = (props) => {
  // Global error boundary for Terminator crashes
  useEffect(() => {
    const originalHandler = (globalThis as any).ErrorUtils?.getGlobalHandler();
    
    const crashHandler = (error: any, isFatal?: boolean) => {
      if (error?.message?.includes('stringPrototypeCharCodeAt') || 
          error?.message?.includes('GeneratorInnerFunction') ||
          error?.message?.includes('memmove')) {
        console.error('CRITICAL: Hermes engine crash detected in Terminator camera');
        emergencyFlags.reportCrash('terminator');
      }
      
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    };
    
    (globalThis as any).ErrorUtils?.setGlobalHandler(crashHandler);
    
    return () => {
      if (originalHandler) {
        (globalThis as any).ErrorUtils?.setGlobalHandler(originalHandler);
      }
    };
  }, []);

  return (
    <TerminatorProvider>
      <CameraScreenInternal {...props} />
    </TerminatorProvider>
  );
};

export default CameraScreen; 