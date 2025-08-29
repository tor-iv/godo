import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { format } from 'date-fns';
import { DateNavigation } from '../../../src/components/calendar/DateNavigation';
import { ViewType } from '../../../src/components/calendar/ViewToggle';

// Mock date-fns to control today's date for testing
jest.mock('date-fns', () => {
  const originalModule = jest.requireActual('date-fns');
  return {
    ...originalModule,
    format: jest.fn().mockImplementation((date, formatStr) => {
      if (date instanceof Date && formatStr === 'yyyy-MM-dd') {
        return '2025-08-29'; // Mock today as August 29, 2025
      }
      return originalModule.format(date, formatStr);
    }),
  };
});

describe('Today Button Functionality', () => {
  const mockOnDateChange = jest.fn();
  const mockFormat = format as jest.MockedFunction<typeof format>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset format mock to default behavior except for specific cases
    mockFormat.mockImplementation((date, formatStr) => {
      const originalFormat = jest.requireActual('date-fns').format;
      if (date instanceof Date && formatStr === 'yyyy-MM-dd') {
        return '2025-08-29'; // Mock today
      }
      return originalFormat(date, formatStr);
    });
  });

  describe('Today Button Display Logic', () => {
    it('should show today button when not on current date', () => {
      const { getByText } = render(
        <DateNavigation
          selectedDate="2025-07-15"
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      expect(getByText('Today')).toBeTruthy();
    });

    it('should hide today button when already on current date', () => {
      const { queryByText } = render(
        <DateNavigation
          selectedDate="2025-08-29" // Today's date
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      expect(queryByText('Today')).toBeNull();
    });

    it('should show today button in all view types when not on today', () => {
      const viewTypes: ViewType[] = ['month', 'week', 'day'];
      
      viewTypes.forEach(viewType => {
        const { getByText, unmount } = render(
          <DateNavigation
            selectedDate="2025-07-15"
            viewType={viewType}
            onDateChange={mockOnDateChange}
          />
        );

        expect(getByText('Today')).toBeTruthy();
        unmount();
      });
    });

    it('should not show today button in agenda view', () => {
      const { queryByText } = render(
        <DateNavigation
          selectedDate="2025-07-15"
          viewType="agenda"
          onDateChange={mockOnDateChange}
        />
      );

      expect(queryByText('Today')).toBeNull();
    });
  });

  describe('Today Button Click Functionality', () => {
    it('should call onDateChange with today\'s date when clicked from different month', async () => {
      const { getByText } = render(
        <DateNavigation
          selectedDate="2025-07-15" // July 15th
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      const todayButton = getByText('Today');
      fireEvent.press(todayButton);

      await waitFor(() => {
        expect(mockOnDateChange).toHaveBeenCalledWith('2025-08-29');
      });
    });

    it('should work correctly across different view types', async () => {
      const viewTypes: ViewType[] = ['month', 'week', 'day'];
      
      for (const viewType of viewTypes) {
        const { getByText, unmount } = render(
          <DateNavigation
            selectedDate="2025-06-01"
            viewType={viewType}
            onDateChange={mockOnDateChange}
          />
        );

        const todayButton = getByText('Today');
        fireEvent.press(todayButton);

        await waitFor(() => {
          expect(mockOnDateChange).toHaveBeenCalledWith('2025-08-29');
        });

        unmount();
        jest.clearAllMocks();
      }
    });

    it('should navigate from past month to current month', async () => {
      const { getByText } = render(
        <DateNavigation
          selectedDate="2025-01-15" // January 15th
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      const todayButton = getByText('Today');
      fireEvent.press(todayButton);

      await waitFor(() => {
        expect(mockOnDateChange).toHaveBeenCalledWith('2025-08-29');
      });
    });

    it('should navigate from future month to current month', async () => {
      const { getByText } = render(
        <DateNavigation
          selectedDate="2025-12-15" // December 15th
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      const todayButton = getByText('Today');
      fireEvent.press(todayButton);

      await waitFor(() => {
        expect(mockOnDateChange).toHaveBeenCalledWith('2025-08-29');
      });
    });
  });

  describe('Today Button in Modal', () => {
    it('should have today button in date picker modal', async () => {
      const { getByText, getByTestId } = render(
        <DateNavigation
          selectedDate="2025-07-15"
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      // Open modal by clicking on date display
      const dateDisplay = getByText('July 2025');
      fireEvent.press(dateDisplay);

      await waitFor(() => {
        expect(getByText('Today')).toBeTruthy(); // Modal today button
      });
    });

    it('should call onDateChange and close modal when modal today button is pressed', async () => {
      const { getByText, queryByText } = render(
        <DateNavigation
          selectedDate="2025-07-15"
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      // Open modal
      const dateDisplay = getByText('July 2025');
      fireEvent.press(dateDisplay);

      // Wait for modal to appear
      await waitFor(() => {
        expect(getByText('Today')).toBeTruthy();
      });

      // Click modal today button
      const modalTodayButton = getByText('Today');
      fireEvent.press(modalTodayButton);

      await waitFor(() => {
        expect(mockOnDateChange).toHaveBeenCalledWith('2025-08-29');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle year boundary correctly', async () => {
      // Mock new year scenario
      mockFormat.mockImplementation((date, formatStr) => {
        const originalFormat = jest.requireActual('date-fns').format;
        if (date instanceof Date && formatStr === 'yyyy-MM-dd') {
          return '2026-01-01'; // Mock today as New Year
        }
        return originalFormat(date, formatStr);
      });

      const { getByText } = render(
        <DateNavigation
          selectedDate="2025-12-31" // Previous year
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      const todayButton = getByText('Today');
      fireEvent.press(todayButton);

      await waitFor(() => {
        expect(mockOnDateChange).toHaveBeenCalledWith('2026-01-01');
      });
    });

    it('should handle leap year February correctly', async () => {
      // Mock leap year date
      mockFormat.mockImplementation((date, formatStr) => {
        const originalFormat = jest.requireActual('date-fns').format;
        if (date instanceof Date && formatStr === 'yyyy-MM-dd') {
          return '2024-02-29'; // Mock today as leap day
        }
        return originalFormat(date, formatStr);
      });

      const { getByText } = render(
        <DateNavigation
          selectedDate="2024-01-15"
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      const todayButton = getByText('Today');
      fireEvent.press(todayButton);

      await waitFor(() => {
        expect(mockOnDateChange).toHaveBeenCalledWith('2024-02-29');
      });
    });

    it('should handle multiple rapid clicks gracefully', async () => {
      const { getByText } = render(
        <DateNavigation
          selectedDate="2025-07-15"
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      const todayButton = getByText('Today');
      
      // Rapid fire clicks
      fireEvent.press(todayButton);
      fireEvent.press(todayButton);
      fireEvent.press(todayButton);

      await waitFor(() => {
        expect(mockOnDateChange).toHaveBeenCalledWith('2025-08-29');
      });

      // Should not crash or cause issues
      expect(mockOnDateChange).toHaveBeenCalledTimes(3);
    });
  });

  describe('State Synchronization', () => {
    it('should properly update view after today button click', async () => {
      const { getByText, rerender } = render(
        <DateNavigation
          selectedDate="2025-07-15"
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      const todayButton = getByText('Today');
      fireEvent.press(todayButton);

      await waitFor(() => {
        expect(mockOnDateChange).toHaveBeenCalledWith('2025-08-29');
      });

      // Simulate parent component updating selectedDate
      rerender(
        <DateNavigation
          selectedDate="2025-08-29" // Updated to today
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      // Today button should now be hidden
      expect(() => getByText('Today')).toThrow();
    });
  });
});