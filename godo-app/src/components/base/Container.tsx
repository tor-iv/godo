import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { colors, layout, shadows } from '../../design/tokens';

interface ContainerProps extends ViewProps {
  variant?: 'screen' | 'screenCentered' | 'card' | 'premiumCard' | 'section';
  padding?: number;
  margin?: number;
}

export const Container: React.FC<ContainerProps> = ({
  variant = 'screen',
  padding,
  margin,
  style,
  children,
  ...props
}) => {
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
    ...shadows.medium,
  },
  
  premiumCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: layout.cardBorderRadius,
    padding: layout.cardPadding,
    marginBottom: layout.cardMargin,
    ...shadows.large,
  },
  
  section: {
    paddingVertical: layout.sectionPadding,
  },
});