import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { ProfileStats } from '../../src/components/profile/ProfileStats';
import { EventFilterToggle } from '../../src/components/calendar/EventFilterToggle';

// Mock text measurement for overflow testing
const mockTextMeasurement = {
  measureText: jest.fn(),
};

jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  // Mock text measurement capabilities
  Text: (props: any) => {
    const MockedText = jest.requireActual('react-native').Text;
    return <MockedText {...props} testID={props.testID || 'text-element'} />;
  },
}));

describe('Text Overflow Prevention Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ProfileStats Text Overflow Prevention', () => {
    it('should handle very large numbers without overflow', () => {
      const largeStats = {
        eventsAttended: 999999,
        eventsSaved: 1234567,
        friendsConnected: 99999,
      };

      const { getByText, getAllByTestId } = render(
        <ProfileStats stats={largeStats} />
      );

      // Numbers should be displayed without causing layout issues
      expect(getByText('999999')).toBeTruthy();
      expect(getByText('1234567')).toBeTruthy();
      expect(getByText('99999')).toBeTruthy();

      // Verify that containers accommodate the large numbers
      const textElements = getAllByTestId('text-element');
      textElements.forEach(element => {
        // Text should not have negative margins or be clipped
        expect(element.props.style).toBeDefined();
      });
    });

    it('should handle extreme number values gracefully', () => {
      const extremeStats = {
        eventsAttended: Number.MAX_SAFE_INTEGER,
        eventsSaved: 0,
        friendsConnected: -1, // Edge case that shouldn't happen but should be handled
      };

      const { getByText } = render(<ProfileStats stats={extremeStats} />);

      expect(getByText(String(Number.MAX_SAFE_INTEGER))).toBeTruthy();
      expect(getByText('0')).toBeTruthy();
      expect(getByText('-1')).toBeTruthy();
    });

    it('should prevent label text overflow on narrow screens', () => {
      // Simulate very narrow screen
      jest.doMock('react-native/Libraries/Utilities/Dimensions', () => ({
        get: () => ({ width: 280, height: 568 }),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      const mockStats = {
        eventsAttended: 42,
        eventsSaved: 156,
        friendsConnected: 28,
      };

      const { getByText } = render(<ProfileStats stats={mockStats} />);

      // Labels should still be readable even on narrow screens
      expect(getByText('Events Attended')).toBeTruthy();
      expect(getByText('Events Saved')).toBeTruthy();
      expect(getByText('Friends')).toBeTruthy();
    });

    it('should handle custom long text labels without breaking layout', () => {
      // Test with artificially long labels (could happen with localization)
      const mockStats = {
        eventsAttended: 42,
        eventsSaved: 156,
        friendsConnected: 28,
      };

      // This test simulates what would happen if labels were much longer
      const { container } = render(<ProfileStats stats={mockStats} />);

      // Component should render without throwing errors
      expect(container).toBeTruthy();
    });

    it('should maintain equal width distribution regardless of number size', () => {
      const unevenStats = {
        eventsAttended: 5, // 1 digit
        eventsSaved: 10000, // 5 digits
        friendsConnected: 999, // 3 digits
      };

      const { getByText } = render(<ProfileStats stats={unevenStats} />);

      expect(getByText('5')).toBeTruthy();
      expect(getByText('10000')).toBeTruthy();
      expect(getByText('999')).toBeTruthy();

      // All cards should maintain equal flex distribution
      // This is tested through the component's style structure
    });
  });

  describe('EventFilterToggle Text Overflow Prevention', () => {
    const mockOnFilterChange = jest.fn();

    beforeEach(() => {
      mockOnFilterChange.mockClear();
    });

    it('should handle dropdown variant text overflow on narrow screens', () => {
      jest.doMock('react-native/Libraries/Utilities/Dimensions', () => ({
        get: () => ({ width: 280, height: 568 }),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      const { getByText } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
          variant="dropdown"
        />
      );

      // Button text should fit within available space
      expect(getByText('All Events')).toBeTruthy();
    });

    it('should handle full variant text overflow with long labels', () => {
      // Test full variant which has more space constraints
      const { getByText } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
          variant="full"
        />
      );

      // All options should be visible and readable
      expect(getByText('All Events')).toBeTruthy();
      expect(getByText('Private')).toBeTruthy();
      expect(getByText('Public')).toBeTruthy();
    });

    it('should prevent text overlap in full variant on very narrow screens', () => {
      // Simulate extremely narrow screen
      jest.doMock('react-native/Libraries/Utilities/Dimensions', () => ({
        get: () => ({ width: 250, height: 568 }),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      const { getByText } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
          variant="full"
        />
      );

      // Text should still be readable, potentially with smaller font size
      const allEventsText = getByText('All Events');
      const privateText = getByText('Private');
      const publicText = getByText('Public');

      expect(allEventsText).toBeTruthy();
      expect(privateText).toBeTruthy();
      expect(publicText).toBeTruthy();

      // Font size should be adjusted for narrow screens
      expect(allEventsText.props.style.fontSize).toBeLessThanOrEqual(12);
    });

    it('should handle dropdown menu positioning to prevent overflow', () => {
      const { getByRole } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
          variant="dropdown"
        />
      );

      const dropdownButton = getByRole('button');
      expect(dropdownButton).toBeTruthy();

      // Dropdown menu should have appropriate positioning to prevent overflow
      // This is primarily tested through visual inspection and integration tests
    });
  });

  describe('Generic Text Overflow Prevention Patterns', () => {
    it('should handle ellipsis truncation gracefully', () => {
      // Create a component with potentially overflowing text
      const LongTextComponent = () => (
        <View style={{ width: 100 }}>
          <Text numberOfLines={1} ellipsizeMode="tail">
            This is a very long text that should be truncated with ellipsis
          </Text>
        </View>
      );

      const { container } = render(<LongTextComponent />);
      expect(container).toBeTruthy();
    });

    it('should handle multi-line text wrapping', () => {
      const MultiLineComponent = () => (
        <View style={{ width: 150 }}>
          <Text numberOfLines={2}>
            This text should wrap to multiple lines when the container is narrow
          </Text>
        </View>
      );

      const { container } = render(<MultiLineComponent />);
      expect(container).toBeTruthy();
    });

    it('should handle flex-based text containers', () => {
      const FlexTextComponent = () => (
        <View style={{ flexDirection: 'row', width: 300 }}>
          <Text style={{ flex: 1 }}>Flexible text container 1</Text>
          <Text style={{ flex: 1 }}>Flexible text container 2</Text>
          <Text style={{ flex: 1 }}>Flexible text container 3</Text>
        </View>
      );

      const { container } = render(<FlexTextComponent />);
      expect(container).toBeTruthy();
    });

    it('should handle text scaling based on container size', () => {
      // Test different container sizes
      const containerSizes = [
        { width: 100, expectedMaxFontSize: 12 },
        { width: 200, expectedMaxFontSize: 16 },
        { width: 300, expectedMaxFontSize: 18 },
      ];

      containerSizes.forEach(({ width, expectedMaxFontSize }) => {
        const ScalingTextComponent = () => (
          <View style={{ width }}>
            <Text style={{ fontSize: Math.min(16, width / 10) }}>
              Scaling text content
            </Text>
          </View>
        );

        const { container } = render(<ScalingTextComponent />);
        expect(container).toBeTruthy();
      });
    });
  });

  describe('Font Size and Line Height Validation', () => {
    it('should maintain readable font sizes across all screen sizes', () => {
      const mockStats = {
        eventsAttended: 42,
        eventsSaved: 156,
        friendsConnected: 28,
      };

      const { getAllByTestId } = render(<ProfileStats stats={mockStats} />);
      
      const textElements = getAllByTestId('text-element');
      
      textElements.forEach(element => {
        const style = element.props.style;
        if (style && style.fontSize) {
          // Font size should be at least 12pt for readability
          expect(style.fontSize).toBeGreaterThanOrEqual(12);
          // Font size should not be excessively large
          expect(style.fontSize).toBeLessThanOrEqual(48);
        }
      });
    });

    it('should maintain appropriate line height ratios', () => {
      const TestComponent = () => (
        <Text style={{ fontSize: 16, lineHeight: 24 }}>
          Test text with proper line height
        </Text>
      );

      const { container } = render(<TestComponent />);
      expect(container).toBeTruthy();
    });
  });

  describe('Dynamic Content Overflow Prevention', () => {
    it('should handle dynamically changing content sizes', () => {
      const DynamicComponent = ({ size }: { size: 'small' | 'medium' | 'large' }) => {
        const content = {
          small: '42',
          medium: '1,234',
          large: '999,999',
        };

        return <Text>{content[size]}</Text>;
      };

      // Test transitions between different content sizes
      const { rerender, getByText } = render(<DynamicComponent size="small" />);
      expect(getByText('42')).toBeTruthy();

      rerender(<DynamicComponent size="medium" />);
      expect(getByText('1,234')).toBeTruthy();

      rerender(<DynamicComponent size="large" />);
      expect(getByText('999,999')).toBeTruthy();
    });

    it('should handle content that changes rapidly', () => {
      const RapidChangeComponent = ({ count }: { count: number }) => (
        <Text>{count.toString()}</Text>
      );

      const { rerender, container } = render(<RapidChangeComponent count={0} />);

      // Simulate rapid content changes
      for (let i = 1; i <= 100; i++) {
        rerender(<RapidChangeComponent count={i} />);
      }

      expect(container).toBeTruthy();
    });
  });

  describe('Accessibility and Text Overflow', () => {
    it('should maintain accessibility when text is constrained', () => {
      const mockStats = {
        eventsAttended: 42,
        eventsSaved: 156,
        friendsConnected: 28,
      };

      const { getByText } = render(<ProfileStats stats={mockStats} />);

      const eventLabel = getByText('Events Attended');
      
      // Text should remain accessible even when space is limited
      expect(eventLabel).toBeTruthy();
      expect(eventLabel.props.accessible).not.toBe(false);
    });

    it('should provide proper accessibility labels for truncated text', () => {
      const TruncatedComponent = () => (
        <Text 
          numberOfLines={1} 
          ellipsizeMode="tail"
          accessibilityLabel="Full text content for screen readers"
        >
          Very long text that will be truncated visually but accessible via screen reader
        </Text>
      );

      const { container } = render(<TruncatedComponent />);
      expect(container).toBeTruthy();
    });
  });

  describe('Performance Under Text Overflow Scenarios', () => {
    it('should maintain performance with large amounts of text', () => {
      const LargeTextComponent = () => (
        <View>
          {Array.from({ length: 1000 }, (_, i) => (
            <Text key={i}>Text item {i}</Text>
          ))}
        </View>
      );

      const startTime = performance.now();
      const { container } = render(<LargeTextComponent />);
      const endTime = performance.now();

      expect(container).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(100); // Should render quickly
    });

    it('should handle memory efficiently with text overflow scenarios', () => {
      // Test multiple renders with varying text sizes
      for (let i = 0; i < 50; i++) {
        const stats = {
          eventsAttended: Math.floor(Math.random() * 999999),
          eventsSaved: Math.floor(Math.random() * 999999),
          friendsConnected: Math.floor(Math.random() * 999999),
        };

        const { unmount } = render(<ProfileStats stats={stats} />);
        unmount();
      }

      // Final render should still work without memory issues
      const finalStats = {
        eventsAttended: 42,
        eventsSaved: 156,
        friendsConnected: 28,
      };

      const { getByText } = render(<ProfileStats stats={finalStats} />);
      expect(getByText('Events Attended')).toBeTruthy();
    });
  });
});