import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ProfileStats } from './ProfileStats';
import { ProfilePreferences } from './ProfilePreferences';
import { ProfileActions } from './ProfileActions';
import type { User } from '../../types';

interface ProfileContentProps {
  user: User;
  stats: {
    eventsAttended: number;
    eventsSaved: number;
    friendsConnected: number;
  };
  onAccountManagement: () => void;
  onPrivacySecurity: () => void;
  onHelpSupport: () => void;
  onLogout: () => void;
}

export const ProfileContent: React.FC<ProfileContentProps> = ({
  user,
  stats,
  onAccountManagement,
  onPrivacySecurity,
  onHelpSupport,
  onLogout,
}) => {
  return (
    <View style={styles.container}>
      {/* User Statistics */}
      <ProfileStats stats={stats} />

      {/* User Preferences */}
      <ProfilePreferences
        categories={user.preferences.categories}
        neighborhoods={user.preferences.neighborhoods}
      />

      {/* Profile Actions */}
      <ProfileActions
        onAccountManagement={onAccountManagement}
        onPrivacySecurity={onPrivacySecurity}
        onHelpSupport={onHelpSupport}
        onLogout={onLogout}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
