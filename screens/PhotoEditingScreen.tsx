import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PhotoEditingToolbar } from './components/PhotoEditingToolbar';
import { usePhotoEditor } from '../hooks/usePhotoEditor';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PhotoEditingScreenProps {
  photoUri: string;
  onSave: (editedPhotoUri: string) => void;
  onRetake: () => void;
  mode: 'wardrobe' | 'profile';
}

export const PhotoEditingScreen: React.FC<PhotoEditingScreenProps> = ({
  photoUri,
  onSave,
  onRetake,
  mode = 'wardrobe',
}) => {
  
  const {
    editingState,
    setCurrentTool,
    applyCrop,
    applyAdjustments,
    applyEnhancement,
    removeBackground,
    undo,
    redo,
    resetToOriginal,
    saveEditedPhoto,
  } = usePhotoEditor(photoUri);

  const [isProcessing, setIsProcessing] = useState(false);

  const handleSave = async () => {
    try {
      setIsProcessing(true);
      const finalPhotoUri = await saveEditedPhoto();
      onSave(finalPhotoUri);
    } catch (error) {
      console.error('Failed to save edited photo:', error);
      Alert.alert('Error', 'Failed to save edited photo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    Alert.alert(
      'Retake Photo',
      'Are you sure you want to retake this photo? Your edits will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retake', style: 'destructive', onPress: onRetake },
      ]
    );
  };

  const handleToolSelect = (tool: 'crop' | 'adjust' | 'enhance' | 'background') => {
    setCurrentTool(tool);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onRetake} style={styles.headerButton}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {mode === 'wardrobe' ? 'Edit Wardrobe Item' : 'Edit Profile Photo'}
        </Text>
        
        <TouchableOpacity onPress={handleSave} style={styles.headerButton} disabled={isProcessing}>
          <Text style={styles.saveButtonText}>
            {isProcessing ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Photo Preview */}
      <View style={styles.photoContainer}>
        <Image
          source={{ uri: editingState.currentUri }}
          style={styles.photo}
          resizeMode="contain"
        />
        
        {/* Tool-specific overlays */}
        {editingState.currentTool === 'crop' && (
          <View style={styles.cropOverlay}>
            {/* TODO: Implement crop overlay with draggable handles */}
            <Text style={styles.overlayText}>Drag to crop</Text>
          </View>
        )}
        
        {editingState.currentTool === 'adjust' && (
          <View style={styles.adjustOverlay}>
            {/* TODO: Implement adjustment sliders overlay */}
            <Text style={styles.overlayText}>Adjust brightness, contrast, etc.</Text>
          </View>
        )}
      </View>

      {/* Editing Toolbar */}
      <PhotoEditingToolbar
        currentTool={editingState.currentTool}
        onToolSelect={handleToolSelect}
        onUndo={undo}
        onRedo={redo}
        onReset={resetToOriginal}
        canUndo={editingState.editHistory.length > 0}
        canRedo={false} // TODO: Implement redo functionality
      />

      {/* Tool-specific controls */}
      <ScrollView style={styles.toolControls} showsVerticalScrollIndicator={false}>
        {editingState.currentTool === 'crop' && (
          <View style={styles.cropControls}>
            <Text style={styles.toolTitle}>Crop & Rotate</Text>
            
            <View style={styles.aspectRatioButtons}>
              <TouchableOpacity style={styles.aspectRatioButton}>
                <Text style={styles.aspectRatioText}>1:1</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.aspectRatioButton}>
                <Text style={styles.aspectRatioText}>4:3</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.aspectRatioButton}>
                <Text style={styles.aspectRatioText}>16:9</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.aspectRatioButton}>
                <Text style={styles.aspectRatioText}>Free</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.rotationButtons}>
              <TouchableOpacity style={styles.rotationButton}>
                <Ionicons name="arrow-back-circle" size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.rotationButton}>
                <Ionicons name="arrow-forward-circle" size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.rotationButton}>
                <Ionicons name="swap-horizontal" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {editingState.currentTool === 'adjust' && (
          <View style={styles.adjustControls}>
            <Text style={styles.toolTitle}>Adjustments</Text>
            
            {/* TODO: Implement adjustment sliders */}
            <Text style={styles.comingSoon}>Adjustment sliders coming soon</Text>
          </View>
        )}

        {editingState.currentTool === 'enhance' && (
          <View style={styles.enhanceControls}>
            <Text style={styles.toolTitle}>Auto Enhance</Text>
            
            <TouchableOpacity style={styles.enhanceButton}>
              <Ionicons name="sparkles" size={24} color="#007AFF" />
              <Text style={styles.enhanceButtonText}>Auto Enhance</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.enhanceButton}>
              <Ionicons name="color-palette" size={24} color="#007AFF" />
              <Text style={styles.enhanceButtonText}>Color Correction</Text>
            </TouchableOpacity>
          </View>
        )}

        {editingState.currentTool === 'background' && (
          <View style={styles.backgroundControls}>
            <Text style={styles.toolTitle}>Background</Text>
            
            <TouchableOpacity style={styles.backgroundButton}>
              <Ionicons name="cut" size={24} color="#007AFF" />
              <Text style={styles.backgroundButtonText}>Remove Background</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.backgroundButton}>
              <Ionicons name="color-filter" size={24} color="#007AFF" />
              <Text style={styles.backgroundButtonText}>Blur Background</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity onPress={handleRetake} style={styles.retakeButton}>
          <Ionicons name="camera-reverse" size={20} color="#FF3B30" />
          <Text style={styles.retakeButtonText}>Retake</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
  },
  photoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  photo: {
    width: screenWidth,
    height: screenWidth,
  },
  cropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
  },
  toolControls: {
    maxHeight: 200,
    backgroundColor: '#1C1C1E',
  },
  toolTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  cropControls: {
    padding: 20,
  },
  aspectRatioButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  aspectRatioButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
  },
  aspectRatioText: {
    color: '#fff',
    fontSize: 14,
  },
  rotationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rotationButton: {
    padding: 12,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
  },
  adjustControls: {
    padding: 20,
  },
  comingSoon: {
    color: '#8E8E93',
    textAlign: 'center',
    fontSize: 16,
  },
  enhanceControls: {
    padding: 20,
  },
  enhanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  enhanceButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  backgroundControls: {
    padding: 20,
  },
  backgroundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  backgroundButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  bottomActions: {
    padding: 20,
    alignItems: 'center',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  retakeButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default PhotoEditingScreen; 