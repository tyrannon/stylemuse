import React, { useState } from 'react';
import { View, Text, Button, Image, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const WardrobeUploadScreen = () => {
  const [savedItems, setSavedItems] = useState([
    { id: 1, image: '', description: 'Tan blazer', selected: false },
    { id: 2, image: '', description: 'Black jeans', selected: false },
  ]);
  const [referencePhoto, setReferencePhoto] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const pickReferencePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      setReferencePhoto(result.assets[0].uri);
    }
  };

  const toggleItemSelection = (id: number) => {
    setSavedItems((prev) =>
      prev.map((item) => item.id === id ? { ...item, selected: !item.selected } : item)
    );
  };

  const handleGenerateOutfit = () => {
    // placeholder image simulation
    setGeneratedImage('https://via.placeholder.com/300x400?text=AI+Outfit');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Wardrobe</Text>

      <Text style={styles.subheader}>Saved Wardrobe Items</Text>
      {savedItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.item, item.selected && styles.itemSelected]}
          onPress={() => toggleItemSelection(item.id)}
        >
          <Text>{item.description}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.subheader}>Upload Reference Photo</Text>
      {referencePhoto ? (
        <Image source={{ uri: referencePhoto }} style={styles.referencePhoto} />
      ) : (
        <Button title="Pick Reference Photo" onPress={pickReferencePhoto} />
      )}

      <Text style={styles.subheader}>Style Prompt</Text>
      <TextInput
        value={prompt}
        onChangeText={setPrompt}
        placeholder="e.g. Cozy fall outfit for a picnic"
        style={styles.input}
      />

      <Button title="Generate Outfit" onPress={handleGenerateOutfit} />

      {generatedImage && (
        <>
          <Text style={styles.subheader}>AI-Generated Outfit</Text>
          <Image source={{ uri: generatedImage }} style={styles.generatedImage} />
        </>
      )}
    </ScrollView>
  );
};

export default WardrobeUploadScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subheader: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  item: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  itemSelected: {
    backgroundColor: '#d0ebff',
    borderColor: '#339af0',
  },
  referencePhoto: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 20,
  },
  generatedImage: {
    width: '100%',
    height: 400,
    borderRadius: 10,
    marginTop: 10,
  },
});