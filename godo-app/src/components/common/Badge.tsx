import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Typography from './Typography';

interface BadgeProps {
  text: string;
  variant?: 'category' | 'status' | 'price';
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'category',
  color,
  backgroundColor,
  style,
}) => {
  const getBadgeStyle = (): ViewStyle => {
    const baseStyle: ViewStyle[] = [styles.base];

    if (backgroundColor) {
      baseStyle.push({ backgroundColor });
    } else {
      baseStyle.push(styles[variant]);
    }

    return StyleSheet.flatten([...baseStyle, style]);
  };

  const getTextColor = (): string => {
    if (color) return color;

    switch (variant) {
      case 'category':
        return '#6B46C1';
      case 'status':
        return '#059669';
      case 'price':
        return '#DC2626';
      default:
        return '#6B46C1';
    }
  };

  return (
    <View style={getBadgeStyle()}>
      <Typography variant="caption" color={getTextColor()} style={styles.text}>
        {text}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    fontSize: 12,
  },
  category: {
    backgroundColor: '#E5D3FF',
  },
  status: {
    backgroundColor: '#D1FAE5',
  },
  price: {
    backgroundColor: '#FEE2E2',
  },
});

export default Badge;
