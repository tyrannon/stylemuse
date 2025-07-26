/**
 * Type definitions for clothing detection and tracking
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedClothingItem {
  id: string;
  label: string;
  confidence: number;
  boundingBox: BoundingBox;
  category: 'top' | 'bottom' | 'shoes' | 'accessories' | 'jacket' | 'hat';
}

export interface TerminatorState {
  current: 'idle' | 'scanning' | 'detecting' | 'tracking' | 'lost' | 'error';
  detectedItems: DetectedClothingItem[];
  trackingConfidence: number;
  lastDetectionTime: number;
  consecutiveFailures: number;
  isActive: boolean;
}