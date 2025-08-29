// Main Design System Export
// This is the single entry point for the entire design system

import {
  colors,
  typography,
  spacing,
  layout,
  shadows,
  getFontFamily,
} from './tokens';
import { flatDesignSystem } from './flatTokens';
import {
  responsiveDesignSystem,
  getResponsiveFontSize,
  getResponsiveSpacing,
  deviceInfo,
  createResponsiveStyle,
  textTruncation,
  accessibility,
} from './responsiveTokens';
import {
  layoutPatterns,
  createDevicePattern,
  mergePatterns,
} from './layoutPatterns';

// Design system constants
export const DESIGN_SYSTEM_VERSION = '2.0.0';
export const SUPPORTED_SCREEN_SIZES = [
  'small',
  'medium',
  'large',
  'xlarge',
] as const;
export const SUPPORTED_DEVICE_TYPES = ['phone', 'tablet', 'desktop'] as const;

// Quick access to commonly used values
export const quickAccess = {
  // Responsive font sizes for common use cases
  fonts: {
    tiny: getResponsiveFontSize('xs', { min: 9, max: 11 }),
    small: getResponsiveFontSize('sm', { min: 10, max: 13 }),
    body: getResponsiveFontSize('md', { min: 12, max: 16 }),
    subtitle: getResponsiveFontSize('lg', { min: 14, max: 18 }),
    title: getResponsiveFontSize('xl', { min: 16, max: 22 }),
    heading: getResponsiveFontSize('2xl', { min: 18, max: 26 }),
  },

  // Responsive spacing for common use cases
  spacing: {
    xs: getResponsiveSpacing(1), // 3-5px
    sm: getResponsiveSpacing(2), // 7-10px
    md: getResponsiveSpacing(4), // 14-20px
    lg: getResponsiveSpacing(6), // 20-30px
    xl: getResponsiveSpacing(8), // 27-40px
    xxl: getResponsiveSpacing(12), // 41-60px
  },

  // Touch targets
  touchTargets: {
    small: 36,
    medium: 44,
    large: 52,
    xlarge: 60,
  },

  // Common border radius values
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    xlarge: 20,
    pill: 999,
  },

  // Animation durations
  animation: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
};

// Utility functions for common design patterns
export const designUtils = {
  // Create consistent card styles
  createCardStyle: (variant: 'elevated' | 'bordered' | 'flat' = 'bordered') => {
    const base = layoutPatterns.container.card.base;

    switch (variant) {
      case 'elevated':
        return layoutPatterns.container.card.elevated;
      case 'flat':
        return base;
      default:
        return layoutPatterns.container.card.bordered;
    }
  },

  // Create consistent button styles
  createButtonStyle: (
    variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'primary',
    size: 'small' | 'medium' | 'large' = 'medium'
  ) => {
    const baseTouch =
      size === 'small'
        ? { minHeight: 36, paddingHorizontal: 12, paddingVertical: 8 }
        : size === 'large'
          ? { minHeight: 52, paddingHorizontal: 24, paddingVertical: 16 }
          : { minHeight: 44, paddingHorizontal: 16, paddingVertical: 12 };

    return {
      ...layoutPatterns.touch.button.base,
      ...baseTouch,
      borderRadius: quickAccess.borderRadius.medium,
    };
  },

  // Create text styles with proper truncation
  createTextStyle: (
    variant: 'heading' | 'body' | 'caption' | 'label' = 'body',
    truncate: boolean | number = false
  ) => {
    let baseStyle;

    switch (variant) {
      case 'heading':
        baseStyle = responsiveDesignSystem.typography.heading[2];
        break;
      case 'caption':
        baseStyle = responsiveDesignSystem.typography.ui.caption;
        break;
      case 'label':
        baseStyle = responsiveDesignSystem.typography.ui.label;
        break;
      default:
        baseStyle = responsiveDesignSystem.typography.body.medium;
    }

    if (truncate === true) {
      return { ...baseStyle, ...textTruncation.singleLine };
    } else if (typeof truncate === 'number') {
      return { ...baseStyle, ...textTruncation.multiLine(truncate) };
    }

    return baseStyle;
  },

  // Helper for consistent spacing
  getSpacing: (multiplier: number = 1) => getResponsiveSpacing(4) * multiplier,

  // Helper for consistent icon sizes
  getIconSize: (size: 'small' | 'medium' | 'large' = 'medium') => {
    const base = responsiveDesignSystem.performance.commonSizes.iconSize;
    switch (size) {
      case 'small':
        return Math.round(base * 0.75);
      case 'large':
        return Math.round(base * 1.5);
      default:
        return base;
    }
  },

  // Helper for color opacity
  addOpacity: (color: string, opacity: number) => {
    // Simple opacity helper - in a real app you'd want a more robust solution
    if (color.startsWith('#')) {
      const hex = Math.round(opacity * 255)
        .toString(16)
        .padStart(2, '0');
      return `${color}${hex}`;
    }
    return color;
  },

  // Responsive breakpoint checker
  isSmallScreen: () => deviceInfo.size === 'small',
  isMediumScreen: () => deviceInfo.size === 'medium',
  isLargeScreen: () => deviceInfo.size === 'large',
  isXLargeScreen: () => deviceInfo.size === 'xlarge',
  isTablet: () => deviceInfo.type === 'tablet',
  isPhone: () => deviceInfo.type === 'phone',
};

