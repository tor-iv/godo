import React, { memo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing } from '../../design';
import { Body } from './Typography';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  style?: any;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = memo(
  ({ size = 'large', color = colors.primary[500], text, style }) => {
    return (
      <View
        style={[styles.container, style]}
        accessibilityRole="progressbar"
        accessibilityLabel={text || 'Loading'}
      >
        <ActivityIndicator size={size} color={color} />
        {text && (
          <Body
            style={[styles.text, { color: colors.neutral[700] }]}
            accessibilityLiveRegion="polite"
          >
            {text}
          </Body>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
  },
  text: {
    marginTop: spacing[2],
    textAlign: 'center',
  },
});
