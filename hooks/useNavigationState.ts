import { useState } from 'react';

export const useNavigationState = () => {
  // Page visibility states
  const [showOutfitBuilder, setShowOutfitBuilder] = useState(true);
  const [showWardrobe, setShowWardrobe] = useState(false);
  const [showLovedItems, setShowLovedItems] = useState(false);
  const [showOutfitsPage, setShowOutfitsPage] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  
  // Detail view states
  const [showingItemDetail, setShowingItemDetail] = useState(false);
  const [detailViewItem, setDetailViewItem] = useState<any | null>(null);
  const [showingOutfitDetail, setShowingOutfitDetail] = useState(false);
  const [detailViewOutfit, setDetailViewOutfit] = useState<any | null>(null);
  
  // Modal states
  const [showGenderSelector, setShowGenderSelector] = useState(false);
  const [categoryDropdownVisible, setCategoryDropdownVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Editing states for inline editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingColor, setEditingColor] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(false);
  const [editingStyle, setEditingStyle] = useState(false);
  const [editingFit, setEditingFit] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  
  // Temporary values for editing
  const [tempTitle, setTempTitle] = useState('');
  const [tempColor, setTempColor] = useState('');
  const [tempMaterial, setTempMaterial] = useState('');
  const [tempStyle, setTempStyle] = useState('');
  const [tempFit, setTempFit] = useState('');
  const [tempTags, setTempTags] = useState<string[]>([]);

  // Navigation functions
  const navigateToBuilder = () => {
    setShowOutfitBuilder(true);
    setShowWardrobe(false);
    setShowLovedItems(false);
    setShowProfilePage(false);
    setShowOutfitsPage(false);
    closeAllDetails();
  };

  const navigateToWardrobe = () => {
    setShowWardrobe(true);
    setShowOutfitBuilder(false);
    setShowLovedItems(false);
    setShowProfilePage(false);
    setShowOutfitsPage(false);
    closeAllDetails();
  };

  const navigateToOutfits = () => {
    setShowOutfitsPage(true);
    setShowOutfitBuilder(false);
    setShowWardrobe(false);
    setShowLovedItems(false);
    setShowProfilePage(false);
    closeAllDetails();
  };

  const navigateToProfile = () => {
    setShowProfilePage(true);
    setShowOutfitBuilder(false);
    setShowWardrobe(false);
    setShowLovedItems(false);
    setShowOutfitsPage(false);
    closeAllDetails();
  };

  const closeAllDetails = () => {
    setShowingItemDetail(false);
    setDetailViewItem(null);
    setShowingOutfitDetail(false);
    setDetailViewOutfit(null);
    setCategoryDropdownVisible(false);
  };

  const openItemDetail = (item: any) => {
    setDetailViewItem(item);
    setShowingItemDetail(true);
    setShowWardrobe(false);
  };

  const openOutfitDetail = (outfit: any) => {
    setDetailViewOutfit(outfit);
    setShowingOutfitDetail(true);
    setShowOutfitsPage(false);
  };

  const goBackToWardrobe = () => {
    setShowingItemDetail(false);
    setDetailViewItem(null);
    setShowWardrobe(true);
    setCategoryDropdownVisible(false);
  };

  const goBackToOutfits = () => {
    setShowingOutfitDetail(false);
    setDetailViewOutfit(null);
    setShowOutfitsPage(true);
  };

  return {
    // Page visibility
    showOutfitBuilder,
    setShowOutfitBuilder,
    showWardrobe,
    setShowWardrobe,
    showLovedItems,
    setShowLovedItems,
    showOutfitsPage,
    setShowOutfitsPage,
    showProfilePage,
    setShowProfilePage,
    
    // Detail views
    showingItemDetail,
    setShowingItemDetail,
    detailViewItem,
    setDetailViewItem,
    showingOutfitDetail,
    setShowingOutfitDetail,
    detailViewOutfit,
    setDetailViewOutfit,
    
    // Modals
    showGenderSelector,
    setShowGenderSelector,
    categoryDropdownVisible,
    setCategoryDropdownVisible,
    selectedCategory,
    setSelectedCategory,
    
    // Editing states
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
    
    // Temp values
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
    
    // Navigation functions
    navigateToBuilder,
    navigateToWardrobe,
    navigateToOutfits,
    navigateToProfile,
    closeAllDetails,
    openItemDetail,
    openOutfitDetail,
    goBackToWardrobe,
    goBackToOutfits,
  };
};