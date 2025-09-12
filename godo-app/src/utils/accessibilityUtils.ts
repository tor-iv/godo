import { Platform, AccessibilityInfo } from 'react-native';
import * as React from 'react';
import * as Haptics from 'expo-haptics';

/**
 * Accessibility utilities for React Native mobile optimization
 */
export class AccessibilityUtils {
  // Enhanced accessibility announcements
  static announce(message: string, priority: 'low' | 'high' = 'low') {
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(message);
    } else {
      // Android accessibility announcement
      AccessibilityInfo.announceForAccessibility(message);
    }
  }

  // Check if screen reader is enabled
  static async isScreenReaderEnabled(): Promise<boolean> {
    try {
      return await AccessibilityInfo.isScreenReaderEnabled();
    } catch {
      return false;
    }
  }

  // Enhanced touch feedback with accessibility consideration
  static async provideFeedback(
    type: 'light' | 'medium' | 'heavy' = 'medium',
    includeAccessibilityFeedback = true
  ) {
    // Haptic feedback
    const hapticType = {
      light: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
    }[type];

    await Haptics.impactAsync(hapticType);

    // Additional accessibility feedback for screen readers
    if (includeAccessibilityFeedback) {
      const isScreenReaderOn = await AccessibilityUtils.isScreenReaderEnabled();
      if (isScreenReaderOn) {
        // Provide audio cue for screen reader users
        const feedbackMessage = {
          light: 'Selected',
          medium: 'Activated',
          heavy: 'Confirmed',
        }[type];

        AccessibilityUtils.announce(feedbackMessage, 'low');
      }
    }
  }

  // Generate accessible labels for complex components
  static generateAccessibilityLabel(parts: (string | undefined)[]): string {
    return parts.filter(Boolean).join(', ');
  }

  // Create accessible button props
  static createAccessibleButton(
    label: string,
    hint?: string,
    state?: { selected?: boolean; disabled?: boolean }
  ) {
    return {
      accessibilityRole: 'button' as const,
      accessibilityLabel: label,
      accessibilityHint: hint,
      accessibilityState: state,
      accessible: true,
    };
  }

  // Create accessible text input props
  static createAccessibleTextInput(
    label: string,
    value?: string,
    hint?: string,
    error?: string
  ) {
    const accessibilityLabel = error ? `${label}, ${error}` : label;

    return {
      accessibilityRole: 'text' as const,
      accessibilityLabel,
      accessibilityValue: value ? { text: value } : undefined,
      accessibilityHint: hint,
      accessible: true,
    };
  }

  // Enhanced swipe gesture accessibility
  static createSwipeAccessibility(
    directions: ('up' | 'down' | 'left' | 'right')[],
    actions: Record<string, string>
  ) {
    const accessibilityActions = directions.map(direction => ({
      name: `swipe${direction.charAt(0).toUpperCase() + direction.slice(1)}` as any,
      label: actions[direction] || `Swipe ${direction}`,
    }));

    return {
      accessible: true,
      accessibilityActions,
    };
  }

  // Calendar accessibility helpers
  static createCalendarDayAccessibility(
    date: string,
    hasEvents?: boolean,
    eventCount?: number,
    isSelected?: boolean,
    isToday?: boolean
  ) {
    const parts: string[] = [];

    // Add date
    parts.push(date);

    // Add state information
    if (isToday) parts.push('today');
    if (isSelected) parts.push('selected');

    // Add event information
    if (hasEvents && eventCount) {
      parts.push(`${eventCount} ${eventCount === 1 ? 'event' : 'events'}`);
    }

    return {
      accessibilityRole: 'button' as const,
      accessibilityLabel: parts.join(', '),
      accessibilityHint: 'Tap to select date and view events',
      accessibilityState: { selected: isSelected },
    };
  }

  // Event card accessibility
  static createEventCardAccessibility(
    title: string,
    venue?: string,
    date?: string,
    time?: string,
    attendees?: number
  ) {
    const parts: string[] = [title];

    if (venue) parts.push(`at ${venue}`);
    if (date) parts.push(`on ${date}`);
    if (time) parts.push(`at ${time}`);
    if (attendees) parts.push(`${attendees} attending`);

    return {
      accessibilityRole: 'button' as const,
      accessibilityLabel: parts.join(', '),
      accessibilityHint: 'Tap for event details',
    };
  }

  // Focus management for navigation
  static async setAccessibilityFocus(ref: any, delay = 100) {
    if (ref?.current) {
      setTimeout(() => {
        AccessibilityInfo.setAccessibilityFocus(ref.current);
      }, delay);
    }
  }

  // Announce navigation changes
  static announceScreenChange(screenName: string, additionalInfo?: string) {
    const message = additionalInfo
      ? `${screenName} screen, ${additionalInfo}`
      : `${screenName} screen`;

    // Delay announcement to ensure screen is fully loaded
    setTimeout(() => {
      AccessibilityUtils.announce(message, 'high');
    }, 500);
  }

  // Reduce motion preferences
  static async shouldReduceMotion(): Promise<boolean> {
    try {
      return await AccessibilityInfo.isReduceMotionEnabled();
    } catch {
      return false;
    }
  }

  // Get animation duration based on accessibility preferences
  static async getAnimationDuration(defaultDuration: number): Promise<number> {
    const shouldReduce = await AccessibilityUtils.shouldReduceMotion();
    return shouldReduce
      ? Math.min(defaultDuration * 0.3, 150)
      : defaultDuration;
  }
}

/**
 * Hook for accessibility announcements
 */
export const useAccessibilityAnnouncement = () => {
  return {
    announce: AccessibilityUtils.announce,
    announceScreenChange: AccessibilityUtils.announceScreenChange,
  };
};

/**
 * Hook for responsive accessibility
 */
export const useResponsiveAccessibility = () => {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] =
    React.useState(false);
  const [shouldReduceMotion, setShouldReduceMotion] = React.useState(false);

  React.useEffect(() => {
    // Check initial state
    AccessibilityUtils.isScreenReaderEnabled().then(setIsScreenReaderEnabled);
    AccessibilityUtils.shouldReduceMotion().then(setShouldReduceMotion);

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );

    const motionSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setShouldReduceMotion
    );

    return () => {
      subscription?.remove();
      motionSubscription?.remove();
    };
  }, []);

  return {
    isScreenReaderEnabled,
    shouldReduceMotion,
    getAnimationDuration: AccessibilityUtils.getAnimationDuration,
  };
};
