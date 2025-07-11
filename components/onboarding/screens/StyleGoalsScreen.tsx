import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { logger } from '../../../utils/DebugLogger';
import { LogCategories } from '../../../constants/LogCategories';

interface Goal {
  id: string;
  label: string;
  icon: string;
  value: string;
  description: string;
}

interface StyleGoalsScreenProps {
  navigation: any;
  route: any;
}

export const StyleGoalsScreen: React.FC<StyleGoalsScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const fadeAnim = new Animated.Value(0);

  const { onboardingData, setOnboardingData, currentStep, totalSteps, saveProgress } = route.params;

  useEffect(() => {
    logger.info(LogCategories.USER_ACTION, 'Style goals screen opened', {
      screen: 'onboarding_style_goals',
      step: currentStep,
      totalSteps
    });

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const goals: Goal[] = [
    { 
      id: '1', 
      label: 'Organize my wardrobe', 
      icon: '🗄️', 
      value: 'organize',
      description: 'Keep track of what you own and find items easily'
    },
    { 
      id: '2', 
      label: 'Get daily outfit ideas', 
      icon: '💡', 
      value: 'outfits',
      description: 'Never run out of fresh styling inspiration'
    },
    { 
      id: '3', 
      label: 'Shop smarter', 
      icon: '🛍️', 
      value: 'shopping',
      description: 'Buy only what complements your existing wardrobe'
    },
    { 
      id: '4', 
      label: 'Reduce decision fatigue', 
      icon: '🧠', 
      value: 'efficiency',
      description: 'Spend less time choosing what to wear each morning'
    },
    { 
      id: '5', 
      label: 'Sustainable fashion choices', 
      icon: '🌱', 
      value: 'sustainable',
      description: 'Make more eco-conscious clothing decisions'
    },
    { 
      id: '6', 
      label: 'Track what I wear', 
      icon: '📊', 
      value: 'tracking',
      description: 'See patterns in your style and outfit frequency'
    },
    { 
      id: '7', 
      label: 'Build a capsule wardrobe', 
      icon: '🎯', 
      value: 'capsule',
      description: 'Create a versatile collection of mix-and-match pieces'
    },
    { 
      id: '8', 
      label: 'Find my personal style', 
      icon: '✨', 
      value: 'discover',
      description: 'Explore and define your unique fashion identity'
    }
  ];

  const toggleGoal = (value: string) => {
    setSelectedGoals(prev => {
      const newGoals = prev.includes(value) 
        ? prev.filter(g => g !== value)
        : [...prev, value];
      
      logger.debug(LogCategories.USER_ACTION, 'Style goal toggled', {
        goal: value,
        selected: !prev.includes(value),
        totalSelected: newGoals.length
      });

      return newGoals;
    });
  };

  const handleContinue = async () => {
    logger.info(LogCategories.USER_ACTION, 'Style goals completed', {
      selectedGoals,
      goalCount: selectedGoals.length,
      screen: 'onboarding_style_goals'
    });

    const updatedData = {
      ...onboardingData,
      styleGoals: selectedGoals
    };

    setOnboardingData(updatedData);
    await saveProgress(updatedData, currentStep + 1);
    navigation.navigate('StyleQuiz');
  };

  const handleSkip = async () => {
    logger.info(LogCategories.USER_ACTION, 'Style goals skipped', {
      screen: 'onboarding_style_goals'
    });

    const updatedData = {
      ...onboardingData,
      styleGoals: []
    };

    setOnboardingData(updatedData);
    await saveProgress(updatedData, currentStep + 1);
    navigation.navigate('StyleQuiz');
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${((currentStep + 1) / totalSteps) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {currentStep + 1} of {totalSteps}
            </Text>
          </View>

          <Text style={styles.title}>What brings you to StyleMuse?</Text>
          <Text style={styles.subtitle}>
            Select all that apply - this helps us personalize your experience
          </Text>
        </View>

        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.goalsGrid}>
            {goals.map((goal, index) => (
              <Animated.View
                key={goal.id}
                style={[
                  styles.goalCardContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    }],
                  }
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.goalCard,
                    selectedGoals.includes(goal.value) && styles.selectedGoal
                  ]}
                  onPress={() => toggleGoal(goal.value)}
                  activeOpacity={0.8}
                >
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalIcon}>{goal.icon}</Text>
                    {selectedGoals.includes(goal.value) && (
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.goalLabel}>{goal.label}</Text>
                  <Text style={styles.goalDescription}>{goal.description}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </ScrollView>
      </Animated.View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.8}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedGoals.length === 0 && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={selectedGoals.length === 0}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.continueButtonText,
            selectedGoals.length === 0 && styles.disabledButtonText
          ]}>
            Continue ({selectedGoals.length})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },
  header: {
    marginBottom: 30,
  },
  progressContainer: {
    marginBottom: 30,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  scrollContainer: {
    flex: 1,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  goalCardContainer: {
    width: '48%',
    marginBottom: 16,
  },
  goalCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: theme.colors.border,
    minHeight: 120,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedGoal: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  goalIcon: {
    fontSize: 24,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
    lineHeight: 18,
  },
  goalDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
  },
  skipButton: {
    flex: 1,
    marginRight: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  skipButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  continueButton: {
    flex: 2,
    marginLeft: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: theme.colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledButtonText: {
    color: theme.colors.textMuted,
  },
});