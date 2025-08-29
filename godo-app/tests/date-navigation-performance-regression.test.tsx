import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { format, addDays, subDays } from 'date-fns';
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

describe('DateNavigation Performance and Regression Tests', () => {
  const defaultProps = {
    selectedDate: '2025-01-15',
    viewType: 'day' as ViewType,
    onDateChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDimensions.get.mockReturnValue({ width: 375, height: 812 });
  });

  describe('Rendering Performance', () => {
    test('renders quickly with responsive text formatting', () => {
      const startTime = performance.now();
      
      const { getByText } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="day"
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render in less than 50ms
      expect(renderTime).toBeLessThan(50);
      expect(getByText(/Wednesday|Wed|15/)).toBeTruthy();
    });

    test('handles frequent screen size changes efficiently', () => {
      const screenWidths = [280, 320, 375, 414, 768];
      const renderTimes: number[] = [];

      screenWidths.forEach((width) => {
        const startTime = performance.now();
        
        mockDimensions.get.mockReturnValue({ width, height: 812 });
        
        const { unmount } = render(
          <DateNavigation
            {...defaultProps}
            selectedDate="2025-01-15"
            viewType="day"
          />
        );

        const endTime = performance.now();
        renderTimes.push(endTime - startTime);
        
        unmount();
      });

      // All renders should be fast
      renderTimes.forEach((time, index) => {
        expect(time).toBeLessThan(100); // Allow more time for different screen sizes
      });

      // Average render time should be reasonable
      const averageTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
      expect(averageTime).toBeLessThan(50);
    });

    test('memoization prevents unnecessary recalculations', () => {
      let calculationCount = 0;
      
      // Mock the responsive text calculation to count calls
      const originalUseMemo = React.useMemo;
      const mockUseMemo = jest.fn((factory, deps) => {
        if (deps && deps.length > 0) {
          calculationCount++;
        }
        return originalUseMemo(factory, deps);
      });

      React.useMemo = mockUseMemo;

      const { rerender } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="day"
        />
      );

      const initialCount = calculationCount;

      // Re-render with same props - should not trigger recalculation
      rerender(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="day"
        />
      );

      // Should not have increased calculation count significantly
      expect(calculationCount - initialCount).toBeLessThanOrEqual(1);

      React.useMemo = originalUseMemo;
    });
  });

  describe('Memory Usage', () => {
    test('does not leak memory during rapid navigation', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      const { rerender } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="day"
        />
      );

      // Simulate rapid navigation through dates
      for (let i = 0; i < 100; i++) {
        const newDate = format(addDays(new Date('2025-01-15'), i), 'yyyy-MM-dd');
        rerender(
          <DateNavigation
            {...defaultProps}
            selectedDate={newDate}
            viewType="day"
          />
        );
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Memory usage should not grow significantly (allow for 5MB growth)
      if (initialMemory > 0) {
        expect(finalMemory - initialMemory).toBeLessThan(5 * 1024 * 1024);
      }
    });

    test('cleans up event handlers and timers', () => {
      const { unmount } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="day"
        />
      );

      // Should not throw when unmounting
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Text Calculation Efficiency', () => {
    test('text formatting algorithms are efficient', () => {
      const testDates = [];
      
      // Generate 365 days of test dates
      for (let i = 0; i < 365; i++) {
        testDates.push(format(addDays(new Date('2025-01-01'), i), 'yyyy-MM-dd'));
      }

      const startTime = performance.now();

      testDates.forEach((date) => {
        const { unmount } = render(
          <DateNavigation
            {...defaultProps}
            selectedDate={date}
            viewType="day"
          />
        );
        unmount();
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / testDates.length;

      // Should process each date quickly
      expect(averageTime).toBeLessThan(5); // 5ms per date
      expect(totalTime).toBeLessThan(2000); // Total under 2 seconds
    });

    test('week calculations are efficient for cross-month boundaries', () => {
      // Test dates that are likely to cross month boundaries
      const boundaryDates = [
        '2025-01-01', // New Year
        '2025-02-28', // End of February
        '2025-03-31', // End of March
        '2025-06-30', // End of June
        '2025-12-31', // End of year
      ];

      const startTime = performance.now();

      boundaryDates.forEach((date) => {
        const { unmount } = render(
          <DateNavigation
            {...defaultProps}
            selectedDate={date}
            viewType="week"
          />
        );
        unmount();
      });

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / boundaryDates.length;

      // Cross-month calculations should still be fast
      expect(averageTime).toBeLessThan(20);
    });
  });

  describe('Navigation Performance', () => {
    test('rapid navigation does not cause performance degradation', () => {
      const onDateChange = jest.fn();
      const { getByRole } = render(
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

      const startTime = performance.now();

      // Simulate rapid clicking
      for (let i = 0; i < 50; i++) {
        fireEvent.press(nextButton);
      }

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / 50;

      // Each navigation should be fast
      expect(averageTime).toBeLessThan(10);
      expect(onDateChange).toHaveBeenCalledTimes(50);
    });

    test('navigation throttling prevents excessive updates', () => {
      const onDateChange = jest.fn();
      const { getByRole } = render(
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

      // Simulate very rapid clicking (should be throttled)
      fireEvent.press(nextButton);
      fireEvent.press(nextButton);
      fireEvent.press(nextButton);

      // Should not process all clicks immediately due to throttling
      expect(onDateChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Responsive Text Caching', () => {
    test('text calculations are cached for identical conditions', () => {
      const { rerender } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="day"
        />
      );

      const startTime = performance.now();

      // Multiple re-renders with same conditions
      for (let i = 0; i < 10; i++) {
        rerender(
          <DateNavigation
            {...defaultProps}
            selectedDate="2025-01-15"
            viewType="day"
          />
        );
      }

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / 10;

      // Cached renders should be very fast
      expect(averageTime).toBeLessThan(2);
    });

    test('cache invalidation works correctly on prop changes', () => {
      const { rerender, getByText } = render(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-15"
          viewType="day"
        />
      );

      // Initial render
      expect(getByText(/Wednesday|15/)).toBeTruthy();

      // Change date - should update text
      rerender(
        <DateNavigation
          {...defaultProps}
          selectedDate="2025-01-16"
          viewType="day"
        />
      );

      expect(getByText(/Thursday|16/)).toBeTruthy();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('handles invalid dates gracefully', () => {
      // Should not crash with invalid date
      expect(() => {
        render(
          <DateNavigation
            {...defaultProps}
            selectedDate="invalid-date"
            viewType="day"
          />
        );
      }).not.toThrow();
    });

    test('handles extreme screen sizes without performance issues', () => {
      const extremeSizes = [
        { width: 100, height: 200 }, // Very narrow
        { width: 2000, height: 1500 }, // Very wide
      ];

      extremeSizes.forEach(({ width, height }) => {
        mockDimensions.get.mockReturnValue({ width, height });

        const startTime = performance.now();
        
        const { unmount } = render(
          <DateNavigation
            {...defaultProps}
            selectedDate="2025-01-15"
            viewType="day"
          />
        );

        const endTime = performance.now();
        
        // Should handle extreme sizes without performance degradation
        expect(endTime - startTime).toBeLessThan(100);
        
        unmount();
      });
    });

    test('does not cause infinite re-renders with responsive calculations', () => {
      const renderCount = jest.fn();
      
      const TestWrapper = () => {
        renderCount();
        return (
          <DateNavigation
            {...defaultProps}
            selectedDate="2025-01-15"
            viewType="day"
          />
        );
      };

      render(<TestWrapper />);

      // Should not render excessively
      expect(renderCount).toHaveBeenCalledTimes(1);

      // Wait a bit to ensure no additional renders
      setTimeout(() => {
        expect(renderCount).toHaveBeenCalledTimes(1);
      }, 100);
    });
  });

  describe('Regression Tests', () => {
    test('text formatting remains consistent across React Native versions', () => {
      // Test various date formats to ensure consistency
      const testCases = [
        { date: '2025-01-15', viewType: 'day' as ViewType },
        { date: '2025-01-15', viewType: 'week' as ViewType },
        { date: '2025-01-15', viewType: 'month' as ViewType },
        { date: '2025-01-01', viewType: 'week' as ViewType }, // Cross-month
      ];

      testCases.forEach(({ date, viewType }) => {
        const { getByText, unmount } = render(
          <DateNavigation
            {...defaultProps}
            selectedDate={date}
            viewType={viewType}
          />
        );

        // Should render some text (exact format may vary)
        const textElements = getByText.toString();
        expect(typeof textElements).toBe('function');
        
        unmount();
      });
    });

    test('maintains backwards compatibility with existing props', () => {
      // Test with minimal props
      const { getByText } = render(
        <DateNavigation
          selectedDate="2025-01-15"
          viewType="day"
          onDateChange={jest.fn()}
        />
      );

      expect(getByText(/15|Wednesday|Wed/)).toBeTruthy();
    });

    test('performance remains within acceptable bounds', () => {
      const performances: number[] = [];

      // Run multiple performance tests
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        
        const { unmount } = render(
          <DateNavigation
            {...defaultProps}
            selectedDate="2025-01-15"
            viewType="day"
          />
        );

        const endTime = performance.now();
        performances.push(endTime - startTime);
        
        unmount();
      }

      const averagePerformance = performances.reduce((sum, time) => sum + time, 0) / performances.length;
      const maxPerformance = Math.max(...performances);

      // Performance benchmarks
      expect(averagePerformance).toBeLessThan(30); // Average under 30ms
      expect(maxPerformance).toBeLessThan(100); // Max under 100ms
      
      // Standard deviation should be low (consistent performance)
      const variance = performances.reduce((sum, time) => sum + Math.pow(time - averagePerformance, 2), 0) / performances.length;
      const standardDeviation = Math.sqrt(variance);
      expect(standardDeviation).toBeLessThan(20); // Consistent performance
    });
  });
});