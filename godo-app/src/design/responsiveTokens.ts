import { Dimensions, Platform, PixelRatio } from 'react-native';

// Device Information
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const pixelRatio = PixelRatio.get();

// Device Size Categories
export type DeviceSize = 'small' | 'medium' | 'large' | 'xlarge';
export type DeviceType = 'phone' | 'tablet' | 'desktop';

// Device Detection
export const getDeviceSize = (): DeviceSize => {
  if (screenWidth < 375) return 'small';
  if (screenWidth < 414) return 'medium';
  if (screenWidth < 768) return 'large';
  return 'xlarge';
};

export const getDeviceType = (): DeviceType => {
  if (screenWidth >= 768) return 'tablet';
  if (screenWidth >= 1024) return 'desktop';
  return 'phone';
};

// Current device info
export const deviceInfo = {
  width: screenWidth,
  height: screenHeight,
  pixelRatio,
  size: getDeviceSize(),
  type: getDeviceType(),
  isSmallDevice: screenWidth < 375,
  isMediumDevice: screenWidth >= 375 && screenWidth < 414,
  isLargeDevice: screenWidth >= 414,
  isTablet: screenWidth >= 768,
  isLandscape: screenWidth > screenHeight,
};

// Responsive Font Scaling
const baseFontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
  '6xl': 36,
};

// Font scaling factors by device size
const fontScaleFactors: Record<DeviceSize, number> = {
  small: 0.85, // iPhone SE, small devices
  medium: 1.0, // iPhone 8, standard devices
  large: 1.1, // iPhone Pro, larger phones
  xlarge: 1.25, // Tablets and very large devices
};

// Dynamic font scaling with min/max constraints
export const getResponsiveFontSize = (
  size: keyof typeof baseFontSizes,
  options?: {
    min?: number;
    max?: number;
    scale?: number;
  }
): number => {
  const baseSize = baseFontSizes[size];
  const scaleFactor = fontScaleFactors[deviceInfo.size];
  const customScale = options?.scale || 1;

  let scaledSize = baseSize * scaleFactor * customScale;

  // Apply min/max constraints
  if (options?.min) scaledSize = Math.max(scaledSize, options.min);
  if (options?.max) scaledSize = Math.min(scaledSize, options.max);

  return Math.round(scaledSize);
};

