import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CameraControlsProps {
  onCapture: () => void;
  onCancel: () => void;
  onToggleFlash: () => void;
  onToggleCamera: () => void;
  onToggleGrid: () => void;
  onShowSettings: () => void;
  isCapturing: boolean;
  flashMode: 'on' | 'off' | 'auto';
  showGrid: boolean;
  mode: 'wardrobe' | 'profile' | 'outfit';
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  onCapture,
  onCancel,
  onToggleFlash,
  onToggleCamera,
  onToggleGrid,
  onShowSettings,
  isCapturing,
  flashMode,
  showGrid,
  mode,
}) => {
  return (
    <View style={styles.container}>
      {/* Top controls */}
      <View style={styles.topControls}>
        <TouchableOpacity onPress={onCancel} style={styles.topButton}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.topCenterControls}>
          <TouchableOpacity onPress={onToggleFlash} style={styles.topButton}>
            <Ionicons 
              name={flashMode === 'on' ? 'flash' : flashMode === 'off' ? 'flash-off' : 'flash-outline'} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={onToggleGrid} style={styles.topButton}>
            <Ionicons 
              name={showGrid ? 'grid' : 'grid-outline'} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={onShowSettings} style={styles.topButton}>
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={onToggleCamera} style={styles.topButton}>
          <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        {/* Left side - Gallery preview (placeholder) */}
        <View style={styles.galleryPreview}>
          {/* TODO: Add gallery preview thumbnail */}
        </View>

        {/* Center - Capture button */}
        <TouchableOpacity
          onPress={onCapture}
          disabled={isCapturing}
          style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
        >
          <View style={styles.captureButtonInner}>
            {isCapturing && (
              <View style={styles.capturingIndicator} />
            )}
          </View>
        </TouchableOpacity>

        {/* Right side - Mode indicator */}
        <View style={styles.modeIndicator}>
          <Ionicons 
            name={
              mode === 'wardrobe' ? 'shirt-outline' : 
              mode === 'profile' ? 'person-outline' : 
              'people-outline'
            } 
            size={24} 
            color="#fff" 
          />
        </View>
      </View>
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
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  topCenterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  galleryPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  capturingIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ff4444',
  },
  modeIndicator: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 