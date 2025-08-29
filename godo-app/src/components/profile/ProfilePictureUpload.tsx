import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing, shadows } from '../../design/tokens';

interface ProfilePictureUploadProps {
  imageUri?: string;
  onImageSelected: (uri: string) => void;
  size?: 'small' | 'medium' | 'large';
  editable?: boolean;
}

export const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  imageUri,
  onImageSelected,
  size = 'medium',
  editable = true,
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const requestPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable camera roll permissions in settings to upload a profile picture.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {} }, // Would open settings
          ]
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;

      setIsUploading(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable camera permissions to take a photo.'
        );
        return;
      }

      setIsUploading(true);

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to set your profile picture',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
      ]
    );
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { width: 60, height: 60, borderRadius: 30 };
      case 'large':
        return { width: 120, height: 120, borderRadius: 60 };
      default:
        return { width: 80, height: 80, borderRadius: 40 };
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  const getEditButtonSize = () => {
    switch (size) {
      case 'small':
        return { width: 24, height: 24, borderRadius: 12 };
      case 'large':
        return { width: 36, height: 36, borderRadius: 18 };
      default:
        return { width: 28, height: 28, borderRadius: 14 };
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.imageContainer, getSizeStyle()]}
        onPress={editable ? showImagePicker : undefined}
        disabled={!editable || isUploading}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={[styles.image, getSizeStyle()]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.placeholder, getSizeStyle()]}>
            <Feather
              name="user"
              size={getIconSize() * 1.5}
              color={colors.neutral[400]}
            />
          </View>
        )}

        {/* Loading Overlay */}
        {isUploading && (
          <View style={[styles.loadingOverlay, getSizeStyle()]}>
            <View style={styles.loadingSpinner}>
              <Feather
                name="loader"
                size={getIconSize()}
                color={colors.neutral[0]}
              />
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Edit Button */}
      {editable && (
        <TouchableOpacity
          style={[styles.editButton, getEditButtonSize()]}
          onPress={showImagePicker}
          disabled={isUploading}
        >
          <Feather
            name={imageUri ? 'edit-2' : 'camera'}
            size={getIconSize() * 0.7}
            color={colors.neutral[0]}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'center',
  },
  imageContainer: {
    backgroundColor: colors.neutral[100],
    borderWidth: 3,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.neutral[200],
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    padding: spacing[2],
  },
});
