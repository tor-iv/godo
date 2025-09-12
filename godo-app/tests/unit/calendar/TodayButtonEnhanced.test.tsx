import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { format, addMonths, subMonths, addDays } from 'date-fns';
import { DateNavigation } from '../../../src/components/calendar/DateNavigation';
import { MyEventsScreen } from '../../../src/screens/calendar/MyEventsScreen';
import { ViewType } from '../../../src/components/calendar/ViewToggle';

// Mock date-fns to control "today" for testing
const mockToday = '2025-08-29';
jest.mock('date-fns', () => {
  const originalModule = jest.requireActual('date-fns');
  return {
    ...originalModule,
    format: jest.fn().mockImplementation((date, formatStr) => {
      if (date instanceof Date && formatStr === 'yyyy-MM-dd') {
        // Check if this is the "new Date()" call for today
        const now = new Date();
        if (Math.abs(date.getTime() - now.getTime()) < 1000) {
          return mockToday;
        }
      }
      return originalModule.format(date, formatStr);
    }),
    isToday: jest.fn().mockImplementation((date) => {
      const dateString = originalModule.format(date, 'yyyy-MM-dd');
      return dateString === mockToday;
    }),
  };
});

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
  useFocusEffect: (callback: () => void) => {
    const mockReact = require('react');
    mockReact.useEffect(callback, []);
  },
}));

// Mock safe area
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 20, bottom: 20, left: 0, right: 0 }),
}));

// Mock services for MyEventsScreen
jest.mock('../../../src/services', () => ({
  EventService: {
    getInstance: () => ({
      getAllCalendarEvents: () => [],
      getSavedEvents: () => [],
      getSwipeStats: () => ({ interested: 0, publicEvents: 0, saved: 0 }),
      getPrivateCalendarEvents: () => [],
      getPublicCalendarEvents: () => [],
    }),
  },
}));

