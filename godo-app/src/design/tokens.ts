import { Platform } from 'react-native';

// Color System
export const colors = {
  // Primary Brand Colors (British Racing Green - Sophisticated & Rich)
  primary: {
    50: '#f0f7f2', // Almost white with racing green tint
    100: '#dceee2', // Very light racing green
    200: '#b8dcc8', // Light racing green
    300: '#8fc5a4', // Medium light racing green
    400: '#5fa97b', // Medium racing green
    500: '#2d6e3e', // Main British Racing Green (darker, richer)
    600: '#1d5029', // Deep racing green
    700: '#154020', // Darker racing green
    800: '#0d3017', // Very dark racing green
    900: '#004225', // Classic British Racing Green (darkest)
  },

  // Neutral Palette (Warm Grays)
  neutral: {
    0: '#FFFFFF', // Pure white
    25: '#FDFDFD', // Almost white (for slight elevation)
    50: '#FAFAFA', // Off-white backgrounds
    100: '#F4F4F5', // Light gray backgrounds
    200: '#E4E4E7', // Border colors
    300: '#D4D4D8', // Disabled colors
    400: '#A1A1AA', // Secondary text
    500: '#71717A', // Medium text
    600: '#52525B', // Primary text (light mode)
    700: '#3F3F46', // Strong text
    800: '#27272A', // Headings
    900: '#18181B', // Darkest text
  },

  // Semantic Colors
  success: {
    50: '#f0f7f2',
    500: '#2d6e3e', // British Racing Green success color (up swipe - public calendar)
    600: '#1d5029', // Darker British Racing Green success
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b', // Main warning color (down swipe - save for later)
    600: '#d97706', // Darker warning
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444', // Main error color (left swipe - not interested)
    600: '#dc2626', // Darker error
  },
  info: {
    50: '#eff6ff',
    500: '#3b82f6', // Main info color (right swipe - private calendar)
    600: '#2563eb', // Darker info
  },

  // NYC-Specific Accent Colors
  nyc: {
    taxi: '#F7B801', // NYC Taxi Yellow
    subway: '#0039A6', // MTA Blue
    central_park: '#228B22', // Park Green
    brooklyn: '#FF6B35', // Brooklyn Bridge Orange
  },
};

// Font System
const fonts = {
  // iOS System Fonts
  display: 'SF Pro Display',
  text: 'SF Pro Text',
  mono: 'SF Mono',

  // Android Fallbacks
  androidDisplay: 'Roboto',
  androidText: 'Roboto',
  androidMono: 'Roboto Mono',
};

export const getFontFamily = (type: 'display' | 'text' | 'mono' = 'text') => {
  const isIOS = Platform.OS === 'ios';

  switch (type) {
    case 'display':
      return isIOS ? fonts.display : fonts.androidDisplay;
    case 'mono':
      return isIOS ? fonts.mono : fonts.androidMono;
    default:
      return isIOS ? fonts.text : fonts.androidText;
  }
};

// Typography Scale
export const typography = {
  // Display Typography (Large headlines)
  display1: {
    fontFamily: getFontFamily('display'),
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  display2: {
    fontFamily: getFontFamily('display'),
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
    letterSpacing: -0.6,
  },
  display3: {
    fontFamily: getFontFamily('display'),
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 30,
    letterSpacing: -0.4,
  },

  // Heading Typography
  h1: {
    fontFamily: getFontFamily('display'),
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  h2: {
    fontFamily: getFontFamily('display'),
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  h3: {
    fontFamily: getFontFamily('display'),
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: -0.1,
  },

  // Body Typography
  body1: {
    fontFamily: getFontFamily('text'),
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  body2: {
    fontFamily: getFontFamily('text'),
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },

  // Supporting Typography
  caption: {
    fontFamily: getFontFamily('text'),
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  label: {
    fontFamily: getFontFamily('text'),
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  button: {
    fontFamily: getFontFamily('text'),
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
};

// Spacing Scale
export const spacing = {
  // Base spacing units (4px increments)
  0: 0,
  1: 4, // 0.25rem - Tiny gaps
  2: 8, // 0.5rem  - Small gaps
  3: 12, // 0.75rem - Medium-small gaps
  4: 16, // 1rem    - Standard gaps
  5: 20, // 1.25rem - Medium gaps
  6: 24, // 1.5rem  - Large gaps
  8: 32, // 2rem    - Extra large gaps
  10: 40, // 2.5rem  - Section gaps
  12: 48, // 3rem    - Major section gaps
  16: 64, // 4rem    - Page section gaps
  20: 80, // 5rem    - Very large gaps
  24: 96, // 6rem    - Extreme gaps
};

// Layout System
export const layout = {
  // Screen-level spacing
  screenPadding: spacing[6], // 24px - Edge padding for screens
  screenPaddingLarge: spacing[8], // 32px - Large screen edge padding

  // Component spacing
  componentPadding: spacing[5], // 20px - Internal component padding
  componentMargin: spacing[4], // 16px - Between components

  // Card spacing
  cardPadding: spacing[6], // 24px - Internal card padding
  cardMargin: spacing[4], // 16px - Between cards
  cardBorderRadius: 20, // Rounded corners for premium feel

  // Section spacing
  sectionSpacing: spacing[10], // 40px - Between major sections
  sectionPadding: spacing[8], // 32px - Section internal padding

  // Touch targets (44pt minimum for iOS)
  touchTarget: 44, // Minimum touch target size
  buttonHeight: 52, // Comfortable button height
  tabBarHeight: 80, // Tab bar with proper spacing

  // Content spacing
  paragraphSpacing: spacing[4], // Between paragraphs
  listItemSpacing: spacing[3], // Between list items

  // Form spacing
  formFieldSpacing: spacing[5], // Between form fields
  formSectionSpacing: spacing[8], // Between form sections
};

// Shadow System
export const shadows = {
  small: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  premium: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
};
