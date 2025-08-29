import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  colors,
  typography,
  spacing,
  layout,
  shadows,
} from '../../design/tokens';
import { Button } from '../base/Button';

interface ProfileActionsProps {
  onAccountManagement: () => void;
  onPrivacySecurity: () => void;
  onHelpSupport: () => void;
  onLogout: () => void;
}

export const ProfileActions: React.FC<ProfileActionsProps> = ({
  onAccountManagement,
  onPrivacySecurity,
  onHelpSupport,
  onLogout,
}) => {
  const renderActionItem = (
    icon: keyof typeof Feather.glyphMap,
    title: string,
    onPress: () => void,
    isLast: boolean = false
  ) => {
    return (
      <TouchableOpacity
        style={[styles.actionItem, isLast && styles.lastActionItem]}
        onPress={onPress}
      >
        <View style={styles.actionLeft}>
          <View style={styles.actionIcon}>
            <Feather name={icon} size={20} color={colors.primary[500]} />
          </View>
          <Text style={styles.actionText}>{title}</Text>
        </View>
        <Feather name="chevron-right" size={20} color={colors.neutral[400]} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Account Actions */}
      <View style={styles.actionsContainer}>
        {renderActionItem('user', 'Account Management', onAccountManagement)}
        {renderActionItem('shield', 'Privacy & Security', onPrivacySecurity)}
        {renderActionItem('help-circle', 'Help & Support', onHelpSupport, true)}
      </View>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <Button
          title="Sign Out"
          onPress={onLogout}
          variant="ghost"
          size="large"
          icon="log-out"
          style={styles.logoutButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: layout.screenPadding,
  },
  actionsContainer: {
    backgroundColor: colors.neutral[0],
    borderRadius: layout.cardBorderRadius,
    marginBottom: spacing[8],
    ...shadows.medium,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  lastActionItem: {
    borderBottomWidth: 0,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
  },
  actionText: {
    ...typography.body1,
    color: colors.neutral[700],
    fontWeight: '500',
  },
  logoutContainer: {
    // Empty for now, styling handled by button
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: colors.error[50],
  },
});
