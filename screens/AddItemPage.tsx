import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import * as Haptics from 'expo-haptics';

interface AddItemPageProps {
  onCameraPress: () => void;
  onPhotoLibraryPress: () => void;
  onBulkUploadPress: () => void;
  onTextEntryPress: () => void;
}

export const AddItemPage: React.FC<AddItemPageProps> = ({
  onCameraPress,
  onPhotoLibraryPress,
  onBulkUploadPress,
  onTextEntryPress,
}) => {
  const handleOptionPress = (action: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    action();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Add to Wardrobe</Text>
        <Text style={styles.subtitle}>Choose how you want to add items to your collection</Text>
        
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.option}
            onPress={() => handleOptionPress(onCameraPress)}
            activeOpacity={0.8}
          >
            <View style={styles.optionIcon}>
              <Text style={styles.optionEmoji}>📸</Text>
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Camera</Text>
              <Text style={styles.optionSubtitle}>Take a photo of your clothing</Text>
            </View>
            <Text style={styles.optionArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.option}
            onPress={() => handleOptionPress(onPhotoLibraryPress)}
            activeOpacity={0.8}
          >
            <View style={styles.optionIcon}>
              <Text style={styles.optionEmoji}>📷</Text>
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Single Photo</Text>
              <Text style={styles.optionSubtitle}>Select one photo with "Add Another" flow</Text>
            </View>
            <Text style={styles.optionArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.option}
            onPress={() => handleOptionPress(onBulkUploadPress)}
            activeOpacity={0.8}
          >
            <View style={styles.optionIcon}>
              <Text style={styles.optionEmoji}>📚</Text>
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Bulk Upload</Text>
              <Text style={styles.optionSubtitle}>Select multiple photos at once (up to 10)</Text>
            </View>
            <Text style={styles.optionArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.option}
            onPress={() => handleOptionPress(onTextEntryPress)}
            activeOpacity={0.8}
          >
            <View style={styles.optionIcon}>
              <Text style={styles.optionEmoji}>📝</Text>
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Text Entry</Text>
              <Text style={styles.optionSubtitle}>Add items without photos</Text>
            </View>
            <Text style={styles.optionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Pro Tips</Text>
          <View style={styles.tip}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Camera gives best AI analysis results</Text>
          </View>
          <View style={styles.tip}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Single Photo has "Add Another" convenience</Text>
          </View>
          <View style={styles.tip}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Bulk Upload processes up to 10 photos at once</Text>
          </View>
          <View style={styles.tip}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Text Entry is perfect for quick cataloging</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  optionIcon: {
    width: 56,
    height: 56,
    backgroundColor: '#f0f7ff',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionEmoji: {
    fontSize: 28,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  optionArrow: {
    fontSize: 24,
    color: '#ccc',
    marginLeft: 12,
  },
  tipsContainer: {
    marginTop: 40,
    backgroundColor: '#fff9e6',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffe4b5',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  tip: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
});