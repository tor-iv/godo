import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { typography, colors } from '../../design/tokens';

interface TypographyProps extends TextProps {
  variant?: 
    | 'display1' | 'display2' | 'display3'
    | 'h1' | 'h2' | 'h3'
    | 'body1' | 'body2'
    | 'caption' | 'label' | 'button';
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body1',
  color = colors.neutral[800],
  align = 'left',
  style,
  children,
  ...props
}) => {
  const textColor = color;

  return (
    <Text
      style={[
        typography[variant],
        {
          color: textColor,
          textAlign: align,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

// Convenience components for common use cases
export const Heading1: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h1" {...props} />
);

export const Heading2: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h2" {...props} />
);

export const Heading3: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h3" {...props} />
);

export const Body: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="body1" {...props} />
);

export const Caption: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="caption" color="500" {...props} />
);

export const Label: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="label" {...props} />
);