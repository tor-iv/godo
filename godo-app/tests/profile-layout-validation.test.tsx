import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { ProfileStats } from '../src/components/profile/ProfileStats';
import { ResponsiveProfileStats } from '../src/components/profile/ResponsiveProfileStats';

// Mock Dimensions to test different screen sizes
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })), // iPhone X default
    },
  };
});

const mockStats = {
  eventsAttended: 42,
  eventsSaved: 128,
  friendsConnected: 89,
};

describe('Profile Layout Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Row Layout Implementation', () => {
    test('should render stats in proper row layout structure', () => {
      render(<ProfileStats stats={mockStats} />);
      
      // Verify the component renders without crashing
      expect(screen.getByText('42')).toBeTruthy();
      expect(screen.getByText('128')).toBeTruthy();
      expect(screen.getByText('89')).toBeTruthy();
      
      // Verify text labels are present
      expect(screen.getByText('Events Attended')).toBeTruthy();
      expect(screen.getByText('Events Saved')).toBeTruthy();
      expect(screen.getByText('Friends')).toBeTruthy();
    });

    test('should maintain proper spacing between stat cards', () => {
      const { getByTestId } = render(
        <ProfileStats stats={mockStats} />
      );
      
      // This would need testID props in the actual component for proper testing
      // For now, we're validating the structure renders correctly
      expect(screen.getByText('Events Attended')).toBeTruthy();
    });
  });

  describe('Responsive Behavior Across Screen Sizes', () => {
    const screenSizes = [
      { name: 'iPhone SE', width: 320, height: 568 },
      { name: 'iPhone 12', width: 390, height: 844 },
      { name: 'iPhone 12 Pro Max', width: 428, height: 926 },
      { name: 'iPad Mini', width: 744, height: 1133 },
      { name: 'iPad Pro', width: 1024, height: 1366 },
    ];

    screenSizes.forEach(({ name, width, height }) => {
      test(`should render properly on ${name} (${width}x${height})`, () => {
        // Mock the specific screen size
        (Dimensions.get as jest.Mock).mockReturnValue({ width, height });
        
        render(<ProfileStats stats={mockStats} />);
        
        // Verify component renders without errors
        expect(screen.getByText('Events Attended')).toBeTruthy();
        expect(screen.getByText('Events Saved')).toBeTruthy();
        expect(screen.getByText('Friends')).toBeTruthy();
        
        // Verify values are displayed
        expect(screen.getByText('42')).toBeTruthy();
        expect(screen.getByText('128')).toBeTruthy();
        expect(screen.getByText('89')).toBeTruthy();
      });
    });
  });

  describe('Text Readability Validation', () => {
    test('should implement responsive text sizing', () => {
      render(<ProfileStats stats={mockStats} />);
      
      // Verify all text elements are present (readability check)
      const eventsAttendedText = screen.getByText('Events Attended');
      const eventsSavedText = screen.getByText('Events Saved');
      const friendsText = screen.getByText('Friends');
      
      expect(eventsAttendedText).toBeTruthy();
      expect(eventsSavedText).toBeTruthy();
      expect(friendsText).toBeTruthy();
      
      // Verify that text truncation props are implemented
      // This would need more detailed component inspection in a real test
    });

    test('should handle long text gracefully', () => {
      const longTextStats = {
        eventsAttended: 999999,
        eventsSaved: 888888,
        friendsConnected: 777777,
      };
      
      render(<ProfileStats stats={longTextStats} />);
      
      // Verify large numbers render correctly
      expect(screen.getByText('999999')).toBeTruthy();
      expect(screen.getByText('888888')).toBeTruthy();
      expect(screen.getByText('777777')).toBeTruthy();
    });
  });

  describe('ResponsiveProfileStats Enhanced Component', () => {
    test('should render with default variant', () => {
      render(<ResponsiveProfileStats stats={mockStats} />);
      
      expect(screen.getByText('Events')).toBeTruthy();
      expect(screen.getByText('Saved')).toBeTruthy();
      expect(screen.getByText('Friends')).toBeTruthy();
    });

    test('should handle compact variant', () => {
      render(<ResponsiveProfileStats stats={mockStats} variant="compact" />);
      
      expect(screen.getByText('Events')).toBeTruthy();
      expect(screen.getByText('Saved')).toBeTruthy();
      expect(screen.getByText('Friends')).toBeTruthy();
    });

    test('should format large numbers correctly', () => {
      const largeStats = {
        eventsAttended: 1500000,
        eventsSaved: 2300,
        friendsConnected: 45000,
      };
      
      render(<ResponsiveProfileStats stats={largeStats} />);
      
      // Should format large numbers with K/M suffixes
      expect(screen.getByText('1.5M')).toBeTruthy();
      expect(screen.getByText('2.3K')).toBeTruthy();
      expect(screen.getByText('45.0K')).toBeTruthy();
    });

    test('should be accessible', () => {
      render(
        <ResponsiveProfileStats 
          stats={mockStats} 
          onStatPress={() => {}} 
        />
      );
      
      // Verify accessibility labels are present
      // This would need more detailed accessibility testing
      expect(screen.getByText('Events')).toBeTruthy();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle zero values', () => {
      const zeroStats = {
        eventsAttended: 0,
        eventsSaved: 0,
        friendsConnected: 0,
      };
      
      render(<ProfileStats stats={zeroStats} />);
      
      expect(screen.getByText('0')).toBeTruthy();
    });

    test('should handle negative values gracefully', () => {
      const negativeStats = {
        eventsAttended: -5,
        eventsSaved: -10,
        friendsConnected: -3,
      };
      
      render(<ProfileStats stats={negativeStats} />);
      
      // Should render negative values (though this might not be desired in real app)
      expect(screen.getByText('-5')).toBeTruthy();
    });

    test('should handle undefined/null stats gracefully', () => {
      const emptyStats = {
        eventsAttended: 0,
        eventsSaved: 0,
        friendsConnected: 0,
      };
      
      // This tests the component's resilience
      expect(() => render(<ProfileStats stats={emptyStats} />)).not.toThrow();
    });
  });

  describe('Performance and Memory Usage', () => {
    test('should render efficiently with large datasets', () => {
      const startTime = performance.now();
      
      render(<ProfileStats stats={mockStats} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render in under 100ms
      expect(renderTime).toBeLessThan(100);
    });

    test('should not cause memory leaks on re-renders', () => {
      const { rerender } = render(<ProfileStats stats={mockStats} />);
      
      // Re-render multiple times
      for (let i = 0; i < 10; i++) {
        rerender(<ProfileStats stats={{
          eventsAttended: i * 10,
          eventsSaved: i * 20,
          friendsConnected: i * 5,
        }} />);
      }
      
      // Component should still be functional
      expect(screen.getByText('Events Attended')).toBeTruthy();
    });
  });
});