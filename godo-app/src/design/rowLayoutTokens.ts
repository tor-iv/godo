import { Dimensions } from 'react-native';
import { colors } from './tokens';
import {
  deviceInfo,
  getResponsiveSpacing,
  getResponsiveFontSize,
  responsiveDesignSystem,
  DeviceSize,
} from './responsiveTokens';

// Row Layout System Constants
const GOLDEN_RATIO = 1.618;
const MIN_TOUCH_TARGET = 44;
const OPTIMAL_READING_WIDTH = 45; // Characters

// Device Size Multipliers for Row Layout
const ROW_SCALE_FACTORS: Record<DeviceSize, number> = {
  small: 0.85, // iPhone SE/Mini - Compact layout
  medium: 1.0, // iPhone Standard - Base layout
  large: 1.15, // iPhone Pro/Plus - Generous layout
  xlarge: 1.35, // iPad/Tablet - Spacious layout
};

// Row Layout Specifications
export const rowLayoutSpecs = {
  // Container Configuration
  container: {
    // Padding scales with device size
    paddingHorizontal: getResponsiveSpacing(6, { min: 16, max: 32 }),
    paddingVertical: getResponsiveSpacing(4, { min: 12, max: 24 }),

    // Gap between items in a row
    gap: getResponsiveSpacing(3, { min: 8, max: 20 }),

    // Maximum width before switching to multi-row layout
    maxWidth:
      deviceInfo.width - 2 * getResponsiveSpacing(6, { min: 16, max: 32 }),

    // Minimum height for consistent alignment
    minHeight: deviceInfo.size === 'small' ? 100 : 120,
  },

  // Item Configuration in Row Layout
  item: {
    // Minimum width to maintain readability
    minWidth: deviceInfo.size === 'small' ? 80 : 100,

    // Maximum width to prevent stretching
    maxWidth: deviceInfo.width * 0.4, // Never exceed 40% of screen width

    // Aspect ratio guidance (width:height)
    aspectRatio: {
      square: 1,
      portrait: 0.75, // 3:4 ratio
      landscape: 1.33, // 4:3 ratio
      golden: GOLDEN_RATIO, // 1:1.618 ratio
    },

    // Padding within each item
    padding: {
      horizontal: getResponsiveSpacing(3, { min: 10, max: 16 }),
      vertical: getResponsiveSpacing(2, { min: 8, max: 12 }),
    },

    // Border radius for consistency
    borderRadius: deviceInfo.size === 'small' ? 16 : 20,
  },

  // Responsive breakpoints for row layout
  breakpoints: {
    // When to show 2 items per row
    twoColumn: {
      minWidth: 320,
      maxWidth: 480,
      itemWidth: '47.5%', // Account for gap
    },

    // When to show 3 items per row (default)
    threeColumn: {
      minWidth: 375,
      maxWidth: 768,
      itemWidth: '31%', // Account for gaps
    },

    // When to show 4 items per row (tablets)
    fourColumn: {
      minWidth: 768,
      itemWidth: '23%', // Account for gaps
    },
  },
};

// Typography System for Row Layout
export const rowTypography = {
  // Primary value/number display
  value: {
    fontSize: getResponsiveFontSize('3xl', { min: 20, max: 28 }),
    fontWeight: '700' as const,
    lineHeight: getResponsiveFontSize('3xl', { min: 20, max: 28 }) * 1.1,
    letterSpacing: -0.4,
    color: colors.neutral[800],
  },

  // Secondary value for smaller emphasis
  valueSecondary: {
    fontSize: getResponsiveFontSize('xl', { min: 16, max: 20 }),
    fontWeight: '600' as const,
    lineHeight: getResponsiveFontSize('xl', { min: 16, max: 20 }) * 1.2,
    letterSpacing: -0.2,
    color: colors.neutral[700],
  },

  // Label/title text
  label: {
    fontSize: getResponsiveFontSize('sm', { min: 11, max: 14 }),
    fontWeight: '500' as const,
    lineHeight: getResponsiveFontSize('sm', { min: 11, max: 14 }) * 1.3,
    letterSpacing: 0.2,
    color: colors.neutral[600],
  },

  // Caption/subtitle text
  caption: {
    fontSize: getResponsiveFontSize('xs', { min: 10, max: 12 }),
    fontWeight: '400' as const,
    lineHeight: getResponsiveFontSize('xs', { min: 10, max: 12 }) * 1.3,
    letterSpacing: 0.3,
    color: colors.neutral[500],
  },
};

