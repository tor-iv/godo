import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, layout } from '../../design/tokens';
import { Button } from '../base/Button';
import { ProfilePictureUpload } from './ProfilePictureUpload';
import type { User } from '../../types';

interface ProfileHeaderProps {
  user: User;
  onEditProfile: () => void;
  onSettings: () => void;
  onImageSelected: (uri: string) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  onEditProfile,
  onSettings,
  onImageSelected,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing[4] }]}>
      {/* Header Controls */}
      <View style={styles.headerControls}>
        <TouchableOpacity style={styles.settingsButton} onPress={onSettings}>
          <Feather name="settings" size={24} color={colors.neutral[600]} />
        </TouchableOpacity>
      </View>

      {/* Profile Info */}
      <View style={styles.profileInfo}>
        <ProfilePictureUpload
          imageUri={user.avatar}
          onImageSelected={onImageSelected}
          size="large"
        />

        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>

        <Button
          title="Edit Profile"
          onPress={onEditProfile}
          variant="outline"
          size="medium"
          icon="edit-2"
          style={styles.editButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing[8],
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing[8],
  },
  settingsButton: {
    padding: spacing[2],
  },
  profileInfo: {
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  userName: {
    ...typography.display2,
    color: colors.neutral[800],
    marginTop: spacing[4],
    marginBottom: spacing[1],
  },
  userEmail: {
    ...typography.body2,
    color: colors.neutral[500],
    marginBottom: spacing[6],
  },
  editButton: {
    minWidth: 140,
  },
});
