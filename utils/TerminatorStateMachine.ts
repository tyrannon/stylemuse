/**
 * Advanced XState Machine for Terminator Camera System
 * Handles complex state transitions with proper error handling and recovery
 */

import { createMachine, assign, ActorRefFrom } from 'xstate';
import { DetectedClothingItem } from '../types/ClothingTypes';
import * as Haptics from 'expo-haptics';

// Types for the state machine context
export interface TerminatorContext {
  detectedItems: DetectedClothingItem[];
  trackingConfidence: number;
  lastDetectionTime: number | null;
  errorMessage: string | null;
  frameData: string | null;
  detectionInProgress: boolean;
  consecutiveFailures: number;
  trackingData: {
    startTime: number;
    lastUpdate: number;
    positions: Array<{ x: number; y: number; timestamp: number }>;
  } | null;
}

// Events that can be sent to the machine
export type TerminatorEvent =
  | { type: 'ACTIVATE' }
  | { type: 'DEACTIVATE' }
  | { type: 'TAP_SCREEN'; frameData: string }
  | { type: 'DETECTION_SUCCESS'; items: DetectedClothingItem[] }
  | { type: 'DETECTION_FAILED'; error: string }
  | { type: 'TRACKING_UPDATE'; confidence: number }
  | { type: 'TRACKING_LOST' }
  | { type: 'RE_DETECT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' };

// Actions for side effects
const actions = {
  // Initialize scanning mode
  startScanning: assign({
    detectedItems: [],
    trackingConfidence: 0,
    errorMessage: null,
    consecutiveFailures: 0,
  }),

  // Start detection process
  triggerDetection: assign({
    detectionInProgress: true,
    errorMessage: null,
  }),

  // Save successful detection results
  saveDetection: assign(({ context, event }) => {
    if (event.type === 'DETECTION_SUCCESS') {
      return {
        detectedItems: event.items,
        lastDetectionTime: Date.now(),
        detectionInProgress: false,
        consecutiveFailures: 0,
        trackingData: {
          startTime: Date.now(),
          lastUpdate: Date.now(),
          positions: [],
        },
      };
    }
    return {};
  }),

  // Handle detection failure
  handleDetectionFailure: assign(({ context, event }) => {
    if (event.type === 'DETECTION_FAILED') {
      return {
        detectionInProgress: false,
        errorMessage: event.error,
        consecutiveFailures: context.consecutiveFailures + 1,
      };
    }
    return {};
  }),

  // Update tracking confidence
  updateTracking: assign(({ context, event }) => {
    if (event.type === 'TRACKING_UPDATE') {
      return {
        trackingConfidence: event.confidence,
        trackingData: context.trackingData ? {
          ...context.trackingData,
          lastUpdate: Date.now(),
        } : null,
      };
    }
    return {};
  }),

  // Clear tracking data when lost
  clearTracking: assign({
    trackingData: null,
    trackingConfidence: 0,
  }),

  // Reset to initial state
  resetState: assign({
    detectedItems: [],
    trackingConfidence: 0,
    lastDetectionTime: null,
    errorMessage: null,
    frameData: null,
    detectionInProgress: false,
    consecutiveFailures: 0,
    trackingData: null,
  }),

  // Haptic feedback actions
  playDetectionHaptic: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Lock-on confirmation
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 100);
  },

  playTrackingHaptic: () => {
    Haptics.selectionAsync();
  },

  playErrorHaptic: () => {
    // Error pattern: 3 heavy impacts
    [0, 100, 200].forEach((delay) => {
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), delay);
    });
  },

  playScanHaptic: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
};

// Guards for conditional transitions
const guards = {
  // Check if too many consecutive failures
  tooManyFailures: ({ context }: { context: TerminatorContext }) => context.consecutiveFailures >= 3,

  // Check if tracking confidence is too low
  lowTrackingConfidence: ({ context }: { context: TerminatorContext }) => context.trackingConfidence < 0.3,

  // Check if detection was recent enough for tracking
  recentDetection: ({ context }: { context: TerminatorContext }) => {
    if (!context.lastDetectionTime) return false;
    return Date.now() - context.lastDetectionTime < 30000; // 30 seconds
  },

  // Check if we have detected items
  hasDetectedItems: ({ context }: { context: TerminatorContext }) => context.detectedItems.length > 0,
};

/**
 * Advanced Terminator Camera State Machine
 * 
 * States:
 * - idle: Camera is off or terminator mode disabled
 * - scanning: Actively scanning for targets, waiting for user tap
 * - detecting: Processing frame through AI detection
 * - tracking: Following detected items with lightweight tracking
 * - lost: Tracking lost, brief pause before returning to scanning
 * - error: Error state with recovery options
 */
