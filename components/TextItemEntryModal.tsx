import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { WardrobeItem } from '../hooks/useWardrobeData';

interface TextItemEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (item: Partial<WardrobeItem>) => Promise<void>;
  categories: string[];
  suggestedColors?: string[];
  suggestedMaterials?: string[];
  suggestedStyles?: string[];
}

const PRESET_COLORS = [
  'Black', 'White', 'Gray', 'Navy', 'Blue', 'Red', 'Green', 
  'Yellow', 'Orange', 'Purple', 'Pink', 'Brown', 'Beige', 'Khaki'
];

const PRESET_MATERIALS = [
  'Cotton', 'Polyester', 'Wool', 'Silk', 'Linen', 'Denim', 
  'Leather', 'Cashmere', 'Nylon', 'Rayon', 'Spandex'
];

const PRESET_STYLES = [
  'Casual', 'Formal', 'Business', 'Athletic', 'Vintage', 
  'Streetwear', 'Minimalist', 'Bohemian', 'Classic', 'Trendy'
];

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const TextItemEntryModal: React.FC<TextItemEntryModalProps> = ({
  visible,
  onClose,
  onSave,
  categories,
  suggestedColors = PRESET_COLORS,
  suggestedMaterials = PRESET_MATERIALS,
  suggestedStyles = PRESET_STYLES,
}) => {
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [material, setMaterial] = useState('');
  const [style, setStyle] = useState('');
  const [size, setSize] = useState('');
  const [brand, setBrand] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setDescription('');
    setTitle('');
    setCategory('');
    setColor('');
    setMaterial('');
    setStyle('');
    setSize('');
    setBrand('');
    setTags([]);
    setTagInput('');
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const validateForm = () => {
    if (!description.trim()) {
      Alert.alert('Missing Information', 'Please provide a description for the item.');
      return false;
    }
    if (!category) {
      Alert.alert('Missing Information', 'Please select a category for the item.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const allTags = [...tags];
      if (brand.trim()) {
        allTags.push(`brand:${brand.trim()}`);
      }
      allTags.push('text-entry');

      const newItem: Partial<WardrobeItem> = {
        image: 'text-only', // Special marker for text-only items
        title: title.trim() || description.trim(),
        description: description.trim(),
        category,
        color: color.trim(),
        material: material.trim(),
        style: style.trim(),
        fit: size.trim(),
        tags: allTags,
        laundryStatus: 'clean',
      };

      await onSave(newItem);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save item. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const QuickSelectButton = ({ value, onPress, selected }: { value: string; onPress: () => void; selected: boolean }) => (
    <TouchableOpacity
      style={[styles.quickSelectButton, selected && styles.quickSelectButtonSelected]}
      onPress={onPress}
    >
      <Text style={[styles.quickSelectButtonText, selected && styles.quickSelectButtonTextSelected]}>
        {value}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Item (No Photo)</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>{isLoading ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Blue striped dress shirt"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={200}
            />
            <Text style={styles.characterCount}>{description.length}/200</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Title (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Favorite Work Shirt"
              value={title}
              onChangeText={setTitle}
              maxLength={50}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickSelectContainer}>
              {categories.filter(cat => cat !== 'all').map(cat => (
                <QuickSelectButton
                  key={cat}
                  value={cat}
                  selected={category === cat}
                  onPress={() => setCategory(cat)}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Color</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Type a color or select below"
              value={color}
              onChangeText={setColor}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickSelectContainer}>
              {suggestedColors.map(c => (
                <QuickSelectButton
                  key={c}
                  value={c}
                  selected={color === c}
                  onPress={() => setColor(c)}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Material</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Type a material or select below"
              value={material}
              onChangeText={setMaterial}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickSelectContainer}>
              {suggestedMaterials.map(m => (
                <QuickSelectButton
                  key={m}
                  value={m}
                  selected={material === m}
                  onPress={() => setMaterial(m)}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Style</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Type a style or select below"
              value={style}
              onChangeText={setStyle}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickSelectContainer}>
              {suggestedStyles.map(s => (
                <QuickSelectButton
                  key={s}
                  value={s}
                  selected={style === s}
                  onPress={() => setStyle(s)}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Size</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickSelectContainer}>
              {COMMON_SIZES.map(s => (
                <QuickSelectButton
                  key={s}
                  value={s}
                  selected={size === s}
                  onPress={() => setSize(s)}
                />
              ))}
              <TextInput
                style={[styles.textInput, { width: 100, marginLeft: 10 }]}
                placeholder="Other"
                value={!COMMON_SIZES.includes(size) ? size : ''}
                onChangeText={setSize}
              />
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Brand (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Nike, Zara, H&M"
              value={brand}
              onChangeText={setBrand}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                placeholder="Add custom tags"
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={handleAddTag}
              />
              <TouchableOpacity style={styles.addTagButton} onPress={handleAddTag}>
                <Text style={styles.addTagButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.tag}
                  onPress={() => handleRemoveTag(tag)}
                >
                  <Text style={styles.tagText}>{tag} ×</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  cancelButton: {
    padding: 5,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  saveButton: {
    padding: 5,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 5,
  },
  quickSelectContainer: {
    marginTop: 10,
  },
  quickSelectButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 10,
  },
  quickSelectButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  quickSelectButtonText: {
    fontSize: 14,
    color: '#666',
  },
  quickSelectButtonTextSelected: {
    color: 'white',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addTagButton: {
    marginLeft: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#007AFF',
    borderRadius: 10,
  },
  addTagButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  tag: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#333',
  },
});