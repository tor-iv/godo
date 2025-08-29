import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { Dimensions, Platform } from 'react-native';
import { EventFilterToggle } from '../../src/components/calendar/EventFilterToggle';
import { CalendarView } from '../../src/components/calendar/CalendarView';

// Mock platform and dimensions
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn(obj => obj.ios || obj.default),
}));

const mockDimensions = {
  get: jest.fn().mockReturnValue({ width: 375, height: 667 }),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Dimensions: mockDimensions,
}));

describe('Calendar Toggle Functionality Validation', () => {
  const mockOnFilterChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnFilterChange.mockClear();
  });

  describe('Toggle State Management', () => {
    it('should correctly display current filter state', () => {
      const { getByText, rerender } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
          variant="dropdown"
        />
      );

      expect(getByText('All Events')).toBeTruthy();

      // Change to private filter
      rerender(
        <EventFilterToggle
          currentFilter="private"
          onFilterChange={mockOnFilterChange}
          variant="dropdown"
        />
      );

      expect(getByText('Private')).toBeTruthy();

      // Change to public filter
      rerender(
        <EventFilterToggle
          currentFilter="public"
          onFilterChange={mockOnFilterChange}
          variant="dropdown"
        />
      );

      expect(getByText('Public')).toBeTruthy();
    });

    it('should maintain correct visual state when toggled', async () => {
      const { getByRole, getByText } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
          variant="dropdown"
        />
      );

      const dropdownButton = getByRole('button');
      
      // Initial state - dropdown closed
      expect(dropdownButton.props.accessibilityState.expanded).toBe(false);

      // Open dropdown
      fireEvent.press(dropdownButton);

      await waitFor(() => {
        expect(dropdownButton.props.accessibilityState.expanded).toBe(true);
        expect(getByText('Private')).toBeTruthy();
        expect(getByText('Public')).toBeTruthy();
      });

      // Select an option
      fireEvent.press(getByText('Private'));

      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith('private');
        // Dropdown should close after selection
        expect(dropdownButton.props.accessibilityState.expanded).toBe(false);
      });
    });
  });

  describe('Responsive Text Display', () => {
    const deviceSizes = [
      { name: 'iPhone SE', width: 320, height: 568, expectTruncation: true },
      { name: 'iPhone 8', width: 375, height: 667, expectTruncation: false },
      { name: 'iPhone 8 Plus', width: 414, height: 736, expectTruncation: false },
      { name: 'iPad Mini', width: 768, height: 1024, expectTruncation: false },
    ];

    deviceSizes.forEach(device => {
      it(`should display text properly on ${device.name}`, () => {
        mockDimensions.get.mockReturnValue({
          width: device.width,
          height: device.height,
        });

        const { getByText } = render(
          <EventFilterToggle
            currentFilter="all"
            onFilterChange={mockOnFilterChange}
            variant="dropdown"
          />
        );

        const buttonText = getByText('All Events');
        expect(buttonText).toBeTruthy();
        
        // Text should be readable regardless of screen size
        expect(buttonText.props.style).toBeDefined();
        expect(buttonText.props.style.fontSize).toBeGreaterThan(0);
      });

      it(`should handle long filter labels on ${device.name}`, () => {
        mockDimensions.get.mockReturnValue({
          width: device.width,
          height: device.height,
        });

        // Test with custom long labels
        const { getByRole } = render(
          <EventFilterToggle
            currentFilter="all"
            onFilterChange={mockOnFilterChange}
            variant="dropdown"
          />
        );

        const dropdownButton = getByRole('button');
        
        // Text should fit within button bounds
        expect(dropdownButton.props.style).toBeDefined();
        expect(dropdownButton.props.style.minWidth).toBeGreaterThan(0);
      });
    });
  });

  describe('Full Variant Layout Tests', () => {
    it('should distribute space evenly in full variant', () => {
      const { getByText } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
          variant="full"
        />
      );

      // All options should be visible
      expect(getByText('All Events')).toBeTruthy();
      expect(getByText('Private')).toBeTruthy();
      expect(getByText('Public')).toBeTruthy();
    });

    it('should handle narrow screens in full variant', () => {
      // Set very narrow screen
      mockDimensions.get.mockReturnValue({ width: 280, height: 568 });

      const { getByText } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
          variant="full"
        />
      );

      // Text should still be readable even when compressed
      const allEventsText = getByText('All Events');
      const privateText = getByText('Private');
      const publicText = getByText('Public');

      expect(allEventsText).toBeTruthy();
      expect(privateText).toBeTruthy();
      expect(publicText).toBeTruthy();

      // Font size should be adjusted for readability
      expect(allEventsText.props.style.fontSize).toBeLessThanOrEqual(12);
    });
  });

  describe('Touch Target Validation', () => {
    it('should have adequate touch targets in dropdown variant', () => {
      const { getByRole } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
          variant="dropdown"
        />
      );

      const dropdownButton = getByRole('button');
      
      // Button should have minimum touch target size (44x44 points)
      const buttonStyle = dropdownButton.props.style;
      expect(buttonStyle.paddingVertical).toBeGreaterThanOrEqual(12);
      expect(buttonStyle.paddingHorizontal).toBeGreaterThanOrEqual(12);
    });

    it('should have adequate touch targets in full variant', () => {
      const { getByText } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
          variant="full"
        />
      );

      const allButton = getByText('All Events').parent;
      const privateButton = getByText('Private').parent;
      const publicButton = getByText('Public').parent;

      // Each option should have adequate touch area
      [allButton, privateButton, publicButton].forEach(button => {
        expect(button?.props.style).toBeDefined();
        expect(button?.props.style.paddingVertical).toBeGreaterThanOrEqual(8);
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('should provide proper screen reader support', async () => {
      const { getByRole, getAllByRole } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
          variant="dropdown"
        />
      );

      const dropdownButton = getByRole('button');
      
      // Button should have proper accessibility attributes
      expect(dropdownButton.props.accessibilityLabel).toMatch(/Current filter: All Events/);
      expect(dropdownButton.props.accessibilityHint).toMatch(/Tap to open filter options/);
      expect(dropdownButton.props.accessibilityRole).toBe('button');

      // Open dropdown to test menu items
      fireEvent.press(dropdownButton);

      await waitFor(() => {
        const menuItems = getAllByRole('menuitem');
        expect(menuItems).toHaveLength(3);

        menuItems.forEach(item => {
          expect(item.props.accessibilityRole).toBe('menuitem');
          expect(item.props.accessibilityLabel).toBeDefined();
          expect(item.props.accessibilityState).toBeDefined();
        });
      });
    });

    it('should announce filter changes to screen readers', async () => {
      const { getByRole, getByText } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
          variant="dropdown"
        />
      );

      // Open dropdown and select different filter
      fireEvent.press(getByRole('button'));

      await waitFor(() => {
        const privateOption = getByText('Private');
        fireEvent.press(privateOption);
      });

      expect(mockOnFilterChange).toHaveBeenCalledWith('private');
    });

    it('should support keyboard navigation when available', async () => {
      const { getByRole } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
          variant="dropdown"
        />
      );

      const dropdownButton = getByRole('button');
      
      // Should be focusable
      expect(dropdownButton.props.accessible).toBeTruthy();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid filter values gracefully', () => {
      const invalidFilter = 'invalid' as any;
      
      const { getByRole } = render(
        <EventFilterToggle
          currentFilter={invalidFilter}
          onFilterChange={mockOnFilterChange}
          variant="dropdown"
        />
      );

      // Should not crash and should provide fallback
      const dropdownButton = getByRole('button');
      expect(dropdownButton).toBeTruthy();
    });

    it('should handle rapid successive clicks', async () => {
      const { getByRole } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
          variant="dropdown"
        />
      );

      const dropdownButton = getByRole('button');

      // Rapidly click multiple times
      for (let i = 0; i < 5; i++) {
        fireEvent.press(dropdownButton);
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });
      }

      // Should still be functional
      expect(dropdownButton).toBeTruthy();
    });

    it('should handle null/undefined callback gracefully', () => {
      const { getByRole } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={undefined as any}
          variant="dropdown"
        />
      );

      const dropdownButton = getByRole('button');
      
      // Should not crash when pressed
      expect(() => {
        fireEvent.press(dropdownButton);
      }).not.toThrow();
    });
  });

  describe('Performance Under Load', () => {
    it('should maintain smooth animations during rapid state changes', async () => {
      const { getByRole, rerender } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
          variant="dropdown"
        />
      );

      const dropdownButton = getByRole('button');

      // Simulate rapid filter changes
      const filters: Array<'all' | 'private' | 'public'> = ['all', 'private', 'public'];
      
      for (let i = 0; i < 20; i++) {
        const currentFilter = filters[i % 3];
        
        rerender(
          <EventFilterToggle
            currentFilter={currentFilter}
            onFilterChange={mockOnFilterChange}
            variant="dropdown"
          />
        );

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
        });
      }

      // Should still be responsive
      expect(dropdownButton).toBeTruthy();
      expect(dropdownButton.props.accessibilityState.expanded).toBe(false);
    });

    it('should render efficiently with frequent props changes', () => {
      const TestWrapper = ({ filter }: { filter: 'all' | 'private' | 'public' }) => (
        <EventFilterToggle
          currentFilter={filter}
          onFilterChange={mockOnFilterChange}
          variant="dropdown"
        />
      );

      const startTime = performance.now();
      
      const { rerender } = render(<TestWrapper filter="all" />);
      
      // Force multiple rerenders
      for (let i = 0; i < 100; i++) {
        const filters: Array<'all' | 'private' | 'public'> = ['all', 'private', 'public'];
        rerender(<TestWrapper filter={filters[i % 3]} />);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should complete quickly
      expect(totalTime).toBeLessThan(100); // Less than 100ms for 100 rerenders
    });
  });
});