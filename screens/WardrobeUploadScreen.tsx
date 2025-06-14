import { View, Button, Image, StyleSheet, Text, TouchableOpacity, ScrollView, SafeAreaView, Modal, Pressable, TextInput } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { describeClothingItem } from '../utils/openai';
import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

const WardrobeUploadScreen = () => {
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedItems, setSavedItems] = useState<
    { image: string; title?: string; description: string; tags?: string[] }[]
  >([]);
  const [title, setTitle] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<{
    image: string;
    title?: string;
    description: string;
    tags?: string[];
  } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState<string>("");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItemsForOutfit, setSelectedItemsForOutfit] = useState<string[]>([]);
  const [generatedOutfit, setGeneratedOutfit] = useState<string | null>(null);
  const [generatingOutfit, setGeneratingOutfit] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access media library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      setImage(imageUri);
      
      // Automatically start AI description process
      await handleAutoDescribeAndSave(imageUri);
    }
  };

  const handleAutoDescribeAndSave = async (imageUri: string) => {
    setLoading(true);
    setDescription(null);
    setTitle(null);
    setTags([]);

    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const result = await describeClothingItem(base64);

      // Clean the wrapped markdown formatting
      const cleanResult = result.replace(/```json|```/g, '').trim();

      let parsed;
      try {
        parsed = JSON.parse(cleanResult);
      } catch (err) {
        console.error("❌ JSON Parse error:", err, cleanResult);
        alert("AI returned invalid formatting. Try again.");
        return;
      }

      const itemTitle = parsed.title;
      const itemDescription = parsed.description;
      const itemTags = parsed.tags;

      // Set the state for display
      setTitle(itemTitle);
      setDescription(itemDescription);
      setTags(itemTags);

      // Automatically save to wardrobe
      setSavedItems(prev => [
        ...prev,
        {
          image: imageUri,
          title: itemTitle,
          description: itemDescription,
          tags: itemTags,
        },
      ]);

      alert("Item analyzed and saved to wardrobe!");

    } catch (err) {
      console.error(err);
      alert("Failed to analyze image");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = () => {
    if (!selectedItem) return;

    setSavedItems(prev =>
      prev.filter(item => !(item.image === selectedItem.image && item.description === selectedItem.description))
    );

    setModalVisible(false);
    setSelectedItem(null);
  };


const handleGenerateOutfit = async () => {
  if (selectedItemsForOutfit.length < 2) {
    alert("Please select at least 2 items to generate an outfit!");
    return;
  }

  setGeneratingOutfit(true);
  
  try {
    // Simple timeout to simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Set flag to show the outfit
    setGeneratedOutfit("ready");
    
    alert("Outfit created! 🎉");
    
  } catch (error) {
    console.error('Error generating outfit:', error);
    alert("Failed to generate outfit. Please try again.");
  } finally {
    setGeneratingOutfit(false);
    setIsSelectionMode(false);
    // Don't clear selectedItemsForOutfit here so we can show them in the outfit
  }
};


const handleItemSelection = (imageUri: string) => {
  if (!isSelectionMode) return;
  
  if (selectedItemsForOutfit.includes(imageUri)) {
    // Remove from selection
    setSelectedItemsForOutfit(prev => prev.filter(uri => uri !== imageUri));
  } else {
    // Add to selection
    setSelectedItemsForOutfit(prev => [...prev, imageUri]);
  }
};

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>Add Clothing Item</Text>

        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <Text style={styles.placeholder}>Tap to pick a photo</Text>
          )}
        </TouchableOpacity>

        <Button title="Upload (Coming Soon)" onPress={() => alert('Upload functionality coming soon')} />

{savedItems.length > 1 && (
  <View style={{ marginTop: 10 }}>
    <Button 
      title={isSelectionMode ? "Cancel Selection" : "Generate Outfit"} 
      onPress={() => {
        if (isSelectionMode) {
          setIsSelectionMode(false);
          setSelectedItemsForOutfit([]);
        } else {
          setIsSelectionMode(true);
        }
      }}
    />
    
    {isSelectionMode && (
      <View style={{ marginTop: 10 }}>
        <Text>Select items to combine (Selected: {selectedItemsForOutfit.length})</Text>
        <Button 
          title="Create Outfit" 
          onPress={handleGenerateOutfit}
          disabled={generatingOutfit || selectedItemsForOutfit.length < 2}
        />
      </View>
    )}
  </View>
)}

{generatingOutfit && <Text>Generating outfit... ✨</Text>}

        {loading && <Text>Analyzing with AI...</Text>}

        {description && (
          <View style={{ marginTop: 20, paddingHorizontal: 10 }}>
            <Text style={{ fontWeight: 'bold' }}>Description:</Text>
            <Text style={{ paddingBottom: 10 }}>{description}</Text>
          </View>
        )}
      </View>