export const terminatorMachine = createMachine({
  id: 'terminator-camera',
  initial: 'idle',
  context: {
    detectedItems: [],
    trackingConfidence: 0,
    lastDetectionTime: null,
    errorMessage: null,
    frameData: null,
    detectionInProgress: false,
    consecutiveFailures: 0,
    trackingData: null,
  } as TerminatorContext,
  
  states: {
    // Idle state - terminator mode is off
    idle: {
      entry: ['resetState'],
      on: {
        ACTIVATE: {
          target: 'scanning',
          actions: ['startScanning', 'playScanHaptic'],
        },
      },
    },

    // Scanning state - looking for targets, waiting for user interaction
    scanning: {
      entry: ['startScanning'],
      on: {
        TAP_SCREEN: {
          target: 'detecting',
          actions: ['triggerDetection'],
        },
        DEACTIVATE: 'idle',
        RESET: 'idle',
      },
    },

    // Detecting state - AI processing in progress
    detecting: {
      on: {
        DETECTION_SUCCESS: [
          {
            target: 'tracking',
            guard: 'hasDetectedItems',
            actions: ['saveDetection', 'playDetectionHaptic'],
          },
          {
            target: 'scanning',
            actions: ['saveDetection'],
          },
        ],
        DETECTION_FAILED: [
          {
            target: 'error',
            guard: 'tooManyFailures',
            actions: ['handleDetectionFailure', 'playErrorHaptic'],
          },
          {
            target: 'scanning',
            actions: ['handleDetectionFailure'],
          },
        ],
        DEACTIVATE: 'idle',
        RESET: 'idle',
      },
      
      // Timeout after 10 seconds if no response
      after: {
        10000: {
          target: 'scanning',
          actions: ['handleDetectionFailure'],
        },
      },
    },

    // Tracking state - following detected items
    tracking: {
      entry: ['playTrackingHaptic'],
      on: {
        TRACKING_UPDATE: [
          {
            target: 'lost',
            guard: 'lowTrackingConfidence',
            actions: ['updateTracking', 'clearTracking'],
          },
          {
            target: 'tracking',
            actions: ['updateTracking'],
          },
        ],
        TRACKING_LOST: {
          target: 'lost',
          actions: ['clearTracking'],
        },
        TAP_SCREEN: {
          target: 'detecting',
          actions: ['triggerDetection'],
        },
        DEACTIVATE: 'idle',
        RESET: 'idle',
      },

      // Periodic haptic feedback during tracking
      after: {
        2000: {
          target: 'tracking',
          actions: ['playTrackingHaptic'],
        },
      },
    },

    // Lost state - brief pause before returning to scanning
    lost: {
      entry: ['clearTracking'],
      on: {
        TAP_SCREEN: {
          target: 'detecting',
          actions: ['triggerDetection'],
        },
        DEACTIVATE: 'idle',
        RESET: 'idle',
      },
      
      // Auto-return to scanning after 2 seconds
      after: {
        2000: 'scanning',
      },
    },

    // Error state - recovery options available
    error: {
      on: {
        CLEAR_ERROR: 'scanning',
        TAP_SCREEN: {
          target: 'detecting',
          actions: ['triggerDetection'],
        },
        DEACTIVATE: 'idle',
        RESET: 'idle',
      },
      
      // Auto-recovery after 5 seconds
      after: {
        5000: {
          target: 'scanning',
          actions: ['resetState'],
        },
      },
    },
  },
}, {
  actions,
  guards,
});

// Type for the machine actor
export type TerminatorMachineActor = ActorRefFrom<typeof terminatorMachine>;

// Selector functions for optimized component subscriptions
export const selectors = {
  isScanning: (state: any) => state.matches('scanning'),
  isDetecting: (state: any) => state.matches('detecting'),
  isTracking: (state: any) => state.matches('tracking'),
  isLost: (state: any) => state.matches('lost'),
  isError: (state: any) => state.matches('error'),
  isIdle: (state: any) => state.matches('idle'),
  
  detectedItems: (state: any) => state.context.detectedItems,
  trackingConfidence: (state: any) => state.context.trackingConfidence,
  errorMessage: (state: any) => state.context.errorMessage,
  detectionInProgress: (state: any) => state.context.detectionInProgress,
  consecutiveFailures: (state: any) => state.context.consecutiveFailures,
  
  // Computed selectors
  currentStateDisplay: (state: any) => {
    if (state.matches('scanning')) return 'SCANNING FOR TARGETS...';
    if (state.matches('detecting')) return 'ANALYZING TARGET...';
    if (state.matches('tracking')) return 'TARGETS ACQUIRED';
    if (state.matches('lost')) return 'TARGET LOST';
    if (state.matches('error')) return 'SYSTEM ERROR';
    return 'TERMINATOR OFFLINE';
  },
  
  stateColor: (state: any) => {
    if (state.matches('scanning')) return '#00DDFF';
    if (state.matches('detecting')) return '#FFAA00';
    if (state.matches('tracking')) return '#00FF00';
    if (state.matches('lost')) return '#FF4444';
    if (state.matches('error')) return '#FF0000';
    return '#666666';
  },
  
  shouldShowBoundingBoxes: (state: any) => state.matches('tracking') || state.matches('lost'),
  shouldShowScanner: (state: any) => state.matches('scanning'),
  shouldShowTargetsScroller: (state: any) => state.matches('tracking') && state.context.detectedItems.length > 0,
};