// Responsive Typography System
export const responsiveTypography = {
  // Display Typography (Headlines)
  display: {
    1: {
      fontSize: getResponsiveFontSize('6xl', { min: 28, max: 44 }),
      lineHeight: getResponsiveFontSize('6xl', { min: 28, max: 44 }) * 1.2,
      fontWeight: '700' as const,
      letterSpacing: -0.8,
    },
    2: {
      fontSize: getResponsiveFontSize('5xl', { min: 24, max: 36 }),
      lineHeight: getResponsiveFontSize('5xl', { min: 24, max: 36 }) * 1.2,
      fontWeight: '700' as const,
      letterSpacing: -0.6,
    },
    3: {
      fontSize: getResponsiveFontSize('4xl', { min: 20, max: 32 }),
      lineHeight: getResponsiveFontSize('4xl', { min: 20, max: 32 }) * 1.25,
      fontWeight: '600' as const,
      letterSpacing: -0.4,
    },
  },

  // Heading Typography
  heading: {
    1: {
      fontSize: getResponsiveFontSize('3xl', { min: 18, max: 28 }),
      lineHeight: getResponsiveFontSize('3xl', { min: 18, max: 28 }) * 1.3,
      fontWeight: '600' as const,
      letterSpacing: -0.3,
    },
    2: {
      fontSize: getResponsiveFontSize('2xl', { min: 16, max: 24 }),
      lineHeight: getResponsiveFontSize('2xl', { min: 16, max: 24 }) * 1.3,
      fontWeight: '600' as const,
      letterSpacing: -0.2,
    },
    3: {
      fontSize: getResponsiveFontSize('xl', { min: 14, max: 20 }),
      lineHeight: getResponsiveFontSize('xl', { min: 14, max: 20 }) * 1.33,
      fontWeight: '600' as const,
      letterSpacing: -0.1,
    },
  },

  // Body Typography
  body: {
    large: {
      fontSize: getResponsiveFontSize('lg', { min: 14, max: 18 }),
      lineHeight: getResponsiveFontSize('lg', { min: 14, max: 18 }) * 1.5,
      fontWeight: '400' as const,
      letterSpacing: 0,
    },
    medium: {
      fontSize: getResponsiveFontSize('md', { min: 12, max: 16 }),
      lineHeight: getResponsiveFontSize('md', { min: 12, max: 16 }) * 1.43,
      fontWeight: '400' as const,
      letterSpacing: 0.1,
    },
    small: {
      fontSize: getResponsiveFontSize('sm', { min: 10, max: 14 }),
      lineHeight: getResponsiveFontSize('sm', { min: 10, max: 14 }) * 1.33,
      fontWeight: '400' as const,
      letterSpacing: 0.2,
    },
  },

  // UI Typography
  ui: {
    button: {
      fontSize: getResponsiveFontSize('md', { min: 12, max: 16 }),
      lineHeight: getResponsiveFontSize('md', { min: 12, max: 16 }) * 1.25,
      fontWeight: '600' as const,
      letterSpacing: 0.1,
    },
    label: {
      fontSize: getResponsiveFontSize('sm', { min: 10, max: 14 }),
      lineHeight: getResponsiveFontSize('sm', { min: 10, max: 14 }) * 1.33,
      fontWeight: '500' as const,
      letterSpacing: 0.4,
    },
    caption: {
      fontSize: getResponsiveFontSize('xs', { min: 9, max: 12 }),
      lineHeight: getResponsiveFontSize('xs', { min: 9, max: 12 }) * 1.33,
      fontWeight: '500' as const,
      letterSpacing: 0.4,
    },
  },

  // Stats and Number Typography
  stats: {
    large: {
      fontSize: getResponsiveFontSize('4xl', { min: 24, max: 32 }),
      lineHeight: getResponsiveFontSize('4xl', { min: 24, max: 32 }) * 1.1,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
    },
    medium: {
      fontSize: getResponsiveFontSize('2xl', { min: 18, max: 24 }),
      lineHeight: getResponsiveFontSize('2xl', { min: 18, max: 24 }) * 1.2,
      fontWeight: '600' as const,
      letterSpacing: -0.3,
    },
    small: {
      fontSize: getResponsiveFontSize('lg', { min: 14, max: 18 }),
      lineHeight: getResponsiveFontSize('lg', { min: 14, max: 18 }) * 1.25,
      fontWeight: '600' as const,
      letterSpacing: -0.2,
    },
  },
};

// Responsive Spacing System
const baseSpacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
};

// Spacing scale factors by device size
const spacingScaleFactors: Record<DeviceSize, number> = {
  small: 0.85, // Tighter spacing on small devices
  medium: 1.0, // Standard spacing
  large: 1.1, // Slightly more generous on large phones
  xlarge: 1.25, // More generous on tablets
};

export const getResponsiveSpacing = (
  size: keyof typeof baseSpacing,
  options?: {
    min?: number;
    max?: number;
    scale?: number;
  }
): number => {
  const baseSize = baseSpacing[size];
  const scaleFactor = spacingScaleFactors[deviceInfo.size];
  const customScale = options?.scale || 1;

  let scaledSize = baseSize * scaleFactor * customScale;

  // Apply min/max constraints
  if (options?.min) scaledSize = Math.max(scaledSize, options.min);
  if (options?.max) scaledSize = Math.min(scaledSize, options.max);

  return Math.round(scaledSize);
};

