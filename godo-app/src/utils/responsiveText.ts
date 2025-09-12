import { deviceInfo } from '../design/responsiveTokens';

// Text variant system for different screen sizes
export interface TextVariants {
  full: string;
  short: string;
  minimal: string;
  icon?: string; // For icon-only fallback
}

// Common text abbreviations for the app
export const textVariants: Record<string, TextVariants> = {
  'Events Attended': {
    full: 'Events Attended',
    short: 'Attended',
    minimal: 'Going',
    icon: 'calendar',
  },
  'Events Saved': {
    full: 'Events Saved',
    short: 'Saved',
    minimal: 'Saved',
    icon: 'bookmark',
  },
  Friends: {
    full: 'Friends',
    short: 'Friends',
    minimal: 'Friends',
    icon: 'users',
  },
  'All Events': {
    full: 'All Events',
    short: 'All',
    minimal: 'All',
    icon: 'calendar',
  },
  Private: {
    full: 'Private',
    short: 'Private',
    minimal: 'Prv',
    icon: 'eye-off',
  },
  Public: {
    full: 'Public',
    short: 'Public',
    minimal: 'Pub',
    icon: 'users',
  },
};

// Text priority levels for responsive display
export type TextPriority = 'high' | 'medium' | 'low';

// Get appropriate text variant based on available space and device size
export const getResponsiveText = (
  originalText: string,
  availableWidth: number,
  fontSize: number = 14,
  priority: TextPriority = 'medium'
): string => {
  const variants = textVariants[originalText];

  if (!variants) {
    return originalText;
  }

  // Estimate text width (rough approximation)
  const estimateTextWidth = (text: string, size: number) =>
    text.length * size * 0.6;

  const fullWidth = estimateTextWidth(variants.full, fontSize);
  const shortWidth = estimateTextWidth(variants.short, fontSize);
  const minimalWidth = estimateTextWidth(variants.minimal, fontSize);

  // Device-based text selection with priority consideration
  if (deviceInfo.size === 'small') {
    if (priority === 'high' && minimalWidth <= availableWidth) {
      return variants.minimal;
    }
    if (shortWidth <= availableWidth) {
      return variants.short;
    }
    return variants.minimal;
  }

  if (deviceInfo.size === 'medium') {
    if (fullWidth <= availableWidth) {
      return variants.full;
    }
    if (shortWidth <= availableWidth) {
      return variants.short;
    }
    return variants.minimal;
  }

  // Large and xlarge devices
  if (fullWidth <= availableWidth) {
    return variants.full;
  }
  if (shortWidth <= availableWidth) {
    return variants.short;
  }
  return variants.minimal;
};

// Smart text truncation with ellipsis
export const smartTruncate = (
  text: string,
  maxLength: number,
  options?: {
    preferWords?: boolean;
    suffix?: string;
  }
): string => {
  const { preferWords = true, suffix = '...' } = options || {};

  if (text.length <= maxLength) {
    return text;
  }

  const truncateLength = maxLength - suffix.length;

  if (preferWords) {
    const words = text.split(' ');
    let result = '';

    for (const word of words) {
      if ((result + word).length <= truncateLength) {
        result += (result ? ' ' : '') + word;
      } else {
        break;
      }
    }

    return result + suffix;
  }

  return text.substring(0, truncateLength) + suffix;
};

// Responsive font size with text scaling
export const getAdaptiveFontSize = (
  baseSize: number,
  textLength: number,
  availableWidth: number,
  options?: {
    minSize?: number;
    maxSize?: number;
    scaleFactor?: number;
  }
): number => {
  const {
    minSize = baseSize * 0.75,
    maxSize = baseSize * 1.25,
    scaleFactor = 0.6,
  } = options || {};

  // Estimate required width
  const estimatedWidth = textLength * baseSize * scaleFactor;

  if (estimatedWidth <= availableWidth) {
    return Math.min(baseSize, maxSize);
  }

  // Calculate scaled font size
  const ratio = availableWidth / estimatedWidth;
  const scaledSize = baseSize * ratio;

  return Math.max(Math.min(scaledSize, maxSize), minSize);
};

// Multi-line text handling
export const getOptimalLineCount = (
  text: string,
  availableWidth: number,
  fontSize: number,
  maxLines: number = 2
): number => {
  const estimatedCharsPerLine = Math.floor(availableWidth / (fontSize * 0.6));
  const requiredLines = Math.ceil(text.length / estimatedCharsPerLine);

  return Math.min(requiredLines, maxLines);
};

// Stats text formatting for different screen sizes
export const formatStatsText = (stats: {
  going?: number;
  public?: number;
  saved?: number;
  attended?: number;
  friends?: number;
}): string => {
  const parts: string[] = [];

  if (deviceInfo.size === 'small') {
    // Abbreviated format for small screens
    if (stats.going !== undefined) parts.push(`${stats.going} going`);
    if (stats.public !== undefined) parts.push(`${stats.public} pub`);
    if (stats.saved !== undefined) parts.push(`${stats.saved} saved`);
  } else if (deviceInfo.size === 'medium') {
    // Medium format
    if (stats.going !== undefined) parts.push(`${stats.going} going`);
    if (stats.public !== undefined) parts.push(`${stats.public} public`);
    if (stats.saved !== undefined) parts.push(`${stats.saved} saved`);
  } else {
    // Full format for large screens
    if (stats.going !== undefined) parts.push(`${stats.going} going`);
    if (stats.public !== undefined) parts.push(`${stats.public} public events`);
    if (stats.saved !== undefined) parts.push(`${stats.saved} saved`);
  }

  return parts.join(' • ');
};

// Container width estimation utilities
export const getContainerWidth = (
  screenWidth: number,
  padding: number = 32,
  margins: number = 0
): number => {
  return screenWidth - padding - margins;
};

// Text measurement utilities (for more accurate calculations)
export const measureText = (
  text: string,
  fontSize: number,
  fontWeight: string = '400'
): { width: number; height: number } => {
  // Rough approximation - in a real app, you might use a more accurate measurement
  const charWidth =
    fontSize *
    (fontWeight === 'bold' || fontWeight === '600' || fontWeight === '700'
      ? 0.65
      : 0.6);
  const width = text.length * charWidth;
  const height = fontSize * 1.2; // Approximate line height

  return { width, height };
};

// Responsive text props generator
export const getResponsiveTextProps = (
  text: string,
  availableWidth: number,
  priority: TextPriority = 'medium'
) => {
  const responsiveText = getResponsiveText(text, availableWidth, 14, priority);
  const optimalLines = getOptimalLineCount(responsiveText, availableWidth, 14);

  return {
    children: responsiveText,
    numberOfLines: optimalLines,
    ellipsizeMode: 'tail' as const,
    adjustsFontSizeToFit: deviceInfo.size === 'small',
    minimumFontScale: 0.85,
  };
};
