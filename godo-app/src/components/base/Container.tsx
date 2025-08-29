import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { colors, layout } from '../../design/tokens';

interface ContainerProps extends ViewProps {
  variant?: 'screen' | 'screenCentered' | 'card' | 'premiumCard' | 'section';
  padding?: number;
  margin?: number;
}

export const Container: React.FC<ContainerProps> = allProps => {
  const {
    variant = 'screen',
    padding,
    margin,
    style,
    children,
    ...props
  } = allProps;
  const dynamicStyles: any[] = [styles[variant]];

  if (padding) {
    dynamicStyles.push({ padding });
  }
  if (margin) {
    dynamicStyles.push({ margin });
  }
  if (style) {
    dynamicStyles.push(style);
  }

  // Debug logging to help identify rendering issues
  if (__DEV__) {
    console.log(
      'Container rendering with variant:',
      variant,
      'styles:',
      dynamicStyles
    );
  }

  return (
    <View style={dynamicStyles} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.neutral[0],
    paddingHorizontal: layout.screenPadding,
  },

  screenCentered: {
    flex: 1,
    backgroundColor: colors.neutral[0],
    paddingHorizontal: layout.screenPadding,
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: layout.cardBorderRadius,
    padding: layout.cardPadding,
    marginBottom: layout.cardMargin,
    borderColor: colors.neutral[200],
    borderWidth: 1,
  },

  premiumCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: layout.cardBorderRadius,
    padding: layout.cardPadding,
    marginBottom: layout.cardMargin,
    borderColor: colors.neutral[300],
    borderWidth: 2,
  },

  section: {
    paddingVertical: layout.sectionPadding,
  },
});
