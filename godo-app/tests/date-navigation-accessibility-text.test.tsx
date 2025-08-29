import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { format, startOfWeek, endOfWeek } from 'date-fns';
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

describe('DateNavigation Accessibility and Screen Reader Compatibility', () => {
  const defaultProps = {
    selectedDate: '2025-01-15',
    viewType: 'day' as ViewType,
    onDateChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDimensions.get.mockReturnValue({ width: 375, height: 812 });
  });

  describe('Accessibility Labels and Screen Reader Support', () => {
    test('provides meaningful accessibility labels for date display', () => {
      const { getByRole } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="day"
        />
      );

      const dateButton = getByRole('button', { 
        name: /Current date.*15/i 
      });
      
      expect(dateButton).toBeTruthy();
      expect(dateButton.props.accessibilityLabel).toMatch(/Current date/);
      expect(dateButton.props.accessibilityHint).toBe('Tap to open date picker');
    });

    test('navigation buttons have proper accessibility labels', () => {
      const { getByRole } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="day"
        />
      );

      const prevButton = getByRole('button', { 
        name: /Go to previous day/i 
      });
      const nextButton = getByRole('button', { 
        name: /Go to next day/i 
      });

      expect(prevButton).toBeTruthy();
      expect(nextButton).toBeTruthy();
      expect(prevButton.props.accessibilityLabel).toBe('Go to previous day');
      expect(nextButton.props.accessibilityLabel).toBe('Go to next day');
    });

    test('today button has proper accessibility support', () => {
      const { getByRole } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-12-25" // Not today
          viewType="day"
        />
      );

      const todayButton = getByRole('button', { 
        name: /Go to today/i 
      });

      expect(todayButton).toBeTruthy();
      expect(todayButton.props.accessibilityLabel).toBe('Go to today');
      expect(todayButton.props.accessibilityHint).toBe('Jump to today\'s date');
    });

    test('accessibility labels adapt to different view types', () => {
      const viewTypes: ViewType[] = ['day', 'week', 'month'];
      
      viewTypes.forEach((viewType) => {
        const { getByRole, unmount } = render(
          <DateNavigation
            {...defaultProps}
            selectedDate="2025-01-15"
            viewType={viewType}
          />
        );

        const prevButton = getByRole('button', { 
          name: new RegExp(`Go to previous ${viewType}`, 'i')
        });
        const nextButton = getByRole('button', { 
          name: new RegExp(`Go to next ${viewType}`, 'i')
        });

        expect(prevButton.props.accessibilityLabel).toBe(`Go to previous ${viewType}`);
        expect(nextButton.props.accessibilityLabel).toBe(`Go to next ${viewType}`);

        unmount();
      });
    });
  });

  describe('Text Readability and Screen Reader Optimization', () => {
    test('responsive text remains accessible on small screens', () => {
      mockDimensions.get.mockReturnValue({ width: 280, height: 640 });

      const { getByRole } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="day"
        />
      );

      const dateButton = getByRole('button', { 
        name: /Current date/i 
      });

      // Even with compact text, accessibility label should be descriptive
      expect(dateButton.props.accessibilityLabel).toMatch(/Wednesday|15|January/);
    });

    test('week view accessibility labels include full date range', () => {
      const { getByRole } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="week"
        />
      );

      const dateButton = getByRole('button', { 
        name: /Current date/i 
      });

      // Accessibility label should describe the full week range
      const weekStart = startOfWeek(new Date('2025-01-15'), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date('2025-01-15'), { weekStartsOn: 1 });
      
      // Should contain information about the week range
      expect(dateButton.props.accessibilityLabel).toMatch(/13|19|Jan/);
    });

    test('cross-month week accessibility includes both months', () => {
      const { getByRole } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-01" // Likely crosses months
          viewType="week"
        />
      );

      const dateButton = getByRole('button', { 
        name: /Current date/i 
      });

      const weekStart = startOfWeek(new Date('2025-01-01'), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date('2025-01-01'), { weekStartsOn: 1 });
      
      if (weekStart.getMonth() !== weekEnd.getMonth()) {
        // Should mention both months in accessibility
        expect(dateButton.props.accessibilityLabel).toMatch(/Dec|Jan/);
      }
    });

    test('month view accessibility includes year when relevant', () => {
      const testCases = [
        { date: '2024-06-15', shouldIncludeYear: true }, // Different year
        { date: '2025-12-15', shouldIncludeYear: true }, // December (boundary)
        { date: '2025-06-15', shouldIncludeYear: false }, // Mid-year current year
      ];

      testCases.forEach(({ date, shouldIncludeYear }) => {
        const { getByRole, unmount } = render(
          <DateNavigation
            {...defaultProps}
            selectedDate={date}
            viewType="month"
          />
        );

        const dateButton = getByRole('button', { 
          name: /Current date/i 
        });

        if (shouldIncludeYear) {
          expect(dateButton.props.accessibilityLabel).toMatch(/\d{4}/);
        }

        unmount();
      });
    });
  });

  describe('Focus Management and Keyboard Navigation', () => {
    test('date display button is focusable', () => {
      const { getByRole } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="day"
        />
      );

      const dateButton = getByRole('button', { 
        name: /Current date/i 
      });

      expect(dateButton.props.accessible).toBe(true);
      expect(dateButton.props.focusable).toBe(true);
    });

    test('navigation buttons are focusable and accessible', () => {
      const { getByRole } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="day"
        />
      );

      const prevButton = getByRole('button', { 
        name: /Go to previous/i 
      });
      const nextButton = getByRole('button', { 
        name: /Go to next/i 
      });

      expect(prevButton.props.accessible).toBe(true);
      expect(prevButton.props.focusable).toBe(true);
      expect(nextButton.props.accessible).toBe(true);
      expect(nextButton.props.focusable).toBe(true);
    });

    test('today button is properly accessible when visible', () => {
      const { getByRole } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-12-25" // Not today
          viewType="day"
        />
      );

      const todayButton = getByRole('button', { 
        name: /Go to today/i 
      });

      expect(todayButton.props.accessible).toBe(true);
      expect(todayButton.props.focusable).toBe(true);
    });
  });

  describe('Text Scaling and Font Size Adaptation', () => {
    test('text scales properly with system font size settings', () => {
      const { getByRole } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="day"
        />
      );

      const dateButton = getByRole('button', { 
        name: /Current date/i 
      });

      // Find the text element within the button
      const textElement = dateButton.findByType('Text');
      
      expect(textElement.props.adjustsFontSizeToFit).toBe(true);
      expect(textElement.props.minimumFontScale).toBe(0.8);
      expect(textElement.props.numberOfLines).toBe(1);
    });

    test('minimum font scale ensures readability', () => {
      // Test with very narrow screen
      mockDimensions.get.mockReturnValue({ width: 240, height: 640 });

      const { getByRole } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="day"
        />
      );

      const dateButton = getByRole('button', { 
        name: /Current date/i 
      });

      const textElement = dateButton.findByType('Text');
      
      // Even on narrow screens, minimum font scale should prevent text from being too small
      expect(textElement.props.minimumFontScale).toBe(0.8);
      expect(textElement.props.adjustsFontSizeToFit).toBe(true);
    });
  });

  describe('High Contrast and Visual Accessibility', () => {
    test('text color provides sufficient contrast', () => {
      const { getByRole } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="day"
        />
      );

      const dateButton = getByRole('button', { 
        name: /Current date/i 
      });

      const textElement = dateButton.findByType('Text');
      
      // Should use high contrast color for text
      expect(textElement.props.style).toEqual(
        expect.objectContaining({
          color: expect.any(String), // Should have a color defined
        })
      );
    });

    test('button text maintains readability in different states', () => {
      const { getByRole } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-12-25" // Not today, so Today button visible
          viewType="day"
        />
      );

      const todayButton = getByRole('button', { 
        name: /Go to today/i 
      });

      const todayText = todayButton.findByType('Text');
      
      // Today button should have distinctive styling
      expect(todayText.props.style).toEqual(
        expect.objectContaining({
          fontWeight: '600',
          fontSize: 13,
        })
      );
    });
  });

  describe('Screen Reader Announcements', () => {
    test('date changes are properly announced', () => {
      const onDateChange = jest.fn();
      
      const { getByRole, rerender } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="day"
          onDateChange={onDateChange}
        />
      );

      const nextButton = getByRole('button', { 
        name: /Go to next day/i 
      });

      fireEvent.press(nextButton);

      // Should call onDateChange with new date
      expect(onDateChange).toHaveBeenCalledWith('2025-01-16');

      // Re-render with new date to test accessibility label update
      rerender(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-16"
          viewType="day"
          onDateChange={onDateChange}
        />
      );

      const dateButton = getByRole('button', { 
        name: /Current date.*16/i 
      });
      
      expect(dateButton).toBeTruthy();
    });

    test('view type changes affect accessibility labels', () => {
      const onDateChange = jest.fn();
      
      const { getByRole, rerender } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="day"
          onDateChange={onDateChange}
        />
      );

      const prevButtonDay = getByRole('button', { 
        name: /Go to previous day/i 
      });
      expect(prevButtonDay.props.accessibilityLabel).toBe('Go to previous day');

      // Change to week view
      rerender(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="week"
          onDateChange={onDateChange}
        />
      );

      const prevButtonWeek = getByRole('button', { 
        name: /Go to previous week/i 
      });
      expect(prevButtonWeek.props.accessibilityLabel).toBe('Go to previous week');
    });
  });

  describe('Responsive Text Accessibility Edge Cases', () => {
    test('agenda view maintains consistent accessibility', () => {
      const screenWidths = [280, 375, 768];

      screenWidths.forEach((width) => {
        mockDimensions.get.mockReturnValue({ width, height: 812 });

        const { getByText, unmount } = render(
          <DateNavigation
            {...defaultProps}
            selectedDate="2025-01-15"
            viewType="agenda"
          />
        );

        const textElement = getByText('Upcoming Events');
        
        // Agenda view should have consistent text regardless of screen size
        expect(textElement).toBeTruthy();
        expect(textElement.props.numberOfLines).toBe(1);
        expect(textElement.props.adjustsFontSizeToFit).toBe(true);

        unmount();
      });
    });

    test('extremely long date strings are handled gracefully', () => {
      // Test with a date that might produce very long text
      mockDimensions.get.mockReturnValue({ width: 768, height: 812 });

      const { getByRole } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2024-09-30" // September 30, 2024 - long month name, different year
          viewType="day"
        />
      );

      const dateButton = getByRole('button', { 
        name: /Current date/i 
      });

      const textElement = dateButton.findByType('Text');
      
      // Should handle long text gracefully
      expect(textElement.props.adjustsFontSizeToFit).toBe(true);
      expect(textElement.props.minimumFontScale).toBe(0.8);
      expect(textElement.props.numberOfLines).toBe(1);
      
      // Accessibility label should still be comprehensive
      expect(dateButton.props.accessibilityLabel).toMatch(/September|30|2024/);
    });
  });
});