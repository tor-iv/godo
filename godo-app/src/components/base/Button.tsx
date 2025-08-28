import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, typography, spacing, layout } from '../../design/tokens';

interface ButtonProps {
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

export const Button: React.FC<ButtonProps> = allProps => {
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
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
    opacity.value = withSpring(0.8);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    opacity.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const getButtonStyle = () => {
    return [
      styles.button,
      styles[variant],
      styles[size],
      disabled && styles.disabled,
      style,
    ];
  };

  const getTextStyle = () => {
    return [
      styles.text,
      styles[`${variant}Text`],
      styles[`${size}Text`],
      disabled && styles.disabledText,
    ];
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

  const getIconColor = () => {
    if (disabled) return colors.neutral[300];

    switch (variant) {
      case 'primary':
        return colors.neutral[0];
      case 'secondary':
        return colors.neutral[0];
      case 'outline':
        return colors.primary[500];
      case 'ghost':
        return colors.primary[500];
      default:
        return colors.neutral[0];
    }
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

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
      >
        <Animated.View style={animatedStyle}>
          <LinearGradient
            colors={[colors.primary[500], colors.primary[600]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={getButtonStyle()}
          >
            {renderContent()}
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
    >
      <Animated.View style={[getButtonStyle(), animatedStyle]}>
        {renderContent()}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  // Variants
  primary: {
    // Gradient applied via LinearGradient component
  },

  secondary: {
    backgroundColor: colors.neutral[800],
  },

  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary[500],
  },

  ghost: {
    backgroundColor: 'transparent',
  },

  // Sizes
  small: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    minHeight: 36,
  },

  medium: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    minHeight: layout.buttonHeight,
  },

  large: {
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    minHeight: 56,
  },

  // States
  disabled: {
    opacity: 0.5,
  },

  // Content
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text styles
  text: {
    ...typography.button,
    textAlign: 'center',
  },

  primaryText: {
    color: colors.neutral[0],
  },

  secondaryText: {
    color: colors.neutral[0],
  },

  outlineText: {
    color: colors.primary[500],
  },

  ghostText: {
    color: colors.primary[500],
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

  disabledText: {
    opacity: 0.5,
  },

  // Icons
  iconLeft: {
    marginRight: spacing[2],
  },

  iconRight: {
    marginLeft: spacing[2],
  },
});
