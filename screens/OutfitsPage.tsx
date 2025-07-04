import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';
import { LovedOutfit } from '../hooks/useWardrobeData';
import { SmartOutfitSuggestions } from './components/SmartOutfitSuggestions';
import { OutfitAnalytics } from './components/OutfitAnalytics';
import { MarkAsWornModal } from './components/MarkAsWornModal';
import { SafeImage } from '../utils/SafeImage';
import { formatDate } from '../utils/dateUtils';

interface OutfitsPageProps {
  lovedOutfits: LovedOutfit[];
  getSortedOutfits: () => LovedOutfit[];
  getSmartOutfitSuggestions: (limit?: number) => LovedOutfit[];
  getOutfitWearStats: () => any;
  openOutfitDetailView: (outfit: LovedOutfit) => void;
  toggleOutfitLove: (outfitId: string) => void;
  downloadImage: (imageUri: string) => void;
  markOutfitAsWorn: (outfitId: string, rating?: number, event?: string, location?: string) => void;
  navigateToBuilder: () => void;
}

export const OutfitsPage: React.FC<OutfitsPageProps> = ({
  lovedOutfits,
  getSortedOutfits,
  getSmartOutfitSuggestions,
  getOutfitWearStats,
  openOutfitDetailView,
  toggleOutfitLove,
  downloadImage,
  markOutfitAsWorn,
  navigateToBuilder,
}) => {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [markAsWornModalVisible, setMarkAsWornModalVisible] = useState(false);
  const [selectedOutfitForWearing, setSelectedOutfitForWearing] = useState<string | null>(null);
  if (lovedOutfits.length === 0) {
    return (
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, paddingHorizontal: 20, textAlign: 'center' }}>
          👗 Generated Outfits (0)
        </Text>
        
        <View style={{ alignItems: 'center', padding: 40 }}>
          <Text style={{ fontSize: 40, marginBottom: 20 }}>👗</Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' }}>
            No Generated Outfits Yet
          </Text>
          <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 }}>
            Generate your first outfit using the Outfit Builder!
          </Text>
          <TouchableOpacity
            onPress={navigateToBuilder}
            style={styles.generateFirstOutfitButton}
          >
            <Text style={styles.generateFirstOutfitButtonText}>🎮 Go to Outfit Builder</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleQuickMarkAsWorn = (outfitId: string) => {
    setSelectedOutfitForWearing(outfitId);
    setMarkAsWornModalVisible(true);
  };

  const smartSuggestions = getSmartOutfitSuggestions(10);
  const outfitStats = getOutfitWearStats();

  if (showAnalytics) {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.tabHeader}>
          <TouchableOpacity
            onPress={() => setShowAnalytics(false)}
            style={[styles.tabButton, !showAnalytics && styles.activeTab]}
          >
            <Text style={[styles.tabText, !showAnalytics && styles.activeTabText]}>👗 Outfits</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowAnalytics(true)}
            style={[styles.tabButton, showAnalytics && styles.activeTab]}
          >
            <Text style={[styles.tabText, showAnalytics && styles.activeTabText]}>📊 Analytics</Text>
          </TouchableOpacity>
        </View>
        
        <OutfitAnalytics
          stats={outfitStats}
          onOutfitPress={openOutfitDetailView}
        />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={styles.tabHeader}>
        <TouchableOpacity
          onPress={() => setShowAnalytics(false)}
          style={[styles.tabButton, !showAnalytics && styles.activeTab]}
        >
          <Text style={[styles.tabText, !showAnalytics && styles.activeTabText]}>👗 Outfits</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowAnalytics(true)}
          style={[styles.tabButton, showAnalytics && styles.activeTab]}
        >
          <Text style={[styles.tabText, showAnalytics && styles.activeTabText]}>📊 Analytics</Text>
        </TouchableOpacity>
      </View>
      
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, paddingHorizontal: 20, textAlign: 'center' }}>
          👗 Generated Outfits ({lovedOutfits.length})
        </Text>
      
      <View style={{ paddingHorizontal: 20 }}>
        {/* Loved Outfits Section */}
        {lovedOutfits.filter(outfit => outfit.isLoved).length > 0 && (
          <View style={{ marginBottom: 30 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#ff6b6b' }}>
              ❤️ Loved Outfits ({lovedOutfits.filter(outfit => outfit.isLoved).length})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 10 }}
            >
              {lovedOutfits.filter(outfit => outfit.isLoved).map((outfit, index) => (
                <TouchableOpacity
                  key={outfit.id}
                  onPress={() => openOutfitDetailView(outfit)}
                  style={{
                    marginRight: 20,
                    width: 200,
                    backgroundColor: '#fff5f5',
                    borderRadius: 12,
                    padding: 10,
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: '#ff6b6b',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  {/* Love/Unlove button */}
                  <TouchableOpacity
                    onPress={() => toggleOutfitLove(outfit.id)}
                    style={{
                      position: 'absolute',
                      top: 5,
                      right: 5,
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: '#ff6b6b',
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: 1,
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>❤️</Text>
                  </TouchableOpacity>

                  {/* Download button */}
                  <TouchableOpacity
                    onPress={() => downloadImage(outfit.image)}
                    style={{
                      position: 'absolute',
                      top: 5,
                      left: 5,
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: '#4CAF50',
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: 1,
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>⬇️</Text>
                  </TouchableOpacity>

                  {/* Outfit image */}
                  <SafeImage
                    uri={outfit.image}
                    style={{ width: 180, height: 140, borderRadius: 8, marginBottom: 8 }}
                    resizeMode="cover"
                  />

                  {/* Weather info if available */}
                  {outfit.weatherData && (
                    <View style={{
                      backgroundColor: '#E8F5E8',
                      padding: 4,
                      borderRadius: 6,
                      marginBottom: 6,
                    }}>
                      <Text style={{ fontSize: 10, color: '#2E7D32', fontWeight: 'bold' }}>
                        🌡️ {outfit.weatherData.temperature}°F
                      </Text>
                    </View>
                  )}

                  {/* Style DNA indicator */}
                  {outfit.styleDNA && (
                    <View style={{
                      backgroundColor: '#f0f8f0',
                      padding: 4,
                      borderRadius: 6,
                      marginBottom: 6,
                    }}>
                      <Text style={{ fontSize: 10, color: '#4CAF50', fontWeight: 'bold' }}>
                        🧬 Personalized
                      </Text>
                    </View>
                  )}

                  {/* Date */}
                  <Text style={{ fontSize: 10, color: '#666', fontStyle: 'italic' }}>
                    {formatDate(outfit.createdAt)}
                  </Text>

                  {/* Items used */}
                  <Text style={{ fontSize: 10, color: '#666', marginTop: 4 }}>
                    {outfit.selectedItems.length} items used
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* All Outfits Section */}
        <View>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#333' }}>
            📸 All Generated Outfits
          </Text>
          <View style={styles.outfitsGrid}>
            {getSortedOutfits().map((outfit, index) => (
              <TouchableOpacity
                key={outfit.id}
                onPress={() => openOutfitDetailView(outfit)}
                style={[
                  styles.outfitCard,
                  outfit.isLoved && styles.lovedOutfitCard
                ]}
                activeOpacity={0.7}
              >
                {/* Love/Unlove button */}
                <TouchableOpacity
                  onPress={() => toggleOutfitLove(outfit.id)}
                  style={[
                    styles.loveButton,
                    outfit.isLoved && styles.lovedButton
                  ]}
                >
                  <Text style={styles.loveButtonText}>
                    {outfit.isLoved ? '❤️' : '🤍'}
                  </Text>
                </TouchableOpacity>

                {/* Download button */}
                <TouchableOpacity
                  onPress={() => downloadImage(outfit.image)}
                  style={styles.downloadOutfitButton}
                >
                  <Text style={styles.downloadOutfitButtonText}>⬇️</Text>
                </TouchableOpacity>

                {/* Outfit image */}
                <SafeImage
                  uri={outfit.image}
                  style={styles.outfitCardImage}
                  resizeMode="cover"
                />

                {/* Outfit info */}
                <View style={styles.outfitCardInfo}>
                  {/* Weather info if available */}
                  {outfit.weatherData && (
                    <View style={styles.outfitWeatherBadge}>
                      <Text style={styles.outfitWeatherText}>
                        🌡️ {outfit.weatherData.temperature}°F
                      </Text>
                    </View>
                  )}

                  {/* Style DNA indicator */}
                  {outfit.styleDNA && (
                    <View style={styles.outfitDNABadge}>
                      <Text style={styles.outfitDNAText}>
                        🧬
                      </Text>
                    </View>
                  )}

                  {/* Date */}
                  <Text style={styles.outfitDateText}>
                    {formatDate(outfit.createdAt)}
                  </Text>

                  {/* Items used */}
                  <Text style={styles.outfitItemsText}>
                    {outfit.selectedItems.length} items
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
      
        {/* Smart Suggestions Section */}
        {smartSuggestions.length > 0 && showSuggestions && (
          <SmartOutfitSuggestions
            suggestions={smartSuggestions}
            onOutfitPress={openOutfitDetailView}
            onMarkAsWorn={handleQuickMarkAsWorn}
          />
        )}
      </View>
      
      {/* Mark as Worn Modal */}
      <MarkAsWornModal
        visible={markAsWornModalVisible}
        onClose={() => {
          setMarkAsWornModalVisible(false);
          setSelectedOutfitForWearing(null);
        }}
        onMarkAsWorn={(rating, event, location) => {
          if (selectedOutfitForWearing) {
            markOutfitAsWorn(selectedOutfitForWearing, rating, event, location);
          }
        }}
        outfitId={selectedOutfitForWearing || ''}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  generateFirstOutfitButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  generateFirstOutfitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  outfitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  outfitCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lovedOutfitCard: {
    borderWidth: 2,
    borderColor: '#ff6b6b',
    backgroundColor: '#fff5f5',
  },
  loveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  lovedButton: {
    backgroundColor: '#ff6b6b',
  },
  loveButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  downloadOutfitButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  downloadOutfitButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  outfitCardImage: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    marginBottom: 8,
  },
  outfitCardInfo: {
    flex: 1,
  },
  outfitWeatherBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  outfitWeatherText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  outfitDNABadge: {
    backgroundColor: '#f0f8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  outfitDNAText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  outfitDateText: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  outfitItemsText: {
    fontSize: 10,
    color: '#666',
  },
});