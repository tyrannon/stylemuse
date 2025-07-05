import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeArea } from '../utils/SafeArea';

const { width: screenWidth } = Dimensions.get('window');

interface ProgressStep {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  details: string;
  emoji: string;
}

interface MultiItemProgressModalProps {
  visible: boolean;
  detectedItems: any[];
  currentStep: number;
  logs: string[];
  onComplete: () => void;
}

export const MultiItemProgressModal: React.FC<MultiItemProgressModalProps> = ({
  visible,
  detectedItems,
  currentStep,
  logs,
  onComplete,
}) => {
  const [progressAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (visible) {
      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: currentStep,
        duration: 500,
        useNativeDriver: false,
      }).start();

      // Pulse animation for current step
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible, currentStep]);

  const generateSteps = (): ProgressStep[] => {
    const steps: ProgressStep[] = [
      {
        id: 'detection',
        title: 'Detecting Items',
        status: currentStep > 0 ? 'completed' : currentStep === 0 ? 'processing' : 'pending',
        details: `Found ${detectedItems.length} clothing items`,
        emoji: '🔍'
      }
    ];

    // Add step for each detected item
    detectedItems.forEach((item, index) => {
      steps.push({
        id: `item_${index}`,
        title: `Analyzing ${item.itemType}`,
        status: currentStep > index + 1 ? 'completed' : currentStep === index + 1 ? 'processing' : 'pending',
        details: item.description || `Processing ${item.itemType}...`,
        emoji: getItemEmoji(item.itemType)
      });
    });

    // Final step
    steps.push({
      id: 'saving',
      title: 'Saving to Wardrobe',
      status: currentStep > detectedItems.length + 1 ? 'completed' : currentStep === detectedItems.length + 1 ? 'processing' : 'pending',
      details: 'Adding all items to your collection',
      emoji: '💾'
    });

    return steps;
  };

  const getItemEmoji = (itemType: string): string => {
    const emojiMap: { [key: string]: string } = {
      'shirt': '👕',
      't-shirt': '👕',
      'tank-top': '🎽',
      'blouse': '👚',
      'sweater': '🧥',
      'hoodie': '🧥',
      'jacket': '🧥',
      'coat': '🧥',
      'pants': '👖',
      'jeans': '👖',
      'trousers': '👖',
      'skirt': '👗',
      'dress': '👗',
      'shorts': '🩳',
      'shoes': '👟',
      'sneakers': '👟',
      'boots': '🥾',
      'sandals': '👡',
      'heels': '👠',
      'hat': '👒',
      'cap': '🧢',
      'beanie': '🎩',
      'scarf': '🧣',
      'belt': '🔗',
      'bag': '👜',
      'purse': '👛',
      'backpack': '🎒',
      'watch': '⌚',
      'glasses': '👓',
      'sunglasses': '🕶️',
    };
    
    return emojiMap[itemType.toLowerCase()] || '👔';
  };

  const steps = generateSteps();
  const overallProgress = Math.min((currentStep / steps.length) * 100, 100);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeArea style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🤖 AI Multi-Item Processing</Text>
          <Text style={styles.headerSubtitle}>
            Processing {detectedItems.length} detected items...
          </Text>
        </View>

        {/* Overall Progress Bar */}
        <View style={styles.overallProgressContainer}>
          <Text style={styles.progressLabel}>Overall Progress</Text>
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, steps.length],
                    outputRange: ['0%', '100%'],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(overallProgress)}%</Text>
        </View>

        {/* Step-by-Step Progress */}
        <ScrollView style={styles.stepsContainer} showsVerticalScrollIndicator={false}>
          {steps.map((step, index) => (
            <Animated.View
              key={step.id}
              style={[
                styles.stepContainer,
                step.status === 'processing' && {
                  transform: [{ scale: pulseAnim }]
                }
              ]}
            >
              <View style={styles.stepHeader}>
                <View style={[
                  styles.stepIndicator,
                  step.status === 'completed' && styles.stepCompleted,
                  step.status === 'processing' && styles.stepProcessing,
                  step.status === 'failed' && styles.stepFailed,
                ]}>
                  {step.status === 'completed' ? (
                    <Text style={styles.stepEmoji}>✅</Text>
                  ) : step.status === 'processing' ? (
                    <Text style={styles.stepEmoji}>⚡</Text>
                  ) : step.status === 'failed' ? (
                    <Text style={styles.stepEmoji}>❌</Text>
                  ) : (
                    <Text style={styles.stepEmoji}>{step.emoji}</Text>
                  )}
                </View>
                <View style={styles.stepText}>
                  <Text style={[
                    styles.stepTitle,
                    step.status === 'processing' && styles.stepTitleActive
                  ]}>
                    {step.title}
                  </Text>
                  <Text style={styles.stepDetails}>{step.details}</Text>
                </View>
              </View>
            </Animated.View>
          ))}
        </ScrollView>

        {/* Live Logs Feed */}
        <View style={styles.logsContainer}>
          <Text style={styles.logsTitle}>🔬 Live Processing Logs</Text>
          <ScrollView 
            style={styles.logsScrollView}
            showsVerticalScrollIndicator={false}
          >
            {logs.slice(-10).map((log, index) => (
              <Text key={index} style={styles.logText}>
                {log}
              </Text>
            ))}
          </ScrollView>
        </View>
      </SafeArea>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#667eea',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  overallProgressContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  stepsContainer: {
    flex: 1,
    padding: 20,
  },
  stepContainer: {
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepProcessing: {
    backgroundColor: '#FF9500',
  },
  stepFailed: {
    backgroundColor: '#f44336',
  },
  stepEmoji: {
    fontSize: 18,
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  stepTitleActive: {
    color: '#FF9500',
  },
  stepDetails: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  logsContainer: {
    height: 150,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  logsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    padding: 12,
    paddingBottom: 8,
  },
  logsScrollView: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  logText: {
    fontSize: 12,
    color: '#00ff00',
    fontFamily: 'Courier',
    marginBottom: 2,
    lineHeight: 16,
  },
});