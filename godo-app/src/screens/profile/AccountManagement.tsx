import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  colors,
  typography,
  spacing,
  layout,
  shadows,
} from '../../design/tokens';
import { Container } from '../../components/base/Container';
import { Button } from '../../components/base/Button';
import { SettingsItem } from '../../components/profile/SettingsItem';

interface AccountManagementProps {
  navigation: any;
}

interface AccountInfo {
  email: string;
  phoneNumber: string;
  memberSince: string;
  subscription: 'free' | 'premium';
  storageUsed: string;
}

export const AccountManagement: React.FC<AccountManagementProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();

  const [accountInfo] = useState<AccountInfo>({
    email: 'alex.johnson@gmail.com',
    phoneNumber: '+1 (555) 123-4567',
    memberSince: 'January 2024',
    subscription: 'free',
    storageUsed: '2.3 GB / 5 GB',
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChangeEmail = () => {
    Alert.alert(
      'Change Email',
      'You will receive a verification email at your new address.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => navigation.navigate('ChangeEmail') },
      ]
    );
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleChangePhone = () => {
    navigation.navigate('ChangePhoneNumber');
  };

  const handleTwoFactorAuth = () => {
    navigation.navigate('TwoFactorAuth');
  };

  const handleSubscriptionManagement = () => {
    navigation.navigate('SubscriptionManagement');
  };

  const handleDataExport = async () => {
    setIsLoading(true);
    try {
      // Simulate data export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert(
        'Export Complete',
        'Your data has been exported and will be sent to your email address within 24 hours.'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateAccount = () => {
    Alert.alert(
      'Deactivate Account',
      'This will temporarily disable your account. You can reactivate it by signing in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Account Deactivated',
              'Your account has been temporarily deactivated.'
            );
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => navigation.navigate('DeleteAccountConfirmation'),
        },
      ]
    );
  };

  const renderSectionHeader = (title: string, subtitle?: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderAccountInfoCard = () => (
    <View style={styles.accountInfoCard}>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Email Address</Text>
        <Text style={styles.infoValue}>{accountInfo.email}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Phone Number</Text>
        <Text style={styles.infoValue}>
          {accountInfo.phoneNumber || 'Not provided'}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Member Since</Text>
        <Text style={styles.infoValue}>{accountInfo.memberSince}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Subscription</Text>
        <View style={styles.subscriptionRow}>
          <Text style={styles.infoValue}>
            {accountInfo.subscription === 'premium' ? 'Premium' : 'Free'}
          </Text>
          {accountInfo.subscription === 'free' && (
            <Button
              title="Upgrade"
              onPress={handleSubscriptionManagement}
              variant="primary"
              size="small"
            />
          )}
        </View>
      </View>

      <View style={[styles.infoRow, styles.lastRow]}>
        <Text style={styles.infoLabel}>Storage Used</Text>
        <Text style={styles.infoValue}>{accountInfo.storageUsed}</Text>
      </View>
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
          <Text style={styles.screenTitle}>Account Management</Text>
        </View>

        {/* Account Information */}
        {renderSectionHeader(
          'Account Information',
          'Your basic account details'
        )}
        {renderAccountInfoCard()}

        {/* Security Section */}
        {renderSectionHeader('Security & Privacy', 'Keep your account secure')}
        <View style={styles.settingsGroup}>
          <SettingsItem
            icon="mail"
            title="Change Email Address"
            subtitle={accountInfo.email}
            onPress={handleChangeEmail}
            type="navigation"
          />

          <SettingsItem
            icon="lock"
            title="Change Password"
            subtitle="Update your password"
            onPress={handleChangePassword}
            type="navigation"
          />

          <SettingsItem
            icon="smartphone"
            title="Phone Number"
            subtitle={accountInfo.phoneNumber || 'Add phone number'}
            onPress={handleChangePhone}
            type="navigation"
          />

          <SettingsItem
            icon="shield"
            title="Two-Factor Authentication"
            subtitle="Add an extra layer of security"
            onPress={handleTwoFactorAuth}
            type="navigation"
            showDivider={false}
          />
        </View>

        {/* Subscription Section */}
        {renderSectionHeader(
          'Subscription & Billing',
          'Manage your plan and payments'
        )}
        <View style={styles.settingsGroup}>
          <SettingsItem
            icon="credit-card"
            title="Subscription Plan"
            subtitle={`Current: ${accountInfo.subscription === 'premium' ? 'Premium' : 'Free Plan'}`}
            onPress={handleSubscriptionManagement}
            type="navigation"
          />

          {accountInfo.subscription === 'premium' && (
            <SettingsItem
              icon="file-text"
              title="Billing History"
              subtitle="View past invoices"
              onPress={() => navigation.navigate('BillingHistory')}
              type="navigation"
            />
          )}

          <SettingsItem
            icon="database"
            title="Storage Management"
            subtitle={accountInfo.storageUsed}
            onPress={() => navigation.navigate('StorageManagement')}
            type="navigation"
            showDivider={false}
          />
        </View>

        {/* Data Management Section */}
        {renderSectionHeader(
          'Data Management',
          'Control your data and privacy'
        )}
        <View style={styles.settingsGroup}>
          <SettingsItem
            icon="download"
            title="Export Account Data"
            subtitle="Download all your data"
            onPress={handleDataExport}
            type="navigation"
          />

          <SettingsItem
            icon="refresh-cw"
            title="Connected Apps"
            subtitle="Manage third-party connections"
            onPress={() => navigation.navigate('ConnectedApps')}
            type="navigation"
          />

          <SettingsItem
            icon="eye-off"
            title="Privacy Settings"
            subtitle="Control who can see your activity"
            onPress={() => navigation.navigate('PrivacySettings')}
            type="navigation"
            showDivider={false}
          />
        </View>

        {/* Account Actions Section */}
        {renderSectionHeader(
          'Account Actions',
          'Deactivate or delete your account'
        )}
        <View style={styles.settingsGroup}>
          <SettingsItem
            icon="pause-circle"
            title="Deactivate Account"
            subtitle="Temporarily disable your account"
            onPress={handleDeactivateAccount}
            type="navigation"
            textColor={colors.warning[600]}
          />

          <SettingsItem
            icon="trash-2"
            title="Delete Account"
            subtitle="Permanently delete your account and data"
            onPress={handleDeleteAccount}
            type="navigation"
            textColor={colors.error[500]}
            showDivider={false}
          />
        </View>

        {/* Export Data Button */}
        <View style={styles.actionContainer}>
          <Button
            title="Export All Data"
            onPress={handleDataExport}
            variant="outline"
            size="large"
            icon="download"
            loading={isLoading}
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
  accountInfoCard: {
    backgroundColor: colors.neutral[0],
    marginHorizontal: layout.screenPadding,
    borderRadius: layout.cardBorderRadius,
    padding: spacing[6],
    marginBottom: spacing[4],
    ...shadows.medium,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    ...typography.body2,
    color: colors.neutral[500],
    fontWeight: '500',
  },
  infoValue: {
    ...typography.body2,
    color: colors.neutral[700],
    fontWeight: '500',
  },
  subscriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  settingsGroup: {
    backgroundColor: colors.neutral[0],
    marginHorizontal: layout.screenPadding,
    borderRadius: layout.cardBorderRadius,
    ...shadows.medium,
    marginBottom: spacing[4],
  },
  actionContainer: {
    paddingHorizontal: layout.screenPadding,
    marginTop: spacing[4],
  },
});
