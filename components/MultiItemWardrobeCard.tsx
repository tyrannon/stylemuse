import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeImage } from '../utils/SafeImage';
import { BoundingBoxOverlay } from './BoundingBoxOverlay';
import { WardrobeItem } from '../hooks/useWardrobeData';
import { SafeArea } from '../utils/SafeArea';

const { width: screenWidth } = Dimensions.get('window');

interface MultiItemWardrobeCardProps {
  item: WardrobeItem;
  relatedItems?: WardrobeItem[]; // Other items detected in the same photo
  onPress?: () => void;
  style?: any;
}

export const MultiItemWardrobeCard: React.FC<MultiItemWardrobeCardProps> = ({
  item,
  relatedItems = [],
  onPress,
  style,
}) => {
  const [showBoundingBoxModal, setShowBoundingBoxModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const isMultiItem = item.multiItemData?.isFromMultiDetection;

  if (!isMultiItem) {
    // Regular wardrobe item card
    return (
      <TouchableOpacity
        style={[styles.card, style]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <SafeImage
          uri={item.image}
          style={styles.itemImage}
          resizeMode="cover"
        />
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.itemDescription} numberOfLines={1}>
            {item.description}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Multi-item detected card with bounding box overlay feature
  const allDetectedItems = [item, ...relatedItems].filter(relatedItem => 
    relatedItem.multiItemData?.originalImage === item.multiItemData?.originalImage
  );

  const boundingBoxes = allDetectedItems.map(detectedItem => ({
    id: detectedItem.multiItemData?.detectionId || 0,
    itemType: detectedItem.multiItemData?.itemType || 'item',
    description: detectedItem.title || 'Unknown item',
    boundingBox: detectedItem.multiItemData?.boundingBox || {
      top_left: [0, 0],
      bottom_right: [100, 100],
    },
    confidence: detectedItem.multiItemData?.confidence || 0,
    color: detectedItem === item ? '#FF6B6B' : undefined, // Highlight current item
  }));

  return (
    <>
      <TouchableOpacity
        style={[styles.card, styles.multiItemCard, style]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {/* Main item image */}
        <SafeImage
          uri={item.image}
          style={styles.itemImage}
          resizeMode="cover"
        />
        
        {/* Multi-item detection indicator */}
        <View style={styles.multiItemBadge}>
          <Text style={styles.multiItemBadgeText}>
            🔍 {allDetectedItems.length}
          </Text>
        </View>

        {/* Bounding box preview button */}
        <TouchableOpacity
          style={styles.boundingBoxButton}
          onPress={(e) => {
            e.stopPropagation();
            setShowBoundingBoxModal(true);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.boundingBoxButtonText}>📦</Text>
        </TouchableOpacity>

        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.itemDescription} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={styles.detectionInfo}>
            Detected with {allDetectedItems.length - 1} other item{allDetectedItems.length - 1 !== 1 ? 's' : ''}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Bounding Box Modal */}
      <Modal
        visible={showBoundingBoxModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeArea style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowBoundingBoxModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Multi-Item Detection</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              AI detected {allDetectedItems.length} items in this photo:
            </Text>
            
            <BoundingBoxOverlay
              imageUri={item.multiItemData?.originalImage || item.image}
              boundingBoxes={boundingBoxes}
              imageWidth={screenWidth - 40}
              imageHeight={300}
              showLabels={true}
            />

            <View style={styles.detectedItemsList}>
              <Text style={styles.listTitle}>Detected Items:</Text>
              {allDetectedItems.map((detectedItem, index) => (
                <View key={index} style={styles.detectedItemRow}>
                  <Text style={styles.detectedItemEmoji}>
                    {detectedItem === item ? '🎯' : '📦'}
                  </Text>
                  <View style={styles.detectedItemText}>
                    <Text style={[
                      styles.detectedItemTitle,
                      detectedItem === item && styles.currentItemTitle
                    ]}>
                      {detectedItem.title}
                      {detectedItem === item && ' (Current)'}
                    </Text>
                    <Text style={styles.detectedItemConfidence}>
                      {detectedItem.multiItemData?.confidence}% confidence
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </SafeArea>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 8,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  multiItemCard: {
    borderWidth: 2,
    borderColor: '#667eea',
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: 200,
  },
  multiItemBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#667eea',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  multiItemBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  boundingBoxButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boundingBoxButtonText: {
    fontSize: 16,
  },
  itemInfo: {
    padding: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detectionInfo: {
    fontSize: 12,
    color: '#667eea',
    fontStyle: 'italic',
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
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  detectedItemsList: {
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  detectedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detectedItemEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  detectedItemText: {
    flex: 1,
  },
  detectedItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  currentItemTitle: {
    color: '#FF6B6B',
  },
  detectedItemConfidence: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});