import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface DetectedTarget {
  id: string;
  label: string;
  confidence: number;
  category: string;
}

interface TargetsAcquiredScrollerProps {
  targets: DetectedTarget[];
  isScanning: boolean;
}

const getCategoryEmoji = (category: string, label: string): string => {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes('shirt') || lowerLabel.includes('top') || lowerLabel.includes('blouse')) return '👕';
  if (lowerLabel.includes('pants') || lowerLabel.includes('jeans') || lowerLabel.includes('trouser')) return '👖';
  if (lowerLabel.includes('shoe') || lowerLabel.includes('sneaker') || lowerLabel.includes('boot')) return '👟';
  if (lowerLabel.includes('dress')) return '👗';
  if (lowerLabel.includes('skirt')) return '🩱';
  if (lowerLabel.includes('jacket') || lowerLabel.includes('blazer') || lowerLabel.includes('coat')) return '🧥';
  if (lowerLabel.includes('hat') || lowerLabel.includes('cap')) return '👒';
  if (lowerLabel.includes('bag') || lowerLabel.includes('purse')) return '👜';
  return '👔'; // Default clothing emoji
};

export const TargetsAcquiredScroller: React.FC<TargetsAcquiredScrollerProps> = ({
  targets = [],
  isScanning = false,
}) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const blinkOpacity = useRef(new Animated.Value(1)).current;
  const scanPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (targets.length > 0) {
      // Auto-scroll animation for the targets
      Animated.loop(
        Animated.timing(scrollX, {
          toValue: -screenWidth * 2, // Scroll left
          duration: 15000, // 15 seconds
          useNativeDriver: true,
        })
      ).start();

      // Blink effect for "TARGETS ACQUIRED"
      Animated.loop(
        Animated.sequence([
          Animated.timing(blinkOpacity, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(blinkOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // Scanning pulse animation
    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanPulse, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scanPulse, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanPulse.setValue(1);
    }
  }, [targets.length, isScanning]);

  if (!isScanning && targets.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Scanning Status */}
      {isScanning && targets.length === 0 && (
        <Animated.View style={[styles.scanningContainer, { transform: [{ scale: scanPulse }] }]}>
          <Text style={styles.scanningText}>
            🎯 SCANNING FOR TARGETS...
          </Text>
          <View style={styles.scanLine} />
        </Animated.View>
      )}

      {/* Targets Acquired */}
      {targets.length > 0 && (
        <View style={styles.targetsContainer}>
          <Animated.Text style={[styles.headerText, { opacity: blinkOpacity }]}>
            🎯 TARGETS ACQUIRED:
          </Animated.Text>
          
          <View style={styles.scrollContainer}>
            <Animated.View 
              style={[
                styles.targetsList,
                { transform: [{ translateX: scrollX }] }
              ]}
            >
              {targets.map((target, index) => (
                <Text key={target.id} style={styles.targetText}>
                  {getCategoryEmoji(target.category, target.label)} {target.label} ({Math.round(target.confidence * 100)}%)
                  {index < targets.length - 1 ? ' • ' : ''}
                </Text>
              ))}
              {/* Duplicate for seamless scrolling */}
              {targets.map((target, index) => (
                <Text key={`${target.id}-duplicate`} style={styles.targetText}>
                  {getCategoryEmoji(target.category, target.label)} {target.label} ({Math.round(target.confidence * 100)}%)
                  {index < targets.length - 1 ? ' • ' : ' • '}
                </Text>
              ))}
            </Animated.View>
          </View>
          
          <View style={styles.statusIndicator}>
            <Text style={styles.statusText}>
              [{targets.length} TARGET{targets.length !== 1 ? 'S' : ''} LOCKED]
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
  },
  scanningContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 1,
    borderColor: '#00FF00',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  scanningText: {
    color: '#00FF00',
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#00FF00',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  scanLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#00FF00',
    marginTop: 8,
    opacity: 0.8,
  },
  targetsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderWidth: 2,
    borderColor: '#00FF00',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#00FF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  headerText: {
    color: '#00FF00',
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: '#00FF00',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    letterSpacing: 1,
  },
  scrollContainer: {
    height: 24,
    overflow: 'hidden',
  },
  targetsList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetText: {
    color: '#00DD00',
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: '#00FF00',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
    paddingHorizontal: 4,
  },
  statusIndicator: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#00FF00',
    alignItems: 'center',
  },
  statusText: {
    color: '#00AA00',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    textShadowColor: '#00FF00',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
});

export default TargetsAcquiredScroller;