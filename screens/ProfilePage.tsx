import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { WardrobeItem, LovedOutfit } from '../hooks/useWardrobeData';
import { SafeImage } from '../utils/SafeImage';
import { EnhancedStyleDNA } from '../types/Avatar';

interface ProfilePageProps {
  profileImage: string | null;
  styleDNA: EnhancedStyleDNA | null;
  selectedGender: 'male' | 'female' | 'nonbinary' | null;
  savedItems: WardrobeItem[];
  lovedOutfits: LovedOutfit[];
  analyzingProfile: boolean;
  pickProfileImage: () => void;
  analyzeProfileImage: (imageUri: string) => void;
  setShowGenderSelector: (show: boolean) => void;
  onUpdateStyleDNA: (updatedStyleDNA: EnhancedStyleDNA) => void;
  triggerHaptic: (type?: 'light' | 'medium' | 'heavy') => void;
  navigateToAvatarCustomization: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  profileImage,
  styleDNA,
  selectedGender,
  savedItems,
  lovedOutfits,
  analyzingProfile,
  pickProfileImage,
  analyzeProfileImage,
  setShowGenderSelector,
  onUpdateStyleDNA,
  triggerHaptic,
  navigateToAvatarCustomization,
}) => {
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, paddingHorizontal: 20, textAlign: 'center' }}>
        🧬 Style DNA Profile
      </Text>
      
      {/* Profile Images Section */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          {/* Real Profile Photo */}
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Your Photo</Text>
            <TouchableOpacity
              onPress={pickProfileImage}
              style={{ position: 'relative' }}
            >
              {profileImage ? (
                <Image 
                  source={{ uri: profileImage }} 
                  style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: styleDNA ? '#4CAF50' : '#e0e0e0' }} 
                />
              ) : (
                <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#e0e0e0' }}>
                  <Text style={{ fontSize: 30 }}>🧬</Text>
                </View>
              )}
              <View style={{ position: 'absolute', top: 2, right: 2, width: 25, height: 25, borderRadius: 12.5, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: 'white', fontSize: 12 }}>✏️</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Generated Avatar */}
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Your Avatar</Text>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('medium');
                navigateToAvatarCustomization();
              }}
              style={{ position: 'relative' }}
            >
              {styleDNA?.avatar_image_url ? (
                <View style={{ width: 100, height: 100, borderRadius: 50, overflow: 'hidden', borderWidth: 3, borderColor: '#007AFF' }}>
                  <SafeImage 
                    uri={styleDNA.avatar_image_url}
                    style={{ width: '100%', height: '100%' }}
                    fallbackStyle={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }}
                  />
                </View>
              ) : (
                <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#e0e0e0' }}>
                  <Text style={{ fontSize: 20 }}>🎨</Text>
                  <Text style={{ fontSize: 8, color: '#666', textAlign: 'center' }}>Customize to generate</Text>
                </View>
              )}
              {/* Edit indicator */}
              <View style={{ position: 'absolute', top: 2, right: 2, width: 25, height: 25, borderRadius: 12.5, backgroundColor: '#8e24aa', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: 'white', fontSize: 12 }}>🎨</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        {profileImage && (
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('medium');
              analyzeProfileImage(profileImage);
            }}
            style={{
              marginTop: 15,
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 25,
              backgroundColor: '#007AFF',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
            disabled={analyzingProfile}
          >
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: 'white' }}>
              {analyzingProfile ? '🧬 Analyzing...' : '🧬 Analyze Style DNA'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Gender Selection Section */}
      <View style={{ marginBottom: 20, paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' }}>
          Gender Identity
        </Text>
        <Text style={{ fontSize: 12, color: '#666', marginBottom: 10, textAlign: 'center' }}>
          Helps AI generate outfits that match your preferred style
        </Text>
        
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            setShowGenderSelector(true);
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 15,
            borderWidth: 2,
            borderColor: !selectedGender ? '#ff6b6b' : '#e0e0e0',
            borderRadius: 12,
            backgroundColor: '#f8f9fa',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, marginRight: 10 }}>
              {selectedGender === 'male' ? '👨' : 
               selectedGender === 'female' ? '👩' : 
               selectedGender === 'nonbinary' ? '🌈' : '⚧️'}
            </Text>
            <Text style={{ fontSize: 16, color: '#333' }}>
              {selectedGender ? selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1) : 'Select Gender'}
            </Text>
          </View>
          <Text style={{ fontSize: 16, color: '#666' }}>▶️</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar Customization Button */}
      <View style={{ marginBottom: 20, paddingHorizontal: 20 }}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('medium');
            navigateToAvatarCustomization();
          }}
          style={{
            backgroundColor: '#8e24aa',
            borderRadius: 12,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Text style={{ fontSize: 24, marginRight: 10 }}>🎨</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'white', marginBottom: 2 }}>
              Customize Your Avatar
            </Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
              Add details about your style, sizes, and preferences
            </Text>
          </View>
          <Text style={{ fontSize: 16, color: 'white' }}>▶️</Text>
        </TouchableOpacity>
      </View>

      {/* Style DNA Results Section */}
      {styleDNA && (
        <View style={{ marginBottom: 20, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
            Style Analysis Results
          </Text>
          
          {/* Appearance */}
          {styleDNA.appearance && (
            <View style={styles.styleDNACard}>
              <Text style={styles.styleDNACardTitle}>👤 Appearance</Text>
              <Text style={styles.styleDNAText}>
                <Text style={styles.styleDNALabel}>Hair:</Text> {styleDNA.appearance.hair_color || 'Not specified'}
              </Text>
              <Text style={styles.styleDNAText}>
                <Text style={styles.styleDNALabel}>Build:</Text> {styleDNA.appearance.build || 'Not specified'}
              </Text>
              <Text style={styles.styleDNAText}>
                <Text style={styles.styleDNALabel}>Complexion:</Text> {styleDNA.appearance.complexion || 'Not specified'}
              </Text>
              <Text style={styles.styleDNAText}>
                <Text style={styles.styleDNALabel}>Age Range:</Text> {styleDNA.appearance.approximate_age_range || 'Not specified'}
              </Text>
            </View>
          )}

          {/* Style Preferences */}
          {styleDNA.style_preferences && (
            <View style={styles.styleDNACard}>
              <Text style={styles.styleDNACardTitle}>🎨 Style Preferences</Text>
              <Text style={styles.styleDNAText}>
                <Text style={styles.styleDNALabel}>Current Style:</Text> {styleDNA.style_preferences.current_style_visible || 'Not specified'}
              </Text>
              <Text style={styles.styleDNAText}>
                <Text style={styles.styleDNALabel}>Preferred Styles:</Text> {styleDNA.style_preferences.preferred_styles?.join(', ') || 'Not specified'}
              </Text>
              <Text style={styles.styleDNAText}>
                <Text style={styles.styleDNALabel}>Color Palette:</Text> {styleDNA.style_preferences.color_palette?.join(', ') || 'Not specified'}
              </Text>
              <Text style={styles.styleDNAText}>
                <Text style={styles.styleDNALabel}>Fit Preferences:</Text> {styleDNA.style_preferences.fit_preferences || 'Not specified'}
              </Text>
            </View>
          )}

          {/* Outfit Generation Notes */}
          {styleDNA.outfit_generation_notes && (
            <View style={styles.styleDNACard}>
              <Text style={styles.styleDNACardTitle}>✨ Outfit Generation</Text>
              <Text style={[styles.styleDNAText, { lineHeight: 16 }]}>
                {styleDNA.outfit_generation_notes}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Stats Section */}
      <View style={{ marginBottom: 20, paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
          Your Stats
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{savedItems.length}</Text>
            <Text style={styles.statLabel}>Wardrobe Items</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{lovedOutfits.length}</Text>
            <Text style={styles.statLabel}>Loved Outfits</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {styleDNA ? '✅' : '❌'}
            </Text>
            <Text style={styles.statLabel}>Style DNA</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {selectedGender ? '✅' : '❌'}
            </Text>
            <Text style={styles.statLabel}>Gender Set</Text>
          </View>
        </View>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  styleDNACard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  styleDNACardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  styleDNAText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  styleDNALabel: {
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
});