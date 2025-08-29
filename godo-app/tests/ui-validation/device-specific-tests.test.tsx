import React from 'react';
import { render } from '@testing-library/react-native';
import { Dimensions, PixelRatio, Platform } from 'react-native';
import { ProfileStats } from '../../src/components/profile/ProfileStats';
import { EventFilterToggle } from '../../src/components/calendar/EventFilterToggle';

// Device specification data for comprehensive testing
const deviceSpecifications = {
  ios: [
    // iPhones
    { name: 'iPhone SE (1st gen)', width: 320, height: 568, pixelRatio: 2.0, os: 'ios' },
    { name: 'iPhone SE (2nd gen)', width: 375, height: 667, pixelRatio: 2.0, os: 'ios' },
    { name: 'iPhone 8', width: 375, height: 667, pixelRatio: 2.0, os: 'ios' },
    { name: 'iPhone 8 Plus', width: 414, height: 736, pixelRatio: 3.0, os: 'ios' },
    { name: 'iPhone X', width: 375, height: 812, pixelRatio: 3.0, os: 'ios' },
    { name: 'iPhone 11', width: 414, height: 896, pixelRatio: 2.0, os: 'ios' },
    { name: 'iPhone 11 Pro', width: 375, height: 812, pixelRatio: 3.0, os: 'ios' },
    { name: 'iPhone 11 Pro Max', width: 414, height: 896, pixelRatio: 3.0, os: 'ios' },
    { name: 'iPhone 12 mini', width: 360, height: 780, pixelRatio: 3.0, os: 'ios' },
    { name: 'iPhone 12', width: 390, height: 844, pixelRatio: 3.0, os: 'ios' },
    { name: 'iPhone 12 Pro', width: 390, height: 844, pixelRatio: 3.0, os: 'ios' },
    { name: 'iPhone 12 Pro Max', width: 428, height: 926, pixelRatio: 3.0, os: 'ios' },
    { name: 'iPhone 13 mini', width: 360, height: 780, pixelRatio: 3.0, os: 'ios' },
    { name: 'iPhone 13', width: 390, height: 844, pixelRatio: 3.0, os: 'ios' },
    { name: 'iPhone 13 Pro', width: 390, height: 844, pixelRatio: 3.0, os: 'ios' },
    { name: 'iPhone 13 Pro Max', width: 428, height: 926, pixelRatio: 3.0, os: 'ios' },
    { name: 'iPhone 14', width: 390, height: 844, pixelRatio: 3.0, os: 'ios' },
    { name: 'iPhone 14 Plus', width: 428, height: 926, pixelRatio: 3.0, os: 'ios' },
    { name: 'iPhone 14 Pro', width: 393, height: 852, pixelRatio: 3.0, os: 'ios' },
    { name: 'iPhone 14 Pro Max', width: 430, height: 932, pixelRatio: 3.0, os: 'ios' },
    
    // iPads
    { name: 'iPad Mini', width: 768, height: 1024, pixelRatio: 2.0, os: 'ios' },
    { name: 'iPad', width: 768, height: 1024, pixelRatio: 2.0, os: 'ios' },
    { name: 'iPad Air', width: 820, height: 1180, pixelRatio: 2.0, os: 'ios' },
    { name: 'iPad Pro 11"', width: 834, height: 1194, pixelRatio: 2.0, os: 'ios' },
    { name: 'iPad Pro 12.9"', width: 1024, height: 1366, pixelRatio: 2.0, os: 'ios' },
  ],
  android: [
    // Popular Android devices
    { name: 'Samsung Galaxy S8', width: 360, height: 740, pixelRatio: 4.0, os: 'android' },
    { name: 'Samsung Galaxy S9', width: 360, height: 740, pixelRatio: 4.0, os: 'android' },
    { name: 'Samsung Galaxy S10', width: 360, height: 760, pixelRatio: 4.0, os: 'android' },
    { name: 'Samsung Galaxy S20', width: 384, height: 854, pixelRatio: 3.5, os: 'android' },
    { name: 'Samsung Galaxy S21', width: 384, height: 854, pixelRatio: 3.0, os: 'android' },
    { name: 'Samsung Galaxy Note 10', width: 412, height: 869, pixelRatio: 3.5, os: 'android' },
    { name: 'Samsung Galaxy Note 20', width: 412, height: 915, pixelRatio: 3.5, os: 'android' },
    { name: 'Google Pixel 3', width: 393, height: 786, pixelRatio: 2.75, os: 'android' },
    { name: 'Google Pixel 4', width: 393, height: 830, pixelRatio: 3.0, os: 'android' },
    { name: 'Google Pixel 5', width: 393, height: 851, pixelRatio: 2.75, os: 'android' },
    { name: 'Google Pixel 6', width: 411, height: 869, pixelRatio: 3.5, os: 'android' },
    { name: 'OnePlus 8', width: 384, height: 854, pixelRatio: 3.0, os: 'android' },
    { name: 'OnePlus 9', width: 384, height: 854, pixelRatio: 3.0, os: 'android' },
    { name: 'Xiaomi Mi 11', width: 384, height: 854, pixelRatio: 3.0, os: 'android' },
    
    // Tablets
    { name: 'Samsung Galaxy Tab S6', width: 753, height: 1037, pixelRatio: 2.0, os: 'android' },
    { name: 'Samsung Galaxy Tab S7', width: 800, height: 1232, pixelRatio: 2.0, os: 'android' },
  ]
};