// Color Variants for Row Layout Items
export const rowColorVariants = {
  // Default neutral variant
  default: {
    background: colors.neutral[0],
    border: colors.neutral[200],
    surface: colors.neutral[25],
    accent: colors.primary[50],
    accentBorder: colors.primary[200],
  },

  // Primary accent variant
  primary: {
    background: colors.primary[50],
    border: colors.primary[200],
    surface: colors.primary[25],
    accent: colors.primary[100],
    accentBorder: colors.primary[300],
  },

  // Success variant (for positive metrics)
  success: {
    background: colors.success[50],
    border: colors.success[500],
    surface: colors.success[50],
    accent: colors.success[50],
    accentBorder: colors.success[500],
  },

  // Warning variant (for attention metrics)
  warning: {
    background: colors.warning[50],
    border: colors.warning[500],
    surface: colors.warning[50],
    accent: colors.warning[50],
    accentBorder: colors.warning[500],
  },

  // Info variant (for informational metrics)
  info: {
    background: colors.info[50],
    border: colors.info[500],
    surface: colors.info[50],
    accent: colors.info[50],
    accentBorder: colors.info[500],
  },
};

// Spacing System for Row Layout
export const rowSpacing = {
  // Between items in a row
  itemGap: {
    small: getResponsiveSpacing(2, { min: 6, max: 10 }),
    medium: getResponsiveSpacing(3, { min: 8, max: 16 }),
    large: getResponsiveSpacing(4, { min: 12, max: 20 }),
  },

  // Between rows (if multi-row layout)
  rowGap: {
    small: getResponsiveSpacing(4, { min: 12, max: 16 }),
    medium: getResponsiveSpacing(6, { min: 16, max: 24 }),
    large: getResponsiveSpacing(8, { min: 20, max: 32 }),
  },

  // Internal item spacing
  internal: {
    // Between icon and value
    iconToValue: getResponsiveSpacing(2, { min: 6, max: 10 }),
    // Between value and label
    valueToLabel: getResponsiveSpacing(1, { min: 4, max: 6 }),
    // Between label and caption
    labelToCaption: getResponsiveSpacing(1, { min: 2, max: 4 }),
  },
};

// Icon Configuration for Row Layout
export const rowIconSystem = {
  // Icon sizes based on device size
  sizes: {
    small: deviceInfo.size === 'small' ? 18 : 20,
    medium: deviceInfo.size === 'small' ? 22 : 24,
    large: deviceInfo.size === 'small' ? 26 : 28,
  },

  // Icon container sizes
  containers: {
    small: {
      width: deviceInfo.size === 'small' ? 32 : 36,
      height: deviceInfo.size === 'small' ? 32 : 36,
      borderRadius: deviceInfo.size === 'small' ? 16 : 18,
    },
    medium: {
      width: deviceInfo.size === 'small' ? 40 : 44,
      height: deviceInfo.size === 'small' ? 40 : 44,
      borderRadius: deviceInfo.size === 'small' ? 20 : 22,
    },
    large: {
      width: deviceInfo.size === 'small' ? 48 : 52,
      height: deviceInfo.size === 'small' ? 48 : 52,
      borderRadius: deviceInfo.size === 'small' ? 24 : 26,
    },
  },
};

// Accessibility Features for Row Layout
export const rowAccessibility = {
  // Minimum touch target sizes
  touchTarget: {
    minimum: MIN_TOUCH_TARGET,
    recommended: deviceInfo.size === 'small' ? 48 : 52,
    comfortable: deviceInfo.size === 'small' ? 56 : 60,
  },

  // Text accessibility
  text: {
    minimumFontSize: deviceInfo.size === 'small' ? 11 : 12,
    maximumLines: {
      value: 1,
      label: deviceInfo.size === 'small' ? 2 : 3,
      caption: 2,
    },
    minimumFontScale: 0.8,
  },

  // Color accessibility
  contrast: {
    minimumRatio: 4.5, // WCAG AA standard
    preferredRatio: 7.0, // WCAG AAA standard
  },
};

// Animation and Interaction Tokens
export const rowAnimations = {
  // Transition durations
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
  },

  // Easing functions
  easing: {
    ease: 'ease-in-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Transform values
  scale: {
    press: 0.95,
    hover: 1.02,
    active: 0.98,
  },
};

// Layout Patterns for Different Row Configurations
export const rowLayoutPatterns = {
  // Standard 3-column stats layout
  statsThreeColumn: {
    container: {
      flexDirection: 'row' as const,
      justifyContent: 'space-evenly' as const,
      alignItems: 'stretch' as const,
      gap: rowLayoutSpecs.container.gap,
    },
    item: {
      flex: 1,
      minWidth: rowLayoutSpecs.item.minWidth,
      maxWidth: rowLayoutSpecs.item.maxWidth,
    },
  },

  // Flexible grid layout
  flexGrid: {
    container: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      gap: rowLayoutSpecs.container.gap,
    },
    item: {
      width:
        deviceInfo.width >= 768
          ? '23%'
          : deviceInfo.width >= 480
            ? '31%'
            : '47.5%',
      marginBottom: rowSpacing.rowGap.medium,
    },
  },

  // Horizontal scroll layout
  horizontalScroll: {
    container: {
      flexDirection: 'row' as const,
      paddingHorizontal: rowLayoutSpecs.container.paddingHorizontal,
    },
    item: {
      width: deviceInfo.width * 0.7, // 70% of screen width
      marginRight: rowSpacing.itemGap.medium,
    },
  },
};