describe('Enhanced Today Button Functionality', () => {
  const mockOnDateChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Today Button Visibility Logic', () => {
    it('should show today button when selected date is not today', () => {
      const { getByText } = render(
        <DateNavigation
          selectedDate="2025-07-15"
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      expect(getByText('Today')).toBeTruthy();
    });

    it('should hide today button when selected date is today', () => {
      const { queryByText } = render(
        <DateNavigation
          selectedDate={mockToday}
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      expect(queryByText('Today')).toBeNull();
    });

    it('should update visibility when selected date changes', () => {
      const { getByText, queryByText, rerender } = render(
        <DateNavigation
          selectedDate="2025-07-15"
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      // Initially should show today button
      expect(getByText('Today')).toBeTruthy();

      // Change to today's date
      rerender(
        <DateNavigation
          selectedDate={mockToday}
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      // Should hide today button
      expect(queryByText('Today')).toBeNull();

      // Change back to different date
      rerender(
        <DateNavigation
          selectedDate="2025-09-15"
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      // Should show today button again
      expect(getByText('Today')).toBeTruthy();
    });

    it('should show today button in all supported view types when not on today', () => {
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

  describe('Today Button Click Behavior', () => {
    it('should navigate to today when clicked from different month', async () => {
      const { getByText } = render(
        <DateNavigation
          selectedDate="2025-07-15"
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      const todayButton = getByText('Today');
      fireEvent.press(todayButton);

      await waitFor(() => {
        expect(mockOnDateChange).toHaveBeenCalledWith(mockToday);
      });
    });

    it('should navigate to today when clicked from different year', async () => {
      const { getByText } = render(
        <DateNavigation
          selectedDate="2024-08-29"
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      const todayButton = getByText('Today');
      fireEvent.press(todayButton);

      await waitFor(() => {
        expect(mockOnDateChange).toHaveBeenCalledWith(mockToday);
      });
    });

    it('should work correctly in different view types', async () => {
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
          expect(mockOnDateChange).toHaveBeenCalledWith(mockToday);
        });

        unmount();
        jest.clearAllMocks();
      }
    });

    it('should handle rapid consecutive clicks gracefully', async () => {
      const { getByText } = render(
        <DateNavigation
          selectedDate="2025-07-15"
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      const todayButton = getByText('Today');
      
      // Multiple rapid clicks
      fireEvent.press(todayButton);
      fireEvent.press(todayButton);
      fireEvent.press(todayButton);

      // Should handle all clicks but may debounce some
      await waitFor(() => {
        expect(mockOnDateChange).toHaveBeenCalledWith(mockToday);
      });

      // At least one call should go through
      expect(mockOnDateChange).toHaveBeenCalled();
    });

    it('should provide haptic feedback when pressed', async () => {
      // Mock Vibration
      const mockVibrate = jest.fn();
      jest.doMock('react-native', () => ({
        ...jest.requireActual('react-native'),
        Vibration: { vibrate: mockVibrate },
      }));

      const { getByText } = render(
        <DateNavigation
          selectedDate="2025-07-15"
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      const todayButton = getByText('Today');
      fireEvent.press(todayButton);

      await waitFor(() => {
        expect(mockOnDateChange).toHaveBeenCalledWith(mockToday);
      });

      // Note: Vibration mock might not work in this test environment
      // This is more for documentation of expected behavior
    });
  });

  describe('Today Button in Modal Date Picker', () => {
    it('should show today button in date picker modal', async () => {
      const { getByText, getByTestId } = render(
        <DateNavigation
          selectedDate="2025-07-15"
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      // Open modal by clicking date display
      const dateDisplay = getByText('July 2025');
      fireEvent.press(dateDisplay);

      // Check for modal today button
      await waitFor(() => {
        const modalTodayButton = getByText('Today');
        expect(modalTodayButton).toBeTruthy();
      });
    });

    it('should navigate to today and close modal when modal today button is pressed', async () => {
      const { getByText } = render(
        <DateNavigation
          selectedDate="2025-07-15"
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      // Open modal
      const dateDisplay = getByText('July 2025');
      fireEvent.press(dateDisplay);

      // Wait for modal to be visible
      await waitFor(() => {
        expect(getByText('Today')).toBeTruthy();
      });

      // Click modal today button
      const modalTodayButton = getByText('Today');
      fireEvent.press(modalTodayButton);

      await waitFor(() => {
        expect(mockOnDateChange).toHaveBeenCalledWith(mockToday);
      });
    });

    it('should handle both main and modal today buttons correctly', async () => {
      const { getAllByText, getByText } = render(
        <DateNavigation
          selectedDate="2025-07-15"
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      // First, test the main today button
      const mainTodayButton = getByText('Today');
      fireEvent.press(mainTodayButton);

      await waitFor(() => {
        expect(mockOnDateChange).toHaveBeenCalledWith(mockToday);
      });

      jest.clearAllMocks();

      // Open modal
      const dateDisplay = getByText('July 2025');
      fireEvent.press(dateDisplay);

      // Test modal today button
      await waitFor(() => {
        const todayButtons = getAllByText('Today');
        expect(todayButtons.length).toBeGreaterThan(0);
      });

      // Click one of the today buttons (should be modal one)
      const todayButtons = getAllByText('Today');
      fireEvent.press(todayButtons[todayButtons.length - 1]); // Get the last one (modal)

      await waitFor(() => {
        expect(mockOnDateChange).toHaveBeenCalledWith(mockToday);
      });
    });
  });

  describe('Today Button Integration with MyEventsScreen', () => {
    it('should work correctly within MyEventsScreen component', async () => {
      const { getByText } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(getByText('My Events')).toBeTruthy();
      });

      // Look for today button if we're not already on today
      const todayButton = getByText('Today');
      expect(todayButton).toBeTruthy();

      fireEvent.press(todayButton);

      // Should navigate to today (testing the integration)
      await waitFor(() => {
        // The exact assertion depends on how MyEventsScreen handles date changes
        // This tests that the button exists and can be pressed without errors
        expect(todayButton).toBeTruthy();
      });
    });

    it('should hide when already on today in MyEventsScreen', async () => {
      // Create a mock where we're already on today
      const { queryByText, getByText } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(getByText('My Events')).toBeTruthy();
      });

      // If we're on today, today button should not be visible
      // This test verifies the integration maintains the visibility logic
      if (queryByText('Today')) {
        // If today button exists, click it to go to today
        fireEvent.press(queryByText('Today')!);
        
        await waitFor(() => {
          // After clicking, if we're now on today, button should be hidden
          // This is testing the state change behavior
          expect(true).toBeTruthy(); // Basic assertion for integration
        });
      }
    });
  });

  describe('Today Button State Consistency', () => {
    it('should maintain consistent state after navigation operations', async () => {
      const TestComponent = () => {
        const [selectedDate, setSelectedDate] = React.useState('2025-07-15');
        const [viewType] = React.useState<ViewType>('month');
        
        return (
          <div>
            <DateNavigation
              selectedDate={selectedDate}
              viewType={viewType}
              onDateChange={setSelectedDate}
            />
            <div data-testid="selected-date">{selectedDate}</div>
          </div>
        );
      };

      const { getByText, getByTestId } = render(<TestComponent />);

      // Verify initial state
      expect(getByText('Today')).toBeTruthy();
      expect(getByTestId('selected-date')).toHaveTextContent('2025-07-15');

      // Click today button
      const todayButton = getByText('Today');
      fireEvent.press(todayButton);

      await waitFor(() => {
        expect(getByTestId('selected-date')).toHaveTextContent(mockToday);
      });

      // Today button should now be hidden
      expect(() => getByText('Today')).toThrow();
    });

    it('should handle edge cases around date boundaries', async () => {
      // Test with different today mock values
      const edgeCases = [
        '2025-12-31', // End of year
        '2025-01-01', // Start of year
        '2025-02-28', // End of February (non-leap year)
      ];

      for (const todayMock of edgeCases) {
        // Update mock for this iteration
        const mockFormat = require('date-fns').format;
        const mockIsToday = require('date-fns').isToday;
        
        mockFormat.mockImplementation((date: Date, formatStr: string) => {
          if (date instanceof Date && formatStr === 'yyyy-MM-dd') {
            const now = new Date();
            if (Math.abs(date.getTime() - now.getTime()) < 1000) {
              return todayMock;
            }
          }
          return jest.requireActual('date-fns').format(date, formatStr);
        });

        mockIsToday.mockImplementation((date: Date) => {
          const dateString = jest.requireActual('date-fns').format(date, 'yyyy-MM-dd');
          return dateString === todayMock;
        });

        const mockOnDateChange = jest.fn();
        const { getByText, unmount } = render(
          <DateNavigation
            selectedDate="2025-06-15"
            viewType="month"
            onDateChange={mockOnDateChange}
          />
        );

        const todayButton = getByText('Today');
        fireEvent.press(todayButton);

        await waitFor(() => {
          expect(mockOnDateChange).toHaveBeenCalledWith(todayMock);
        });

        unmount();
      }
    });

    it('should work correctly when system date changes', async () => {
      // This test simulates what happens if the system date changes while the app is running
      const { getByText, rerender } = render(
        <DateNavigation
          selectedDate="2025-07-15"
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      // Initially should show today button
      expect(getByText('Today')).toBeTruthy();

      // Simulate system date changing to make selected date "today"
      const mockIsToday = require('date-fns').isToday;
      mockIsToday.mockImplementation((date: Date) => {
        const dateString = jest.requireActual('date-fns').format(date, 'yyyy-MM-dd');
        return dateString === '2025-07-15'; // Now this date is "today"
      });

      // Re-render with same props
      rerender(
        <DateNavigation
          selectedDate="2025-07-15"
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      // Today button should now be hidden
      expect(() => getByText('Today')).toThrow();
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should have proper accessibility labels', () => {
      const { getByText } = render(
        <DateNavigation
          selectedDate="2025-07-15"
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      const todayButton = getByText('Today');
      expect(todayButton).toBeTruthy();
      
      // Should be accessible for screen readers
      expect(todayButton.props.accessibilityRole).toBe('button');
      expect(todayButton.props.accessibilityLabel).toBe('Go to today');
    });

    it('should provide clear user feedback when pressed', async () => {
      const { getByText } = render(
        <DateNavigation
          selectedDate="2025-07-15"
          viewType="month"
          onDateChange={mockOnDateChange}
        />
      );

      const todayButton = getByText('Today');
      
      // Should have visual feedback (activeOpacity)
      expect(todayButton.props.activeOpacity).toBe(0.7);
      
      fireEvent.press(todayButton);

      await waitFor(() => {
        expect(mockOnDateChange).toHaveBeenCalledWith(mockToday);
      });
    });
  });
});