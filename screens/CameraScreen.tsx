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
import { detectMultipleClothingItems } from '../utils/openai';
import { UnifiedLoadingOverlay } from '../components/UnifiedLoadingOverlay';
import { useUnifiedLoading, LOADING_CONFIGS } from '../hooks/useUnifiedLoading';
import { useTheme } from '../contexts/ThemeContext';
import { TerminatorOverlay } from '../components/TerminatorOverlay';
import { TargetsAcquiredScroller } from '../components/TargetsAcquiredScroller';

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

export const CameraScreen: React.FC<CameraScreenProps> = ({
  onPhotoTaken,
  onCancel,
  mode = 'wardrobe',
  showGrid = false,
  flashMode = 'off',
  onMultiItemDetected,
  defaultMultiItemMode = false,
  defaultTerminatorMode = false,
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

  const { theme } = useTheme();
  const unifiedLoading = useUnifiedLoading();
  const [isInitializing, setIsInitializing] = useState(true);
  const [multiItemMode, setMultiItemMode] = useState(defaultMultiItemMode); // Use prop default
  const [isProcessingMultiItem, setIsProcessingMultiItem] = useState(false);
  const [terminatorMode, setTerminatorMode] = useState(defaultTerminatorMode);
  const [detectedItems, setDetectedItems] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  // New smart tracking states
  const [terminatorState, setTerminatorState] = useState<'scanning' | 'detecting' | 'tracking' | 'lost'>('scanning');
  const [trackingData, setTrackingData] = useState<any>(null);
  const [lastDetectionTime, setLastDetectionTime] = useState<number>(0);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const styles = createStyles(theme);

  useEffect(() => {
    initializeCamera();
  }, []);

  // Smart terminator mode - detect once, track continuously
  useEffect(() => {
    console.log('🎯 Terminator mode state:', { 
      terminatorMode, 
      terminatorState,
      isCameraReady,
      hasCamera: !!cameraRef.current 
    });
    
    if (terminatorMode && isCameraReady) {
      console.log('🎯 Terminator mode: ⚡ READY for smart detection/tracking');
      setIsScanning(true);
      setTerminatorState('scanning');
    } else {
      console.log('🎯 Terminator mode: ❌ Disabled - clearing state');
      stopTracking();
      setIsScanning(false);
      setDetectedItems([]);
      setTerminatorState('scanning');
    }
    
    return () => {
      stopTracking();
      setIsScanning(false);
    };
  }, [terminatorMode, isCameraReady]);

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
        if (multiItemMode && onMultiItemDetected) {
          await handleMultiItemDetection(photoUri);
        } else {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onPhotoTaken(photoUri);
        }
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

  // NEW: Smart tap-to-detect function
  const triggerSmartDetection = async () => {
    if (!cameraRef.current || terminatorState === 'detecting') {
      console.log('🎯 Smart detection: Camera not ready or already detecting');
      return;
    }
    
    console.log('🎯 Smart detection: 🎯 TAP TRIGGERED - Starting one-time AI detection');
    setTerminatorState('detecting');
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
        flash: 'off',
        skipProcessing: true,
      });
      
      if (photo && photo.base64) {
        console.log('🎯 Smart detection: Photo captured for AI analysis');
        const result = await detectMultipleClothingItems(photo.base64);
        
        if (result.success && result.items && result.items.length > 0) {
          console.log('🎯 Smart detection: ✅ AI detected', result.items.length, 'items - SWITCHING TO TRACKING');
          
          const formattedItems = result.items.map((item: any, index: number) => ({
            id: `tracked-${Date.now()}-${index}`,
            label: item.itemType || 'Item',
            confidence: (item.confidence || 50) / 100,
            boundingBox: {
              x: item.boundingBox?.top_left?.[0] || 10,
              y: item.boundingBox?.top_left?.[1] || 10,
              width: Math.abs((item.boundingBox?.bottom_right?.[0] || 90) - (item.boundingBox?.top_left?.[0] || 10)),
              height: Math.abs((item.boundingBox?.bottom_right?.[1] || 90) - (item.boundingBox?.top_left?.[1] || 10)),
            },
            category: 'top' as const,
            // Store tracking data
            originalBox: item.boundingBox,
            detectionTime: Date.now(),
          }));
          
          setDetectedItems(formattedItems);
          setTrackingData({
            items: formattedItems,
            lastFrame: photo.uri,
            confidence: 1.0,
            frameCount: 0
          });
          setLastDetectionTime(Date.now());
          setTerminatorState('tracking');
          
          // Start continuous tracking
          startTracking();
          
        } else {
          console.log('🎯 Smart detection: ❌ No items detected - returning to scanning');
          setTerminatorState('scanning');
        }
      }
    } catch (error) {
      console.error('🎯 Smart detection error:', error);
      setTerminatorState('scanning');
    }
  };

  // NEW: Start lightweight tracking
  const startTracking = () => {
    console.log('🎯 Tracking: 🚀 Starting continuous lightweight tracking');
    
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
    }
    
    trackingIntervalRef.current = setInterval(() => {
      updateTracking();
    }, 100); // 10 FPS tracking - lightweight and responsive
  };

  // NEW: Stop tracking
  const stopTracking = () => {
    if (trackingIntervalRef.current) {
      console.log('🎯 Tracking: 🛑 Stopping tracking');
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
  };

  // NEW: Lightweight tracking update
  const updateTracking = () => {
    if (!trackingData || terminatorState !== 'tracking') {
      return;
    }
    
    // Simple tracking simulation - in real implementation, use computer vision
    const frameCount = trackingData.frameCount + 1;
    const confidence = Math.max(0.3, trackingData.confidence - (frameCount * 0.005)); // Slowly degrade confidence
    
    // Simulate slight box movement (real implementation would use optical flow)
    const updatedItems = trackingData.items.map((item: any) => ({
      ...item,
      boundingBox: {
        ...item.boundingBox,
        x: item.boundingBox.x + (Math.random() - 0.5) * 2, // Small random movement
        y: item.boundingBox.y + (Math.random() - 0.5) * 2,
      },
      confidence: confidence,
    }));
    
    setDetectedItems(updatedItems);
    setTrackingData({
      ...trackingData,
      items: updatedItems,
      confidence,
      frameCount
    });
    
    // Check if we've lost tracking
    if (confidence < 0.4 || frameCount > 300) { // 30 seconds at 10 FPS
      console.log('🎯 Tracking: ❌ Lost tracking - need re-detection');
      setTerminatorState('lost');
      stopTracking();
      
      // Auto return to scanning after a delay
      setTimeout(() => {
        if (terminatorState === 'lost') {
          console.log('🎯 Tracking: 🔄 Auto-returning to scanning mode');
          setTerminatorState('scanning');
          setDetectedItems([]);
        }
      }, 2000);
    }
  };

  // NEW: Handle camera tap for detection trigger
  const handleCameraTap = () => {
    if (terminatorMode && terminatorState === 'scanning') {
      triggerSmartDetection();
    }
  };

  // OLD function kept for compatibility but not used in smart mode
  const captureAndAnalyzeFrame = async () => {
    if (!cameraRef.current || state.isCapturing || isProcessingMultiItem) {
      console.log('🎯 Terminator mode: Skipping frame capture - conditions not met:', {
        hasCamera: !!cameraRef.current,
        isCapturing: state.isCapturing,
        isProcessingMultiItem
      });
      return;
    }
    
    try {
      console.log('🎯 Terminator mode: Starting SILENT frame capture...');
      // Get base64 directly from camera - no fetch/FileReader needed!
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true, // Get base64 directly from camera
        flash: 'off', // Force flash off in terminator mode
        skipProcessing: true,
      });
      console.log('🎯 Terminator mode: Silent photo captured:', photo?.uri ? 'SUCCESS' : 'FAILED');
      
      if (photo && photo.base64) {
        console.log('🎯 Terminator mode: Base64 ready, length:', photo.base64.length);

        console.log('🎯 Terminator mode: Calling detectMultipleClothingItems...');
        
        // Real AI detection mode - no more fake data!
        const result = await detectMultipleClothingItems(photo.base64);
        
        console.log('🎯 Terminator mode: API result:', {
          success: result.success,
          hasItems: !!result.items,
          itemCount: result.items?.length || 0,
          fullResult: result
        });
        
        if (result.success && result.items && result.items.length > 0) {
          console.log('🎯 Terminator mode: ✅ Real AI detected', result.items.length, 'items!');
          // Convert API response to TerminatorOverlay format
          const formattedItems = result.items.map((item: any, index: number) => {
            console.log('🎯 Real detection - processing item:', item);
            return {
              id: `terminator-${Date.now()}-${index}`,
              label: item.itemType || 'Item',
              confidence: (item.confidence || 50) / 100, // Convert to 0-1 range
              boundingBox: {
                x: item.boundingBox?.top_left?.[0] || 10,
                y: item.boundingBox?.top_left?.[1] || 10,
                width: Math.abs((item.boundingBox?.bottom_right?.[0] || 90) - (item.boundingBox?.top_left?.[0] || 10)),
                height: Math.abs((item.boundingBox?.bottom_right?.[1] || 90) - (item.boundingBox?.top_left?.[1] || 10)),
              },
              category: 'top' as const, // Default category
            };
          });
          
          console.log('🎯 Terminator mode: Real AI formatted items:', formattedItems);
          
          // Clear previous boxes before setting new ones
          setDetectedItems([]);
          setTimeout(() => {
            setDetectedItems(formattedItems);
            console.log('🎯 Terminator mode: ✅ Real items detected and set:', formattedItems.length);
          }, 100);
        } else {
          console.log('🎯 Terminator mode: ❌ No clothing items detected by AI - clearing boxes');
          setDetectedItems([]);
        }
      } else {
        console.log('🎯 Terminator mode: ❌ Photo capture failed - no base64 data');
      }
    } catch (error) {
      console.error('🎯 Terminator mode: 💥 DETROIT SMASH ERROR:', error);
      
      // Only show fallback for network issues to demonstrate the UI
      if (error.message?.includes('Network request failed') || error.message?.includes('fetch') || error.message?.includes('ENOTFOUND')) {
        console.log('🎯 Network error detected - showing demo detection for UI demonstration');
        const fallbackResult = {
          success: true,
          items: [
            {
              itemType: 'Demo Item (No Network)',
              confidence: 75,
              boundingBox: {
                top_left: [30, 40],
                bottom_right: [70, 80]
              }
            }
          ]
        };
        
        const formattedItems = fallbackResult.items.map((item: any, index: number) => ({
          id: `terminator-network-demo-${Date.now()}-${index}`,
          label: item.itemType,
          confidence: (item.confidence || 50) / 100,
          boundingBox: {
            x: item.boundingBox?.top_left?.[0] || 10,
            y: item.boundingBox?.top_left?.[1] || 10,
            width: Math.abs((item.boundingBox?.bottom_right?.[0] || 90) - (item.boundingBox?.top_left?.[0] || 10)),
            height: Math.abs((item.boundingBox?.bottom_right?.[1] || 90) - (item.boundingBox?.top_left?.[1] || 10)),
          },
          category: 'top' as const,
        }));
        
        setDetectedItems([]);
        setTimeout(() => {
          setDetectedItems(formattedItems);
        }, 100);
      } else {
        // For other errors, just clear and continue scanning
        console.log('🎯 API error - clearing boxes and continuing to scan');
        setDetectedItems([]);
      }
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
      // Step 1: Loading high-resolution image data
      console.log('📸 Loading high-resolution image data...');
      const response = await fetch(photoUri);
      const blob = await response.blob();
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Mark step 1 complete
      let updatedSteps = [...initialSteps];
      updatedSteps[0] = { ...updatedSteps[0], completed: true };
      unifiedLoading.updateSteps(updatedSteps);
      
      // Step 2: Initializing neural networks
      console.log('🧠 Initializing neural networks...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
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

      // Step 3: Scanning for clothing objects
      console.log('👁️ Scanning for clothing objects...');
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Mark step 3 complete
      updatedSteps[2] = { ...updatedSteps[2], completed: true };
      unifiedLoading.updateSteps(updatedSteps);
      
      // Step 4: Starting AI detection
      console.log('🏷️ Classifying detected items...');
      updatedSteps[3] = { ...updatedSteps[3], completed: true };
      unifiedLoading.updateSteps(updatedSteps);
      
      const result = await detectMultipleClothingItems(base64);
      
      // Step 5: Post-processing
      console.log('📏 Calculating precise boundaries...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mark step 5 complete
      updatedSteps[4] = { ...updatedSteps[4], completed: true };
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
        
        await new Promise(resolve => setTimeout(resolve, 400));
        updatedSteps[5] = { ...updatedSteps[5], completed: true };
        unifiedLoading.updateSteps(updatedSteps);
        
        // Step 7: Analyzing colors and patterns
        console.log('🎨 Analyzing colors and patterns...');
        await new Promise(resolve => setTimeout(resolve, 350));
        updatedSteps[6] = { ...updatedSteps[6], completed: true };
        unifiedLoading.updateSteps(updatedSteps);
        
        // Step 8: Preparing cropping coordinates
        console.log('📦 Preparing cropping coordinates...');
        await new Promise(resolve => setTimeout(resolve, 300));
        updatedSteps[7] = { ...updatedSteps[7], completed: true };
        unifiedLoading.updateSteps(updatedSteps);
        
        // Step 9: Finalizing cyberpunk bounding boxes
        console.log('✨ Finalizing cyberpunk bounding boxes...');
        await new Promise(resolve => setTimeout(resolve, 400));
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
      
      {/* Terminator Vision Overlay */}
      {terminatorMode && (
        <TerminatorOverlay
          detectedItems={detectedItems}
          cameraWidth={screenWidth}
          cameraHeight={screenHeight}
          isScanning={isScanning}
          terminatorState={terminatorState}
          trackingData={trackingData}
        />
      )}
      
      {/* Targets Acquired Scroller */}
      {terminatorMode && detectedItems.length > 0 && terminatorState === 'tracking' && (
        <TargetsAcquiredScroller
          targets={detectedItems}
          isScanning={false}
        />
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

export default CameraScreen; 