import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CameraPermissionScreenProps {
  onRequestPermission: () => Promise<boolean>;
  onCancel: () => void;
}

export const CameraPermissionScreen: React.FC<CameraPermissionScreenProps> = ({
  onRequestPermission,
  onCancel,
}) => {
  const handleRequestPermission = async () => {
    try {
      const hasPermission = await onRequestPermission();
      if (!hasPermission) {
        showPermissionDeniedAlert();
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      Alert.alert('Error', 'Failed to request camera permission.');
    }
  };

  const showPermissionDeniedAlert = () => {
    Alert.alert(
      'Camera Permission Required',
      'StyleMuse needs camera access to help you take photos of your wardrobe items. Please enable camera access in your device settings.',
      [
        { text: 'Cancel', onPress: onCancel },
        { 
          text: 'Open Settings', 
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          }
        },
      ]
    );
  };

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="camera-outline" size={80} color="#007AFF" />
        </View>

        {/* Title */}
        <Text style={styles.title}>Camera Access Required</Text>

        {/* Description */}
        <Text style={styles.description}>
          StyleMuse uses your camera to help you take professional photos of your wardrobe items. 
          This enables our AI to provide better descriptions and outfit suggestions.
        </Text>

        {/* Benefits list */}
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            <Text style={styles.benefitText}>AI-powered item descriptions</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            <Text style={styles.benefitText}>Smart outfit suggestions</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            <Text style={styles.benefitText}>Professional photo editing</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            <Text style={styles.benefitText}>Background removal</Text>
          </View>
        </View>

        {/* Privacy note */}
        <View style={styles.privacyContainer}>
          <Ionicons name="shield-checkmark" size={16} color="#8E8E93" />
          <Text style={styles.privacyText}>
            Your photos are processed locally and securely. We never store your images on our servers.
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={handleRequestPermission}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Allow Camera Access</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={openSettings}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Open Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onCancel}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1C1C1E',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    color: '#3A3A3C',
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#3A3A3C',
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  privacyText: {
    fontSize: 14,
    marginLeft: 8,
    color: '#8E8E93',
    lineHeight: 20,
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 18,
    fontWeight: '600',
  },
}); 