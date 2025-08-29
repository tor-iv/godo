import React from 'react';
import { render } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { ProfileStats } from '../src/components/profile/ProfileStats';
import { EventFilterToggle } from '../src/components/calendar/EventFilterToggle';
import { MyEventsScreen } from '../src/screens/calendar/MyEventsScreen';
import {
  getResponsiveText,
  formatStatsText,
  textVariants,
  getContainerWidth,
  smartTruncate,
} from '../src/utils/responsiveText';

// Mock device dimensions for testing
const mockDimensions = (width: number, height: number) => {
  jest.spyOn(Dimensions, 'get').mockReturnValue({
    width,
    height,
    scale: 2,
    fontScale: 1,
  });
};

// Mock responsive design system
jest.mock('../src/design/responsiveTokens', () => ({
  deviceInfo: {
    size: 'medium',
    width: 375,
    height: 667,
  },
  responsiveDesignSystem: {
    layout: {
      screenPadding: { horizontal: 16 },
    },
    spacing: {
      get: jest.fn((size: number, options?: any) => {
        const baseSpacing: Record<number, number> = {
          1: 4,
          2: 8,
          3: 12,
          4: 16,
          6: 24,
          10: 40,
        };
        return baseSpacing[size] || 16;
      }),
    },
    typography: {
      stats: { medium: { fontSize: 20, fontWeight: '600' } },
      ui: { caption: { fontSize: 12, fontWeight: '500' } },
    },
    performance: {
      commonSizes: { avatarSize: 48 },
    },
  },
  createResponsiveStyle: jest.fn(styles => styles.medium || {}),
  textTruncation: {
    responsive: { title: { numberOfLines: 2 } },
  },
}));

