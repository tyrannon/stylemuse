import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, Alert } from 'react-native';
import { LovedOutfit } from '../hooks/useWardrobeData';
import { SmartOutfitSuggestions } from './components/SmartOutfitSuggestions';
import { OutfitAnalytics } from './components/OutfitAnalytics';
import { MarkAsWornModal } from './components/MarkAsWornModal';
import { AIOutfitAssistant } from '../components/AIOutfitAssistant';
import { UnifiedLoadingOverlay } from '../components/UnifiedLoadingOverlay';
import { useUnifiedLoading } from '../hooks/useUnifiedLoading';
import { SafeImage } from '../utils/SafeImage';
import { formatDate } from '../utils/dateUtils';
import { useTheme } from '../contexts/ThemeContext';
import { OutfitFilterBar } from '../components/OutfitFilterBar';
import { useOutfitFilter, matchesFilters } from '../contexts/OutfitFilterContext';

interface OutfitsPageProps {
  lovedOutfits: LovedOutfit[];
  getSortedOutfits: () => LovedOutfit[];
  getSmartOutfitSuggestions: (limit?: number) => LovedOutfit[];
  getOutfitWearStats: () => any;
  openOutfitDetailView: (outfit: LovedOutfit) => void;
  toggleOutfitLove: (outfitId: string) => void;
  downloadImage: (imageUri: string) => void;
  markOutfitAsWorn: (outfitId: string, rating?: number, event?: string, location?: string) => void;
  markAllOutfitsAsViewed?: () => Promise<number>;
  navigateToBuilder: () => void;
  // Bulk operations
  deleteBulkOutfits?: (outfitIds: string[]) => Promise<void>;
  downloadBulkImages?: (imageUris: string[]) => Promise<void>;
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
  markAllOutfitsAsViewed,
  navigateToBuilder,
  // Bulk operations
  deleteBulkOutfits,
  downloadBulkImages,
}) => {
  const { theme } = useTheme();
  const unifiedLoading = useUnifiedLoading();
  const styles = createStyles(theme);
  const { filters } = useOutfitFilter();
  
  const [activeTab, setActiveTab] = useState<'outfits' | 'analytics'>('outfits');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [markAsWornModalVisible, setMarkAsWornModalVisible] = useState(false);
  const [selectedOutfitForWearing, setSelectedOutfitForWearing] = useState<string | null>(null);
  
  // Multi-select state
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedOutfits, setSelectedOutfits] = useState<LovedOutfit[]>([]);
  
  // Filter outfits based on active filters
  const filteredOutfits = React.useMemo(() => {
    return lovedOutfits.filter(outfit => matchesFilters(outfit, filters));
  }, [lovedOutfits, filters]);
  
  const filteredSortedOutfits = React.useMemo(() => {
    return getSortedOutfits().filter(outfit => matchesFilters(outfit, filters));
  }, [getSortedOutfits, filters]);
  
  // Check if there are any unviewed outfits
  const hasUnviewedOutfits = lovedOutfits.some(outfit => !outfit.viewed);
  
  // Handle multi-select functions
  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedOutfits([]); // Clear selection when toggling mode
  };
  
  const toggleOutfitSelection = (outfit: LovedOutfit) => {
    if (selectedOutfits.some(selected => selected.id === outfit.id)) {
      setSelectedOutfits(selectedOutfits.filter(selected => selected.id !== outfit.id));
    } else {
      setSelectedOutfits([...selectedOutfits, outfit]);
    }
  };
  
  const selectAllOutfits = () => {
    setSelectedOutfits(lovedOutfits);
  };
  
  const clearSelection = () => {
    setSelectedOutfits([]);
  };
  
  const handleBulkDownload = async () => {
    if (selectedOutfits.length === 0) return;
    
    try {
      if (downloadBulkImages) {
        const imageUris = selectedOutfits.map(outfit => outfit.image);
        await downloadBulkImages(imageUris);
        Alert.alert(
          'Success! 🎉',
          `Downloaded ${selectedOutfits.length} outfit image${selectedOutfits.length > 1 ? 's' : ''} to your photo library.`,
          [{ text: 'OK' }]
        );
      } else {
        // Fallback to individual downloads
        for (const outfit of selectedOutfits) {
          await downloadImage(outfit.image);
        }
        Alert.alert(
          'Success! 🎉',
          `Downloaded ${selectedOutfits.length} outfit image${selectedOutfits.length > 1 ? 's' : ''} to your photo library.`,
          [{ text: 'OK' }]
        );
      }
      setSelectedOutfits([]);
      setIsMultiSelectMode(false);
    } catch (error) {
      console.error('Error downloading images:', error);
      Alert.alert('Error', 'Failed to download some images. Please try again.');
    }
  };
  
  const handleBulkDelete = async () => {
    if (selectedOutfits.length === 0) return;
    
    Alert.alert(
      'Delete Outfits',
      `Are you sure you want to delete ${selectedOutfits.length} outfit${selectedOutfits.length > 1 ? 's' : ''} from your collection? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (deleteBulkOutfits) {
                const outfitIds = selectedOutfits.map(outfit => outfit.id);
                await deleteBulkOutfits(outfitIds);
                setSelectedOutfits([]);
                setIsMultiSelectMode(false);
              }
            } catch (error) {
              console.error('Error deleting outfits:', error);
              Alert.alert('Error', 'Failed to delete outfits. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleMarkAllAsSeen = async () => {
    if (!markAllOutfitsAsViewed) return;
    
    try {
      const markedCount = await markAllOutfitsAsViewed();
      if (markedCount > 0) {
        Alert.alert(
          'Success! ✅',
          `Marked ${markedCount} outfit${markedCount > 1 ? 's' : ''} as seen.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error marking all as seen:', error);
      Alert.alert('Error', 'Failed to mark outfits as seen. Please try again.');
    }
  };

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
            Let AI help you create your first amazing outfit!
          </Text>
          <AIOutfitAssistant
            context="standalone"
            size="large"
            sharedLoading={unifiedLoading} // Pass the shared loading instance
            onOutfitGenerated={(outfit) => {
              // Navigate to builder with the generated outfit
              navigateToBuilder();
            }}
          />
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

  // Handle different tab views
  if (activeTab === 'analytics') {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.tabHeader}>
          <TouchableOpacity
            onPress={() => setActiveTab('outfits')}
            style={[styles.tabButton, activeTab === 'outfits' && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === 'outfits' && styles.activeTabText]}>👗 Outfits</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('analytics')}
            style={[styles.tabButton, activeTab === 'analytics' && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>📊 Analytics</Text>
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
    <View style={{ flex: 1 }}>
      {/* Filter Bar */}
      <OutfitFilterBar />
      
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.tabHeader}>
          <TouchableOpacity
            onPress={() => setActiveTab('outfits')}
            style={[styles.tabButton, activeTab === 'outfits' && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === 'outfits' && styles.activeTabText]}>👗 Outfits</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('analytics')}
            style={[styles.tabButton, activeTab === 'analytics' && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>📊 Analytics</Text>
          </TouchableOpacity>
        </View>
      
      <View style={{ marginTop: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', flex: 1 }}>
            👗 Generated Outfits ({filteredOutfits.length}{filteredOutfits.length !== lovedOutfits.length && ` of ${lovedOutfits.length}`})
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {hasUnviewedOutfits && markAllOutfitsAsViewed && (
              <TouchableOpacity
                onPress={handleMarkAllAsSeen}
                style={styles.actionButton}
              >
                <Text style={styles.actionButtonText}>
                  👁️ Mark All Seen
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              onPress={toggleMultiSelectMode}
              style={[styles.actionButton, isMultiSelectMode && styles.activeActionButton]}
            >
              <Text style={[styles.actionButtonText, isMultiSelectMode && styles.activeActionButtonText]}>
                {isMultiSelectMode ? '✅ Multi' : '☑️ Select'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Multi-select actions */}
        {isMultiSelectMode && (
          <View style={styles.multiSelectActions}>
            <View style={styles.selectionInfo}>
              <Text style={styles.selectionText}>
                {selectedOutfits.length} selected
              </Text>
            </View>
            
            <View style={styles.bulkActionButtons}>
              <TouchableOpacity
                onPress={selectAllOutfits}
                style={styles.bulkActionButton}
                disabled={selectedOutfits.length === lovedOutfits.length}
              >
                <Text style={styles.bulkActionButtonText}>Select All</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={clearSelection}
                style={styles.bulkActionButton}
                disabled={selectedOutfits.length === 0}
              >
                <Text style={styles.bulkActionButtonText}>Clear</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleBulkDownload}
                style={[styles.bulkActionButton, styles.downloadButton]}
                disabled={selectedOutfits.length === 0}
              >
                <Text style={[styles.bulkActionButtonText, styles.downloadButtonText]}>
                  ⬇️ Download ({selectedOutfits.length})
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleBulkDelete}
                style={[styles.bulkActionButton, styles.deleteButton]}
                disabled={selectedOutfits.length === 0}
              >
                <Text style={[styles.bulkActionButtonText, styles.deleteButtonText]}>
                  🗑️ Delete ({selectedOutfits.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      
      <View style={{ paddingHorizontal: 20 }}>
        {/* Loved Outfits Section */}
        {filteredOutfits.filter(outfit => outfit.isLoved).length > 0 && (
          <View style={styles.lovedOutfitsSection}>
            <Text style={styles.lovedOutfitsSectionTitle}>
              ❤️ Loved Outfits ({filteredOutfits.filter(outfit => outfit.isLoved).length})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.lovedOutfitsScroll}
              contentContainerStyle={styles.lovedOutfitsScrollContent}
            >
              {filteredOutfits.filter(outfit => outfit.isLoved).map((outfit, index) => (
                <TouchableOpacity
                  key={outfit.id}
                  onPress={() => isMultiSelectMode ? toggleOutfitSelection(outfit) : openOutfitDetailView(outfit)}
                  style={[
                    styles.lovedOutfitCard,
                    isMultiSelectMode && selectedOutfits.some(selected => selected.id === outfit.id) && styles.selectedOutfitCard
                  ]}
                >
                  {/* Love/Unlove button */}
                  <TouchableOpacity
                    onPress={() => toggleOutfitLove(outfit.id)}
                    style={styles.loveButton}
                  >
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>❤️</Text>
                  </TouchableOpacity>

                  {/* Download button */}
                  <TouchableOpacity
                    onPress={() => downloadImage(outfit.image)}
                    style={styles.downloadButton}
                  >
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>⬇️</Text>
                  </TouchableOpacity>

                  {/* Unviewed indicator */}
                  {!outfit.viewed && (
                    <View style={styles.unviewedDot} />
                  )}

                  {/* Outfit image */}
                  <SafeImage
                    uri={outfit.image}
                    style={styles.lovedOutfitCardImage}
                    resizeMode="cover"
                  />

                  <View style={styles.lovedOutfitCardInfo}>
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
                      {outfit.selectedItems.length} items used
                    </Text>
                    
                    {/* Metadata badges for loved outfits */}
                    {outfit.metadata && (
                      <View style={styles.metadataBadges}>
                        {outfit.metadata.occasion && (
                          <View style={[styles.metadataBadge, { backgroundColor: theme.colors.primary }]}>
                            <Text style={styles.metadataBadgeText}>
                              {outfit.metadata.occasion}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                  
                  {/* Selection overlay for multi-select mode */}
                  {isMultiSelectMode && selectedOutfits.some(selected => selected.id === outfit.id) && (
                    <View style={styles.selectionOverlay}>
                      <View style={styles.selectionCheckmark}>
                        <Text style={styles.selectionCheckmarkText}>✓</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* All Outfits Section */}
        <View style={styles.allOutfitsSection}>
          <Text style={styles.allOutfitsSectionTitle}>
            📸 {lovedOutfits.filter(outfit => outfit.isLoved).length > 0 ? 'Other Generated Outfits' : 'All Generated Outfits'}
          </Text>
          <View style={styles.outfitsGrid}>
            {filteredSortedOutfits
              .filter(outfit => !outfit.isLoved) // Exclude loved outfits since they're shown above
              .map((outfit, index) => (
              <TouchableOpacity
                key={outfit.id}
                onPress={() => isMultiSelectMode ? toggleOutfitSelection(outfit) : openOutfitDetailView(outfit)}
                style={[
                  styles.outfitCard,
                  outfit.isLoved && styles.lovedOutfitCard,
                  isMultiSelectMode && selectedOutfits.some(selected => selected.id === outfit.id) && styles.selectedOutfitCard
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

                {/* Unviewed indicator */}
                {!outfit.viewed && (
                  <View style={styles.unviewedDot} />
                )}

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
                  
                  {/* Metadata badges */}
                  {outfit.metadata && (
                    <View style={styles.metadataBadges}>
                      {outfit.metadata.occasion && (
                        <View style={[styles.metadataBadge, { backgroundColor: theme.colors.primary }]}>
                          <Text style={styles.metadataBadgeText}>
                            {outfit.metadata.occasion}
                          </Text>
                        </View>
                      )}
                      {outfit.metadata.season && outfit.metadata.season[0] && (
                        <View style={[styles.metadataBadge, { backgroundColor: theme.colors.secondary }]}>
                          <Text style={styles.metadataBadgeText}>
                            {outfit.metadata.season[0]}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
                
                {/* Selection overlay for multi-select mode */}
                {isMultiSelectMode && selectedOutfits.some(selected => selected.id === outfit.id) && (
                  <View style={styles.selectionOverlay}>
                    <View style={styles.selectionCheckmark}>
                      <Text style={styles.selectionCheckmarkText}>✓</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
      
        {/* DEPRECATED: Legacy SmartOutfitSuggestions replaced with unified Smart Outfit Generator */}
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
      
      {/* Unified Loading Overlay */}
      <UnifiedLoadingOverlay
        visible={unifiedLoading.isLoading}
        title={unifiedLoading.loadingConfig?.title || ''}
        subtitle={unifiedLoading.loadingConfig?.subtitle}
        steps={unifiedLoading.loadingConfig?.steps}
        style={unifiedLoading.loadingConfig?.style}
      />
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
    ...theme.shadows.medium,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
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
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    ...theme.shadows.medium,
    elevation: 3,
  },
  lovedOutfitsSection: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    ...theme.shadows.medium,
  },
  lovedOutfitsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.error, // Use theme error color for loved items
    textAlign: 'center',
  },
  lovedOutfitsScroll: {
    marginHorizontal: -16,
  },
  lovedOutfitsScrollContent: {
    paddingHorizontal: 16,
  },
  lovedOutfitCard: {
    width: 180,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: theme.colors.error,
    ...theme.shadows.medium,
  },
  lovedOutfitCardImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  lovedOutfitCardInfo: {
    flex: 1,
  },
  allOutfitsSection: {
    marginTop: 8,
  },
  allOutfitsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: theme.colors.text,
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
    color: theme.colors.textSecondary,
  },
  
  // Metadata badges
  metadataBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  metadataBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  metadataBadgeText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  
  // Multi-select styles
  actionButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeActionButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  activeActionButtonText: {
    color: 'white',
  },
  multiSelectActions: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectionInfo: {
    alignItems: 'center',
    marginBottom: 10,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  bulkActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 6,
  },
  bulkActionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  bulkActionButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  downloadButton: {
    backgroundColor: '#4CAF50',
  },
  downloadButtonText: {
    color: 'white',
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
  },
  deleteButtonText: {
    color: 'white',
  },
  selectedOutfitCard: {
    borderWidth: 3,
    borderColor: theme.colors.primary,
    backgroundColor: theme.mode === 'dark' ? '#1a2332' : '#e3f2fd',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    ...theme.shadows.medium,
  },
  selectionCheckmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCheckmarkText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  unviewedDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.error || '#FF3B30',
    zIndex: 1,
  },
});