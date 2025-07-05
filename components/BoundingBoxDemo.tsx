import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
} from 'react-native';
import { BoundingBoxOverlay } from './BoundingBoxOverlay';
import { SafeArea } from '../utils/SafeArea';

const { width: screenWidth } = Dimensions.get('window');

// Mock data to demonstrate the bounding box functionality
const mockDetectedItems = [
  {
    id: 1,
    itemType: 't-shirt',
    description: 'White cotton t-shirt',
    boundingBox: {
      top_left: [20, 15],
      bottom_right: [65, 60]
    },
    confidence: 95,
    color: '#FF6B6B', // Red
  },
  {
    id: 2,
    itemType: 'jeans',
    description: 'Blue denim jeans',
    boundingBox: {
      top_left: [10, 55],
      bottom_right: [70, 95]
    },
    confidence: 88,
    color: '#4ECDC4', // Teal
  },
  {
    id: 3,
    itemType: 'cap',
    description: 'Baseball cap',
    boundingBox: {
      top_left: [70, 10],
      bottom_right: [95, 35]
    },
    confidence: 92,
    color: '#45B7D1', // Blue
  },
];

export const BoundingBoxDemo: React.FC = () => {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.demoButton}
        onPress={() => setShowDemo(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.demoButtonText}>🔍 Demo Bounding Box Detection</Text>
      </TouchableOpacity>

      <Modal
        visible={showDemo}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeArea style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDemo(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Multi-Item Detection Demo</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.description}>
              This demonstrates how AI detects multiple clothing items in a single photo and shows precise bounding boxes around each detected item.
            </Text>
            
            <BoundingBoxOverlay
              imageUri="https://via.placeholder.com/400x300/f0f0f0/333333?text=Demo+Multi-Item+Photo"
              boundingBoxes={mockDetectedItems}
              imageWidth={screenWidth - 40}
              imageHeight={250}
              showLabels={true}
            />

            <View style={styles.featureList}>
              <Text style={styles.featureTitle}>✨ Multi-Item Detection Features:</Text>
              <Text style={styles.featureItem}>🎯 Precise bounding box coordinates</Text>
              <Text style={styles.featureItem}>🏷️ Individual item analysis and tagging</Text>
              <Text style={styles.featureItem}>📊 Confidence scoring for each detection</Text>
              <Text style={styles.featureItem}>🔗 Related item grouping and navigation</Text>
              <Text style={styles.featureItem}>📱 Interactive overlay visualization</Text>
              <Text style={styles.featureItem}>🎨 Color-coded detection indicators</Text>
            </View>

            <Text style={styles.instructions}>
              When you use the Multi-Item Detection feature in StyleMuse, each detected item will be saved to your wardrobe with these visual indicators showing exactly where it was found in the original photo!
            </Text>
          </View>
        </SafeArea>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  demoButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    margin: 10,
    alignItems: 'center',
  },
  demoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  featureList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  featureItem: {
    fontSize: 14,
    color: '#666',
    paddingVertical: 4,
    lineHeight: 20,
  },
  instructions: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});