// Performance Optimization Tokens
export const rowPerformance = {
  // Virtualization thresholds
  virtualization: {
    threshold: 20, // Number of items before virtualization
    itemHeight: rowLayoutSpecs.container.minHeight + rowSpacing.rowGap.medium,
    estimatedItemSize: rowLayoutSpecs.container.minHeight,
  },

  // Memoization keys
  memoization: {
    deviceSize: deviceInfo.size,
    screenWidth: deviceInfo.width,
    orientation: deviceInfo.isLandscape ? 'landscape' : 'portrait',
  },
};

// Export consolidated row layout system
export const rowLayoutSystem = {
  specs: rowLayoutSpecs,
  typography: rowTypography,
  colors: rowColorVariants,
  spacing: rowSpacing,
  icons: rowIconSystem,
  accessibility: rowAccessibility,
  animations: rowAnimations,
  patterns: rowLayoutPatterns,
  performance: rowPerformance,

  // Device-specific optimizations
  device: {
    scale: ROW_SCALE_FACTORS[deviceInfo.size],
    isSmall: deviceInfo.size === 'small',
    isTablet: deviceInfo.type === 'tablet',
    orientation: deviceInfo.isLandscape ? 'landscape' : 'portrait',
  },
};

// Utility functions for row layout calculations
export const rowLayoutUtils = {
  // Calculate optimal item width for n columns
  calculateItemWidth: (
    containerWidth: number,
    columns: number,
    gap: number
  ): number => {
    const totalGaps = (columns - 1) * gap;
    return (containerWidth - totalGaps) / columns;
  },

  // Get recommended column count based on screen width
  getOptimalColumns: (screenWidth: number): number => {
    if (screenWidth >= 768) return 4; // Tablet
    if (screenWidth >= 480) return 3; // Large phone
    if (screenWidth >= 375) return 3; // Standard phone
    return 2; // Small phone
  },

  // Calculate if text will fit in given width
  textWillFit: (text: string, width: number, fontSize: number): boolean => {
    // Rough estimation: average character width is ~0.6 * fontSize
    const estimatedWidth = text.length * (fontSize * 0.6);
    return estimatedWidth <= width;
  },

  // Get accessibility-compliant touch target size
  getTouchTargetSize: (preferredSize: number): number => {
    return Math.max(preferredSize, MIN_TOUCH_TARGET);
  },
};

// Missing function implementations for ProfileStatsRowLayout
export const getRowLayoutConfig = (screenWidth: number, itemCount: number) => {
  const optimal = rowLayoutUtils.getOptimalColumns(screenWidth);
  if (itemCount <= optimal) {
    return rowLayoutPatterns.statsThreeColumn.container;
  }
  return rowLayoutPatterns.flexGrid.container;
};

export const getCardConfig = (screenWidth: number) => ({
  padding: rowLayoutSpecs.item.padding.horizontal,
  paddingVertical: rowLayoutSpecs.item.padding.vertical,
  borderRadius: rowLayoutSpecs.item.borderRadius,
  backgroundColor: rowColorVariants.default.background,
  borderWidth: 1,
  borderColor: rowColorVariants.default.border,
});

export const getIconConfig = (screenWidth: number) => ({
  size: rowIconSystem.sizes.medium,
  container: {
    ...rowIconSystem.containers.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: rowSpacing.internal.iconToValue,
  },
});

export const getTypographyConfig = (screenWidth: number) => ({
  value: {
    ...rowTypography.value,
    textAlign: 'center' as const,
    marginBottom: rowSpacing.internal.valueToLabel,
  },
  title: {
    ...rowTypography.label,
    textAlign: 'center' as const,
  },
});

export const calculateOptimalColumns = (
  screenWidth: number,
  itemCount: number
): number => {
  return rowLayoutUtils.getOptimalColumns(screenWidth);
};

// Export the main tokens object for backward compatibility
export const rowLayoutTokens = {
  container: {
    singleRow: rowLayoutPatterns.statsThreeColumn.container,
    auto: rowLayoutPatterns.flexGrid.container,
  },
  card: {
    default: getCardConfig(320),
    compact: {
      ...getCardConfig(320),
      paddingVertical: rowLayoutSpecs.item.padding.vertical * 0.8,
    },
    large: {
      ...getCardConfig(320),
      paddingVertical: rowLayoutSpecs.item.padding.vertical * 1.2,
    },
  },
  row: {
    wrapper: {
      flexDirection: 'row' as const,
      marginBottom: rowSpacing.rowGap.medium,
    },
  },
  spacing: {
    containerPadding: {
      normal: rowLayoutSpecs.container.paddingVertical,
    },
    cardGap: {
      normal: rowLayoutSpecs.container.gap,
      tight: rowLayoutSpecs.container.gap * 0.5,
    },
    rowGap: {
      tight: rowSpacing.rowGap.small,
    },
  },
  accessibility: {
    minFontScale: 0.8,
  },
};
