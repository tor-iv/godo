import { Platform } from 'react-native';

// Flat Design System - Gray Outlines Replacing 3D Elements
// This token system focuses on flat design principles with consistent border treatments

// Enhanced Border System for Flat Design
export const borders = {
  colors: {
    // Primary border colors for flat design
    light: '#E4E4E7', // neutral[200] - Main outline color
    medium: '#D4D4D8', // neutral[300] - Disabled/inactive states
    dark: '#A1A1AA', // neutral[400] - Active/focused states
    accent: '#1B4332', // British Racing Green - Interactive/selected states

    // Semantic border colors
    success: '#1B4332', // British Racing Green - Updated to match primary
    warning: '#f59e0b', // warning[500]
    error: '#ef4444', // error[500]
    info: '#3b82f6', // info[500]
  },

  widths: {
    hairline: 0.5, // Subtle dividers and separators
    thin: 1, // Standard component outlines
    medium: 2, // Focused/active states and primary buttons
    thick: 3, // Emphasis and selection indicators
  },

  radius: {
    small: 8, // Form inputs, small buttons
    medium: 12, // Cards, standard buttons
    large: 16, // Large buttons, containers
    xlarge: 20, // Premium cards, special containers
  },

  styles: {
    solid: 'solid',
    dashed: 'dashed',
    dotted: 'dotted',
  },
};

