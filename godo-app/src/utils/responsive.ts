import { Dimensions, Platform } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const isWeb = Platform.OS === 'web';
export const isTablet = screenWidth >= 768;
export const isDesktop = screenWidth >= 1024;

// Responsive dimensions that prioritize mobile but work on web
export const getResponsiveDimensions = () => {
  if (isWeb) {
    if (isDesktop) {
      // Desktop: Show card in a reasonable size, centered
      return {
        cardWidth: Math.min(400, screenWidth * 0.9),
        cardHeight: 600,
        containerPadding: 32,
      };
    } else if (isTablet) {
      // Tablet: Slightly larger than mobile
      return {
        cardWidth: Math.min(450, screenWidth * 0.8),
        cardHeight: 650,
        containerPadding: 24,
      };
    } else {
      // Web mobile view: Similar to native mobile
      return {
        cardWidth: screenWidth - 32,
        cardHeight: (screenWidth - 32) * 1.4,
        containerPadding: 16,
      };
    }
  } else {
    // Native mobile: Full mobile experience
    return {
      cardWidth: screenWidth - 32,
      cardHeight: (screenWidth - 32) * 1.4,
      containerPadding: 16,
    };
  }
};

export const getResponsiveFontSize = (baseFontSize: number) => {
  if (isWeb && isDesktop) {
    return baseFontSize * 1.1; // Slightly larger on desktop
  }
  return baseFontSize;
};

export const getResponsiveSpacing = (baseSpacing: number) => {
  if (isWeb && isDesktop) {
    return baseSpacing * 1.2; // More spacing on desktop
  }
  return baseSpacing;
};
