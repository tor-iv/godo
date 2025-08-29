import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../design';
import { Heading3, Body } from './Typography';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  message?: string;
  actionTitle?: string;
  onActionPress?: () => void;
  style?: any;
}

export const EmptyState: React.FC<EmptyStateProps> = memo(
  ({ icon = 'inbox', title, message, actionTitle, onActionPress, style }) => {
    return (
      <View style={[styles.container, style]} accessibilityRole="text">
        <View style={styles.iconContainer}>
          <Feather
            name={icon}
            size={48}
            color={colors.neutral[300]}
            accessibilityHidden={true}
          />
        </View>

        <Heading3 style={styles.title} accessibilityRole="header">
          {title}
        </Heading3>

        {message && <Body style={styles.message}>{message}</Body>}

        {actionTitle && onActionPress && (
          <Button
            title={actionTitle}
            onPress={onActionPress}
            variant="outline"
            style={styles.button}
          />
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
    minHeight: 200,
  },
  iconContainer: {
    marginBottom: spacing[4],
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing[2],
    color: colors.neutral[600],
  },
  message: {
    textAlign: 'center',
    color: colors.neutral[500],
    marginBottom: spacing[6],
    maxWidth: 280,
    lineHeight: 22,
  },
  button: {
    minWidth: 120,
  },
});
