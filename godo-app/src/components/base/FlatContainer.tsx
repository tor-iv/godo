import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { flatDesignSystem } from '../../design/flatTokens';
import { colors, layout } from '../../design/tokens';

const { borders, colors: flatColors, layout: flatLayout } = flatDesignSystem;

interface FlatContainerProps extends ViewProps {
  variant?: 'screen' | 'screenCentered' | 'card' | 'premiumCard' | 'section';
  padding?: number;
  margin?: number;
}

export const FlatContainer: React.FC<FlatContainerProps> = allProps => {
  const {
    variant = 'screen',
    padding,
    margin,
    style,
    children,
    ...props
  } = allProps;

  const getContainerStyle = () => {
    const baseStyle = styles[variant];
    const dynamicStyles: any[] = [baseStyle];

    if (padding) {
      dynamicStyles.push({ padding });
    }
    if (margin) {
      dynamicStyles.push({ margin });
    }
    if (style) {
      dynamicStyles.push(style);
    }

    return dynamicStyles;
  };

  return (
    <View style={getContainerStyle()} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: flatColors.backgrounds.primary,
    paddingHorizontal: layout.screenPadding,
  },

  screenCentered: {
    flex: 1,
    backgroundColor: flatColors.backgrounds.primary,
    paddingHorizontal: layout.screenPadding,
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    ...flatLayout.cards.standard,
    padding: flatDesignSystem.spacing.card.internal,
    marginBottom: flatDesignSystem.spacing.card.margin,
  },

  premiumCard: {
    ...flatLayout.cards.premium,
    padding: flatDesignSystem.spacing.card.internal,
    marginBottom: flatDesignSystem.spacing.card.margin,
  },

  section: {
    paddingVertical: flatDesignSystem.spacing.section.padding,
  },
});
