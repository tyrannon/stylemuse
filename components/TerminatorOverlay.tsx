import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, G } from 'react-native-svg';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DetectedItem {
  id: string;
  label: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  category: 'top' | 'bottom' | 'shoes' | 'accessories' | 'jacket' | 'hat';
}

interface TerminatorOverlayProps {
  detectedItems: DetectedItem[];
  cameraWidth?: number;
  cameraHeight?: number;
  isScanning?: boolean;
  terminatorState?: 'scanning' | 'detecting' | 'tracking' | 'lost';
  trackingData?: any;
}

export const TerminatorOverlay: React.FC<TerminatorOverlayProps> = React.memo(({
  detectedItems = [],
  cameraWidth = screenWidth,
  cameraHeight = screenHeight,
  isScanning = false,
  terminatorState = 'scanning',
  trackingData = null,
}) => {
  console.log('🎯 TerminatorOverlay render:', { 
    detectedItemsCount: detectedItems.length, 
    isScanning,
    firstItem: detectedItems[0],
    cameraWidth,
    cameraHeight
  });
  
  if (detectedItems.length > 0) {
    console.log('🎯 TerminatorOverlay: SHOULD BE VISIBLE with items:', detectedItems);
  }
  const renderBoundingBoxes = () => {
    return detectedItems.map((item, index) => {
      const { x, y, width, height } = item.boundingBox;
      
      // Scale coordinates to camera dimensions
      const scaledX = (x / 100) * cameraWidth;
      const scaledY = (y / 100) * cameraHeight;
      const scaledWidth = (width / 100) * cameraWidth;
      const scaledHeight = (height / 100) * cameraHeight;
      
      console.log('🎯 TerminatorOverlay: Drawing box:', {
        original: { x, y, width, height },
        scaled: { scaledX, scaledY, scaledWidth, scaledHeight },
        cameraSize: { cameraWidth, cameraHeight }
      });
      
      // Box color based on confidence
      const boxColor = item.confidence > 0.8 ? '#00FF00' : '#FFFF00';
      const strokeWidth = isScanning ? 3 : 2;
      
      return (
        <G key={`${item.id}-${index}`}>
          {/* Main bounding box */}
          <Rect
            x={scaledX}
            y={scaledY}
            width={scaledWidth}
            height={scaledHeight}
            stroke={boxColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={isScanning ? "5,5" : "0"}
          />
          
          {/* Corner markers for terminator style */}
          <G>
            {/* Top-left corner */}
            <Rect x={scaledX - 2} y={scaledY - 2} width={20} height={3} fill={boxColor} />
            <Rect x={scaledX - 2} y={scaledY - 2} width={3} height={20} fill={boxColor} />
            
            {/* Top-right corner */}
            <Rect x={scaledX + scaledWidth - 18} y={scaledY - 2} width={20} height={3} fill={boxColor} />
            <Rect x={scaledX + scaledWidth - 1} y={scaledY - 2} width={3} height={20} fill={boxColor} />
            
            {/* Bottom-left corner */}
            <Rect x={scaledX - 2} y={scaledY + scaledHeight - 1} width={20} height={3} fill={boxColor} />
            <Rect x={scaledX - 2} y={scaledY + scaledHeight - 18} width={3} height={20} fill={boxColor} />
            
            {/* Bottom-right corner */}
            <Rect x={scaledX + scaledWidth - 18} y={scaledY + scaledHeight - 1} width={20} height={3} fill={boxColor} />
            <Rect x={scaledX + scaledWidth - 1} y={scaledY + scaledHeight - 18} width={3} height={20} fill={boxColor} />
          </G>
          
          {/* Label background */}
          <Rect
            x={scaledX}
            y={scaledY - 25}
            width={Math.max(item.label.length * 8 + 10, 80)}
            height={20}
            fill="rgba(0, 255, 0, 0.8)"
            rx={3}
          />
        </G>
      );
    });
  };

  const renderLabels = () => {
    return detectedItems.map((item, index) => {
      const { x, y } = item.boundingBox;
      const scaledX = (x / 100) * cameraWidth;
      const scaledY = (y / 100) * cameraHeight;
      
      return (
        <View
          key={`label-${item.id}-${index}`}
          style={[
            styles.labelContainer,
            {
              left: scaledX + 5,
              top: scaledY - 22,
              backgroundColor: 'rgba(0, 255, 0, 0.9)',
            }
          ]}
        >
          <Text style={styles.labelText}>
            {item.label} ({Math.round(item.confidence * 100)}%)
          </Text>
        </View>
      );
    });
  };

  if (detectedItems.length === 0 && !isScanning) {
    return null;
  }

  const getStateMessage = () => {
    switch (terminatorState) {
      case 'scanning':
        return '🎯 TAP SCREEN TO SCAN FOR TARGETS';
      case 'detecting':
        return '🔍 AI ANALYZING...';
      case 'tracking':
        return `📍 TRACKING ${detectedItems.length} TARGET${detectedItems.length !== 1 ? 'S' : ''} - CONFIDENCE: ${Math.round((trackingData?.confidence || 0) * 100)}%`;
      case 'lost':
        return '❌ TRACKING LOST - TAP TO RE-SCAN';
      default:
        return '🎯 TERMINATOR VISION ACTIVE';
    }
  };

  const getStateColor = () => {
    switch (terminatorState) {
      case 'scanning':
        return '#00DDFF'; // Cyan for scanning
      case 'detecting':
        return '#FFAA00'; // Orange for detecting
      case 'tracking':
        return '#00FF00'; // Green for tracking
      case 'lost':
        return '#FF4444'; // Red for lost
      default:
        return '#00FF00';
    }
  };

  return (
    <View style={styles.overlay}>
      {/* Smart state indicator */}
      <View style={[styles.stateIndicator, { borderColor: getStateColor() }]}>
        <Text style={[styles.stateText, { color: getStateColor() }]}>
          {getStateMessage()}
        </Text>
        {terminatorState === 'scanning' && (
          <Text style={styles.tapHintText}>
            TAP ANYWHERE ON SCREEN WHEN POINTING AT CLOTHING
          </Text>
        )}
      </View>
      
      {/* Show boxes when tracking or just detected */}
      {(terminatorState === 'tracking' || detectedItems.length > 0) && (
        <>
          {/* SVG Bounding Boxes */}
          <Svg
            width={cameraWidth}
            height={cameraHeight}
            style={StyleSheet.absoluteFillObject}
          >
            {renderBoundingBoxes()}
          </Svg>
          
          {/* Text Labels */}
          {renderLabels()}
        </>
      )}
      
      {/* Lost tracking overlay */}
      {terminatorState === 'lost' && (
        <View style={styles.lostIndicator}>
          <Text style={styles.lostText}>🔄 LOST TRACKING</Text>
          <Text style={styles.lostSubtext}>Tap screen to detect again</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  labelContainer: {
    position: 'absolute',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    maxWidth: 120,
  },
  labelText: {
    color: 'black',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  scanningIndicator: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderColor: '#00FF00',
    borderWidth: 1,
  },
  scanningText: {
    color: '#00FF00',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#00FF00',
    opacity: 0.8,
  },
  detectionIndicator: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 255, 0, 0.8)',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#00FF00',
  },
  detectionText: {
    color: 'black',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  stateIndicator: {
    position: 'absolute',
    top: 20,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  stateText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'monospace',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  tapHintText: {
    color: '#00DDFF',
    fontSize: 10,
    textAlign: 'center',
    fontFamily: 'monospace',
    marginTop: 4,
    opacity: 0.8,
  },
  lostIndicator: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderColor: '#FF4444',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    transform: [{ translateY: -50 }],
  },
  lostText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  lostSubtext: {
    color: '#FFAAAA',
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'monospace',
    marginTop: 4,
  },
});

TerminatorOverlay.displayName = 'TerminatorOverlay';