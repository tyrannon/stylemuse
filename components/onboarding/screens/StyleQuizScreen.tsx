import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { logger } from '../../../utils/DebugLogger';
import { LogCategories } from '../../../constants/LogCategories';

interface QuizQuestion {
  id: string;
  question: string;
  category: 'colors' | 'styles' | 'occasions' | 'bodyType' | 'budget';
  options: QuizOption[];
  multiSelect?: boolean;
}

interface QuizOption {
  id: string;
  label: string;
  value: string;
  icon?: string;
}

interface StyleQuizScreenProps {
  navigation: any;
  route: any;
}

export const StyleQuizScreen: React.FC<StyleQuizScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const slideAnim = new Animated.Value(0);
  const fadeAnim = new Animated.Value(1);

  const { onboardingData, setOnboardingData, currentStep, totalSteps, saveProgress } = route.params;

  useEffect(() => {
    logger.info(LogCategories.USER_ACTION, 'Style quiz screen opened', {
      screen: 'onboarding_style_quiz',
      step: currentStep,
      totalSteps
    });
  }, []);

  const questions: QuizQuestion[] = [
    {
      id: '1',
      question: 'What colors do you gravitate toward?',
      category: 'colors',
      multiSelect: true,
      options: [
        { id: '1', label: 'Earth Tones', value: 'earth', icon: '🌿' },
        { id: '2', label: 'Bold & Bright', value: 'bold', icon: '🌈' },
        { id: '3', label: 'Neutrals', value: 'neutral', icon: '🤍' },
        { id: '4', label: 'Monochrome', value: 'mono', icon: '⚫' },
        { id: '5', label: 'Pastels', value: 'pastel', icon: '🌸' },
        { id: '6', label: 'Jewel Tones', value: 'jewel', icon: '💎' },
      ]
    },
    {
      id: '2',
      question: 'Which styles resonate with you?',
      category: 'styles',
      multiSelect: true,
      options: [
        { id: '1', label: 'Minimalist', value: 'minimalist', icon: '⚪' },
        { id: '2', label: 'Bohemian', value: 'boho', icon: '🌻' },
        { id: '3', label: 'Classic', value: 'classic', icon: '👔' },
        { id: '4', label: 'Streetwear', value: 'street', icon: '🏙️' },
        { id: '5', label: 'Romantic', value: 'romantic', icon: '🌹' },
        { id: '6', label: 'Edgy', value: 'edgy', icon: '⚡' },
      ]
    },
    {
      id: '3',
      question: 'What occasions do you dress for most?',
      category: 'occasions',
      multiSelect: true,
      options: [
        { id: '1', label: 'Work/Professional', value: 'work', icon: '💼' },
        { id: '2', label: 'Casual Daily', value: 'casual', icon: '☕' },
        { id: '3', label: 'Social Events', value: 'social', icon: '🎉' },
        { id: '4', label: 'Date Nights', value: 'date', icon: '💕' },
        { id: '5', label: 'Workout/Active', value: 'active', icon: '🏃' },
        { id: '6', label: 'Special Occasions', value: 'formal', icon: '✨' },
      ]
    },
    {
      id: '4',
      question: 'What\'s your body type preference for styling?',
      category: 'bodyType',
      multiSelect: false,
      options: [
        { id: '1', label: 'Highlight curves', value: 'curves', icon: '⌛' },
        { id: '2', label: 'Create structure', value: 'structure', icon: '📐' },
        { id: '3', label: 'Comfort first', value: 'comfort', icon: '🤗' },
        { id: '4', label: 'Prefer not to specify', value: 'none', icon: '🤷' },
      ]
    },
    {
      id: '5',
      question: 'What\'s your typical budget for new pieces?',
      category: 'budget',
      multiSelect: false,
      options: [
        { id: '1', label: 'Under $50', value: 'budget', icon: '💰' },
        { id: '2', label: '$50-$150', value: 'moderate', icon: '💵' },
        { id: '3', label: '$150-$300', value: 'premium', icon: '💳' },
        { id: '4', label: '$300+', value: 'luxury', icon: '💎' },
        { id: '5', label: 'Varies greatly', value: 'varies', icon: '🎯' },
      ]
    }
  ];

  const handleAnswer = (questionId: string, optionValue: string, multiSelect: boolean = false) => {
    setAnswers(prev => {
      const questionKey = questions[currentQuestion].category;
      
      if (multiSelect) {
        const currentAnswers = prev[questionKey] || [];
        const newAnswers = currentAnswers.includes(optionValue)
          ? currentAnswers.filter(a => a !== optionValue)
          : [...currentAnswers, optionValue];
        
        return {
          ...prev,
          [questionKey]: newAnswers
        };
      } else {
        return {
          ...prev,
          [questionKey]: [optionValue]
        };
      }
    });

    logger.debug(LogCategories.USER_ACTION, 'Quiz answer selected', {
      questionId,
      optionValue,
      multiSelect,
      currentQuestion
    });
  };

  const animateToNext = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setCurrentQuestion(currentQuestion + 1);
      slideAnim.setValue(100);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      animateToNext();
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    logger.info(LogCategories.USER_ACTION, 'Style quiz completed', {
      answers,
      totalQuestions: questions.length,
      screen: 'onboarding_style_quiz'
    });

    const stylePreferences = {
      colors: answers.colors || [],
      styles: answers.styles || [],
      occasions: answers.occasions || [],
      bodyType: answers.bodyType?.[0] || undefined,
      budget: answers.budget?.[0] || undefined,
    };

    const updatedData = {
      ...onboardingData,
      stylePreferences
    };

    setOnboardingData(updatedData);
    await saveProgress(updatedData, currentStep + 1);
    navigation.navigate('StyleDNA');
  };

  const handleSkip = async () => {
    logger.info(LogCategories.USER_ACTION, 'Style quiz skipped', {
      screen: 'onboarding_style_quiz'
    });

    const updatedData = {
      ...onboardingData,
      stylePreferences: {
        colors: [],
        styles: [],
        occasions: [],
      }
    };

    setOnboardingData(updatedData);
    await saveProgress(updatedData, currentStep + 1);
    navigation.navigate('StyleDNA');
  };

  const currentQuestionData = questions[currentQuestion];
  const currentAnswers = answers[currentQuestionData?.category] || [];
  const hasAnswer = currentAnswers.length > 0;

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
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

        <View style={styles.questionProgress}>
          <Text style={styles.questionNumber}>
            Question {currentQuestion + 1} of {questions.length}
          </Text>
        </View>
      </View>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }]
          }
        ]}
      >
        {currentQuestionData && (
          <Text style={styles.question}>{currentQuestionData.question}</Text>
        )}
        
        <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
          {currentQuestionData?.options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                currentAnswers.includes(option.value) && styles.selectedOption
              ]}
              onPress={() => handleAnswer(
                currentQuestionData.id, 
                option.value, 
                currentQuestionData.multiSelect
              )}
              activeOpacity={0.8}
            >
              <View style={styles.optionContent}>
                {option.icon && <Text style={styles.optionIcon}>{option.icon}</Text>}
                <Text style={[
                  styles.optionLabel,
                  currentAnswers.includes(option.value) && styles.selectedOptionText
                ]}>
                  {option.label}
                </Text>
              </View>
              {currentAnswers.includes(option.value) && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {currentQuestionData?.multiSelect && (
          <Text style={styles.multiSelectHint}>
            💡 You can select multiple options
          </Text>
        )}
      </Animated.View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.8}
        >
          <Text style={styles.skipButtonText}>Skip Quiz</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.nextButton,
            !hasAnswer && styles.disabledButton
          ]}
          onPress={handleNext}
          disabled={!hasAnswer}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.nextButtonText,
            !hasAnswer && styles.disabledButtonText
          ]}>
            {currentQuestion < questions.length - 1 ? 'Next' : 'Complete'}
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
  header: {
    marginBottom: 30,
  },
  progressContainer: {
    marginBottom: 20,
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
  questionProgress: {
    alignItems: 'center',
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  content: {
    flex: 1,
  },
  question: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 28,
  },
  optionsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedOption: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  multiSelectHint: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
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
  nextButton: {
    flex: 1,
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
  nextButtonText: {
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