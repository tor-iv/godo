import React, { memo } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { flatDesignSystem } from '../../design/flatTokens';
import { colors, typography, spacing } from '../../design/tokens';

const { borders, colors: flatColors, layout, interactions } = flatDesignSystem;

interface FlatButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
}

export const FlatButton: React.FC<FlatButtonProps> = memo(allProps => {
  const {
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    loading = false,
    disabled = false,
    icon,
    iconPosition = 'left',
    style,
  } = allProps;

  const getButtonStyle = () => {
    const baseStyle = {
      ...layout.buttons[variant],
      ...styles.button,
      ...styles[size],
    };

    if (disabled) {
      return [
        baseStyle,
        {
          backgroundColor: flatColors.buttons.disabled.background,
          borderColor: flatColors.buttons.disabled.border,
          opacity: interactions.button.disabled.opacity,
        },
        style,
      ];
    }

    return [baseStyle, style];
  };

  const getTextStyle = () => {
    let textColor = flatColors.buttons[variant].text;

    if (disabled) {
      textColor = flatColors.buttons.disabled.text;
    }

    return [
      styles.text,
      styles[`${size}Text`],
      {
        color: textColor,
        fontWeight: typography.button.fontWeight,
        fontSize: typography.button.fontSize,
      },
    ];
  };

  const getIconColor = () => {
    if (disabled) return flatColors.buttons.disabled.text;
    return flatColors.buttons[variant].text;
  };

  const renderIcon = (position: 'left' | 'right') => {
    if (!icon || iconPosition !== position) return null;

    return (
      <Feather
        name={icon}
        size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
        color={getIconColor()}
        style={position === 'left' ? styles.iconLeft : styles.iconRight}
      />
    );
  };

  const renderContent = () => (
    <View style={styles.content}>
      {renderIcon('left')}

      {loading ? (
        <ActivityIndicator
          color={getIconColor()}
          size={size === 'small' ? 'small' : 'small'}
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}

      {renderIcon('right')}
    </View>
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={interactions.button.pressed.opacity}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading }}
      accessibilityHint={loading ? 'Button is loading' : undefined}
      style={getButtonStyle()}
    >
      {renderContent()}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderStyle: 'solid',
  },

  // Sizes with flat design spacing
  small: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    minHeight: 36,
    borderRadius: borders.radius.small,
  },

  medium: {
    paddingHorizontal: flatDesignSystem.spacing.button.horizontal,
    paddingVertical: flatDesignSystem.spacing.button.vertical,
    minHeight: 52,
    borderRadius: borders.radius.large,
  },

  large: {
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    minHeight: 56,
    borderRadius: borders.radius.xlarge,
  },

  // Content
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text styles
  text: {
    textAlign: 'center',
  },

  smallText: {
    fontSize: 14,
  },

  mediumText: {
    fontSize: 16,
  },

  largeText: {
    fontSize: 18,
  },

  // Icons
  iconLeft: {
    marginRight: flatDesignSystem.spacing.button.icon,
  },

  iconRight: {
    marginLeft: flatDesignSystem.spacing.button.icon,
  },
});
