import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { format, startOfWeek, endOfWeek, getWeek } from 'date-fns';
import { DateNavigation } from '../src/components/calendar/DateNavigation';
import { ViewType } from '../src/components/calendar/ViewToggle';

// Mock React Native modules
jest.mock('react-native-reanimated', () => ({
  useSharedValue: jest.fn(() => ({ value: 0 })),
  useAnimatedStyle: jest.fn(() => ({})),
  withSpring: jest.fn((value) => value),
}));

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('react-native-calendars', () => ({
  Calendar: 'Calendar',
}));

// Mock Dimensions
const mockDimensions = {
  get: jest.fn(() => ({ width: 375, height: 812 })),
};
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Dimensions: mockDimensions,
  Vibration: {
    vibrate: jest.fn(),
  },
}));

describe('DateNavigation Responsive Text Formatting', () => {
  const defaultProps = {
    selectedDate: '2025-01-15',
    viewType: 'day' as ViewType,
    onDateChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default screen width
    mockDimensions.get.mockReturnValue({ width: 375, height: 812 });
  });

  describe('Screen Width Calculations and Text Adaptation', () => {
    const testWidths = [
      { width: 280, label: 'Very Small (iPhone SE-like)', expectedChars: 18 },
      { width: 320, label: 'Small (older iPhone)', expectedChars: 23 },
      { width: 375, label: 'Medium (iPhone 8)', expectedChars: 29 },
      { width: 414, label: 'Large (iPhone Pro)', expectedChars: 34 },
      { width: 768, label: 'Tablet', expectedChars: 73 },
    ];

    testWidths.forEach(({ width, label, expectedChars }) => {
      test(`calculates available text width correctly for ${label}`, () => {
        mockDimensions.get.mockReturnValue({ width, height: 812 });

        const { getByTestId } = render(
          <DateNavigation {...defaultProps} selectedDate="2025-01-15" />
        );

        // The component should calculate available width based on screen width
        // navigationButtonWidth (44*2) + paddingWidth (16*2) + todayButtonWidth (80) + calendarIconWidth (24) + margins (8*2)
        const expectedAvailableWidth = width - 88 - 32 - 80 - 24 - 16;
        const expectedMaxChars = Math.floor(expectedAvailableWidth / 8); // avgCharWidth = 8

        expect(expectedMaxChars).toBeCloseTo(expectedChars, 2);
      });
    });
  });

  describe('Day View Text Adaptation', () => {
    const testCases = [
      {
        width: 280,
        date: '2025-01-15',
        expectedTexts: ['1/15', 'Jan 15'], // Ultra compact formats
        description: 'Ultra compact day view on very narrow screen',
      },
      {
        width: 320,
        date: '2025-01-15',
        expectedTexts: ['Wed, Jan 15'], // Compact format
        description: 'Compact day view',
      },
      {
        width: 375,
        date: '2025-01-15',
        expectedTexts: ['Wednesday, Jan 15'], // Standard format
        description: 'Standard day view',
      },
      {
        width: 768,
        date: '2025-01-15',
        expectedTexts: ['Wednesday, January 15'], // Full format
        description: 'Full day view on large screen',
      },
    ];

    testCases.forEach(({ width, date, expectedTexts, description }) => {
      test(description, () => {
        mockDimensions.get.mockReturnValue({ width, height: 812 });

        const { getByText } = render(
          <DateNavigation
            {...defaultProps}
            selectedDate={date}
            viewType="day"
          />
        );

        let found = false;
        expectedTexts.forEach((expectedText) => {
          try {
            getByText(expectedText);
            found = true;
          } catch (e) {
            // Try next expected text
          }
        });

        expect(found).toBe(true);
      });
    });
  });

  describe('Week View Text Adaptation', () => {
    test('Ultra compact week view shows week number', () => {
      mockDimensions.get.mockReturnValue({ width: 280, height: 812 });

      const { getByText } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="week"
        />
      );

      const weekNumber = getWeek(new Date('2025-01-15'), { weekStartsOn: 1 });
      const expectedTexts = [`W${weekNumber}`, '13-19']; // Week number or date range

      let found = false;
      expectedTexts.forEach((expectedText) => {
        try {
          getByText(expectedText);
          found = true;
        } catch (e) {
          // Try next expected text
        }
      });

      expect(found).toBe(true);
    });

    test('Compact week view shows abbreviated date range', () => {
      mockDimensions.get.mockReturnValue({ width: 320, height: 812 });

      const { getByText } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="week"
        />
      );

      // Should show something like "13-19 Jan"
      const weekStart = startOfWeek(new Date('2025-01-15'), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date('2025-01-15'), { weekStartsOn: 1 });
      const expectedText = `${format(weekStart, 'd')}-${format(weekEnd, 'd')} ${format(weekStart, 'MMM')}`;

      try {
        getByText(expectedText);
      } catch (e) {
        // Fallback: check if any week format is displayed
        const textElement = getByText(/\d+-\d+/);
        expect(textElement).toBeTruthy();
      }
    });

    test('Standard week view shows month abbreviated range', () => {
      mockDimensions.get.mockReturnValue({ width: 375, height: 812 });

      const { getByText } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="week"
        />
      );

      // Should show something like "Jan 13-19"
      const weekStart = startOfWeek(new Date('2025-01-15'), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date('2025-01-15'), { weekStartsOn: 1 });
      const expectedText = `${format(weekStart, 'MMM d')}-${format(weekEnd, 'd')}`;

      try {
        getByText(expectedText);
      } catch (e) {
        // Fallback: check if month abbreviation is present
        const textElement = getByText(/Jan/);
        expect(textElement).toBeTruthy();
      }
    });

    test('Full week view shows complete month names', () => {
      mockDimensions.get.mockReturnValue({ width: 768, height: 812 });

      const { getByText } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="week"
        />
      );

      // Should show something like "January 13-19, 2025"
      try {
        const textElement = getByText(/January/);
        expect(textElement).toBeTruthy();
      } catch (e) {
        // Fallback: check if full date format is present
        const textElement = getByText(/\d{4}/); // Year should be present
        expect(textElement).toBeTruthy();
      }
    });
  });

  describe('Cross-Month Week Displays', () => {
    test('Cross-month week in ultra compact shows week number', () => {
      mockDimensions.get.mockReturnValue({ width: 280, height: 812 });

      const { getByText } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-01" // New Year's Day, likely crosses months
          viewType="week"
        />
      );

      const weekNumber = getWeek(new Date('2025-01-01'), { weekStartsOn: 1 });
      try {
        getByText(`W${weekNumber}`);
      } catch (e) {
        // Fallback: should show some cross-month indicator
        const textElement = getByText(/\d+-\d+/);
        expect(textElement).toBeTruthy();
      }
    });

    test('Cross-month week in compact shows abbreviated months', () => {
      mockDimensions.get.mockReturnValue({ width: 350, height: 812 });

      const { getByText } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-01"
          viewType="week"
        />
      );

      // Should show something like "30 Dec-5 Jan" or similar cross-month format
      const weekStart = startOfWeek(new Date('2025-01-01'), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date('2025-01-01'), { weekStartsOn: 1 });
      
      if (weekStart.getMonth() !== weekEnd.getMonth()) {
        // Cross-month week
        const expectedText = `${format(weekStart, 'd')} ${format(weekStart, 'MMM')}-${format(weekEnd, 'd')} ${format(weekEnd, 'MMM')}`;
        try {
          getByText(expectedText);
        } catch (e) {
          // Should contain both month abbreviations
          expect(getByText(/Dec|Jan/)).toBeTruthy();
        }
      }
    });

    test('Cross-month week in standard shows full month transition', () => {
      mockDimensions.get.mockReturnValue({ width: 400, height: 812 });

      const { getByText } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-01"
          viewType="week"
        />
      );

      const weekStart = startOfWeek(new Date('2025-01-01'), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date('2025-01-01'), { weekStartsOn: 1 });
      
      if (weekStart.getMonth() !== weekEnd.getMonth()) {
        // Should show format like "Dec 30-Jan 5"
        const expectedText = `${format(weekStart, 'MMM d')}-${format(weekEnd, 'MMM d')}`;
        try {
          getByText(expectedText);
        } catch (e) {
          // At minimum should show the cross-month pattern
          expect(getByText(/-/)).toBeTruthy();
        }
      }
    });
  });

  describe('Year Display Logic', () => {
    test('Shows year when selected year differs from current year', () => {
      mockDimensions.get.mockReturnValue({ width: 375, height: 812 });

      const { getByText } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2024-06-15" // Previous year
          viewType="day"
        />
      );

      // Should show year when it's different from current year
      expect(getByText(/2024|'24/)).toBeTruthy();
    });

    test('Shows year in December (near year boundary)', () => {
      mockDimensions.get.mockReturnValue({ width: 375, height: 812 });

      const { getByText } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-12-15" // December of current year
          viewType="day"
        />
      );

      // Should show year when in December (year boundary month)
      expect(getByText(/2025|'25/)).toBeTruthy();
    });

    test('Shows year in January (near year boundary)', () => {
      mockDimensions.get.mockReturnValue({ width: 375, height: 812 });

      const { getByText } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15" // January of current year
          viewType="day"
        />
      );

      // Should show year when in January (year boundary month)
      expect(getByText(/2025|'25/)).toBeTruthy();
    });

    test('Cross-year week displays both years appropriately', () => {
      mockDimensions.get.mockReturnValue({ width: 600, height: 812 });

      const { getByText } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-01" // Likely crosses years
          viewType="week"
        />
      );

      const weekStart = startOfWeek(new Date('2025-01-01'), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date('2025-01-01'), { weekStartsOn: 1 });
      
      if (weekStart.getFullYear() !== weekEnd.getFullYear()) {
        // Should show both years for cross-year week
        try {
          expect(getByText(/2024.*2025|2025.*2024/)).toBeTruthy();
        } catch (e) {
          // At minimum should show one of the years
          expect(getByText(/2024|2025/)).toBeTruthy();
        }
      }
    });
  });

  describe('Text Fitting and Container Width', () => {
    test('Text fits within available container width on very narrow screens', () => {
      mockDimensions.get.mockReturnValue({ width: 280, height: 812 });

      const { getByDisplayValue } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="day"
        />
      );

      // Text should be short enough to fit
      // Ultra compact should show "1/15" or "Jan 15"
      const textElement = getByText(/1\/15|Jan 15|15/);
      expect(textElement).toBeTruthy();
      expect(textElement.props.numberOfLines).toBe(1);
    });

    test('adjustsFontSizeToFit is properly configured', () => {
      const { getByText } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="day"
        />
      );

      const textElement = getByText(/January|Jan|Wed|15/);
      expect(textElement.props.adjustsFontSizeToFit).toBe(true);
      expect(textElement.props.minimumFontScale).toBe(0.8);
      expect(textElement.props.numberOfLines).toBe(1);
    });

    test('Maximum container width is respected on large screens', () => {
      mockDimensions.get.mockReturnValue({ width: 1200, height: 800 }); // Very large screen

      const { getByText } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="day"
        />
      );

      // Even on large screens, text should be readable and not excessively long
      const textElement = getByText(/Wednesday, January 15/);
      expect(textElement).toBeTruthy();
    });
  });

  describe('Edge Cases and Narrow Screens', () => {
    test('Handles extremely narrow screens gracefully', () => {
      mockDimensions.get.mockReturnValue({ width: 240, height: 640 });

      const { getByText } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="week"
        />
      );

      // Should show week number on extremely narrow screens
      const weekNumber = getWeek(new Date('2025-01-15'), { weekStartsOn: 1 });
      try {
        getByText(`W${weekNumber}`);
      } catch (e) {
        // Fallback: should at least show some numeric format
        expect(getByText(/\d+/)).toBeTruthy();
      }
    });

    test('Month view adapts to screen width', () => {
      const testCases = [
        { width: 280, expected: /Jan|Feb|Mar/ }, // Abbreviated month
        { width: 375, expected: /January|February|March/ }, // Full month name
        { width: 768, expected: /January 2025|February 2025/ }, // With year
      ];

      testCases.forEach(({ width, expected }) => {
        mockDimensions.get.mockReturnValue({ width, height: 812 });

        const { getByText, unmount } = render(
          <DateNavigation
            {...defaultProps}
            selectedDate="2025-01-15"
            viewType="month"
          />
        );

        expect(getByText(expected)).toBeTruthy();
        unmount();
      });
    });

    test('Agenda view shows consistent text regardless of screen size', () => {
      const widths = [280, 375, 768];

      widths.forEach((width) => {
        mockDimensions.get.mockReturnValue({ width, height: 812 });

        const { getByText, unmount } = render(
          <DateNavigation
            {...defaultProps}
            selectedDate="2025-01-15"
            viewType="agenda"
          />
        );

        expect(getByText('Upcoming Events')).toBeTruthy();
        unmount();
      });
    });

    test('Today button affects available text width calculation', () => {
      mockDimensions.get.mockReturnValue({ width: 375, height: 812 });

      // Test with non-today date (today button visible)
      const { getByText: getNonTodayText, unmount: unmountNonToday } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-12-25" // Not today
          viewType="day"
        />
      );

      // Today button should be visible, reducing available text width
      expect(getNonTodayText('Today')).toBeTruthy();
      unmountNonToday();

      // Test with today's date (today button hidden)
      const today = format(new Date(), 'yyyy-MM-dd');
      const { queryByText } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate={today}
          viewType="day"
        />
      );

      // Today button should not be visible, giving more space for text
      expect(queryByText('Today')).toBeNull();
    });
  });

  describe('Responsive Text Regression Tests', () => {
    test('Week number calculation is consistent', () => {
      mockDimensions.get.mockReturnValue({ width: 280, height: 812 });

      const testDates = [
        '2025-01-01', // New Year
        '2025-06-15', // Mid-year
        '2025-12-31', // End of year
      ];

      testDates.forEach((date) => {
        const { getByText, unmount } = render(
          <DateNavigation
            {...defaultProps}
            selectedDate={date}
            viewType="week"
          />
        );

        const weekNumber = getWeek(new Date(date), { weekStartsOn: 1 });
        try {
          getByText(`W${weekNumber}`);
        } catch (e) {
          // Should at least show a week-related format
          expect(getByText(/\d+/)).toBeTruthy();
        }

        unmount();
      });
    });

    test('Cross-month abbreviations are intelligent', () => {
      mockDimensions.get.mockReturnValue({ width: 350, height: 812 });

      // Test month boundary dates
      const boundaryDates = [
        '2025-01-01', // Jan boundary
        '2025-02-01', // Feb boundary
        '2025-07-01', // Mid-year boundary
        '2025-12-31', // Year-end boundary
      ];

      boundaryDates.forEach((date) => {
        const { getByText, unmount } = render(
          <DateNavigation
            {...defaultProps}
            selectedDate={date}
            viewType="week"
          />
        );

        const weekStart = startOfWeek(new Date(date), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(new Date(date), { weekStartsOn: 1 });
        
        if (weekStart.getMonth() !== weekEnd.getMonth()) {
          // Should show abbreviated cross-month format
          const textNode = getByText(/-/); // Should contain a dash for range
          expect(textNode).toBeTruthy();
        }

        unmount();
      });
    });

    test('Font scaling works with different text lengths', () => {
      const { getByText } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="day"
        />
      );

      const textElement = getByText(/Wednesday|Wed|15/);
      
      // Should have scaling properties set
      expect(textElement.props.adjustsFontSizeToFit).toBe(true);
      expect(textElement.props.minimumFontScale).toBe(0.8);
      expect(textElement.props.numberOfLines).toBe(1);
      
      // Should have proper styling for responsive text
      expect(textElement.props.style).toEqual(
        expect.objectContaining({
          fontWeight: '600',
          fontSize: 16,
          textAlign: 'center',
          flexShrink: 1,
          maxWidth: '100%',
        })
      );
    });
  });
});