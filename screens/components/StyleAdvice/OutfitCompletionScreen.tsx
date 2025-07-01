import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const OutfitCompletionScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.comingSoon}>
        <Text style={styles.comingSoonIcon}>✨</Text>
        <Text style={styles.comingSoonTitle}>Outfit Completion</Text>
        <Text style={styles.comingSoonText}>
          Coming in Phase 2! This feature will help you complete your outfits by suggesting missing pieces.
        </Text>
        <Text style={styles.comingSoonFeatures}>
          • AI-powered outfit analysis{'\n'}
          • Missing piece identification{'\n'}
          • Smart completion suggestions{'\n'}
          • Style compatibility scoring
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  comingSoon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  comingSoonIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  comingSoonFeatures: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'left',
    lineHeight: 20,
  },
});