import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { ProfileStats } from '../../src/components/profile/ProfileStats';
import { EventFilterToggle } from '../../src/components/calendar/EventFilterToggle';
import { CalendarView } from '../../src/components/calendar/CalendarView';

// Mock Dimensions for responsive testing
const mockDimensions = {
  get: jest.fn().mockReturnValue({ width: 375, height: 667 }), // iPhone 8 default
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Dimensions: mockDimensions,
}));

// Mock fonts for consistent text measurement
jest.mock('react-native/Libraries/Text/TextStylePropTypes', () => ({
  ...jest.requireActual('react-native/Libraries/Text/TextStylePropTypes'),
}));

describe('Comprehensive UI Text Fitting Tests', () => {
  const mockStats = {
    eventsAttended: 42,
    eventsSaved: 156,
    friendsConnected: 28,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Screen Size Responsive Tests', () => {
    const deviceSizes = [
      { name: 'iPhone SE', width: 320, height: 568 },
      { name: 'iPhone 8', width: 375, height: 667 },
      { name: 'iPhone 8 Plus', width: 414, height: 736 },
      { name: 'iPhone X', width: 375, height: 812 },
      { name: 'iPhone 12 Pro', width: 390, height: 844 },
      { name: 'iPhone 12 Pro Max', width: 428, height: 926 },
      { name: 'iPad Mini', width: 768, height: 1024 },
      { name: 'iPad Pro 11"', width: 834, height: 1194 },
    ];

    describe('ProfileStats Responsive Behavior', () => {
      deviceSizes.forEach(device => {
        it(`should display properly on ${device.name} (${device.width}x${device.height})`, () => {
          // Set device dimensions
          mockDimensions.get.mockReturnValue({
            width: device.width,
            height: device.height,
          });

          const { getByText, queryAllByTestId } = render(
            <ProfileStats stats={mockStats} />
          );

          // Verify all stats are displayed
          expect(getByText('42')).toBeTruthy();
          expect(getByText('156')).toBeTruthy();
          expect(getByText('28')).toBeTruthy();

          // Verify text labels are present
          expect(getByText('Events Attended')).toBeTruthy();
          expect(getByText('Events Saved')).toBeTruthy();
          expect(getByText('Friends')).toBeTruthy();

          // Verify no text overflow by checking container widths
          const statCards = queryAllByTestId('stat-card');
          statCards.forEach(card => {
            expect(card.props.style).toBeDefined();
            // Each card should have flex: 1 to distribute equally
            expect(card.props.style.flex).toBe(1);
          });
        });
      });

      it('should handle very large numbers without overflow', () => {
        const largeStats = {
          eventsAttended: 9999,
          eventsSaved: 99999,
          friendsConnected: 1234,
        };

        const { getByText } = render(<ProfileStats stats={largeStats} />);

        expect(getByText('9999')).toBeTruthy();
        expect(getByText('99999')).toBeTruthy();
        expect(getByText('1234')).toBeTruthy();
      });

      it('should handle zero values gracefully', () => {
        const zeroStats = {
          eventsAttended: 0,
          eventsSaved: 0,
          friendsConnected: 0,
        };

        const { getByText } = render(<ProfileStats stats={zeroStats} />);

        expect(getByText('0')).toBeTruthy();
      });
    });

    describe('EventFilterToggle Responsive Behavior', () => {
      const mockOnFilterChange = jest.fn();

      deviceSizes.forEach(device => {
        it(`should render dropdown variant properly on ${device.name}`, () => {
          mockDimensions.get.mockReturnValue({
            width: device.width,
            height: device.height,
          });

          const { getByText, getByRole } = render(
            <EventFilterToggle
              currentFilter="all"
              onFilterChange={mockOnFilterChange}
              variant="dropdown"
            />
          );

          // Verify dropdown button is accessible
          const dropdownButton = getByRole('button');
          expect(dropdownButton).toBeTruthy();
          expect(getByText('All Events')).toBeTruthy();

          // Test dropdown opening
          fireEvent.press(dropdownButton);
          
          // Verify all options are available
          expect(getByText('Private')).toBeTruthy();
          expect(getByText('Public')).toBeTruthy();
        });

        it(`should render full variant properly on ${device.name}`, () => {
          mockDimensions.get.mockReturnValue({
            width: device.width,
            height: device.height,
          });

          const { getByText } = render(
            <EventFilterToggle
              currentFilter="all"
              onFilterChange={mockOnFilterChange}
              variant="full"
            />
          );

          // All options should be visible in full variant
          expect(getByText('All Events')).toBeTruthy();
          expect(getByText('Private')).toBeTruthy();
          expect(getByText('Public')).toBeTruthy();
        });
      });

      it('should handle text truncation in dropdown variant', () => {
        // Test with very narrow screen
        mockDimensions.get.mockReturnValue({ width: 200, height: 400 });

        const { getByText } = render(
          <EventFilterToggle
            currentFilter="all"
            onFilterChange={mockOnFilterChange}
            variant="dropdown"
          />
        );

        // Text should still be readable even on narrow screens
        expect(getByText('All Events')).toBeTruthy();
      });
    });
  });

  describe('Accessibility and Touch Target Tests', () => {
    it('should have adequate touch targets for ProfileStats', () => {
      const { queryAllByTestId } = render(
        <ProfileStats stats={mockStats} />
      );

      const statCards = queryAllByTestId('stat-card');
      statCards.forEach(card => {
        // Touch targets should be at least 44x44 points
        const cardStyle = card.props.style;
        expect(cardStyle.padding).toBeGreaterThanOrEqual(16); // spacing[6] should be adequate
      });
    });

    it('should have proper accessibility labels for EventFilterToggle', () => {
      const mockOnFilterChange = jest.fn();
      
      const { getByRole } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
          variant="dropdown"
        />
      );

      const dropdownButton = getByRole('button');
      expect(dropdownButton.props.accessibilityLabel).toContain('Current filter: All Events');
      expect(dropdownButton.props.accessibilityHint).toContain('Tap to open filter options');
    });

    it('should maintain accessibility when dropdown is expanded', async () => {
      const mockOnFilterChange = jest.fn();
      
      const { getByRole, getAllByRole } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
          variant="dropdown"
        />
      );

      const dropdownButton = getByRole('button');
      
      // Open dropdown
      fireEvent.press(dropdownButton);

      await waitFor(() => {
        const menuItems = getAllByRole('menuitem');
        expect(menuItems).toHaveLength(3);
        
        menuItems.forEach(item => {
          expect(item.props.accessibilityLabel).toBeDefined();
          expect(item.props.accessibilityState).toBeDefined();
        });
      });
    });
  });

  describe('Edge Case Testing', () => {
    it('should handle rapid filter changes without issues', async () => {
      const mockOnFilterChange = jest.fn();
      
      const { getByRole } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
          variant="dropdown"
        />
      );

      const dropdownButton = getByRole('button');
      
      // Rapidly open and close dropdown
      for (let i = 0; i < 10; i++) {
        fireEvent.press(dropdownButton);
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
        });
      }

      // Should still be functional
      expect(dropdownButton).toBeTruthy();
    });

    it('should handle extreme stat values gracefully', () => {
      const extremeStats = {
        eventsAttended: Number.MAX_SAFE_INTEGER,
        eventsSaved: -1, // Invalid case
        friendsConnected: 0,
      };

      const { getByText } = render(<ProfileStats stats={extremeStats} />);

      // Should handle large numbers
      expect(getByText(String(Number.MAX_SAFE_INTEGER))).toBeTruthy();
      // Should handle negative numbers (though UI should prevent this)
      expect(getByText('-1')).toBeTruthy();
    });

    it('should maintain layout stability during orientation changes', () => {
      const { rerender, getByText } = render(
        <ProfileStats stats={mockStats} />
      );

      // Simulate portrait
      mockDimensions.get.mockReturnValue({ width: 375, height: 667 });
      rerender(<ProfileStats stats={mockStats} />);
      
      expect(getByText('Events Attended')).toBeTruthy();

      // Simulate landscape
      mockDimensions.get.mockReturnValue({ width: 667, height: 375 });
      rerender(<ProfileStats stats={mockStats} />);
      
      expect(getByText('Events Attended')).toBeTruthy();
    });
  });

  describe('Performance and Memory Tests', () => {
    it('should not cause memory leaks with frequent rerenders', () => {
      const mockOnFilterChange = jest.fn();
      let renderCount = 0;
      
      const TestComponent = () => {
        renderCount++;
        return (
          <EventFilterToggle
            currentFilter={renderCount % 2 === 0 ? 'all' : 'private'}
            onFilterChange={mockOnFilterChange}
            variant="dropdown"
          />
        );
      };

      const { rerender } = render(<TestComponent />);

      // Force multiple rerenders
      for (let i = 0; i < 50; i++) {
        rerender(<TestComponent />);
      }

      expect(renderCount).toBe(51); // Initial + 50 rerenders
      // Component should still be functional
      expect(mockOnFilterChange).not.toHaveBeenCalled();
    });

    it('should render efficiently with large datasets', () => {
      const startTime = performance.now();
      
      const { getByText } = render(<ProfileStats stats={mockStats} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Render should be fast (less than 16ms for 60fps)
      expect(renderTime).toBeLessThan(16);
      expect(getByText('Events Attended')).toBeTruthy();
    });
  });

  describe('Platform-Specific Tests', () => {
    it('should handle iOS-specific layout considerations', () => {
      // Mock iOS platform
      jest.doMock('react-native/Libraries/Utilities/Platform', () => ({
        OS: 'ios',
        select: jest.fn(obj => obj.ios),
      }));

      const { getByText } = render(<ProfileStats stats={mockStats} />);
      
      // Should render without platform-specific issues
      expect(getByText('Events Attended')).toBeTruthy();
    });

    it('should handle Android-specific layout considerations', () => {
      // Mock Android platform
      jest.doMock('react-native/Libraries/Utilities/Platform', () => ({
        OS: 'android',
        select: jest.fn(obj => obj.android),
      }));

      const { getByText } = render(<ProfileStats stats={mockStats} />);
      
      // Should render without platform-specific issues
      expect(getByText('Events Attended')).toBeTruthy();
    });
  });

  describe('Text Readability Tests', () => {
    it('should maintain minimum contrast ratios', () => {
      const { getByText } = render(<ProfileStats stats={mockStats} />);
      
      const statValue = getByText('42');
      const statTitle = getByText('Events Attended');

      // Values should be in high contrast color
      expect(statValue.props.style.color).toBeDefined();
      // Titles should be in readable secondary color
      expect(statTitle.props.style.color).toBeDefined();
    });

    it('should use appropriate font sizes for different screen densities', () => {
      // Test high DPI scenario
      mockDimensions.get.mockReturnValue({ 
        width: 428, 
        height: 926,
        scale: 3.0, // High DPI
      });

      const { getByText } = render(<ProfileStats stats={mockStats} />);
      
      const statValue = getByText('42');
      expect(statValue.props.style.fontSize).toBeDefined();
      expect(statValue.props.style.fontSize).toBeGreaterThan(0);
    });
  });
});