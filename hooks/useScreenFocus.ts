import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/**
 * Custom hook to replace useFocusEffect from React Navigation
 * Triggers callback when app becomes active or when component mounts
 * This is specifically designed for our custom navigation system
 */
export const useScreenFocus = (callback: () => void, dependencies: any[] = []) => {
  const callbackRef = useRef(callback);
  const hasRunRef = useRef(false);
  
  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Run callback on mount and when dependencies change
  useEffect(() => {
    if (!hasRunRef.current) {
      hasRunRef.current = true;
      callbackRef.current();
    }
  }, dependencies);

  // Run callback when app becomes active (similar to focus effect)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        callbackRef.current();
      }
    });

    return () => subscription?.remove();
  }, []);
};