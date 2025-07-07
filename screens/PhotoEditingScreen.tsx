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
import { BoundingBoxOverlay } from '../components/BoundingBoxOverlay';
import { cropMultipleItems, getImageDimensions } from '../utils/imageCropping';
import { useTheme } from '../contexts/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DetectedItem {
  id: number;
  itemType: string;
  description: string;
  boundingBox: {
    top_left: [number, number];
    bottom_right: [number, number];
  };
  confidence: number;
  suitable: boolean;
  reason: string;
  uniqueFeatures?: string;
  originalImageUri?: string;
  isPair?: boolean;
  pairAnalysis?: string;
}

interface PhotoEditingScreenProps {
  photoUri: string;
  onSave: (editedPhotoUri: string) => void;
  onRetake: () => void;
  mode: 'wardrobe' | 'profile';
  multiItemMode?: boolean;
  detectedItems?: DetectedItem[];
  onMultiItemSave?: (croppedItems: any[]) => void;
}

export const PhotoEditingScreen: React.FC<PhotoEditingScreenProps> = ({
  photoUri,
  onSave,
  onRetake,
  mode = 'wardrobe',
  multiItemMode = false,
  detectedItems = [],
  onMultiItemSave,
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
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(multiItemMode);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [croppedItems, setCroppedItems] = useState<any[]>([]);
  const [imageSize, setImageSize] = useState({ width: 1024, height: 1024 });
  
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const handleSave = async () => {
    try {
      setIsProcessing(true);
      
      console.log('🔍 [PHOTO-EDITOR] handleSave called:', {
        multiItemMode,
        detectedItemsLength: detectedItems.length,
        hasOnMultiItemSave: !!onMultiItemSave
      });
      
      if (multiItemMode && detectedItems.length > 0) {
        console.log('🔄 [PHOTO-EDITOR] Calling handleMultiItemSave...');
        await handleMultiItemSave();
      } else {
        console.log('🔄 [PHOTO-EDITOR] Calling single item save...');
        const finalPhotoUri = await saveEditedPhoto();
        onSave(finalPhotoUri);
      }
    } catch (error) {
      console.error('❌ [PHOTO-EDITOR] Failed to save edited photo:', error);
      Alert.alert('Error', 'Failed to save edited photo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMultiItemSave = async () => {
    if (!onMultiItemSave) {
      console.error('❌ [PHOTO-EDITOR] Multi-item save handler not provided');
      Alert.alert('Error', 'Multi-item save handler not provided.');
      return;
    }

    console.log('🔍 [PHOTO-EDITOR] Processing multiple items for cropping...');
    console.log('📋 [PHOTO-EDITOR] Detected items to crop:', detectedItems.length);
    
    try {
      const croppedResults = await cropMultipleItems(
        photoUri,
        detectedItems,
        imageSize.width,
        imageSize.height
      );

      console.log('🎯 [PHOTO-EDITOR] Crop results:', {
        croppedCount: croppedResults.length,
        originalCount: detectedItems.length
      });

      if (croppedResults.length === 0) {
        console.error('❌ [PHOTO-EDITOR] No items were successfully cropped');
        Alert.alert('Error', 'Failed to crop any items. Please try again.');
        return;
      }

      console.log(`✅ [PHOTO-EDITOR] Successfully cropped ${croppedResults.length} items, calling onMultiItemSave...`);
      onMultiItemSave(croppedResults);
    } catch (error) {
      console.error('❌ [PHOTO-EDITOR] Error in cropMultipleItems:', error);
      Alert.alert('Error', 'Failed to process items. Please try again.');
    }
  };

  const handleItemSelect = async (item: DetectedItem) => {
    try {
      console.log(`🎯 Selected item: ${item.itemType} - ${item.description}`);
      
      // Crop the individual item immediately
      const croppedResult = await cropMultipleItems(
        photoUri,
        [item], // Only crop the selected item
        imageSize.width,
        imageSize.height
      );

      if (croppedResult.length > 0) {
        console.log(`✅ Successfully cropped selected item: ${item.itemType}`);
        
        // Show the cropped result or save it
        // For now, let's save it directly to the wardrobe
        if (onMultiItemSave) {
          onMultiItemSave(croppedResult);
        }
      } else {
        Alert.alert('Error', 'Failed to crop the selected item. Please try again.');
      }
    } catch (error) {
      console.error('❌ Failed to crop selected item:', error);
      Alert.alert('Error', 'Failed to crop the selected item.');
    }
  };

  const handleShowBoundingBoxes = () => {
    setShowBoundingBoxes(true);
  };

  // Load image dimensions when component mounts
  React.useEffect(() => {
    if (multiItemMode) {
      getImageDimensions(photoUri).then(setImageSize);
    }
  }, [multiItemMode, photoUri]);

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
          {multiItemMode 
            ? `Multi-Item (${detectedItems.length} found)` 
            : mode === 'wardrobe' ? 'Edit Wardrobe Item' : 'Edit Profile Photo'
          }
        </Text>
        
        <TouchableOpacity onPress={handleSave} style={styles.headerButton} disabled={isProcessing}>
          <Text style={styles.saveButtonText}>
            {isProcessing 
              ? (multiItemMode ? 'Processing...' : 'Saving...') 
              : (multiItemMode ? 'Save All' : 'Save')
            }
          </Text>
        </TouchableOpacity>
      </View>

      {/* Photo Preview */}
      <View style={styles.photoContainer}>
        {multiItemMode && showBoundingBoxes ? (
          // Show full-screen bounding box overlay
          <BoundingBoxOverlay
            imageUri={photoUri}
            detectedItems={detectedItems}
            onItemSelect={handleItemSelect}
            visible={true}
            imageWidth={imageSize.width}
            imageHeight={imageSize.height}
          />
        ) : (
          <Image
            source={{ uri: editingState.currentUri }}
            style={styles.photo}
            resizeMode="contain"
            onLoad={(event) => {
              const { width, height } = event.nativeEvent.source;
              setImageSize({ width, height });
            }}
          />
        )}
        
        {/* Tool-specific overlays */}
        {!multiItemMode && editingState.currentTool === 'crop' && (
          <View style={styles.cropOverlay}>
            {/* TODO: Implement crop overlay with draggable handles */}
            <Text style={styles.overlayText}>Drag to crop</Text>
          </View>
        )}
        
        {!multiItemMode && editingState.currentTool === 'adjust' && (
          <View style={styles.adjustOverlay}>
            {/* TODO: Implement adjustment sliders overlay */}
            <Text style={styles.overlayText}>Adjust brightness, contrast, etc.</Text>
          </View>
        )}
      </View>

      {/* Multi-item controls or standard editing toolbar */}
      {multiItemMode ? (
        <View style={styles.multiItemControls}>
          {!showBoundingBoxes ? (
            <TouchableOpacity 
              style={styles.multiItemButton}
              onPress={handleShowBoundingBoxes}
            >
              <Ionicons name="scan" size={20} color="#007AFF" />
              <Text style={styles.multiItemButtonText}>Show Detected Items</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.multiItemButton, styles.backButton]}
              onPress={() => setShowBoundingBoxes(false)}
            >
              <Ionicons name="arrow-back" size={20} color="white" />
              <Text style={[styles.multiItemButtonText, { color: 'white' }]}>Back to Preview</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.multiItemInfo}>
            <Text style={styles.multiItemInfoText}>
              {detectedItems.length} items detected
            </Text>
            <Text style={styles.multiItemInfoSubtext}>
              {showBoundingBoxes 
                ? "Tap any detected item to select it" 
                : 'Tap "Save All" to crop and save each item'
              }
            </Text>
            {/* Show shoe pair summary if any pairs detected */}
            {detectedItems.some(item => item.isPair) && (
              <Text style={styles.pairSummaryText}>
                👟 {detectedItems.filter(item => item.isPair).length} shoe pair{detectedItems.filter(item => item.isPair).length !== 1 ? 's' : ''} automatically grouped
              </Text>
            )}
          </View>
        </View>
      ) : (
        <PhotoEditingToolbar
          currentTool={editingState.currentTool}
          onToolSelect={handleToolSelect}
          onUndo={undo}
          onRedo={redo}
          onReset={resetToOriginal}
          canUndo={editingState.editHistory.length > 0}
          canRedo={false} // TODO: Implement redo functionality
        />
      )}

      {/* Tool-specific controls - hidden in multi-item mode */}
      {!multiItemMode && (
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
      )}

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

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.mode === 'dark' ? '#000000' : '#F8F9FA',
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
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  saveButtonText: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  photoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: theme.colors.background,
    marginHorizontal: 10,
    marginVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: screenWidth - 20,
    height: screenHeight * 0.6,
    maxHeight: screenHeight - 250,
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
  multiItemControls: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    minHeight: 120,
  },
  multiItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary + '20',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  backButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  multiItemButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  multiItemInfo: {
    alignItems: 'center',
  },
  multiItemInfoText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  multiItemInfoSubtext: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  pairSummaryText: {
    color: theme.colors.success,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
  },
});

export default PhotoEditingScreen; 