// Design system validation utilities
export const designValidation = {
  // Validate touch target size
  validateTouchTarget: (size: number) => {
    const minimum = accessibility.touchTargetSize.minimum;
    if (size < minimum) {
      console.warn(
        `Touch target size ${size}px is below the minimum ${minimum}px`
      );
    }
    return size >= minimum;
  },

  // Validate contrast ratio (simplified)
  validateContrast: (foreground: string, background: string) => {
    // In a real implementation, you'd calculate actual contrast ratios
    // This is a placeholder for the concept
    console.info(
      'Contrast validation should be implemented with a proper color contrast library'
    );
    return true;
  },

  // Validate font size
  validateFontSize: (size: number) => {
    const minimum = 10; // Minimum readable font size
    if (size < minimum) {
      console.warn(`Font size ${size}px may be too small for accessibility`);
    }
    return size >= minimum;
  },
};

// Performance optimization helpers
export const designPerformance = {
  // Memoized style creation
  createMemoizedStyle: <T>(styleCreator: () => T): T => {
    // In a real implementation, you'd use React.useMemo or similar
    return styleCreator();
  },

  // Pre-calculate common styles to avoid runtime computation
  preCalculatedStyles: {
    screenPadding: responsiveDesignSystem.layout.screenPadding.horizontal,
    cardBorderRadius: responsiveDesignSystem.layout.card.borderRadius,
    touchTargetSize: responsiveDesignSystem.layout.touchTarget.comfortable,
    commonSpacing: getResponsiveSpacing(4),
  },
};

// Export individual pieces
export {
  // Core token systems
  colors,
  typography,
  spacing,
  layout,
  shadows,
  getFontFamily,
  flatDesignSystem,

  // Responsive design utilities
  responsiveDesignSystem,
  getResponsiveFontSize,
  getResponsiveSpacing,
  deviceInfo,
  createResponsiveStyle,
  textTruncation,
  accessibility,

  // Layout pattern utilities
  layoutPatterns,
  createDevicePattern,
  mergePatterns,
};

// Export everything as default for easy access
const designSystem = {
  // Core systems
  tokens: { colors, typography, spacing, layout, shadows },
  flat: flatDesignSystem,
  responsive: responsiveDesignSystem,
  patterns: layoutPatterns,

  // Utilities
  quick: quickAccess,
  utils: designUtils,
  validation: designValidation,
  performance: designPerformance,

  // Metadata
  version: DESIGN_SYSTEM_VERSION,
  device: deviceInfo,
};

export default designSystem;
