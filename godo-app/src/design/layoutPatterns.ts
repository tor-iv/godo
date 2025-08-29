import { ViewStyle, TextStyle } from 'react-native';
import {
  responsiveDesignSystem,
  responsiveLayout,
  getResponsiveSpacing,
} from './responsiveTokens';

// Adaptive Layout Patterns for Mobile-First Design

// Flex Layout Patterns
export const flexPatterns = {
  // Stack layouts (vertical)
  stack: {
    base: {
      flexDirection: 'column' as const,
      alignItems: 'stretch' as const,
    },
    centered: {
      flexDirection: 'column' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    spaceBetween: {
      flexDirection: 'column' as const,
      justifyContent: 'space-between' as const,
    },
    spaceAround: {
      flexDirection: 'column' as const,
      justifyContent: 'space-around' as const,
    },
  },

  // Row layouts (horizontal)
  row: {
    base: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    spaceBetween: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
    spaceAround: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-around' as const,
    },
    spaceEvenly: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-evenly' as const,
    },
    wrap: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      alignItems: 'center' as const,
    },
  },

  // Grid-like patterns using flex
  grid: {
    twoColumn: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      justifyContent: 'space-between' as const,
    },
    threeColumn: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      justifyContent: 'space-around' as const,
    },
  },
};

// Container Patterns
export const containerPatterns = {
  // Screen-level containers
  screen: {
    base: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    } as ViewStyle,

    padded: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: responsiveLayout.screenPadding.horizontal,
      paddingTop: responsiveLayout.screenPadding.vertical,
    } as ViewStyle,

    safeArea: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: responsiveLayout.screenPadding.horizontal,
    } as ViewStyle,
  },

  // Card containers
  card: {
    base: {
      backgroundColor: '#FFFFFF',
      borderRadius: responsiveLayout.card.borderRadius,
      padding: responsiveLayout.card.padding,
    } as ViewStyle,

    elevated: {
      backgroundColor: '#FFFFFF',
      borderRadius: responsiveLayout.card.borderRadius,
      padding: responsiveLayout.card.padding,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    } as ViewStyle,

    bordered: {
      backgroundColor: '#FFFFFF',
      borderRadius: responsiveLayout.card.borderRadius,
      padding: responsiveLayout.card.padding,
      borderWidth: 1,
      borderColor: '#E4E4E7',
    } as ViewStyle,

    interactive: {
      backgroundColor: '#FFFFFF',
      borderRadius: responsiveLayout.card.borderRadius,
      padding: responsiveLayout.card.padding,
      borderWidth: 1,
      borderColor: '#E4E4E7',
      // Add press states in component implementation
    } as ViewStyle,
  },

  // Section containers
  section: {
    base: {
      marginVertical: getResponsiveSpacing(6),
    } as ViewStyle,

    padded: {
      paddingHorizontal: responsiveLayout.screenPadding.horizontal,
      marginVertical: getResponsiveSpacing(6),
    } as ViewStyle,

    spaced: {
      paddingHorizontal: responsiveLayout.screenPadding.horizontal,
      paddingVertical: getResponsiveSpacing(8),
      marginVertical: getResponsiveSpacing(4),
    } as ViewStyle,
  },
};

// Touch Target Patterns
export const touchPatterns = {
  // Button patterns
  button: {
    base: {
      minHeight: responsiveLayout.touchTarget.comfortable,
      paddingHorizontal: getResponsiveSpacing(6),
      paddingVertical: getResponsiveSpacing(3),
      borderRadius: responsiveLayout.card.borderRadius,
      ...flexPatterns.row.base,
      justifyContent: 'center' as const,
    } as ViewStyle,

    large: {
      minHeight: responsiveLayout.touchTarget.large,
      paddingHorizontal: getResponsiveSpacing(8),
      paddingVertical: getResponsiveSpacing(4),
      borderRadius: responsiveLayout.card.borderRadius,
      ...flexPatterns.row.base,
      justifyContent: 'center' as const,
    } as ViewStyle,

    icon: {
      width: responsiveLayout.touchTarget.comfortable,
      height: responsiveLayout.touchTarget.comfortable,
      borderRadius: responsiveLayout.touchTarget.comfortable / 2,
      ...flexPatterns.row.centered,
    } as ViewStyle,

    iconLarge: {
      width: responsiveLayout.touchTarget.large,
      height: responsiveLayout.touchTarget.large,
      borderRadius: responsiveLayout.touchTarget.large / 2,
      ...flexPatterns.row.centered,
    } as ViewStyle,
  },

  // List item patterns
  listItem: {
    base: {
      minHeight: responsiveLayout.touchTarget.comfortable,
      paddingHorizontal: responsiveLayout.screenPadding.horizontal,
      paddingVertical: getResponsiveSpacing(3),
      ...flexPatterns.row.base,
    } as ViewStyle,

    large: {
      minHeight: responsiveLayout.touchTarget.large,
      paddingHorizontal: responsiveLayout.screenPadding.horizontal,
      paddingVertical: getResponsiveSpacing(4),
      ...flexPatterns.row.base,
    } as ViewStyle,

    card: {
      minHeight: responsiveLayout.touchTarget.comfortable,
      marginHorizontal: responsiveLayout.screenPadding.horizontal,
      marginVertical: getResponsiveSpacing(2),
      ...containerPatterns.card.interactive,
      ...flexPatterns.row.base,
    } as ViewStyle,
  },

  // Tab patterns
  tab: {
    base: {
      flex: 1,
      minHeight: responsiveLayout.touchTarget.comfortable,
      paddingVertical: getResponsiveSpacing(2),
      ...flexPatterns.stack.centered,
    } as ViewStyle,

    large: {
      flex: 1,
      minHeight: responsiveLayout.touchTarget.large,
      paddingVertical: getResponsiveSpacing(3),
      ...flexPatterns.stack.centered,
    } as ViewStyle,
  },
};

