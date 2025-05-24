import { Modal, Pressable } from 'react-native';
import { View, Button, Image, StyleSheet, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { describeClothingItem } from '../utils/openai';
import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

const WardrobeUploadScreen = () => {
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [savedItems, setSavedItems] = useState<
  { image: string; description: string }[]
  >([]);


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
      setImage(result.assets[0].uri);
    }
  };



const handleSave = () => {
  if (!image || !description) {
    alert("Please add and describe an item before saving.");
    return;
  }

  setSavedItems(prev => [...prev, { image, description }]);
  alert("Item saved to wardrobe!");
};



const handleDescribe = async () => {
  if (!image) return;

  setLoading(true);
  setDescription(null);


  try {
    const base64 = await FileSystem.readAsStringAsync(image, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const result = await describeClothingItem(base64);
    setDescription(result);
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


const [selectedItem, setSelectedItem] = useState<{ image: string; description: string } | null>(null);
const [modalVisible, setModalVisible] = useState(false);

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

    <Button title="Describe with AI" onPress={handleDescribe} disabled={loading} />
    <Button title="Save to Wardrobe" onPress={handleSave} />
    <Button title="Upload (Coming Soon)" onPress={() => alert('Upload functionality coming soon')} />

    {loading && <Text>Analyzing with AI...</Text>}

    {description && (
      <View style={{ marginTop: 20, paddingHorizontal: 10 }}>
        <Text style={{ fontWeight: 'bold' }}>Description:</Text>
        <Text>{description}</Text>
      </View>
    )}
  </View>

<Modal
  visible={modalVisible}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setModalVisible(false)} // Android back button
>
  <Pressable
    onPress={() => setModalVisible(false)}
    style={styles.modalOverlay}
  >
    <Pressable style={styles.modalContent}>

      {/* 🧼 Delete Button */}
      <Button title="Delete Item" color="#ff5c5c" onPress={() => handleDeleteItem()} />

      {selectedItem && (
        <>
          <Image
            source={{ uri: selectedItem.image }}
            style={{ width: '100%', height: 250, borderRadius: 10 }}
            resizeMode="cover"
          />
          <Text style={{ marginTop: 15 }}>{selectedItem.description}</Text>

        </>
      )}
        <Button title="Close" onPress={() => setModalVisible(false)} />
    </Pressable>
  </Pressable>
</Modal>


  <ScrollView style={{ flex: 1, paddingHorizontal: 20, marginTop: 20 }}>
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
            <View
              key={index}
              style={{
                marginRight: 20,
                width: 200,
                backgroundColor: '#f9f9f9',
                borderRadius: 12,
                padding: 10,
                alignItems: 'center',
              }}
            >
                <Pressable onPress={() => {
                  setSelectedItem(item);
                  setModalVisible(true);
                }}>
                <Image
                  source={{ uri: item.image }}
                  style={{ width: 180, height: 140, borderRadius: 8, marginBottom: 8 }}
                  resizeMode="cover"
                />
              </Pressable>
              <Text style={{ fontSize: 12, textAlign: 'left' }}>
                {item.description}
              </Text>
            </View>
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
    padding: 10,
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  placeholder: {
    fontSize: 16,
    color: '#aaa',
  },

  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 10,
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