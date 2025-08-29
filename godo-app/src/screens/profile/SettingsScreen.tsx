import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  colors,
  typography,
  spacing,
  layout,
  shadows,
} from '../../design/tokens';
import { Container } from '../../components/base/Container';
import { SettingsItem } from '../../components/profile/SettingsItem';

interface SettingsScreenProps {
  navigation: any;
}

interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  eventReminders: boolean;
  friendActivity: boolean;
  weeklyDigest: boolean;
}

interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  locationSharing: boolean;
  eventSharing: boolean;
  analytics: boolean;
}

interface AppSettings {
  darkMode: boolean;
  language: string;
  autoSave: boolean;
  offlineMode: boolean;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = useState<NotificationSettings>({
    pushNotifications: true,
    emailNotifications: false,
    eventReminders: true,
    friendActivity: false,
    weeklyDigest: true,
  });

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: 'friends',
    locationSharing: true,
    eventSharing: false,
    analytics: true,
  });

  const [app, setApp] = useState<AppSettings>({
    darkMode: false,
    language: 'English',
    autoSave: true,
    offlineMode: false,
  });

  const updateNotificationSetting = (
    key: keyof NotificationSettings,
    value: boolean
  ) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const updatePrivacySetting = (
    key: keyof PrivacySettings,
    value: boolean | string
  ) => {
    setPrivacy(prev => ({ ...prev, [key]: value }));
  };

  const updateAppSetting = (
    key: keyof AppSettings,
    value: boolean | string
  ) => {
    setApp(prev => ({ ...prev, [key]: value }));
  };

  const renderSectionHeader = (title: string, subtitle?: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <Container>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing[4] },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Settings</Text>
        </View>

        {/* Notifications Section */}
        {renderSectionHeader('Notifications', 'Manage how you receive updates')}
        <View style={styles.settingsGroup}>
          <SettingsItem
            icon="bell"
            title="Push Notifications"
            subtitle="Receive notifications on your device"
            value={notifications.pushNotifications}
            onPress={() =>
              updateNotificationSetting(
                'pushNotifications',
                !notifications.pushNotifications
              )
            }
            type="switch"
          />

          <SettingsItem
            icon="mail"
            title="Email Notifications"
            subtitle="Receive updates via email"
            value={notifications.emailNotifications}
            onPress={() =>
              updateNotificationSetting(
                'emailNotifications',
                !notifications.emailNotifications
              )
            }
            type="switch"
          />

          <SettingsItem
            icon="clock"
            title="Event Reminders"
            subtitle="Get notified before events start"
            value={notifications.eventReminders}
            onPress={() =>
              updateNotificationSetting(
                'eventReminders',
                !notifications.eventReminders
              )
            }
            type="switch"
          />

          <SettingsItem
            icon="users"
            title="Friend Activity"
            subtitle="See when friends join events"
            value={notifications.friendActivity}
            onPress={() =>
              updateNotificationSetting(
                'friendActivity',
                !notifications.friendActivity
              )
            }
            type="switch"
          />

          <SettingsItem
            icon="calendar"
            title="Weekly Digest"
            subtitle="Summary of upcoming events"
            value={notifications.weeklyDigest}
            onPress={() =>
              updateNotificationSetting(
                'weeklyDigest',
                !notifications.weeklyDigest
              )
            }
            type="switch"
            showDivider={false}
          />
        </View>

        {/* Privacy Section */}
        {renderSectionHeader(
          'Privacy & Security',
          'Control your data and visibility'
        )}
        <View style={styles.settingsGroup}>
          <SettingsItem
            icon="eye"
            title="Profile Visibility"
            subtitle={`Currently ${privacy.profileVisibility}`}
            value={privacy.profileVisibility}
            onPress={() => navigation.navigate('ProfileVisibility')}
            type="navigation"
          />

          <SettingsItem
            icon="map-pin"
            title="Location Sharing"
            subtitle="Share your location with friends"
            value={privacy.locationSharing}
            onPress={() =>
              updatePrivacySetting('locationSharing', !privacy.locationSharing)
            }
            type="switch"
          />

          <SettingsItem
            icon="share"
            title="Event Sharing"
            subtitle="Auto-share events you attend"
            value={privacy.eventSharing}
            onPress={() =>
              updatePrivacySetting('eventSharing', !privacy.eventSharing)
            }
            type="switch"
          />

          <SettingsItem
            icon="bar-chart"
            title="Analytics"
            subtitle="Help improve the app with usage data"
            value={privacy.analytics}
            onPress={() =>
              updatePrivacySetting('analytics', !privacy.analytics)
            }
            type="switch"
            showDivider={false}
          />
        </View>

        {/* App Preferences Section */}
        {renderSectionHeader('App Preferences', 'Customize your experience')}
        <View style={styles.settingsGroup}>
          <SettingsItem
            icon="moon"
            title="Dark Mode"
            subtitle="Use dark theme throughout the app"
            value={app.darkMode}
            onPress={() => updateAppSetting('darkMode', !app.darkMode)}
            type="switch"
          />

          <SettingsItem
            icon="globe"
            title="Language"
            subtitle={app.language}
            value={app.language}
            onPress={() => navigation.navigate('LanguageSelection')}
            type="navigation"
          />

          <SettingsItem
            icon="save"
            title="Auto-Save"
            subtitle="Automatically save preferences"
            value={app.autoSave}
            onPress={() => updateAppSetting('autoSave', !app.autoSave)}
            type="switch"
          />

          <SettingsItem
            icon="wifi-off"
            title="Offline Mode"
            subtitle="Access cached content offline"
            value={app.offlineMode}
            onPress={() => updateAppSetting('offlineMode', !app.offlineMode)}
            type="switch"
            showDivider={false}
          />
        </View>

        {/* Account Section */}
        {renderSectionHeader('Account', 'Manage your account and data')}
        <View style={styles.settingsGroup}>
          <SettingsItem
            icon="user"
            title="Account Information"
            subtitle="Update your profile details"
            onPress={() => navigation.navigate('AccountManagement')}
            type="navigation"
          />

          <SettingsItem
            icon="shield"
            title="Security"
            subtitle="Password and two-factor authentication"
            onPress={() => navigation.navigate('Security')}
            type="navigation"
          />

          <SettingsItem
            icon="download"
            title="Download Data"
            subtitle="Export your account data"
            onPress={() => navigation.navigate('DataExport')}
            type="navigation"
          />

          <SettingsItem
            icon="trash-2"
            title="Delete Account"
            subtitle="Permanently delete your account"
            onPress={() => navigation.navigate('DeleteAccount')}
            type="navigation"
            showDivider={false}
            textColor={colors.error[500]}
          />
        </View>

        {/* About Section */}
        {renderSectionHeader('About', 'App information and support')}
        <View style={styles.settingsGroup}>
          <SettingsItem
            icon="info"
            title="App Version"
            subtitle="1.0.0"
            type="display"
          />

          <SettingsItem
            icon="file-text"
            title="Terms of Service"
            subtitle="Read our terms"
            onPress={() => navigation.navigate('Terms')}
            type="navigation"
          />

          <SettingsItem
            icon="shield"
            title="Privacy Policy"
            subtitle="How we handle your data"
            onPress={() => navigation.navigate('PrivacyPolicy')}
            type="navigation"
          />

          <SettingsItem
            icon="help-circle"
            title="Help & Support"
            subtitle="Get help or contact us"
            onPress={() => navigation.navigate('Support')}
            type="navigation"
            showDivider={false}
          />
        </View>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
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
    ...typography.display1,
    color: colors.neutral[800],
  },
  sectionHeader: {
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing[4],
    marginTop: spacing[6],
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.neutral[800],
    marginBottom: spacing[1],
  },
  sectionSubtitle: {
    ...typography.body2,
    color: colors.neutral[500],
  },
  settingsGroup: {
    backgroundColor: colors.neutral[0],
    marginHorizontal: layout.screenPadding,
    borderRadius: layout.cardBorderRadius,
    ...shadows.medium,
    marginBottom: spacing[4],
  },
});
