import { useState, useEffect, useRef } from 'react';
import { useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';

export interface CameraState {
  isReady: boolean;
  flashMode: 'on' | 'off' | 'auto';
  cameraType: 'front' | 'back';
  zoom: number;
  hasPermission: boolean;
  showGrid: boolean;
  resolution: 'low' | 'medium' | 'high';
  isCapturing: boolean;
}

export interface CameraControls {
  state: CameraState;
  cameraRef: React.RefObject<any>;
  toggleFlash: () => void;
  flipCamera: () => void;
  setZoom: (zoom: number) => void;
  toggleGrid: () => void;
  setResolution: (resolution: 'low' | 'medium' | 'high') => void;
  requestPermission: () => Promise<boolean>;
  takePicture: () => Promise<string | null>;
  setIsCapturing: (capturing: boolean) => void;
}

export const useCameraControls = (): CameraControls => {
  const [permission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  const [state, setState] = useState<CameraState>({
    isReady: false,
    flashMode: 'off',
    cameraType: 'back',
    zoom: 0,
    hasPermission: false,
    showGrid: false,
    resolution: 'high',
    isCapturing: false,
  });

  useEffect(() => {
    setState(prev => ({
      ...prev,
      hasPermission: permission?.granted || false,
      isReady: permission?.granted || false,
    }));
  }, [permission?.granted]);

  const toggleFlash = () => {
    setState(prev => {
      const modes: ('off' | 'on' | 'auto')[] = ['off', 'on', 'auto'];
      const currentIndex = modes.indexOf(prev.flashMode);
      const nextMode = modes[(currentIndex + 1) % modes.length];
      
      Haptics.selectionAsync();
      return { ...prev, flashMode: nextMode };
    });
  };

  const flipCamera = () => {
    setState(prev => {
      Haptics.selectionAsync();
      return {
        ...prev,
        cameraType: prev.cameraType === 'back' ? 'front' : 'back',
      };
    });
  };

  const setZoom = (zoom: number) => {
    setState(prev => ({
      ...prev,
      zoom: Math.max(0, Math.min(1, zoom)),
    }));
  };

  const toggleGrid = () => {
    setState(prev => {
      Haptics.selectionAsync();
      return { ...prev, showGrid: !prev.showGrid };
    });
  };

  const setResolution = (resolution: 'low' | 'medium' | 'high') => {
    setState(prev => ({ ...prev, resolution }));
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const result = await requestCameraPermission();
      const granted = result?.granted || false;
      
      setState(prev => ({
        ...prev,
        hasPermission: granted,
        isReady: granted,
      }));
      
      return granted;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  };

  const takePicture = async (): Promise<string | null> => {
    if (!cameraRef.current || !state.hasPermission || state.isCapturing) {
      return null;
    }

    try {
      setState(prev => ({ ...prev, isCapturing: true }));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const photo = await cameraRef.current.takePictureAsync({
        quality: state.resolution === 'high' ? 1 : state.resolution === 'medium' ? 0.7 : 0.5,
        base64: false,
        skipProcessing: false,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return photo.uri;
    } catch (error) {
      console.error('Error taking picture:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return null;
    } finally {
      setState(prev => ({ ...prev, isCapturing: false }));
    }
  };

  const setIsCapturing = (capturing: boolean) => {
    setState(prev => ({ ...prev, isCapturing: capturing }));
  };

  return {
    state,
    cameraRef,
    toggleFlash,
    flipCamera,
    setZoom,
    toggleGrid,
    setResolution,
    requestPermission,
    takePicture,
    setIsCapturing,
  };
};