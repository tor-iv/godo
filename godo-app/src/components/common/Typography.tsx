import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';

interface TypographyProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'button';
  color?: string;
  children: React.ReactNode;
  style?: TextStyle;
  numberOfLines?: number;
}

const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color = '#1F2937',
  children,
  style,
  numberOfLines,
}) => {
  const getVariantStyle = (): TextStyle => {
    switch (variant) {
      case 'h1':
        return styles.h1;
      case 'h2':
        return styles.h2;
      case 'h3':
        return styles.h3;
      case 'body':
        return styles.body;
      case 'caption':
        return styles.caption;
      case 'button':
        return styles.button;
      default:
        return styles.body;
    }
  };

  return (
    <Text
      style={[getVariantStyle(), { color }, style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  h1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 30,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 18,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
});

export default Typography;
