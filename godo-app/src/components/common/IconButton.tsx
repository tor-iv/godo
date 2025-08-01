import React from 'react';
import { TouchableOpacity, ViewStyle, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface IconButtonProps {
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: number;
  color?: string;
  backgroundColor?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

const IconButton: React.FC<IconButtonProps> = ({
  iconName,
  onPress,
  size = 24,
  color = '#6B46C1',
  backgroundColor = 'transparent',
  disabled = false,
  style,
}) => {
  const buttonStyle: ViewStyle = {
    backgroundColor,
    opacity: disabled ? 0.5 : 1,
  };

  return (
    <TouchableOpacity
      style={[styles.button, buttonStyle, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Ionicons name={iconName} size={size} color={color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default IconButton;
