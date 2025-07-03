import { useState } from 'react';

export interface ModalState {
  // Category dropdown
  categoryDropdownVisible: boolean;
  setCategoryDropdownVisible: (visible: boolean) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  
  // Gender selector
  showGenderSelector: boolean;
  setShowGenderSelector: (show: boolean) => void;
  
  // Sort/Filter modal
  showSortFilterModal: boolean;
  setShowSortFilterModal: (show: boolean) => void;
  
  // Smart suggestion modal
  showSmartSuggestionModal: boolean;
  setShowSmartSuggestionModal: (show: boolean) => void;
  
  // Text item entry modal
  showTextItemModal: boolean;
  setShowTextItemModal: (show: boolean) => void;
  
  // Slot selection modal
  slotSelectionModalVisible: boolean;
  setSlotSelectionModalVisible: (visible: boolean) => void;
  selectedSlot: string | null;
  setSelectedSlot: (slot: string | null) => void;
  
  // Camera and photo editing
  showCamera: boolean;
  setShowCamera: (show: boolean) => void;
  showPhotoEditing: boolean;
  setShowPhotoEditing: (show: boolean) => void;
  editingImageUri: string | null;
  setEditingImageUri: (uri: string | null) => void;
  
  // Laundry analytics
  showLaundryAnalytics: boolean;
  setShowLaundryAnalytics: (show: boolean) => void;
}

export const useModalState = (): ModalState => {
  // Category dropdown
  const [categoryDropdownVisible, setCategoryDropdownVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Gender selector
  const [showGenderSelector, setShowGenderSelector] = useState(false);
  
  // Sort/Filter modal
  const [showSortFilterModal, setShowSortFilterModal] = useState(false);
  
  // Smart suggestion modal
  const [showSmartSuggestionModal, setShowSmartSuggestionModal] = useState(false);
  
  // Text item entry modal
  const [showTextItemModal, setShowTextItemModal] = useState(false);
  
  // Slot selection modal
  const [slotSelectionModalVisible, setSlotSelectionModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  
  // Camera and photo editing
  const [showCamera, setShowCamera] = useState(false);
  const [showPhotoEditing, setShowPhotoEditing] = useState(false);
  const [editingImageUri, setEditingImageUri] = useState<string | null>(null);
  
  // Laundry analytics
  const [showLaundryAnalytics, setShowLaundryAnalytics] = useState(false);

  return {
    // Category dropdown
    categoryDropdownVisible,
    setCategoryDropdownVisible,
    selectedCategory,
    setSelectedCategory,
    
    // Gender selector
    showGenderSelector,
    setShowGenderSelector,
    
    // Sort/Filter modal
    showSortFilterModal,
    setShowSortFilterModal,
    
    // Smart suggestion modal
    showSmartSuggestionModal,
    setShowSmartSuggestionModal,
    
    // Text item entry modal
    showTextItemModal,
    setShowTextItemModal,
    
    // Slot selection modal
    slotSelectionModalVisible,
    setSlotSelectionModalVisible,
    selectedSlot,
    setSelectedSlot,
    
    // Camera and photo editing
    showCamera,
    setShowCamera,
    showPhotoEditing,
    setShowPhotoEditing,
    editingImageUri,
    setEditingImageUri,
    
    // Laundry analytics
    showLaundryAnalytics,
    setShowLaundryAnalytics,
  };
};