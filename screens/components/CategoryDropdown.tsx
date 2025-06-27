import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Pressable, StyleSheet } from 'react-native';

interface CategoryDropdownProps {
  visible: boolean;
  onClose: () => void;
  selectedCategory: string;
  availableCategories: string[];
  onSelectCategory: (category: string) => void;
}

export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  visible,
  onClose,
  selectedCategory,
  availableCategories,
  onSelectCategory,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.categoryModalOverlay}
        onPress={onClose}
      >
        <Pressable style={styles.categoryModalContent} onPress={() => {}}>
          <View style={styles.categoryModalHeader}>
            <Text style={styles.categoryModalTitle}>Select Category</Text>
            <Text style={{ fontSize: 12, color: '#666' }}>
              Debug: {visible ? 'Visible' : 'Hidden'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.categoryModalScroll}>
            {availableCategories.map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => onSelectCategory(category)}
                style={[
                  styles.categoryOption,
                  selectedCategory === category && styles.categoryOptionSelected
                ]}
              >
                <Text style={[
                  styles.categoryOptionText,
                  selectedCategory === category && styles.categoryOptionTextSelected
                ]}>
                  {category.toUpperCase()}
                </Text>
                {selectedCategory === category && (
                  <Text style={styles.categoryCheckmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  categoryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  categoryModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  categoryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
  categoryModalScroll: {
    maxHeight: 300,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 4,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  categoryOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoryOptionTextSelected: {
    color: 'white',
  },
  categoryCheckmark: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});