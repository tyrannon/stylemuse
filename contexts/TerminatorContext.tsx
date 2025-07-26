/**
 * Advanced Terminator Camera Context with XState Integration
 * Provides optimized state management and selector-based subscriptions
 */

import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useMachine } from '@xstate/react';
import { 
  terminatorMachine, 
  TerminatorMachineActor, 
  TerminatorContext as MachineContext,
  selectors,
  TerminatorEvent
} from '../utils/TerminatorStateMachine';
import { DetectedClothingItem } from '../types/ClothingTypes';

// Context interface
interface TerminatorContextValue {
  // State machine actor and current state
  actor: TerminatorMachineActor;
  state: any;
  
  // Action dispatchers
  send: (event: TerminatorEvent) => void;
  
  // Optimized selectors (prevent unnecessary re-renders)
  selectors: typeof selectors;
  
  // High-level action methods
  activateTerminator: () => void;
  deactivateTerminator: () => void;
  triggerDetection: (frameData: string) => void;
  reportDetectionSuccess: (items: DetectedClothingItem[]) => void;
  reportDetectionFailure: (error: string) => void;
  updateTracking: (confidence: number) => void;
  reportTrackingLost: () => void;
  clearError: () => void;
  resetSystem: () => void;
  
  // State query methods (memoized for performance)
  getCurrentState: () => string;
  getStateColor: () => string;
  getStateDisplay: () => string;
  getDetectedItems: () => DetectedClothingItem[];
  getTrackingConfidence: () => number;
  shouldShowBoundingBoxes: () => boolean;
  shouldShowTargetsScroller: () => boolean;
  isSystemActive: () => boolean;
}

// Create the context
const TerminatorContext = createContext<TerminatorContextValue | null>(null);

// Provider component
interface TerminatorProviderProps {
  children: ReactNode;
}

export const TerminatorProvider: React.FC<TerminatorProviderProps> = ({ children }) => {
  const [state, send, actor] = useMachine(terminatorMachine);

  // High-level action dispatchers
  const activateTerminator = useCallback(() => {
    send({ type: 'ACTIVATE' });
  }, [send]);

  const deactivateTerminator = useCallback(() => {
    send({ type: 'DEACTIVATE' });
  }, [send]);

  const triggerDetection = useCallback((frameData: string) => {
    send({ type: 'TAP_SCREEN', frameData });
  }, [send]);

  const reportDetectionSuccess = useCallback((items: DetectedClothingItem[]) => {
    send({ type: 'DETECTION_SUCCESS', items });
  }, [send]);

  const reportDetectionFailure = useCallback((error: string) => {
    send({ type: 'DETECTION_FAILED', error });
  }, [send]);

  const updateTracking = useCallback((confidence: number) => {
    send({ type: 'TRACKING_UPDATE', confidence });
  }, [send]);

  const reportTrackingLost = useCallback(() => {
    send({ type: 'TRACKING_LOST' });
  }, [send]);

  const clearError = useCallback(() => {
    send({ type: 'CLEAR_ERROR' });
  }, [send]);

  const resetSystem = useCallback(() => {
    send({ type: 'RESET' });
  }, [send]);

  // Memoized state query methods (prevent unnecessary re-renders)
  const getCurrentState = useCallback(() => {
    if (selectors.isScanning(state)) return 'scanning';
    if (selectors.isDetecting(state)) return 'detecting';
    if (selectors.isTracking(state)) return 'tracking';
    if (selectors.isLost(state)) return 'lost';
    if (selectors.isError(state)) return 'error';
    return 'idle';
  }, [state]);

  const getStateColor = useCallback(() => selectors.stateColor(state), [state]);
  const getStateDisplay = useCallback(() => selectors.currentStateDisplay(state), [state]);
  const getDetectedItems = useCallback(() => selectors.detectedItems(state), [state]);
  const getTrackingConfidence = useCallback(() => selectors.trackingConfidence(state), [state]);
  const shouldShowBoundingBoxes = useCallback(() => selectors.shouldShowBoundingBoxes(state), [state]);
  const shouldShowTargetsScroller = useCallback(() => selectors.shouldShowTargetsScroller(state), [state]);
  const isSystemActive = useCallback(() => !selectors.isIdle(state), [state]);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo<TerminatorContextValue>(() => ({
    actor,
    state,
    send,
    selectors,
    
    // Actions
    activateTerminator,
    deactivateTerminator,
    triggerDetection,
    reportDetectionSuccess,
    reportDetectionFailure,
    updateTracking,
    reportTrackingLost,
    clearError,
    resetSystem,
    
    // Queries
    getCurrentState,
    getStateColor,
    getStateDisplay,
    getDetectedItems,
    getTrackingConfidence,
    shouldShowBoundingBoxes,
    shouldShowTargetsScroller,
    isSystemActive,
  }), [
    actor,
    state,
    send,
    activateTerminator,
    deactivateTerminator,
    triggerDetection,
    reportDetectionSuccess,
    reportDetectionFailure,
    updateTracking,
    reportTrackingLost,
    clearError,
    resetSystem,
    getCurrentState,
    getStateColor,
    getStateDisplay,
    getDetectedItems,
    getTrackingConfidence,
    shouldShowBoundingBoxes,
    shouldShowTargetsScroller,
    isSystemActive,
  ]);

  return (
    <TerminatorContext.Provider value={contextValue}>
      {children}
    </TerminatorContext.Provider>
  );
};

// Custom hook for consuming the context
export const useTerminator = (): TerminatorContextValue => {
  const context = useContext(TerminatorContext);
  
  if (!context) {
    throw new Error('useTerminator must be used within a TerminatorProvider');
  }
  
  return context;
};

// Optimized selector hooks for specific state slices (prevent unnecessary re-renders)
export const useTerminatorState = () => {
  const { getCurrentState } = useTerminator();
  return getCurrentState();
};

export const useTerminatorColor = () => {
  const { getStateColor } = useTerminator();
  return getStateColor();
};

export const useTerminatorDisplay = () => {
  const { getStateDisplay } = useTerminator();
  return getStateDisplay();
};

export const useDetectedItems = () => {
  const { getDetectedItems } = useTerminator();
  return getDetectedItems();
};

export const useTerminatorUI = () => {
  const { shouldShowBoundingBoxes, shouldShowTargetsScroller, isSystemActive } = useTerminator();
  return {
    showBoundingBoxes: shouldShowBoundingBoxes(),
    showTargetsScroller: shouldShowTargetsScroller(),
    isActive: isSystemActive(),
  };
};

// Performance monitoring hook
export const useTerminatorPerformance = () => {
  const { state } = useTerminator();
  
  return useMemo(() => ({
    consecutiveFailures: state.context.consecutiveFailures,
    lastDetectionTime: state.context.lastDetectionTime,
    trackingConfidence: state.context.trackingConfidence,
    isDetectionInProgress: state.context.detectionInProgress,
    
    // Performance metrics
    getPerformanceScore: () => {
      const failures = state.context.consecutiveFailures;
      const confidence = state.context.trackingConfidence;
      
      // Calculate performance score (0-100)
      const failureScore = Math.max(0, 100 - (failures * 20));
      const confidenceScore = confidence * 100;
      
      return Math.round((failureScore + confidenceScore) / 2);
    },
    
    shouldOptimizePerformance: () => {
      return state.context.consecutiveFailures > 2 || state.context.trackingConfidence < 0.5;
    },
  }), [state]);
};