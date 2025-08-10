/**
 * Streak Calendar Screen - Duolingo-style monthly calendar view
 * Shows streak history, freezes used, and achievement milestones
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { streakService, StreakData } from '../services/StreakService';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');
const CALENDAR_PADDING = 20;
const DAY_SIZE = (screenWidth - CALENDAR_PADDING * 2 - 6 * 8) / 7; // 7 days, 6 gaps

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  hasStreak: boolean;
  freezeUsed: boolean;
  isToday: boolean;
  isFuture: boolean;
  streakNumber?: number;
}

export default function StreakCalendarScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);

  useEffect(() => {
    loadStreakData();
  }, []);

  useEffect(() => {
    if (streakData) {
      generateCalendarDays();
    }
  }, [currentMonth, streakData]);

  const loadStreakData = async () => {
    try {
      setLoading(true);
      const data = await streakService.getStreakData();
      setStreakData(data);
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to load streak data', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const today = new Date();
    
    const days: CalendarDay[] = [];
    
    // Add previous month's trailing days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        hasStreak: checkStreakForDate(date),
        freezeUsed: checkFreezeForDate(date),
        isToday: isSameDay(date, today),
        isFuture: date > today,
      });
    }
    
    // Add current month's days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const hasStreak = checkStreakForDate(date);
      days.push({
        date,
        dayNumber: day,
        isCurrentMonth: true,
        hasStreak,
        freezeUsed: checkFreezeForDate(date),
        isToday: isSameDay(date, today),
        isFuture: date > today,
        streakNumber: hasStreak ? getStreakNumberForDate(date) : undefined,
      });
    }
    
    // Add next month's leading days to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        dayNumber: day,
        isCurrentMonth: false,
        hasStreak: false,
        freezeUsed: false,
        isToday: false,
        isFuture: true,
      });
    }
    
    setCalendarDays(days);
  };

  const checkStreakForDate = (date: Date): boolean => {
    if (!streakData) return false;
    
    const dateKey = date.toISOString().split('T')[0];
    const lastActiveDate = new Date(streakData.lastActiveDate);
    const streakStartDate = new Date(streakData.streakStartDate);
    
    // Check if date is within current streak range
    if (date <= lastActiveDate && date >= streakStartDate) {
      // This is a simplified check - in production, you'd want to track each day
      return true;
    }
    
    // Check monthly stats for historical data
    const monthKey = dateKey.substring(0, 7);
    if (streakData.monthlyStats[monthKey]) {
      // Simplified - assumes consecutive days in month
      return true;
    }
    
    return false;
  };

  const checkFreezeForDate = (date: Date): boolean => {
    // This would check if a freeze was used on this date
    // For now, return false - you'd need to track this in StreakData
    return false;
  };

  const getStreakNumberForDate = (date: Date): number => {
    if (!streakData) return 0;
    
    // Calculate the streak number for this specific date
    const startDate = new Date(streakData.streakStartDate);
    const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(daysDiff + 1, streakData.currentStreak);
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const changeMonth = (direction: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  };

  const getMonthYear = () => {
    return currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDayColor = (day: CalendarDay): string => {
    if (day.isFuture) return theme.border;
    if (day.isToday) return '#FFD700';
    if (day.freezeUsed) return '#60A5FA';
    if (day.hasStreak) {
      if (day.streakNumber && day.streakNumber >= 100) return '#9333EA';
      if (day.streakNumber && day.streakNumber >= 30) return '#FF6B6B';
      if (day.streakNumber && day.streakNumber >= 7) return '#FFA500';
      return '#10B981';
    }
    return theme.border;
  };

  const renderCalendarDay = (day: CalendarDay, index: number) => {
    const dayColor = getDayColor(day);
    const isActive = day.hasStreak || day.isToday;
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.dayContainer,
          {
            backgroundColor: isActive ? dayColor : 'transparent',
            borderColor: dayColor,
            borderWidth: day.isToday ? 2 : 1,
            opacity: day.isCurrentMonth ? 1 : 0.3,
          },
        ]}
        activeOpacity={0.7}
        disabled={day.isFuture}
      >
        <Text
          style={[
            styles.dayNumber,
            {
              color: isActive ? '#FFFFFF' : theme.text,
              fontWeight: day.isToday ? 'bold' : 'normal',
            },
          ]}
        >
          {day.dayNumber}
        </Text>
        {day.hasStreak && day.streakNumber && (
          <Text style={styles.streakBadge}>🔥</Text>
        )}
        {day.freezeUsed && (
          <Text style={styles.freezeBadge}>❄️</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: theme.accent }]}>✕</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Streak Calendar</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Current Streak Summary */}
        <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#FF6B6B' }]}>
                {streakData?.currentStreak || 0}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Current Streak
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#9333EA' }]}>
                {streakData?.longestStreak || 0}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Longest Streak
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#60A5FA' }]}>
                {streakData?.streakFreezes || 0}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Freezes Available
              </Text>
            </View>
          </View>
        </View>

        {/* Month Navigation */}
        <View style={styles.monthNavigation}>
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => changeMonth(-1)}
          >
            <Text style={[styles.monthButtonText, { color: theme.accent }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: theme.text }]}>
            {getMonthYear()}
          </Text>
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => changeMonth(1)}
          >
            <Text style={[styles.monthButtonText, { color: theme.accent }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendar}>
          {/* Day Labels */}
          <View style={styles.weekLabels}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <View key={index} style={styles.weekLabelContainer}>
                <Text style={[styles.weekLabel, { color: theme.textSecondary }]}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Days */}
          <View style={styles.daysGrid}>
            {calendarDays.map((day, index) => renderCalendarDay(day, index))}
          </View>
        </View>

        {/* Legend */}
        <View style={[styles.legend, { backgroundColor: theme.surface }]}>
          <Text style={[styles.legendTitle, { color: theme.text }]}>Legend</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>
                Active Day
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#FFD700' }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>
                Today
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#60A5FA' }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>
                Freeze Used
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#FF6B6B' }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>
                30+ Days
              </Text>
            </View>
          </View>
        </View>

        {/* Milestones */}
        <View style={[styles.milestonesSection, { backgroundColor: theme.surface }]}>
          <Text style={[styles.milestonesTitle, { color: theme.text }]}>
            Milestones
          </Text>
          {streakData?.milestones.map((milestone) => (
            <View
              key={milestone.days}
              style={[
                styles.milestoneRow,
                milestone.achieved && styles.milestoneAchieved,
              ]}
            >
              <Text
                style={[
                  styles.milestoneDays,
                  { color: milestone.achieved ? '#10B981' : theme.textSecondary },
                ]}
              >
                {milestone.days} days
              </Text>
              <Text style={[styles.milestoneReward, { color: theme.textSecondary }]}>
                {milestone.reward.type === 'coins' && `🪙 ${milestone.reward.amount}`}
                {milestone.reward.type === 'gems' && `💎 ${milestone.reward.amount}`}
                {milestone.reward.type === 'freeze' && `❄️ ${milestone.reward.amount}`}
                {milestone.reward.type === 'achievement' && `🏆 ${milestone.reward.name}`}
              </Text>
              {milestone.achieved && (
                <Text style={styles.milestoneCheck}>✓</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  summaryCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  monthButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  calendar: {
    paddingHorizontal: CALENDAR_PADDING,
  },
  weekLabels: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekLabelContainer: {
    width: DAY_SIZE,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayContainer: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    margin: 4,
    borderRadius: DAY_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayNumber: {
    fontSize: 14,
  },
  streakBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    fontSize: 8,
  },
  freezeBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    fontSize: 8,
  },
  legend: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
  milestonesSection: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  milestonesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  milestoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  milestoneAchieved: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  milestoneDays: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  milestoneReward: {
    fontSize: 14,
    flex: 2,
    textAlign: 'center',
  },
  milestoneCheck: {
    fontSize: 18,
    color: '#10B981',
  },
});