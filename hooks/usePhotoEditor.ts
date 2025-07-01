import { useState, useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

interface EditAction {
  id: string;
  type: 'crop' | 'adjust' | 'enhance' | 'background';
  data: any;
  timestamp: Date;
}

interface EditingState {
  originalUri: string;
  currentUri: string;
  editHistory: EditAction[];
  currentTool: 'crop' | 'adjust' | 'enhance' | 'background';
  cropData: any;
  adjustments: any;
  isProcessing: boolean;
}

interface ColorAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  temperature: number;
}

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export const usePhotoEditor = (originalPhotoUri: string) => {
  const [editingState, setEditingState] = useState<EditingState>({
    originalUri: originalPhotoUri,
    currentUri: originalPhotoUri,
    editHistory: [],
    currentTool: 'crop',
    cropData: null,
    adjustments: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      temperature: 0,
    },
    isProcessing: false,
  });

  const setCurrentTool = useCallback((tool: 'crop' | 'adjust' | 'enhance' | 'background') => {
    setEditingState(prev => ({
      ...prev,
      currentTool: tool,
    }));
  }, []);

  const addEditAction = useCallback((action: Omit<EditAction, 'id' | 'timestamp'>) => {
    const newAction: EditAction = {
      ...action,
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    setEditingState(prev => ({
      ...prev,
      editHistory: [...prev.editHistory, newAction],
    }));
  }, []);

  const applyCrop = useCallback(async (cropData: CropData) => {
    try {
      setEditingState(prev => ({ ...prev, isProcessing: true }));

      const manipulatedImage = await manipulateAsync(
        editingState.currentUri,
        [
          {
            crop: {
              originX: cropData.x,
              originY: cropData.y,
              width: cropData.width,
              height: cropData.height,
            },
          },
          {
            rotate: cropData.rotation,
          },
        ],
        {
          compress: 0.9,
          format: SaveFormat.JPEG,
        }
      );

      const newUri = manipulatedImage.uri;
      
      setEditingState(prev => ({
        ...prev,
        currentUri: newUri,
        cropData,
        isProcessing: false,
      }));

      addEditAction({
        type: 'crop',
        data: cropData,
      });

      return newUri;
    } catch (error) {
      console.error('Crop operation failed:', error);
      setEditingState(prev => ({ ...prev, isProcessing: false }));
      throw error;
    }
  }, [editingState.currentUri, addEditAction]);

  const applyAdjustments = useCallback(async (adjustments: ColorAdjustments) => {
    try {
      setEditingState(prev => ({ ...prev, isProcessing: true }));

      const manipulations = [];
      
      if (adjustments.brightness !== 0) {
        manipulations.push({ brightness: 1 + adjustments.brightness / 100 });
      }
      if (adjustments.contrast !== 0) {
        manipulations.push({ contrast: 1 + adjustments.contrast / 100 });
      }
      if (adjustments.saturation !== 0) {
        manipulations.push({ saturation: 1 + adjustments.saturation / 100 });
      }

      if (manipulations.length > 0) {
        const manipulatedImage = await manipulateAsync(
          editingState.currentUri,
          manipulations,
          {
            compress: 0.9,
            format: SaveFormat.JPEG,
          }
        );

        const newUri = manipulatedImage.uri;
        
        setEditingState(prev => ({
          ...prev,
          currentUri: newUri,
          adjustments,
          isProcessing: false,
        }));

        addEditAction({
          type: 'adjust',
          data: adjustments,
        });

        return newUri;
      }

      setEditingState(prev => ({ ...prev, isProcessing: false }));
      return editingState.currentUri;
    } catch (error) {
      console.error('Adjustment operation failed:', error);
      setEditingState(prev => ({ ...prev, isProcessing: false }));
      throw error;
    }
  }, [editingState.currentUri, addEditAction]);

  const applyEnhancement = useCallback(async (enhancementType: 'auto' | 'color') => {
    try {
      setEditingState(prev => ({ ...prev, isProcessing: true }));

      let manipulations = [];
      
      if (enhancementType === 'auto') {
        // Auto-enhance: slight brightness, contrast, and saturation boost
        manipulations = [
          { brightness: 1.1 },
          { contrast: 1.05 },
          { saturation: 1.1 },
        ];
      } else if (enhancementType === 'color') {
        // Color correction: temperature adjustment
        manipulations = [
          { saturation: 1.15 },
        ];
      }

      const manipulatedImage = await manipulateAsync(
        editingState.currentUri,
        manipulations,
        {
          compress: 0.9,
          format: SaveFormat.JPEG,
        }
      );

      const newUri = manipulatedImage.uri;
      
      setEditingState(prev => ({
        ...prev,
        currentUri: newUri,
        isProcessing: false,
      }));

      addEditAction({
        type: 'enhance',
        data: { enhancementType },
      });

      return newUri;
    } catch (error) {
      console.error('Enhancement operation failed:', error);
      setEditingState(prev => ({ ...prev, isProcessing: false }));
      throw error;
    }
  }, [editingState.currentUri, addEditAction]);

  const removeBackground = useCallback(async () => {
    try {
      setEditingState(prev => ({ ...prev, isProcessing: true }));

      // TODO: Implement background removal
      // This would typically involve calling an AI service
      // For now, we'll just return the current image
      
      addEditAction({
        type: 'background',
        data: { action: 'remove' },
      });

      setEditingState(prev => ({ ...prev, isProcessing: false }));
      return editingState.currentUri;
    } catch (error) {
      console.error('Background removal failed:', error);
      setEditingState(prev => ({ ...prev, isProcessing: false }));
      throw error;
    }
  }, [editingState.currentUri, addEditAction]);

  const undo = useCallback(() => {
    setEditingState(prev => {
      if (prev.editHistory.length === 0) return prev;

      const newHistory = prev.editHistory.slice(0, -1);
      const lastAction = prev.editHistory[prev.editHistory.length - 1];

      // TODO: Implement proper undo by reverting the last action
      // For now, we'll just remove the last action from history
      
      return {
        ...prev,
        editHistory: newHistory,
      };
    });
  }, []);

  const redo = useCallback(() => {
    // TODO: Implement redo functionality
    console.log('Redo not implemented yet');
  }, []);

  const resetToOriginal = useCallback(() => {
    setEditingState(prev => ({
      ...prev,
      currentUri: prev.originalUri,
      editHistory: [],
      cropData: null,
      adjustments: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        temperature: 0,
      },
    }));
  }, []);

  const saveEditedPhoto = useCallback(async (): Promise<string> => {
    try {
      // Create a final optimized version
      const finalImage = await manipulateAsync(
        editingState.currentUri,
        [], // No additional manipulations
        {
          compress: 0.9,
          format: SaveFormat.JPEG,
        }
      );

      // Save metadata about the editing session
      const metadata = {
        originalUri: editingState.originalUri,
        editedUri: finalImage.uri,
        editHistory: editingState.editHistory,
        timestamp: new Date().toISOString(),
      };

      const metadataPath = `${FileSystem.documentDirectory}photo_edits/${Date.now()}.json`;
      await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}photo_edits/`, { intermediates: true });
      await FileSystem.writeAsStringAsync(metadataPath, JSON.stringify(metadata));

      return finalImage.uri;
    } catch (error) {
      console.error('Failed to save edited photo:', error);
      throw error;
    }
  }, [editingState]);

  return {
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
  };
}; 