// Flat Design Color Palette (replacing gradients and 3D effects)
export const flatColors = {
  // Background colors for flat design
  backgrounds: {
    primary: '#FFFFFF', // Main background
    secondary: '#FAFAFA', // Secondary sections
    tertiary: '#F4F4F5', // Cards and containers
    card: '#FFFFFF', // Card backgrounds
  },

  // Button colors without gradients or shadows
  buttons: {
    primary: {
      background: '#1B4332',
      text: '#FFFFFF',
      border: '#1B4332',
    },
    secondary: {
      background: '#FFFFFF',
      text: '#1B4332',
      border: '#1B4332',
    },
    outline: {
      background: 'transparent',
      text: '#1B4332',
      border: '#E4E4E7',
    },
    ghost: {
      background: 'transparent',
      text: '#1B4332',
      border: 'transparent',
    },
    disabled: {
      background: '#F4F4F5',
      text: '#A1A1AA',
      border: '#D4D4D8',
    },
  },

  // Text colors optimized for flat design
  text: {
    primary: '#27272A', // Main text
    secondary: '#71717A', // Secondary text
    disabled: '#A1A1AA', // Disabled text
    inverse: '#FFFFFF', // Text on dark backgrounds
  },

  // State colors for flat design
  states: {
    success: '#1B4332',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
};

// Flat Layout System (replacing shadow-based elevation)
export const flatLayout = {
  // Border-based card system
  cards: {
    standard: {
      backgroundColor: flatColors.backgrounds.card,
      borderWidth: borders.widths.thin,
      borderColor: borders.colors.light,
      borderRadius: borders.radius.medium,
      borderStyle: borders.styles.solid,
    },

    premium: {
      backgroundColor: flatColors.backgrounds.card,
      borderWidth: borders.widths.medium,
      borderColor: borders.colors.medium,
      borderRadius: borders.radius.large,
      borderStyle: borders.styles.solid,
    },

    interactive: {
      backgroundColor: flatColors.backgrounds.card,
      borderWidth: borders.widths.thin,
      borderColor: borders.colors.light,
      borderRadius: borders.radius.medium,
      borderStyle: borders.styles.solid,
    },

    selected: {
      backgroundColor: flatColors.backgrounds.card,
      borderWidth: borders.widths.medium,
      borderColor: borders.colors.accent,
      borderRadius: borders.radius.medium,
      borderStyle: borders.styles.solid,
    },
  },

  // Button styles without shadows
  buttons: {
    primary: {
      backgroundColor: flatColors.buttons.primary.background,
      borderWidth: borders.widths.thin,
      borderColor: flatColors.buttons.primary.border,
      borderRadius: borders.radius.large,
      borderStyle: borders.styles.solid,
    },

    secondary: {
      backgroundColor: flatColors.buttons.secondary.background,
      borderWidth: borders.widths.thin,
      borderColor: flatColors.buttons.secondary.border,
      borderRadius: borders.radius.large,
      borderStyle: borders.styles.solid,
    },

    outline: {
      backgroundColor: flatColors.buttons.outline.background,
      borderWidth: borders.widths.thin,
      borderColor: flatColors.buttons.outline.border,
      borderRadius: borders.radius.large,
      borderStyle: borders.styles.solid,
    },

    ghost: {
      backgroundColor: flatColors.buttons.ghost.background,
      borderWidth: 0,
      borderColor: flatColors.buttons.ghost.border,
      borderRadius: borders.radius.large,
    },
  },

  // Input styles with flat borders
  inputs: {
    default: {
      backgroundColor: flatColors.backgrounds.primary,
      borderWidth: borders.widths.thin,
      borderColor: borders.colors.light,
      borderRadius: borders.radius.small,
      borderStyle: borders.styles.solid,
    },

    focused: {
      backgroundColor: flatColors.backgrounds.primary,
      borderWidth: borders.widths.medium,
      borderColor: borders.colors.accent,
      borderRadius: borders.radius.small,
      borderStyle: borders.styles.solid,
    },

    error: {
      backgroundColor: flatColors.backgrounds.primary,
      borderWidth: borders.widths.medium,
      borderColor: flatColors.states.error,
      borderRadius: borders.radius.small,
      borderStyle: borders.styles.solid,
    },
  },
};

// Interaction States for Flat Design
export const flatInteractions = {
  button: {
    default: {
      opacity: 1,
      borderColor: borders.colors.light,
      backgroundColor: flatColors.backgrounds.primary,
    },
    hover: {
      opacity: 0.9,
      borderColor: borders.colors.medium,
      backgroundColor: flatColors.backgrounds.secondary,
    },
    pressed: {
      opacity: 0.8,
      borderColor: borders.colors.dark,
      backgroundColor: flatColors.backgrounds.tertiary,
    },
    focused: {
      opacity: 1,
      borderColor: '#1B4332',
      borderWidth: borders.widths.medium,
      backgroundColor: flatColors.backgrounds.primary,
    },
    disabled: {
      opacity: 0.5,
      borderColor: borders.colors.medium,
      backgroundColor: flatColors.backgrounds.tertiary,
    },
  },

  card: {
    default: {
      borderColor: borders.colors.light,
      backgroundColor: flatColors.backgrounds.card,
    },
    hover: {
      borderColor: borders.colors.medium,
      backgroundColor: flatColors.backgrounds.card,
    },
    selected: {
      borderColor: '#1B4332',
      borderWidth: borders.widths.medium,
      backgroundColor: flatColors.backgrounds.card,
    },
  },
};

// Typography adjustments for flat design
export const flatTypography = {
  // Enhanced contrast for flat design
  weights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Spacing adjustments to compensate for removed shadows
  spacing: {
    tight: -0.5,
    normal: 0,
    loose: 0.5,
    extraLoose: 1,
  },
};

// Spacing adjustments for flat design (increased to compensate for removed elevation)
export const flatSpacing = {
  // Increased padding to create visual separation without shadows
  card: {
    internal: 24, // Increased from standard 20px
    margin: 16, // Standard margin between cards
    border: 1, // Border thickness
  },

  button: {
    horizontal: 24, // Increased horizontal padding
    vertical: 16, // Increased vertical padding
    icon: 8, // Space between icon and text
  },

  form: {
    fieldSpacing: 20, // Increased spacing between form fields
    sectionSpacing: 32, // Increased spacing between form sections
    labelSpacing: 8, // Space between label and input
  },

  // Visual separation without shadows
  section: {
    padding: 32, // Increased section padding
    margin: 24, // Margin between sections
    divider: 16, // Space around dividers
  },
};

// Export the complete flat design system
export const flatDesignSystem = {
  borders,
  colors: flatColors,
  layout: flatLayout,
  interactions: flatInteractions,
  typography: flatTypography,
  spacing: flatSpacing,
};