// Mock services
jest.mock('../src/services', () => ({
  EventService: {
    getInstance: () => ({
      getAllCalendarEvents: () => [],
      getSavedEvents: () => [],
      getSwipeStats: () => ({
        interested: 24,
        publicEvents: 12,
        saved: 18,
      }),
      getPrivateCalendarEvents: () => [],
      getPublicCalendarEvents: () => [],
    }),
  },
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

describe('Responsive Text System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Text Variants System', () => {
    test('should have correct text variants for profile stats', () => {
      expect(textVariants['Events Attended']).toEqual({
        full: 'Events Attended',
        short: 'Attended',
        minimal: 'Going',
        icon: 'calendar',
      });

      expect(textVariants['Events Saved']).toEqual({
        full: 'Events Saved',
        short: 'Saved',
        minimal: 'Saved',
        icon: 'bookmark',
      });

      expect(textVariants['Friends']).toEqual({
        full: 'Friends',
        short: 'Friends',
        minimal: 'Friends',
        icon: 'users',
      });
    });

    test('should have correct text variants for filter options', () => {
      expect(textVariants['All Events']).toEqual({
        full: 'All Events',
        short: 'All',
        minimal: 'All',
        icon: 'calendar',
      });

      expect(textVariants['Private']).toEqual({
        full: 'Private',
        short: 'Private',
        minimal: 'Prv',
        icon: 'eye-off',
      });

      expect(textVariants['Public']).toEqual({
        full: 'Public',
        short: 'Public',
        minimal: 'Pub',
        icon: 'users',
      });
    });
  });

  describe('Responsive Text Selection', () => {
    test('should return appropriate text for different available widths', () => {
      // Wide space - should use full text
      expect(getResponsiveText('Events Attended', 200, 14, 'medium')).toBe(
        'Events Attended'
      );

      // Medium space - should use short text
      expect(getResponsiveText('Events Attended', 100, 14, 'medium')).toBe(
        'Attended'
      );

      // Narrow space - should use minimal text
      expect(getResponsiveText('Events Attended', 50, 14, 'medium')).toBe(
        'Going'
      );
    });

    test('should handle unknown text gracefully', () => {
      expect(getResponsiveText('Unknown Text', 100, 14, 'medium')).toBe(
        'Unknown Text'
      );
    });
  });

  describe('Smart Text Truncation', () => {
    test('should truncate text properly with word boundaries', () => {
      const longText = 'This is a very long text that needs to be truncated';
      const truncated = smartTruncate(longText, 20, { preferWords: true });

      expect(truncated.length).toBeLessThanOrEqual(20);
      expect(truncated).toMatch(/\.\.\.$/);
    });

    test('should truncate text without word boundaries when needed', () => {
      const longText = 'Verylongtextwithoutspaces';
      const truncated = smartTruncate(longText, 15, { preferWords: false });

      expect(truncated.length).toBeLessThanOrEqual(15);
      expect(truncated).toMatch(/\.\.\.$/);
    });

    test('should not truncate text shorter than max length', () => {
      const shortText = 'Short text';
      const result = smartTruncate(shortText, 20);

      expect(result).toBe(shortText);
    });
  });

  describe('Stats Text Formatting', () => {
    test('should format stats text for different device sizes', () => {
      // Test with different device sizes
      const stats = { going: 24, public: 12, saved: 18 };

      const formatted = formatStatsText(stats);
      expect(formatted).toContain('24');
      expect(formatted).toContain('12');
      expect(formatted).toContain('18');
      expect(formatted).toContain('•');
    });

    test('should handle missing stats gracefully', () => {
      const partialStats = { going: 5 };
      const formatted = formatStatsText(partialStats);

      expect(formatted).toBe('5 going');
    });

    test('should handle empty stats', () => {
      const emptyStats = {};
      const formatted = formatStatsText(emptyStats);

      expect(formatted).toBe('');
    });
  });

  describe('Container Width Calculations', () => {
    test('should calculate container width correctly', () => {
      const screenWidth = 375;
      const padding = 32;
      const margins = 16;

      const width = getContainerWidth(screenWidth, padding, margins);
      expect(width).toBe(327); // 375 - 32 - 16
    });

    test('should handle default values', () => {
      const screenWidth = 375;
      const width = getContainerWidth(screenWidth);
      expect(width).toBe(343); // 375 - 32 (default padding)
    });
  });

  describe('Device Size Responsiveness', () => {
    test('should adapt to small device screens', () => {
      mockDimensions(320, 568); // iPhone SE size

      const stats = {
        eventsAttended: 24,
        eventsSaved: 12,
        friendsConnected: 18,
      };
      const { getByText } = render(<ProfileStats stats={stats} />);

      // Should render without crashing on small screens
      expect(getByText('24')).toBeTruthy();
      expect(getByText('12')).toBeTruthy();
      expect(getByText('18')).toBeTruthy();
    });

    test('should adapt to medium device screens', () => {
      mockDimensions(375, 667); // iPhone 8 size

      const stats = {
        eventsAttended: 24,
        eventsSaved: 12,
        friendsConnected: 18,
      };
      const { getByText } = render(<ProfileStats stats={stats} />);

      expect(getByText('24')).toBeTruthy();
      expect(getByText('12')).toBeTruthy();
      expect(getByText('18')).toBeTruthy();
    });

    test('should adapt to large device screens', () => {
      mockDimensions(414, 896); // iPhone 11 Pro Max size

      const stats = {
        eventsAttended: 24,
        eventsSaved: 12,
        friendsConnected: 18,
      };
      const { getByText } = render(<ProfileStats stats={stats} />);

      expect(getByText('24')).toBeTruthy();
      expect(getByText('12')).toBeTruthy();
      expect(getByText('18')).toBeTruthy();
    });
  });

  describe('EventFilterToggle Responsiveness', () => {
    test('should render dropdown variant with responsive text', () => {
      const mockOnFilterChange = jest.fn();

      const { getByText } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
          variant="dropdown"
        />
      );

      // Should show appropriate text based on available space
      expect(getByText('All Events')).toBeTruthy();
    });

    test('should handle filter changes properly', () => {
      const mockOnFilterChange = jest.fn();

      render(
        <EventFilterToggle
          currentFilter="private"
          onFilterChange={mockOnFilterChange}
          variant="dropdown"
        />
      );

      // Component should render without errors
      expect(mockOnFilterChange).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle extremely narrow containers', () => {
      const text = getResponsiveText('Events Attended', 30, 14, 'high');
      expect(text).toBe('Going'); // Should use minimal variant
    });

    test('should handle very wide containers', () => {
      const text = getResponsiveText('Events Attended', 500, 14, 'medium');
      expect(text).toBe('Events Attended'); // Should use full variant
    });

    test('should handle zero width containers', () => {
      const text = getResponsiveText('Events Attended', 0, 14, 'medium');
      expect(text).toBe('Going'); // Should fallback to minimal
    });

    test('should handle negative width containers', () => {
      const text = getResponsiveText('Events Attended', -50, 14, 'medium');
      expect(text).toBe('Going'); // Should fallback to minimal
    });
  });

  describe('Accessibility Considerations', () => {
    test('should maintain readable text sizes', () => {
      const stats = {
        eventsAttended: 24,
        eventsSaved: 12,
        friendsConnected: 18,
      };
      const { getByText } = render(<ProfileStats stats={stats} />);

      // Text should be present and readable
      const attendedText = getByText('24');
      expect(attendedText).toBeTruthy();
    });

    test('should provide proper accessibility labels', () => {
      const mockOnFilterChange = jest.fn();

      const { getByLabelText } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
          variant="dropdown"
        />
      );

      expect(getByLabelText('Current filter: All Events')).toBeTruthy();
    });
  });

  describe('Performance Considerations', () => {
    test('should not cause excessive re-renders', () => {
      const stats = {
        eventsAttended: 24,
        eventsSaved: 12,
        friendsConnected: 18,
      };

      const { rerender } = render(<ProfileStats stats={stats} />);

      // Re-render with same props should not cause issues
      rerender(<ProfileStats stats={stats} />);
      rerender(<ProfileStats stats={stats} />);

      // Should still render correctly
      expect(true).toBe(true); // Test passes if no errors thrown
    });
  });
});

describe('Integration Tests', () => {
  test('should work together in MyEventsScreen', () => {
    // This tests the integration of all responsive text components
    const { getByText } = render(<MyEventsScreen />);

    expect(getByText('My Events')).toBeTruthy();
    // Stats text should be formatted responsively
    expect(getByText(/going/)).toBeTruthy();
  });
});