// Responsive Layout Tokens
export const responsiveLayout = {
  // Screen padding based on device size
  screenPadding: {
    horizontal: getResponsiveSpacing(6, { min: 16, max: 32 }),
    vertical: getResponsiveSpacing(6, { min: 16, max: 32 }),
  },

  // Component spacing
  componentSpacing: {
    xs: getResponsiveSpacing(1),
    sm: getResponsiveSpacing(2),
    md: getResponsiveSpacing(4),
    lg: getResponsiveSpacing(6),
    xl: getResponsiveSpacing(8),
  },

  // Card dimensions and spacing
  card: {
    padding: getResponsiveSpacing(6, { min: 16, max: 24 }),
    margin: getResponsiveSpacing(4, { min: 12, max: 16 }),
    borderRadius: deviceInfo.size === 'small' ? 16 : 20,
  },

  // Touch targets (optimized for device size)
  touchTarget: {
    minimum: 44, // iOS HIG minimum
    comfortable: deviceInfo.size === 'small' ? 48 : 52,
    large: deviceInfo.size === 'small' ? 56 : 60,
  },

  // Grid system
  grid: {
    columns: deviceInfo.isTablet ? 12 : 4,
    gutter: getResponsiveSpacing(4, { min: 12, max: 20 }),
    margin: getResponsiveSpacing(6, { min: 16, max: 32 }),
  },
};

// Text Truncation Utilities
export const textTruncation = {
  // Single line truncation
  singleLine: {
    numberOfLines: 1,
    ellipsizeMode: 'tail' as const,
  },

  // Multi-line truncation
  multiLine: (lines: number) => ({
    numberOfLines: lines,
    ellipsizeMode: 'tail' as const,
  }),

  // Responsive truncation based on device size
  responsive: {
    title:
      deviceInfo.size === 'small' ? { numberOfLines: 1 } : { numberOfLines: 2 },
    subtitle:
      deviceInfo.size === 'small' ? { numberOfLines: 1 } : { numberOfLines: 2 },
    body:
      deviceInfo.size === 'small' ? { numberOfLines: 2 } : { numberOfLines: 3 },
    description:
      deviceInfo.size === 'small' ? { numberOfLines: 3 } : { numberOfLines: 4 },
  },
};

// Adaptive Breakpoint System
export const breakpoints = {
  small: { maxWidth: 374 },
  medium: { minWidth: 375, maxWidth: 413 },
  large: { minWidth: 414, maxWidth: 767 },
  xlarge: { minWidth: 768 },
};

// Media Query Helper
export const mediaQuery = {
  small: deviceInfo.width <= 374,
  medium: deviceInfo.width >= 375 && deviceInfo.width <= 413,
  large: deviceInfo.width >= 414 && deviceInfo.width <= 767,
  xlarge: deviceInfo.width >= 768,

  // Orientation queries
  portrait: deviceInfo.height > deviceInfo.width,
  landscape: deviceInfo.width > deviceInfo.height,
};

// Accessibility helpers
export const accessibility = {
  // Text scaling for accessibility
  getAccessibleFontSize: (baseSize: number, userScale = 1) => {
    return Math.round(baseSize * userScale);
  },

  // Minimum touch target sizes
  touchTargetSize: {
    minimum: 44,
    recommended: 48,
  },

  // High contrast mode adjustments
  highContrast: {
    borderWidth: 2,
    focusOutlineWidth: 3,
  },
};

// Performance optimization
export const performanceOptimized = {
  // Memoized values to avoid recalculation
  deviceSize: deviceInfo.size,
  deviceType: deviceInfo.type,
  screenWidth: deviceInfo.width,
  screenHeight: deviceInfo.height,

  // Pre-calculated common values
  commonSizes: {
    buttonHeight: responsiveLayout.touchTarget.comfortable,
    inputHeight: responsiveLayout.touchTarget.minimum,
    iconSize: deviceInfo.size === 'small' ? 20 : 24,
    avatarSize: deviceInfo.size === 'small' ? 40 : 48,
  },
};

// Export consolidated responsive system
export const responsiveDesignSystem = {
  device: deviceInfo,
  typography: responsiveTypography,
  spacing: { get: getResponsiveSpacing, scale: baseSpacing },
  layout: responsiveLayout,
  truncation: textTruncation,
  breakpoints,
  mediaQuery,
  accessibility,
  performance: performanceOptimized,
};

// Utility function to create responsive styles
export const createResponsiveStyle = <T extends Record<string, any>>(
  styles: Partial<Record<DeviceSize, T>>
): T => {
  return styles[deviceInfo.size] || styles.medium || ({} as T);
};