{generatedOutfit && (
  <View style={{ marginTop: 20, paddingHorizontal: 10, alignItems: 'center' }}>
    <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>Your Outfit Combo:</Text>
    <View style={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      backgroundColor: '#f8f8f8',
      padding: 15,
      borderRadius: 15,
      maxWidth: 320,
      borderWidth: 2,
      borderColor: '#007AFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }}>
      {selectedItemsForOutfit.map((imageUri, index) => {
        const numItems = selectedItemsForOutfit.length;
        const itemSize = numItems === 2 ? 140 : numItems === 3 ? 90 : 70;
        
        return (
          <View key={index} style={{ margin: 5 }}>
            <Image 
              source={{ uri: imageUri }} 
              style={{ 
                width: itemSize, 
                height: itemSize, 
                borderRadius: 10,
                borderWidth: 2,
                borderColor: '#fff',
              }}
              resizeMode="cover"
            />
          </View>
        );
      })}
    </View>
      <View style={{ marginTop: 15, flexDirection: 'row', justifyContent: 'space-around' }}>
      <Button 
        title="Love It!" 
        onPress={() => {
          alert("Outfit saved to favorites! ❤️");
        }}
      />
      <Button 
        title="Try Again" 
        onPress={() => {
          setGeneratedOutfit(null);
          setSelectedItemsForOutfit([]);
          setIsSelectionMode(true);
        }}
      />
    </View>
  </View>
)}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          onPress={() => setModalVisible(false)}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalContent}>
            {selectedItem && (
              <>
                <Button title="Delete Item" color="#ff5c5c" onPress={() => handleDeleteItem()} />

                <Image
                  source={{ uri: selectedItem.image }}
                  style={{ width: '100%', height: 250, borderRadius: 10 }}
                  resizeMode="cover"
                />

                <Button
                  title="Save Changes"
                  onPress={() => {
                    if (!selectedItem) return;
                    const updated = savedItems.map((item) =>
                      item.image === selectedItem.image
                        ? {
                            ...item,
                            title: editTitle,
                            tags: editTags,
                          }
                        : item
                    );
                    setSavedItems(updated);
                    setModalVisible(false);
                  }}
                />

                <Text style={{ fontWeight: 'bold', fontSize: 14, marginTop: 12 }}>Edit Title:</Text>
                <TextInput
                  value={editTitle}
                  onChangeText={setEditTitle}
                  style={{
                    borderColor: '#ccc',
                    borderWidth: 1,
                    borderRadius: 8,
                    padding: 6,
                    marginTop: 6,
                    marginBottom: 12,
                    width: '100%',
                  }}
                />

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <TextInput
                    placeholder="Add new tag..."
                    value={newTagInput}
                    onChangeText={setNewTagInput}
                    style={{
                      flex: 1,
                      borderColor: '#ccc',
                      borderWidth: 1,
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      marginRight: 6,
                    }}
                  />
                  <Button
                    title="Add"
                    onPress={() => {
                      if (newTagInput.trim() !== "") {
                        setEditTags([...editTags, newTagInput.trim()]);
                        setNewTagInput("");
                      }
                    }}
                  />
                </View>

                <Text style={{ fontWeight: 'bold', fontSize: 14 }}>Edit Tags:</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 }}>
                  {editTags.map((tag, index) => (
                    <Pressable
                      key={index}
                      onLongPress={() => {
                        const updated = [...editTags];
                        updated.splice(index, 1);
                        setEditTags(updated);
                      }}
                      style={{
                        backgroundColor: '#eee',
                        borderRadius: 16,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        margin: 4,
                      }}
                    >
                      <Text style={{ fontSize: 12 }}>{tag}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={{ marginTop: 10 }}>{selectedItem.description}</Text>

                <Button title="Close" onPress={() => setModalVisible(false)} />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20, marginTop: 20, backgroundColor: '#f8f8f8', borderRadius: 12 }}>
        {savedItems.length > 0 && (
          <View style={{ marginTop: 40 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, paddingHorizontal: 20 }}>
              Saved Wardrobe Items:
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ paddingLeft: 20 }}
            >
              {savedItems.map((item, index) => (
                  <Pressable
  key={index}
  onPress={() => {
    if (isSelectionMode) {
      handleItemSelection(item.image);
    } else {
      setSelectedItem(item);
      setEditTitle(item.title || "");
      setEditTags(item.tags || []);
      setModalVisible(true);
    }
  }}
  style={{
    marginRight: 20,
    width: 200,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    // Add selection styling
    borderWidth: isSelectionMode && selectedItemsForOutfit.includes(item.image) ? 3 : 0,
    borderColor: '#007AFF',
  }}
>
  {/* Add selection indicator */}
  {isSelectionMode && (
    <View style={{
      position: 'absolute',
      top: 5,
      right: 5,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: selectedItemsForOutfit.includes(item.image) ? '#007AFF' : '#ccc',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    }}>
      {selectedItemsForOutfit.includes(item.image) && (
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>✓</Text>
      )}
    </View>
  )}
  
  <Image
    source={{ uri: item.image }}
    style={{ width: 180, height: 140, borderRadius: 8, marginBottom: 8 }}
    resizeMode="cover"
  />
                  <Text style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>
                    {item.title}
                  </Text>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 6 }}>
                    {item.tags?.map((tag, tagIndex) => (
                      <View
                        key={tagIndex}
                        style={{
                          backgroundColor: '#e0e0e0',
                          borderRadius: 20,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          margin: 2,
                        }}
                      >
                        <Text style={{ fontSize: 10 }}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default WardrobeUploadScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    borderRadius: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 8,
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 10,
  },
  placeholder: {
    fontSize: 16,
    color: '#aaa',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    maxHeight: '80%',
  },
});