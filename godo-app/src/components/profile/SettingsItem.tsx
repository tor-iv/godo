import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../design/tokens';
import {
  responsiveDesignSystem,
  textTruncation,
} from '../../design/responsiveTokens';

interface SettingsItemProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  value?: boolean | string;
  onPress?: () => void;
  type: 'switch' | 'navigation' | 'display';
  showDivider?: boolean;
  textColor?: string;
}

export const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  title,
  subtitle,
  value,
  onPress,
  type,
  showDivider = true,
  textColor = colors.neutral[700],
}) => {
  const renderRightElement = () => {
    switch (type) {
      case 'switch':
        return (
          <Switch
            value={value as boolean}
            onValueChange={onPress}
            trackColor={{
              false: colors.neutral[200],
              true: colors.primary[200],
            }}
            thumbColor={
              (value as boolean) ? colors.primary[500] : colors.neutral[400]
            }
            ios_backgroundColor={colors.neutral[200]}
          />
        );
      case 'navigation':
        return (
          <View style={styles.navigationRight}>
            {typeof value === 'string' && value !== title && (
              <Text
                style={styles.valueText}
                numberOfLines={1}
                ellipsizeMode="tail"
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {value}
              </Text>
            )}
            <Feather
              name="chevron-right"
              size={20}
              color={colors.neutral[400]}
            />
          </View>
        );
      case 'display':
        return typeof value === 'string' ? (
          <Text
            style={styles.displayValue}
            numberOfLines={1}
            ellipsizeMode="tail"
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {value}
          </Text>
        ) : null;
      default:
        return null;
    }
  };

  const ItemContent = (
    <View style={[styles.container, !showDivider && styles.lastItem]}>
      <View style={styles.leftContent}>
        <View style={styles.iconContainer}>
          <Feather name={icon} size={20} color={colors.primary[500]} />
        </View>
        <View style={styles.textContent}>
          <Text
            style={[styles.title, { color: textColor }]}
            {...textTruncation.responsive.title}
            adjustsFontSizeToFit
            minimumFontScale={0.9}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={styles.subtitle}
              {...textTruncation.responsive.subtitle}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rightContent}>{renderRightElement()}</View>
    </View>
  );

  if (type === 'display') {
    return ItemContent;
  }

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      {ItemContent}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveDesignSystem.layout.screenPadding.horizontal,
    paddingVertical: responsiveDesignSystem.spacing.get(5, {
      min: 16,
      max: 24,
    }),
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    minHeight: responsiveDesignSystem.layout.touchTarget.comfortable,
    flex: 1, // Allow full width usage
    overflow: 'hidden', // Prevent content overflow
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0, // Allow content to shrink properly
    overflow: 'hidden', // Prevent text overflow
  },
  iconContainer: {
    width: responsiveDesignSystem.performance.commonSizes.avatarSize,
    height: responsiveDesignSystem.performance.commonSizes.avatarSize,
    borderRadius: responsiveDesignSystem.performance.commonSizes.avatarSize / 2,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: responsiveDesignSystem.spacing.get(4),
  },
  textContent: {
    flex: 1,
    minWidth: 0, // Allow text to shrink properly
    marginRight: responsiveDesignSystem.spacing.get(3), // Add margin to prevent overlap with right content
  },
  title: {
    ...responsiveDesignSystem.typography.body.large,
    fontWeight: '500',
    marginBottom: responsiveDesignSystem.spacing.get(1),
    flexWrap: 'wrap',
    minWidth: 0, // Allow text to shrink
  },
  subtitle: {
    ...responsiveDesignSystem.typography.body.medium,
    color: colors.neutral[500],
    flexWrap: 'wrap',
    minWidth: 0, // Allow text to shrink
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0, // Prevent shrinking
    maxWidth: '40%', // Limit width to prevent overlap
  },
  navigationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveDesignSystem.spacing.get(2),
    maxWidth: '100%', // Ensure it doesn't overflow
  },
  valueText: {
    ...responsiveDesignSystem.typography.body.medium,
    color: colors.neutral[500],
    textAlign: 'right',
    flexShrink: 1,
    minWidth: 0,
  },
  displayValue: {
    ...responsiveDesignSystem.typography.body.medium,
    color: colors.neutral[500],
    fontWeight: '500',
  },
});
