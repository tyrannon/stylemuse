import React from 'react';
import { View, Image, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { WardrobeItem } from '../../hooks/useWardrobeData';
import { SafeImage } from '../../utils/SafeImage';

interface ItemDetailViewProps {
  item: WardrobeItem;
  onBack: () => void;
  onSaveField: (field: string, value: string | string[]) => Promise<WardrobeItem>;
  onCategoryPress: () => void;
  onGenerateOutfitSuggestions: (item: WardrobeItem) => void;
  categorizeItem: (item: WardrobeItem) => string;
  
  // Editing states
  editingTitle: boolean;
  setEditingTitle: (editing: boolean) => void;
  editingColor: boolean;
  setEditingColor: (editing: boolean) => void;
  editingMaterial: boolean;
  setEditingMaterial: (editing: boolean) => void;
  editingStyle: boolean;
  setEditingStyle: (editing: boolean) => void;
  editingFit: boolean;
  setEditingFit: (editing: boolean) => void;
  editingTags: boolean;
  setEditingTags: (editing: boolean) => void;
  
  // Temp values
  tempTitle: string;
  setTempTitle: (value: string) => void;
  tempColor: string;
  setTempColor: (value: string) => void;
  tempMaterial: string;
  setTempMaterial: (value: string) => void;
  tempStyle: string;
  setTempStyle: (value: string) => void;
  tempFit: string;
  setTempFit: (value: string) => void;
  tempTags: string[];
  setTempTags: (tags: string[]) => void;
  newTagInput: string;
  setNewTagInput: (value: string) => void;
}

export const ItemDetailView: React.FC<ItemDetailViewProps> = ({
  item,
  onBack,
  onSaveField,
  onCategoryPress,
  onGenerateOutfitSuggestions,
  categorizeItem,
  editingTitle,
  setEditingTitle,
  editingColor,
  setEditingColor,
  editingMaterial,
  setEditingMaterial,
  editingStyle,
  setEditingStyle,
  editingFit,
  setEditingFit,
  editingTags,
  setEditingTags,
  tempTitle,
  setTempTitle,
  tempColor,
  setTempColor,
  tempMaterial,
  setTempMaterial,
  tempStyle,
  setTempStyle,
  tempFit,
  setTempFit,
  tempTags,
  setTempTags,
  newTagInput,
  setNewTagInput,
}) => {
  return (
    <View style={styles.itemDetailContainer}>
      {/* Header with back button */}
      <View style={styles.itemDetailHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back to Wardrobe</Text>
        </TouchableOpacity>
        <Text style={styles.itemDetailTitle}>
          {item.title || 'Clothing Item'}
        </Text>
      </View>

      {/* Item Image */}
      <View style={styles.itemDetailImageContainer}>
        <SafeImage
          uri={item.image}
          style={styles.itemDetailImage}
          resizeMode="contain"
        />
      </View>

      {/* Item Information */}
      <View style={styles.itemDetailInfo}>
        {/* Editable Title */}
        <View style={styles.itemDetailField}>
          <Text style={styles.itemDetailLabel}>Title:</Text>
          {editingTitle ? (
            <View style={styles.editFieldContainer}>
              <TextInput
                style={styles.editFieldInput}
                value={tempTitle}
                onChangeText={setTempTitle}
                placeholder="Item title"
                autoFocus
                onBlur={async () => {
                  await onSaveField('title', tempTitle);
                  setEditingTitle(false);
                }}
                onSubmitEditing={async () => {
                  await onSaveField('title', tempTitle);
                  setEditingTitle(false);
                }}
              />
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                setTempTitle(item.title || '');
                setEditingTitle(true);
              }}
              style={styles.editableField}
            >
              <Text style={styles.itemDetailValue}>
                {item.title || 'Tap to add title'}
              </Text>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.itemDetailDescription}>
          {item.description}
        </Text>
        
        {/* Category with dropdown */}
        <View style={styles.itemDetailField}>
          <Text style={styles.itemDetailLabel}>Category:</Text>
          <TouchableOpacity onPress={onCategoryPress} style={styles.categoryDropdownButton}>
            <Text style={styles.categoryDropdownText}>
              {categorizeItem(item).toUpperCase()}
            </Text>
            <Text style={styles.categoryDropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Editable Color */}
        <View style={styles.itemDetailField}>
          <Text style={styles.itemDetailLabel}>Color:</Text>
          {editingColor ? (
            <View style={styles.editFieldContainer}>
              <TextInput
                style={styles.editFieldInput}
                value={tempColor}
                onChangeText={setTempColor}
                placeholder="Color"
                autoFocus
                onBlur={async () => {
                  await onSaveField('color', tempColor);
                  setEditingColor(false);
                }}
                onSubmitEditing={async () => {
                  await onSaveField('color', tempColor);
                  setEditingColor(false);
                }}
              />
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                setTempColor(item.color || '');
                setEditingColor(true);
              }}
              style={styles.editableField}
            >
              <Text style={styles.itemDetailValue}>
                {item.color || 'Tap to add color'}
              </Text>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Editable Material */}
        <View style={styles.itemDetailField}>
          <Text style={styles.itemDetailLabel}>Material:</Text>
          {editingMaterial ? (
            <View style={styles.editFieldContainer}>
              <TextInput
                style={styles.editFieldInput}
                value={tempMaterial}
                onChangeText={setTempMaterial}
                placeholder="Material"
                autoFocus
                onBlur={async () => {
                  await onSaveField('material', tempMaterial);
                  setEditingMaterial(false);
                }}
                onSubmitEditing={async () => {
                  await onSaveField('material', tempMaterial);
                  setEditingMaterial(false);
                }}
              />
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                setTempMaterial(item.material || '');
                setEditingMaterial(true);
              }}
              style={styles.editableField}
            >
              <Text style={styles.itemDetailValue}>
                {item.material || 'Tap to add material'}
              </Text>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Editable Style */}
        <View style={styles.itemDetailField}>
          <Text style={styles.itemDetailLabel}>Style:</Text>
          {editingStyle ? (
            <View style={styles.editFieldContainer}>
              <TextInput
                style={styles.editFieldInput}
                value={tempStyle}
                onChangeText={setTempStyle}
                placeholder="Style"
                autoFocus
                onBlur={async () => {
                  await onSaveField('style', tempStyle);
                  setEditingStyle(false);
                }}
                onSubmitEditing={async () => {
                  await onSaveField('style', tempStyle);
                  setEditingStyle(false);
                }}
              />
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                setTempStyle(item.style || '');
                setEditingStyle(true);
              }}
              style={styles.editableField}
            >
              <Text style={styles.itemDetailValue}>
                {item.style || 'Tap to add style'}
              </Text>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Editable Fit */}
        <View style={styles.itemDetailField}>
          <Text style={styles.itemDetailLabel}>Fit:</Text>
          {editingFit ? (
            <View style={styles.editFieldContainer}>
              <TextInput
                style={styles.editFieldInput}
                value={tempFit}
                onChangeText={setTempFit}
                placeholder="Fit"
                autoFocus
                onBlur={async () => {
                  await onSaveField('fit', tempFit);
                  setEditingFit(false);
                }}
                onSubmitEditing={async () => {
                  await onSaveField('fit', tempFit);
                  setEditingFit(false);
                }}
              />
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                setTempFit(item.fit || '');
                setEditingFit(true);
              }}
              style={styles.editableField}
            >
              <Text style={styles.itemDetailValue}>
                {item.fit || 'Tap to add fit'}
              </Text>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Editable Tags */}
        <View style={styles.itemDetailField}>
          <Text style={styles.itemDetailLabel}>Tags:</Text>
          {editingTags ? (
            <View style={styles.editTagsContainer}>
              <View style={styles.tagsEditContainer}>
                {tempTags.map((tag: string, index: number) => (
                  <View key={index} style={styles.editableTag}>
                    <Text style={styles.editableTagText}>{tag}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const newTags = tempTags.filter((_, i) => i !== index);
                        setTempTags(newTags);
                      }}
                      style={styles.removeTagButton}
                    >
                      <Text style={styles.removeTagText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <View style={styles.addTagContainer}>
                <TextInput
                  style={styles.addTagInput}
                  value={newTagInput}
                  onChangeText={setNewTagInput}
                  placeholder="Add tag"
                  onSubmitEditing={() => {
                    if (newTagInput.trim()) {
                      setTempTags([...tempTags, newTagInput.trim()]);
                      setNewTagInput('');
                    }
                  }}
                />
                <TouchableOpacity
                  onPress={async () => {
                    await onSaveField('tags', tempTags);
                    setEditingTags(false);
                    setNewTagInput('');
                  }}
                  style={styles.saveTagsButton}
                >
                  <Text style={styles.saveTagsText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                setTempTags(item.tags || []);
                setEditingTags(true);
              }}
              style={styles.editableField}
            >
              <View style={styles.itemDetailTagsContainer}>
                {(item.tags || []).length > 0 ? (
                  item.tags!.map((tag: string, index: number) => (
                    <View key={index} style={styles.itemDetailTag}>
                      <Text style={styles.itemDetailTagText}>{tag}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.itemDetailValue}>Tap to add tags</Text>
                )}
              </View>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.itemDetailActions}>
          <TouchableOpacity
            onPress={() => onGenerateOutfitSuggestions(item)}
            style={[styles.itemDetailActionButton, { flex: 1 }]}
          >
            <Text style={styles.itemDetailActionButtonText}>🎨 Outfit Ideas</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  itemDetailContainer: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  itemDetailHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginBottom: 15,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  itemDetailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  itemDetailImageContainer: {
    padding: 20,
    alignItems: 'center',
  },
  itemDetailImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  itemDetailInfo: {
    padding: 20,
  },
  itemDetailDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  itemDetailField: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  itemDetailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
    minWidth: 80,
  },
  itemDetailValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  itemDetailTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  itemDetailTag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  itemDetailTagText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  itemDetailActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  itemDetailActionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemDetailActionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Editable field styles
  editableField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
  },
  editIcon: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  editFieldContainer: {
    flex: 1,
  },
  editFieldInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#333',
  },
  categoryDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginLeft: 8,
    minWidth: 100,
  },
  categoryDropdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  categoryDropdownArrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  // Tag editing styles
  editTagsContainer: {
    flex: 1,
  },
  tagsEditContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  editableTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  editableTagText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  removeTagButton: {
    marginLeft: 4,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeTagText: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  addTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addTagInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    marginRight: 8,
  },
  saveTagsButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveTagsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});