import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

interface MarkAsWornModalProps {
  visible: boolean;
  onClose: () => void;
  onMarkAsWorn: (rating?: number, event?: string, location?: string) => void;
  outfitId: string;
}

export const MarkAsWornModal: React.FC<MarkAsWornModalProps> = ({
  visible,
  onClose,
  onMarkAsWorn,
  outfitId,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [event, setEvent] = useState<string>('');
  const [location, setLocation] = useState<string>('');

  const handleSubmit = () => {
    onMarkAsWorn(
      rating > 0 ? rating : undefined,
      event.trim() || undefined,
      location.trim() || undefined
    );
    
    // Reset form
    setRating(0);
    setEvent('');
    setLocation('');
    onClose();
  };

  const handleRatingPress = (selectedRating: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRating(selectedRating);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={onClose}
      >
        <Pressable style={styles.modalContent} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>👔 Mark Outfit as Worn</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.sectionTitle}>How was this outfit? ⭐</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => handleRatingPress(star)}
                style={styles.starButton}
              >
                <Text style={[
                  styles.starText,
                  star <= rating && styles.starTextActive
                ]}>
                  ⭐
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>
              {rating === 1 && '😕 Not great'}
              {rating === 2 && '😐 Okay'}
              {rating === 3 && '🙂 Good'}
              {rating === 4 && '😊 Great'}
              {rating === 5 && '🤩 Amazing!'}
            </Text>
          )}
          
          <Text style={styles.sectionTitle}>What was the occasion? 🎉</Text>
          <TextInput
            style={styles.textInput}
            value={event}
            onChangeText={setEvent}
            placeholder="e.g., Date night, Work meeting, Casual day..."
            placeholderTextColor="#999"
          />
          
          <Text style={styles.sectionTitle}>Where did you wear it? 📍</Text>
          <TextInput
            style={styles.textInput}
            value={location}
            onChangeText={setLocation}
            placeholder="e.g., Restaurant, Office, Park..."
            placeholderTextColor="#999"
          />
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.button, styles.cancelButton]}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.button, styles.submitButton]}
            >
              <Text style={styles.submitButtonText}>✅ Mark as Worn</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
    minWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
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
    color: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  starButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  starText: {
    fontSize: 32,
    opacity: 0.3,
  },
  starTextActive: {
    opacity: 1,
  },
  ratingLabel: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});