// Typography Layout Patterns
export const textPatterns = {
  // Header patterns
  header: {
    screenTitle: {
      ...responsiveDesignSystem.typography.heading[1],
      marginBottom: getResponsiveSpacing(4),
      textAlign: 'center' as const,
    } as TextStyle,

    sectionTitle: {
      ...responsiveDesignSystem.typography.heading[2],
      marginBottom: getResponsiveSpacing(3),
      marginTop: getResponsiveSpacing(6),
    } as TextStyle,

    cardTitle: {
      ...responsiveDesignSystem.typography.heading[3],
      marginBottom: getResponsiveSpacing(2),
    } as TextStyle,
  },

  // Body text patterns
  body: {
    paragraph: {
      ...responsiveDesignSystem.typography.body.medium,
      marginBottom: getResponsiveSpacing(4),
      lineHeight: responsiveDesignSystem.typography.body.medium.lineHeight,
    } as TextStyle,

    description: {
      ...responsiveDesignSystem.typography.body.small,
      color: '#71717A',
      marginBottom: getResponsiveSpacing(3),
    } as TextStyle,

    caption: {
      ...responsiveDesignSystem.typography.ui.caption,
      color: '#A1A1AA',
      marginBottom: getResponsiveSpacing(2),
    } as TextStyle,
  },

  // Stats and numbers
  stats: {
    large: {
      ...responsiveDesignSystem.typography.stats.large,
      textAlign: 'center' as const,
    } as TextStyle,

    medium: {
      ...responsiveDesignSystem.typography.stats.medium,
      textAlign: 'center' as const,
    } as TextStyle,

    small: {
      ...responsiveDesignSystem.typography.stats.small,
      textAlign: 'center' as const,
    } as TextStyle,
  },

  // Label patterns
  label: {
    field: {
      ...responsiveDesignSystem.typography.ui.label,
      marginBottom: getResponsiveSpacing(2),
    } as TextStyle,

    required: {
      ...responsiveDesignSystem.typography.ui.label,
      marginBottom: getResponsiveSpacing(2),
    } as TextStyle,

    helper: {
      ...responsiveDesignSystem.typography.ui.caption,
      color: '#71717A',
      marginTop: getResponsiveSpacing(1),
    } as TextStyle,

    error: {
      ...responsiveDesignSystem.typography.ui.caption,
      color: '#ef4444',
      marginTop: getResponsiveSpacing(1),
    } as TextStyle,
  },
};

