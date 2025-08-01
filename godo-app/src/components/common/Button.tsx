import React from 'react';
import { TouchableOpacity, ViewStyle, StyleSheet } from 'react-native';
import Typography from './Typography';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle[] = [styles.base, styles[size]];

    if (disabled) {
      baseStyle.push(styles.disabled);
    } else {
      baseStyle.push(styles[variant]);
    }

    return StyleSheet.flatten([...baseStyle, style]);
  };

  const getTextColor = (): string => {
    if (disabled) return '#9CA3AF';

    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'secondary':
        return '#6B46C1';
      case 'outline':
        return '#6B46C1';
      default:
        return '#FFFFFF';
    }
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Typography variant="button" color={getTextColor()}>
        {title}
      </Typography>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  small: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  medium: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 48,
  },
  large: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    minHeight: 56,
  },
  primary: {
    backgroundColor: '#6B46C1',
    borderColor: '#6B46C1',
  },
  secondary: {
    backgroundColor: '#E5D3FF',
    borderColor: '#E5D3FF',
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: '#6B46C1',
  },
  disabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
});

export default Button;
