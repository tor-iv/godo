import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../design/tokens';

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
              <Text style={styles.valueText}>{value}</Text>
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
          <Text style={styles.displayValue}>{value}</Text>
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
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
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
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    minHeight: 68,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
  },
  textContent: {
    flex: 1,
  },
  title: {
    ...typography.body1,
    fontWeight: '500',
    marginBottom: spacing[1],
  },
  subtitle: {
    ...typography.body2,
    color: colors.neutral[500],
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  navigationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  valueText: {
    ...typography.body2,
    color: colors.neutral[500],
  },
  displayValue: {
    ...typography.body2,
    color: colors.neutral[500],
    fontWeight: '500',
  },
});
