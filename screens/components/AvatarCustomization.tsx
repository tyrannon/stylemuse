import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { EnhancedStyleDNA, AvatarCustomizationSection } from '../../types/Avatar';
import { AvatarVisualization } from './AvatarVisualization';
import { generateAvatarImage } from '../../utils/avatarGeneration';
import * as Haptics from 'expo-haptics';

interface AvatarCustomizationProps {
  visible: boolean;
  onClose: () => void;
  currentStyleDNA: EnhancedStyleDNA | null;
  onSave: (updatedStyleDNA: EnhancedStyleDNA) => void;
  selectedGender?: string | null;
}

export const AvatarCustomization: React.FC<AvatarCustomizationProps> = ({
  visible,
  onClose,
  currentStyleDNA,
  onSave,
  selectedGender,
}) => {
  const [styleDNA, setStyleDNA] = useState<EnhancedStyleDNA>(currentStyleDNA || {});
  const [activeSection, setActiveSection] = useState<string>('personal');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

  useEffect(() => {
    if (currentStyleDNA) {
      setStyleDNA(currentStyleDNA);
    }
  }, [currentStyleDNA]);

  const sections: AvatarCustomizationSection[] = [
    {
      id: 'personal',
      title: 'Personal Info',
      icon: '👤',
      description: 'Basic information about you',
      completed: !!(styleDNA.personal_info?.name && styleDNA.personal_info?.age_range),
      fields: [],
    },
    {
      id: 'measurements',
      title: 'Measurements & Sizes',
      icon: '📏',
      description: 'Body measurements and clothing sizes',
      completed: !!(styleDNA.physical_attributes?.clothing_sizes?.tops && styleDNA.physical_attributes?.clothing_sizes?.bottoms),
      fields: [],
    },
    {
      id: 'physical',
      title: 'Physical Attributes',
      icon: '🎨',
      description: 'Hair, skin tone, body type',
      completed: !!(styleDNA.physical_attributes?.hair_color && styleDNA.physical_attributes?.hair_length && styleDNA.physical_attributes?.skin_tone),
      fields: [],
    },
    {
      id: 'style',
      title: 'Style Profile',
      icon: '✨',
      description: 'Your fashion preferences and style goals',
      completed: !!(styleDNA.style_profile?.style_archetypes?.length && styleDNA.style_profile?.fashion_goals?.length),
      fields: [],
    },
    {
      id: 'lifestyle',
      title: 'Lifestyle & Goals',
      icon: '🎯',
      description: 'Your lifestyle and wardrobe goals',
      completed: !!(styleDNA.lifestyle?.occupation && styleDNA.lifestyle?.lifestyle?.length),
      fields: [],
    },
  ];

  const updateField = (path: string, value: any) => {
    setHasUnsavedChanges(true);
    const pathParts = path.split('.');
    setStyleDNA(prev => {
      const updated = { ...prev };
      let current: any = updated;
      
      // Navigate to the parent object
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!current[pathParts[i]]) {
          current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
      }
      
      // Set the final value
      current[pathParts[pathParts.length - 1]] = value;
      
      return updated;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleArrayValue = (path: string, value: string) => {
    const pathParts = path.split('.');
    setStyleDNA(prev => {
      const updated = { ...prev };
      let current: any = updated;
      
      // Navigate to the parent object
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!current[pathParts[i]]) {
          current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
      }
      
      const fieldName = pathParts[pathParts.length - 1];
      const currentArray = current[fieldName] || [];
      
      if (currentArray.includes(value)) {
        current[fieldName] = currentArray.filter((item: string) => item !== value);
      } else {
        current[fieldName] = [...currentArray, value];
      }
      
      setHasUnsavedChanges(true);
      return updated;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = async () => {
    setIsGeneratingAvatar(true);
    
    try {
      // Generate avatar image based on customization
      const avatarImageUrl = await generateAvatarImage(styleDNA, selectedGender);
      
      const updatedStyleDNA = {
        ...styleDNA,
        avatar_image_url: avatarImageUrl,
        updated_at: new Date(),
        version: (styleDNA.version || 0) + 1,
      };
      
      onSave(updatedStyleDNA);
      setHasUnsavedChanges(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (error) {
      console.error('Error saving avatar:', error);
      // Save without avatar image if generation fails
      const updatedStyleDNA = {
        ...styleDNA,
        updated_at: new Date(),
        version: (styleDNA.version || 0) + 1,
      };
      
      onSave(updatedStyleDNA);
      setHasUnsavedChanges(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onClose();
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save them before closing?',
        [
          { text: 'Discard', style: 'destructive', onPress: onClose },
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save', onPress: handleSave },
        ]
      );
    } else {
      onClose();
    }
  };

  const renderPersonalInfo = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>👤 Personal Information</Text>
      
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Name</Text>
        <TextInput
          style={styles.textInput}
          value={styleDNA.personal_info?.name || ''}
          onChangeText={(value) => updateField('personal_info.name', value)}
          placeholder="What should we call you?"
          placeholderTextColor="#999"
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Age Range</Text>
        <View style={styles.optionGrid}>
          {['18-25', '26-35', '36-45', '46-55', '56-65', '65+'].map(age => (
            <TouchableOpacity
              key={age}
              style={[
                styles.optionButton,
                styleDNA.personal_info?.age_range === age && styles.optionButtonSelected
              ]}
              onPress={() => updateField('personal_info.age_range', age)}
            >
              <Text style={[
                styles.optionButtonText,
                styleDNA.personal_info?.age_range === age && styles.optionButtonTextSelected
              ]}>
                {age}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Pronouns</Text>
        <View style={styles.optionGrid}>
          {['she/her', 'he/him', 'they/them', 'other'].map(pronoun => (
            <TouchableOpacity
              key={pronoun}
              style={[
                styles.optionButton,
                styleDNA.personal_info?.pronouns === pronoun && styles.optionButtonSelected
              ]}
              onPress={() => updateField('personal_info.pronouns', pronoun)}
            >
              <Text style={[
                styles.optionButtonText,
                styleDNA.personal_info?.pronouns === pronoun && styles.optionButtonTextSelected
              ]}>
                {pronoun}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderMeasurements = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>📏 Clothing Sizes</Text>
      
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Tops Size</Text>
        <View style={styles.optionGrid}>
          {['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(size => (
            <TouchableOpacity
              key={size}
              style={[
                styles.optionButton,
                styleDNA.physical_attributes?.clothing_sizes?.tops === size && styles.optionButtonSelected
              ]}
              onPress={() => updateField('physical_attributes.clothing_sizes.tops', size)}
            >
              <Text style={[
                styles.optionButtonText,
                styleDNA.physical_attributes?.clothing_sizes?.tops === size && styles.optionButtonTextSelected
              ]}>
                {size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Bottoms Size</Text>
        <View style={styles.optionGrid}>
          {['24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '36', '38', '40'].map(size => (
            <TouchableOpacity
              key={size}
              style={[
                styles.optionButton,
                styleDNA.physical_attributes?.clothing_sizes?.bottoms === size && styles.optionButtonSelected
              ]}
              onPress={() => updateField('physical_attributes.clothing_sizes.bottoms', size)}
            >
              <Text style={[
                styles.optionButtonText,
                styleDNA.physical_attributes?.clothing_sizes?.bottoms === size && styles.optionButtonTextSelected
              ]}>
                {size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Shoe Size</Text>
        <View style={styles.optionGrid}>
          {['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12'].map(size => (
            <TouchableOpacity
              key={size}
              style={[
                styles.optionButton,
                styleDNA.physical_attributes?.clothing_sizes?.shoes === size && styles.optionButtonSelected
              ]}
              onPress={() => updateField('physical_attributes.clothing_sizes.shoes', size)}
            >
              <Text style={[
                styles.optionButtonText,
                styleDNA.physical_attributes?.clothing_sizes?.shoes === size && styles.optionButtonTextSelected
              ]}>
                {size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Height</Text>
        <TextInput
          style={styles.textInput}
          value={styleDNA.physical_attributes?.body_measurements?.height || ''}
          onChangeText={(value) => updateField('physical_attributes.body_measurements.height', value)}
          placeholder="e.g., 5'6&quot; or 168cm"
          placeholderTextColor="#999"
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />
      </View>
    </View>
  );

  const renderPhysicalAttributes = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>🎨 Physical Attributes</Text>
      
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Hair Color</Text>
        <TextInput
          style={styles.textInput}
          value={styleDNA.physical_attributes?.hair_color || ''}
          onChangeText={(value) => updateField('physical_attributes.hair_color', value)}
          placeholder="e.g., Brown, Blonde, Black, Red"
          placeholderTextColor="#999"
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Hair Length</Text>
        <View style={styles.optionGrid}>
          {['Very Short', 'Short', 'Medium', 'Long', 'Very Long', 'Bald'].map(length => (
            <TouchableOpacity
              key={length}
              style={[
                styles.optionButton,
                styleDNA.physical_attributes?.hair_length === length && styles.optionButtonSelected
              ]}
              onPress={() => updateField('physical_attributes.hair_length', length)}
            >
              <Text style={[
                styles.optionButtonText,
                styleDNA.physical_attributes?.hair_length === length && styles.optionButtonTextSelected
              ]}>
                {length}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Hair Style</Text>
        <View style={styles.optionGrid}>
          {['Straight', 'Wavy', 'Curly', 'Coily', 'Buzz Cut', 'Pixie', 'Bob', 'Layers', 'Bangs', 'Updo', 'Braids', 'Locs'].map(style => (
            <TouchableOpacity
              key={style}
              style={[
                styles.optionButton,
                styleDNA.physical_attributes?.hair_style === style && styles.optionButtonSelected
              ]}
              onPress={() => updateField('physical_attributes.hair_style', style)}
            >
              <Text style={[
                styles.optionButtonText,
                styleDNA.physical_attributes?.hair_style === style && styles.optionButtonTextSelected
              ]}>
                {style}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Skin Tone</Text>
        <View style={styles.optionGrid}>
          {['Fair', 'Light', 'Medium', 'Olive', 'Dark', 'Deep'].map(tone => (
            <TouchableOpacity
              key={tone}
              style={[
                styles.optionButton,
                styleDNA.physical_attributes?.skin_tone === tone && styles.optionButtonSelected
              ]}
              onPress={() => updateField('physical_attributes.skin_tone', tone)}
            >
              <Text style={[
                styles.optionButtonText,
                styleDNA.physical_attributes?.skin_tone === tone && styles.optionButtonTextSelected
              ]}>
                {tone}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Body Type</Text>
        <View style={styles.optionGrid}>
          {['Pear', 'Apple', 'Hourglass', 'Rectangle', 'Athletic', 'Inverted Triangle', 'Not Sure'].map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.optionButton,
                styleDNA.physical_attributes?.body_type === type && styles.optionButtonSelected
              ]}
              onPress={() => updateField('physical_attributes.body_type', type)}
            >
              <Text style={[
                styles.optionButtonText,
                styleDNA.physical_attributes?.body_type === type && styles.optionButtonTextSelected
              ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStyleProfile = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>✨ Style Preferences</Text>
      
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Style Archetypes (select all that apply)</Text>
        <View style={styles.optionGrid}>
          {['Classic', 'Bohemian', 'Minimalist', 'Edgy', 'Romantic', 'Trendy', 'Preppy', 'Artsy', 'Sporty', 'Glamorous'].map(style => (
            <TouchableOpacity
              key={style}
              style={[
                styles.optionButton,
                (styleDNA.style_profile?.style_archetypes || []).includes(style as any) && styles.optionButtonSelected
              ]}
              onPress={() => toggleArrayValue('style_profile.style_archetypes', style)}
            >
              <Text style={[
                styles.optionButtonText,
                (styleDNA.style_profile?.style_archetypes || []).includes(style as any) && styles.optionButtonTextSelected
              ]}>
                {style}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Fashion Goals (select all that apply)</Text>
        <View style={styles.optionGrid}>
          {['Look Professional', 'Express Creativity', 'Feel Comfortable', 'Stand Out', 'Fit In', 'Look Younger', 'Look Sophisticated', 'Save Money', 'Be Sustainable'].map(goal => (
            <TouchableOpacity
              key={goal}
              style={[
                styles.optionButton,
                (styleDNA.style_profile?.fashion_goals || []).includes(goal as any) && styles.optionButtonSelected
              ]}
              onPress={() => toggleArrayValue('style_profile.fashion_goals', goal)}
            >
              <Text style={[
                styles.optionButtonText,
                (styleDNA.style_profile?.fashion_goals || []).includes(goal as any) && styles.optionButtonTextSelected
              ]}>
                {goal}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Favorite Colors</Text>
        <TextInput
          style={styles.textInput}
          value={styleDNA.style_profile?.color_preferences?.favorite_colors?.join(', ') || ''}
          onChangeText={(value) => updateField('style_profile.color_preferences.favorite_colors', value.split(', ').filter(c => c.trim()))}
          placeholder="e.g., Navy, Black, Rose Gold, Emerald"
          placeholderTextColor="#999"
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />
      </View>
    </View>
  );

  const renderLifestyle = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>🎯 Lifestyle & Goals</Text>
      
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Occupation</Text>
        <TextInput
          style={styles.textInput}
          value={styleDNA.lifestyle?.occupation || ''}
          onChangeText={(value) => updateField('lifestyle.occupation', value)}
          placeholder="e.g., Software Engineer, Teacher, Designer"
          placeholderTextColor="#999"
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Lifestyle (select all that apply)</Text>
        <View style={styles.optionGrid}>
          {['Active', 'Professional', 'Creative', 'Student', 'Parent', 'Retired', 'Travel Often', 'Work from Home'].map(lifestyle => (
            <TouchableOpacity
              key={lifestyle}
              style={[
                styles.optionButton,
                (styleDNA.lifestyle?.lifestyle || []).includes(lifestyle as any) && styles.optionButtonSelected
              ]}
              onPress={() => toggleArrayValue('lifestyle.lifestyle', lifestyle)}
            >
              <Text style={[
                styles.optionButtonText,
                (styleDNA.lifestyle?.lifestyle || []).includes(lifestyle as any) && styles.optionButtonTextSelected
              ]}>
                {lifestyle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Budget Range</Text>
        <View style={styles.optionGrid}>
          {[
            { label: '$ Budget-Friendly', value: '$' },
            { label: '$$ Moderate', value: '$$' },
            { label: '$$$ Higher-End', value: '$$$' },
            { label: '$$$$ Luxury', value: '$$$$' }
          ].map(budget => (
            <TouchableOpacity
              key={budget.value}
              style={[
                styles.optionButton,
                styleDNA.lifestyle?.budget_range === budget.value && styles.optionButtonSelected
              ]}
              onPress={() => updateField('lifestyle.budget_range', budget.value)}
            >
              <Text style={[
                styles.optionButtonText,
                styleDNA.lifestyle?.budget_range === budget.value && styles.optionButtonTextSelected
              ]}>
                {budget.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'personal':
        return renderPersonalInfo();
      case 'measurements':
        return renderMeasurements();
      case 'physical':
        return renderPhysicalAttributes();
      case 'style':
        return renderStyleProfile();
      case 'lifestyle':
        return renderLifestyle();
      default:
        return renderPersonalInfo();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Customize Avatar</Text>
            <TouchableOpacity 
              onPress={handleSave} 
              style={[styles.saveButton, isGeneratingAvatar && styles.saveButtonDisabled]}
              disabled={isGeneratingAvatar}
            >
              <Text style={styles.saveButtonText}>
                {isGeneratingAvatar ? '🎨 Generating...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Avatar Visualization - Fixed at top */}
          <AvatarVisualization styleDNA={styleDNA} />

          {/* Section Navigation - Fixed */}
          <ScrollView horizontal style={styles.sectionNav} showsHorizontalScrollIndicator={false}>
            {sections.map(section => (
              <TouchableOpacity
                key={section.id}
                style={[
                  styles.sectionNavButton,
                  activeSection === section.id && styles.sectionNavButtonActive
                ]}
                onPress={() => setActiveSection(section.id)}
              >
                <Text style={styles.sectionNavIcon}>{section.icon}</Text>
                <Text style={[
                  styles.sectionNavTitle,
                  activeSection === section.id && styles.sectionNavTitleActive
                ]}>
                  {section.title}
                </Text>
                {section.completed && (
                  <View style={styles.completedIndicator}>
                    <Text style={styles.completedIndicatorText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Scrollable Content Area with Grab Handle */}
          <View style={styles.scrollableArea}>
            <View style={styles.scrollHandle} />
            <KeyboardAvoidingView 
              style={styles.scrollContainer}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
              <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
                scrollIndicatorInsets={{ right: 1 }}
                indicatorStyle="black"
              >
                {renderSectionContent()}
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  closeButton: {
    paddingVertical: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
  },
  scrollableArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 10,
  },
  scrollHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#c0c0c0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sectionNav: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginHorizontal: 0,
  },
  sectionNavButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  sectionNavButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  sectionNavIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  sectionNavTitle: {
    fontSize: 12,
    color: '#666',
  },
  sectionNavTitleActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  completedIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedIndicatorText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sectionContentContainer: {
    flex: 1,
  },
  sectionContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#333',
  },
  optionButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});