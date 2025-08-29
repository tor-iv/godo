import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  colors,
  typography,
  spacing,
  layout,
  shadows,
} from '../../design/tokens';
import { Button } from '../../components/base/Button';
import { Container } from '../../components/base/Container';
import { ProfilePictureUpload } from '../../components/profile/ProfilePictureUpload';
import { TextInput } from '../../components/forms/TextInput';
import { SelectField } from '../../components/forms/SelectField';
import { MultiSelectField } from '../../components/forms/MultiSelectField';
import type { User } from '../../types';
import { EventCategory } from '../../types';

interface ProfileEditFormProps {
  navigation: any;
  route: {
    params: {
      user: User;
    };
  };
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { user: initialUser } = route.params;

  const [formData, setFormData] = useState({
    name: initialUser.name,
    email: initialUser.email,
    avatar: initialUser.avatar,
    bio: '',
    phone: '',
    location: 'New York, NY',
    website: '',
    categories: initialUser.preferences.categories,
    neighborhoods: initialUser.preferences.neighborhoods,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categoryOptions = [
    { label: 'Networking', value: EventCategory.NETWORKING },
    { label: 'Culture', value: EventCategory.CULTURE },
    { label: 'Fitness', value: EventCategory.FITNESS },
    { label: 'Food & Drink', value: EventCategory.FOOD },
    { label: 'Nightlife', value: EventCategory.NIGHTLIFE },
    { label: 'Outdoor', value: EventCategory.OUTDOOR },
    { label: 'Professional', value: EventCategory.PROFESSIONAL },
  ];

  const neighborhoodOptions = [
    { label: 'Manhattan', value: 'Manhattan' },
    { label: 'Brooklyn', value: 'Brooklyn' },
    { label: 'Queens', value: 'Queens' },
    { label: 'Bronx', value: 'Bronx' },
    { label: 'Staten Island', value: 'Staten Island' },
    { label: 'Williamsburg', value: 'Williamsburg' },
    { label: 'SoHo', value: 'SoHo' },
    { label: 'Greenwich Village', value: 'Greenwich Village' },
    { label: 'Upper East Side', value: 'Upper East Side' },
    { label: 'Upper West Side', value: 'Upper West Side' },
  ];

  const locationOptions = [
    { label: 'New York, NY', value: 'New York, NY' },
    { label: 'Brooklyn, NY', value: 'Brooklyn, NY' },
    { label: 'Queens, NY', value: 'Queens, NY' },
    { label: 'Jersey City, NJ', value: 'Jersey City, NJ' },
    { label: 'Hoboken, NJ', value: 'Hoboken, NJ' },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Please enter a valid website URL';
    }

    if (formData.categories.length === 0) {
      newErrors.categories = 'Please select at least one category';
    }

    if (formData.neighborhoods.length === 0) {
      newErrors.neighborhoods = 'Please select at least one neighborhood';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedUser: User = {
        ...initialUser,
        name: formData.name,
        email: formData.email,
        avatar: formData.avatar,
        preferences: {
          categories: formData.categories,
          neighborhoods: formData.neighborhoods,
        },
      };

      // Store updated user data in memory for coordination
      console.log('Profile updated:', updatedUser);

      Alert.alert('Success', 'Your profile has been updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Container>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + spacing[4] },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.screenTitle}>Edit Profile</Text>
          </View>

          {/* Profile Picture */}
          <View style={styles.profilePictureSection}>
            <ProfilePictureUpload
              imageUri={formData.avatar}
              onImageSelected={uri => updateFormField('avatar', uri)}
              size="large"
            />
            <Text style={styles.profilePictureLabel}>Tap to change photo</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <TextInput
              label="Full Name"
              value={formData.name}
              onChangeText={text => updateFormField('name', text)}
              error={errors.name}
              required
            />

            <TextInput
              label="Email Address"
              value={formData.email}
              onChangeText={text => updateFormField('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              required
            />

            <TextInput
              label="Bio"
              value={formData.bio}
              onChangeText={text => updateFormField('bio', text)}
              multiline
              numberOfLines={3}
              placeholder="Tell others about yourself..."
            />

            <TextInput
              label="Phone Number"
              value={formData.phone}
              onChangeText={text => updateFormField('phone', text)}
              keyboardType="phone-pad"
              placeholder="+1 (555) 123-4567"
            />

            <SelectField
              label="Location"
              value={formData.location}
              onValueChange={value => updateFormField('location', value)}
              options={locationOptions}
              placeholder="Select your location"
            />

            <TextInput
              label="Website"
              value={formData.website}
              onChangeText={text => updateFormField('website', text)}
              keyboardType="url"
              autoCapitalize="none"
              placeholder="https://yourwebsite.com"
              error={errors.website}
            />
          </View>

          {/* Preferences */}
          <View style={styles.preferencesSection}>
            <Text style={styles.sectionTitle}>Preferences</Text>

            <MultiSelectField
              label="Favorite Categories"
              selectedValues={formData.categories}
              onSelectionChange={values =>
                updateFormField('categories', values)
              }
              options={categoryOptions}
              error={errors.categories}
              required
            />

            <MultiSelectField
              label="Preferred Neighborhoods"
              selectedValues={formData.neighborhoods}
              onSelectionChange={values =>
                updateFormField('neighborhoods', values)
              }
              options={neighborhoodOptions}
              error={errors.neighborhoods}
              required
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title="Cancel"
              onPress={() => navigation.goBack()}
              variant="outline"
              size="large"
              style={styles.cancelButton}
            />

            <Button
              title="Save Changes"
              onPress={handleSave}
              variant="primary"
              size="large"
              loading={isLoading}
              style={styles.saveButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[12],
  },
  header: {
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing[8],
  },
  screenTitle: {
    ...typography.display2,
    color: colors.neutral[800],
  },
  profilePictureSection: {
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing[10],
  },
  profilePictureLabel: {
    ...typography.body2,
    color: colors.neutral[500],
    marginTop: spacing[3],
  },
  formSection: {
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing[8],
    gap: spacing[6],
  },
  preferencesSection: {
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing[10],
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.neutral[800],
    marginBottom: spacing[6],
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: layout.screenPadding,
    gap: spacing[4],
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});