// Component-Specific Patterns
export const componentPatterns = {
  // Profile stats pattern
  profileStats: {
    container: {
      ...flexPatterns.row.spaceEvenly,
      paddingHorizontal: responsiveLayout.screenPadding.horizontal,
      paddingVertical: getResponsiveSpacing(6),
    } as ViewStyle,

    statCard: {
      ...containerPatterns.card.bordered,
      ...flexPatterns.stack.centered,
      flex: 1,
      marginHorizontal: getResponsiveSpacing(2),
      paddingVertical: getResponsiveSpacing(5),
      minWidth: responsiveDesignSystem.device.size === 'small' ? 80 : 100,
    } as ViewStyle,

    statIcon: {
      width: responsiveDesignSystem.performance.commonSizes.iconSize * 2,
      height: responsiveDesignSystem.performance.commonSizes.iconSize * 2,
      borderRadius: responsiveDesignSystem.performance.commonSizes.iconSize,
      backgroundColor: '#f0f7f2',
      ...flexPatterns.row.centered,
      marginBottom: getResponsiveSpacing(3),
    } as ViewStyle,

    statValue: {
      ...textPatterns.stats.medium,
      marginBottom: getResponsiveSpacing(1),
    } as TextStyle,

    statLabel: {
      ...responsiveDesignSystem.typography.ui.caption,
      color: '#71717A',
      textAlign: 'center' as const,
      ...responsiveDesignSystem.truncation.singleLine,
    } as TextStyle,
  },

  // Calendar toggle pattern
  calendarToggle: {
    container: {
      position: 'relative' as const,
      zIndex: 1000,
    } as ViewStyle,

    button: {
      ...touchPatterns.button.base,
      minHeight: responsiveLayout.touchTarget.minimum,
      paddingHorizontal: getResponsiveSpacing(3),
      paddingVertical: getResponsiveSpacing(2),
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E4E4E7',
      minWidth: responsiveDesignSystem.device.size === 'small' ? 100 : 120,
      maxWidth: responsiveDesignSystem.device.size === 'small' ? 140 : 160,
    } as ViewStyle,

    buttonText: {
      ...responsiveDesignSystem.typography.ui.button,
      fontSize: responsiveDesignSystem.device.size === 'small' ? 12 : 14,
      flex: 1,
      textAlign: 'center' as const,
      ...responsiveDesignSystem.truncation.singleLine,
    } as TextStyle,

    dropdown: {
      position: 'absolute' as const,
      top: '100%' as const,
      right: 0,
      minWidth: responsiveDesignSystem.device.size === 'small' ? 140 : 160,
      backgroundColor: '#FFFFFF',
      borderRadius: responsiveLayout.card.borderRadius,
      borderWidth: 1,
      borderColor: '#E4E4E7',
      zIndex: 1001,
      marginTop: 4,
    } as ViewStyle,

    option: {
      ...touchPatterns.listItem.base,
      minHeight: responsiveLayout.touchTarget.minimum,
      paddingHorizontal: getResponsiveSpacing(3),
      paddingVertical: getResponsiveSpacing(3),
      borderBottomWidth: 1,
      borderBottomColor: '#F4F4F5',
    } as ViewStyle,

    optionText: {
      ...responsiveDesignSystem.typography.body.medium,
      fontSize: responsiveDesignSystem.device.size === 'small' ? 12 : 14,
      flex: 1,
      marginLeft: getResponsiveSpacing(2),
      ...responsiveDesignSystem.truncation.singleLine,
    } as TextStyle,
  },

  // Form field pattern
  formField: {
    container: {
      marginBottom: getResponsiveSpacing(5),
    } as ViewStyle,

    input: {
      minHeight: responsiveLayout.touchTarget.comfortable,
      paddingHorizontal: getResponsiveSpacing(4),
      paddingVertical: getResponsiveSpacing(3),
      borderWidth: 1,
      borderColor: '#E4E4E7',
      borderRadius: responsiveLayout.card.borderRadius,
      backgroundColor: '#FFFFFF',
      fontSize: responsiveDesignSystem.typography.body.medium.fontSize,
    } as ViewStyle,

    inputFocused: {
      borderColor: '#2d6e3e',
      borderWidth: 2,
    } as ViewStyle,

    inputError: {
      borderColor: '#ef4444',
      borderWidth: 2,
    } as ViewStyle,
  },

  // Navigation patterns
  navigation: {
    tabBar: {
      height: 80,
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#E4E4E7',
      paddingBottom: responsiveDesignSystem.device.type === 'phone' ? 20 : 0,
      ...flexPatterns.row.base,
    } as ViewStyle,

    tab: {
      ...touchPatterns.tab.base,
      paddingTop: getResponsiveSpacing(2),
      paddingBottom: getResponsiveSpacing(1),
    } as ViewStyle,

    tabLabel: {
      ...responsiveDesignSystem.typography.ui.caption,
      fontSize: responsiveDesignSystem.device.size === 'small' ? 10 : 12,
      marginTop: getResponsiveSpacing(1),
      textAlign: 'center' as const,
      ...responsiveDesignSystem.truncation.singleLine,
    } as TextStyle,
  },
};

// Animation and Transition Patterns
export const animationPatterns = {
  // Fade transitions
  fade: {
    duration: 200,
    easing: 'ease-in-out' as const,
  },

  // Slide transitions
  slide: {
    duration: 300,
    easing: 'ease-out' as const,
  },

  // Scale transitions
  scale: {
    duration: 150,
    easing: 'ease-in-out' as const,
  },

  // Press feedback
  press: {
    scale: 0.95,
    opacity: 0.8,
    duration: 100,
  },
};

// Consolidated Layout System Export
export const layoutPatterns = {
  flex: flexPatterns,
  container: containerPatterns,
  touch: touchPatterns,
  text: textPatterns,
  component: componentPatterns,
  animation: animationPatterns,
};

// Helper function to create device-specific patterns
export const createDevicePattern = <T extends Record<string, any>>(
  patterns: Partial<Record<'small' | 'medium' | 'large' | 'xlarge', T>>
): T => {
  const deviceSize = responsiveDesignSystem.device.size;
  return patterns[deviceSize] || patterns.medium || ({} as T);
};

// Helper function to merge patterns
export const mergePatterns = <T extends Record<string, any>>(
  ...patterns: Partial<T>[]
): T => {
  return Object.assign({}, ...patterns) as T;
};
