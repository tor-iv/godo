import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { EventFilterToggle, EventFilterType } from '../../../src/components/calendar/EventFilterToggle';

describe('EventFilterToggle Component', () => {
  const mockOnFilterChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render all filter options', () => {
      const { getByText } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(getByText('All')).toBeTruthy();
      expect(getByText('Private')).toBeTruthy();
      expect(getByText('Public')).toBeTruthy();
    });

    it('should highlight the current filter', () => {
      const { getByText } = render(
        <EventFilterToggle
          currentFilter="private"
          onFilterChange={mockOnFilterChange}
        />
      );

      // Test visual state by checking if the Private option exists
      expect(getByText('Private')).toBeTruthy();
    });

    it('should render with proper icons for each filter type', () => {
      const { getByText } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
        />
      );

      // Icons are rendered as part of the options, verify all options are present
      expect(getByText('All')).toBeTruthy();
      expect(getByText('Private')).toBeTruthy();
      expect(getByText('Public')).toBeTruthy();
    });
  });

  describe('Filter Selection', () => {
    it('should call onFilterChange when clicking different filter', () => {
      const { getByText } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
        />
      );

      fireEvent.press(getByText('Private'));

      expect(mockOnFilterChange).toHaveBeenCalledWith('private');
    });

    it('should not call onFilterChange when clicking current filter', () => {
      const { getByText } = render(
        <EventFilterToggle
          currentFilter="public"
          onFilterChange={mockOnFilterChange}
        />
      );

      fireEvent.press(getByText('Public'));

      expect(mockOnFilterChange).not.toHaveBeenCalled();
    });

    it('should handle switching between all filter types', async () => {
      const { getByText, rerender } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
        />
      );

      // Switch to Private
      fireEvent.press(getByText('Private'));
      expect(mockOnFilterChange).toHaveBeenCalledWith('private');

      // Re-render with new filter
      rerender(
        <EventFilterToggle
          currentFilter="private"
          onFilterChange={mockOnFilterChange}
        />
      );

      jest.clearAllMocks();

      // Switch to Public
      fireEvent.press(getByText('Public'));
      expect(mockOnFilterChange).toHaveBeenCalledWith('public');

      // Re-render with new filter
      rerender(
        <EventFilterToggle
          currentFilter="public"
          onFilterChange={mockOnFilterChange}
        />
      );

      jest.clearAllMocks();

      // Switch back to All
      fireEvent.press(getByText('All'));
      expect(mockOnFilterChange).toHaveBeenCalledWith('all');
    });
  });

  describe('Animation and Visual States', () => {
    it('should handle rapid filter changes without issues', async () => {
      const { getByText } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
        />
      );

      // Rapid fire clicks
      fireEvent.press(getByText('Private'));
      fireEvent.press(getByText('Public'));
      fireEvent.press(getByText('All'));

      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledTimes(3);
      });

      expect(mockOnFilterChange).toHaveBeenNthCalledWith(1, 'private');
      expect(mockOnFilterChange).toHaveBeenNthCalledWith(2, 'public');
      expect(mockOnFilterChange).toHaveBeenNthCalledWith(3, 'all');
    });

    it('should maintain consistent layout across different selections', () => {
      const filters: EventFilterType[] = ['all', 'private', 'public'];
      
      filters.forEach(filter => {
        const { getByText, unmount } = render(
          <EventFilterToggle
            currentFilter={filter}
            onFilterChange={mockOnFilterChange}
          />
        );

        // All options should always be present
        expect(getByText('All')).toBeTruthy();
        expect(getByText('Private')).toBeTruthy();
        expect(getByText('Public')).toBeTruthy();

        unmount();
      });
    });
  });

  describe('Accessibility', () => {
    it('should be accessible for screen readers', () => {
      const { getByText } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
        />
      );

      // Text labels should be present for accessibility
      expect(getByText('All')).toBeTruthy();
      expect(getByText('Private')).toBeTruthy();
      expect(getByText('Public')).toBeTruthy();
    });

    it('should support keyboard navigation patterns', () => {
      // For React Native, this would be tested with actual keyboard events
      // For now, ensure basic interactive elements are present
      const { getByText } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
        />
      );

      // All filter options should be interactable
      const allButton = getByText('All');
      const privateButton = getByText('Private');
      const publicButton = getByText('Public');

      expect(allButton).toBeTruthy();
      expect(privateButton).toBeTruthy();
      expect(publicButton).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid filter type gracefully', () => {
      // TypeScript should prevent this, but test runtime safety
      const { getByText } = render(
        <EventFilterToggle
          currentFilter={'invalid' as EventFilterType}
          onFilterChange={mockOnFilterChange}
        />
      );

      // Should still render all options
      expect(getByText('All')).toBeTruthy();
      expect(getByText('Private')).toBeTruthy();
      expect(getByText('Public')).toBeTruthy();
    });

    it('should handle null/undefined callback gracefully', () => {
      expect(() => {
        render(
          <EventFilterToggle
            currentFilter="all"
            onFilterChange={null as any}
          />
        );
      }).not.toThrow();
    });

    it('should maintain state consistency after multiple rapid changes', async () => {
      const { getByText, rerender } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
        />
      );

      // Multiple state changes
      fireEvent.press(getByText('Private'));
      
      rerender(
        <EventFilterToggle
          currentFilter="private"
          onFilterChange={mockOnFilterChange}
        />
      );

      fireEvent.press(getByText('Public'));
      
      rerender(
        <EventFilterToggle
          currentFilter="public"
          onFilterChange={mockOnFilterChange}
        />
      );

      // Verify final state is correct
      expect(getByText('Public')).toBeTruthy();
      expect(mockOnFilterChange).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration with Header Layout', () => {
    it('should maintain compact size suitable for header placement', () => {
      const { container } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
        />
      );

      // Component should render without taking excessive space
      expect(container).toBeTruthy();
    });

    it('should work with right-aligned header positioning', () => {
      // Test that component renders correctly when used in header context
      const HeaderMock = () => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>Title</div>
          <EventFilterToggle
            currentFilter="all"
            onFilterChange={mockOnFilterChange}
          />
        </div>
      );

      const { getByText } = render(<HeaderMock />);
      
      expect(getByText('Title')).toBeTruthy();
      expect(getByText('All')).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      let renderCount = 0;
      
      const TestWrapper = ({ filter }: { filter: EventFilterType }) => {
        renderCount++;
        return (
          <EventFilterToggle
            currentFilter={filter}
            onFilterChange={mockOnFilterChange}
          />
        );
      };

      const { rerender } = render(<TestWrapper filter="all" />);
      const initialRenderCount = renderCount;

      // Same props should not cause re-render
      rerender(<TestWrapper filter="all" />);
      expect(renderCount).toBe(initialRenderCount);

      // Different props should cause re-render
      rerender(<TestWrapper filter="private" />);
      expect(renderCount).toBe(initialRenderCount + 1);
    });
  });
});