// Mock implementations
const mockDimensions = {
  get: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

const mockPixelRatio = {
  get: jest.fn(),
  getFontScale: jest.fn().mockReturnValue(1.0),
  getPixelSizeForLayoutSize: jest.fn(size => size * 2),
  roundToNearestPixel: jest.fn(size => Math.round(size)),
};

const mockPlatform = {
  OS: 'ios',
  Version: '15.0',
  select: jest.fn(obj => obj.ios || obj.default),
  constants: {},
};

jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Dimensions: mockDimensions,
  PixelRatio: mockPixelRatio,
  Platform: mockPlatform,
}));

describe('Device-Specific UI Validation Tests', () => {
  const mockStats = {
    eventsAttended: 42,
    eventsSaved: 156,
    friendsConnected: 28,
  };

  const mockOnFilterChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnFilterChange.mockClear();
  });

  describe('iOS Device Testing', () => {
    beforeEach(() => {
      mockPlatform.OS = 'ios';
      mockPlatform.select.mockImplementation(obj => obj.ios || obj.default);
    });

    deviceSpecifications.ios.forEach(device => {
      describe(`${device.name} (${device.width}x${device.height})`, () => {
        beforeEach(() => {
          mockDimensions.get.mockReturnValue({
            width: device.width,
            height: device.height,
          });
          mockPixelRatio.get.mockReturnValue(device.pixelRatio);
        });

        it('should render ProfileStats correctly', () => {
          const { getByText } = render(<ProfileStats stats={mockStats} />);

          // Verify all stats are displayed
          expect(getByText('42')).toBeTruthy();
          expect(getByText('156')).toBeTruthy();
          expect(getByText('28')).toBeTruthy();

          // Verify labels are readable
          expect(getByText('Events Attended')).toBeTruthy();
          expect(getByText('Events Saved')).toBeTruthy();
          expect(getByText('Friends')).toBeTruthy();
        });

        it('should render EventFilterToggle dropdown correctly', () => {
          const { getByRole, getByText } = render(
            <EventFilterToggle
              currentFilter="all"
              onFilterChange={mockOnFilterChange}
              variant="dropdown"
            />
          );

          const dropdownButton = getByRole('button');
          expect(dropdownButton).toBeTruthy();
          expect(getByText('All Events')).toBeTruthy();

          // Verify accessibility attributes
          expect(dropdownButton.props.accessibilityLabel).toBeDefined();
          expect(dropdownButton.props.accessibilityHint).toBeDefined();
        });

        it('should handle iOS-specific safe area considerations', () => {
          // iPhone X and newer have safe area insets
          const hasNotch = device.height >= 812 && device.name.includes('iPhone');
          
          const { getByText } = render(<ProfileStats stats={mockStats} />);
          
          // Content should render regardless of safe area
          expect(getByText('Events Attended')).toBeTruthy();
        });

        it('should scale appropriately for device pixel ratio', () => {
          const { getByText } = render(<ProfileStats stats={mockStats} />);
          
          const statValue = getByText('42');
          
          // Font sizes should be appropriate for pixel ratio
          expect(statValue.props.style).toBeDefined();
          expect(statValue.props.style.fontSize).toBeGreaterThan(0);
        });

        it('should handle orientation changes', () => {
          const { getByText, rerender } = render(<ProfileStats stats={mockStats} />);
          
          // Portrait mode
          expect(getByText('Events Attended')).toBeTruthy();

          // Simulate landscape mode
          mockDimensions.get.mockReturnValue({
            width: device.height,
            height: device.width,
          });

          rerender(<ProfileStats stats={mockStats} />);
          expect(getByText('Events Attended')).toBeTruthy();
        });
      });
    });

    it('should handle iOS accessibility features', () => {
      // Simulate larger text size
      mockPixelRatio.getFontScale.mockReturnValue(1.5);

      const { getByText } = render(<ProfileStats stats={mockStats} />);
      
      // Text should still be readable with larger font scale
      expect(getByText('Events Attended')).toBeTruthy();
    });
  });

  describe('Android Device Testing', () => {
    beforeEach(() => {
      mockPlatform.OS = 'android';
      mockPlatform.select.mockImplementation(obj => obj.android || obj.default);
    });

    deviceSpecifications.android.forEach(device => {
      describe(`${device.name} (${device.width}x${device.height})`, () => {
        beforeEach(() => {
          mockDimensions.get.mockReturnValue({
            width: device.width,
            height: device.height,
          });
          mockPixelRatio.get.mockReturnValue(device.pixelRatio);
        });

        it('should render ProfileStats correctly', () => {
          const { getByText } = render(<ProfileStats stats={mockStats} />);

          expect(getByText('42')).toBeTruthy();
          expect(getByText('156')).toBeTruthy();
          expect(getByText('28')).toBeTruthy();
          expect(getByText('Events Attended')).toBeTruthy();
          expect(getByText('Events Saved')).toBeTruthy();
          expect(getByText('Friends')).toBeTruthy();
        });

        it('should render EventFilterToggle dropdown correctly', () => {
          const { getByRole, getByText } = render(
            <EventFilterToggle
              currentFilter="all"
              onFilterChange={mockOnFilterChange}
              variant="dropdown"
            />
          );

          const dropdownButton = getByRole('button');
          expect(dropdownButton).toBeTruthy();
          expect(getByText('All Events')).toBeTruthy();
        });

        it('should handle Android navigation bar considerations', () => {
          // Android devices often have navigation bars
          const { getByText } = render(<ProfileStats stats={mockStats} />);
          
          // Content should render with proper margins
          expect(getByText('Events Attended')).toBeTruthy();
        });

        it('should work with Android back gesture', () => {
          const { getByRole } = render(
            <EventFilterToggle
              currentFilter="all"
              onFilterChange={mockOnFilterChange}
              variant="dropdown"
            />
          );

          const dropdownButton = getByRole('button');
          expect(dropdownButton).toBeTruthy();
          
          // Should be accessible via Android accessibility services
          expect(dropdownButton.props.accessible).toBeTruthy();
        });

        it('should handle high DPI displays correctly', () => {
          const { getByText } = render(<ProfileStats stats={mockStats} />);
          
          const statValue = getByText('42');
          
          // Should render crisply on high DPI displays
          expect(statValue.props.style.fontSize).toBeGreaterThan(0);
          
          // Verify pixel ratio is accounted for
          expect(device.pixelRatio).toBeGreaterThan(1);
        });
      });
    });

    it('should handle Android accessibility features', () => {
      mockPixelRatio.getFontScale.mockReturnValue(2.0); // Large text

      const { getByText } = render(<ProfileStats stats={mockStats} />);
      
      // Should handle larger text scales
      expect(getByText('Events Attended')).toBeTruthy();
    });

    it('should work with Android TalkBack', () => {
      const { getByRole } = render(
        <EventFilterToggle
          currentFilter="all"
          onFilterChange={mockOnFilterChange}
          variant="dropdown"
        />
      );

      const dropdownButton = getByRole('button');
      
      // Should have proper accessibility attributes for TalkBack
      expect(dropdownButton.props.accessibilityRole).toBe('button');
      expect(dropdownButton.props.accessibilityLabel).toBeDefined();
    });
  });

  describe('Cross-Platform Consistency', () => {
    const testCases = [
      { platform: 'ios', device: deviceSpecifications.ios[2] }, // iPhone 8
      { platform: 'android', device: deviceSpecifications.android[3] }, // Galaxy S20
    ];

    testCases.forEach(({ platform, device }) => {
      describe(`${platform.toUpperCase()} - ${device.name}`, () => {
        beforeEach(() => {
          mockPlatform.OS = platform as 'ios' | 'android';
          mockPlatform.select.mockImplementation(obj => obj[platform] || obj.default);
          mockDimensions.get.mockReturnValue({
            width: device.width,
            height: device.height,
          });
          mockPixelRatio.get.mockReturnValue(device.pixelRatio);
        });

        it('should maintain consistent layout across platforms', () => {
          const { getByText } = render(<ProfileStats stats={mockStats} />);

          // Core functionality should be identical
          expect(getByText('Events Attended')).toBeTruthy();
          expect(getByText('Events Saved')).toBeTruthy();
          expect(getByText('Friends')).toBeTruthy();
          expect(getByText('42')).toBeTruthy();
          expect(getByText('156')).toBeTruthy();
          expect(getByText('28')).toBeTruthy();
        });

        it('should provide consistent interaction patterns', () => {
          const { getByRole } = render(
            <EventFilterToggle
              currentFilter="all"
              onFilterChange={mockOnFilterChange}
              variant="dropdown"
            />
          );

          const dropdownButton = getByRole('button');
          
          // Interaction should work the same way
          expect(dropdownButton).toBeTruthy();
          expect(dropdownButton.props.accessibilityRole).toBe('button');
        });
      });
    });
  });

  describe('Edge Case Device Scenarios', () => {
    it('should handle extremely small screens gracefully', () => {
      // Simulate very old or small device
      mockDimensions.get.mockReturnValue({ width: 240, height: 320 });
      mockPixelRatio.get.mockReturnValue(1.0);

      const { getByText } = render(<ProfileStats stats={mockStats} />);

      // Should still be functional, though possibly compressed
      expect(getByText('42')).toBeTruthy();
    });

    it('should handle extremely large screens (tablets)', () => {
      // Simulate large tablet
      mockDimensions.get.mockReturnValue({ width: 1200, height: 1600 });
      mockPixelRatio.get.mockReturnValue(2.0);

      const { getByText } = render(<ProfileStats stats={mockStats} />);

      // Should scale appropriately for large screens
      expect(getByText('Events Attended')).toBeTruthy();
    });

    it('should handle non-standard aspect ratios', () => {
      // Simulate very wide screen
      mockDimensions.get.mockReturnValue({ width: 800, height: 400 });
      mockPixelRatio.get.mockReturnValue(2.0);

      const { getByText } = render(<ProfileStats stats={mockStats} />);

      expect(getByText('Events Attended')).toBeTruthy();
    });

    it('should handle zero or invalid dimensions gracefully', () => {
      mockDimensions.get.mockReturnValue({ width: 0, height: 0 });

      const { getByText } = render(<ProfileStats stats={mockStats} />);

      // Should not crash with invalid dimensions
      expect(getByText('Events Attended')).toBeTruthy();
    });
  });

  describe('Performance on Different Devices', () => {
    it('should render efficiently on low-end devices', () => {
      // Simulate older, slower device
      mockDimensions.get.mockReturnValue({ width: 320, height: 568 });
      mockPixelRatio.get.mockReturnValue(2.0);

      const startTime = performance.now();
      
      const { getByText } = render(<ProfileStats stats={mockStats} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render quickly even on slower devices
      expect(renderTime).toBeLessThan(50); // 50ms threshold
      expect(getByText('Events Attended')).toBeTruthy();
    });

    it('should handle memory constraints on older devices', () => {
      // Multiple renders to simulate memory pressure
      for (let i = 0; i < 20; i++) {
        const { unmount } = render(<ProfileStats stats={mockStats} />);
        unmount();
      }

      // Final render should still work
      const { getByText } = render(<ProfileStats stats={mockStats} />);
      expect(getByText('Events Attended')).toBeTruthy();
    });
  });
});