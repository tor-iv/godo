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
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.5,
  },
});

export default Typography;
