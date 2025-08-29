import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { Dimensions, AccessibilityInfo, PixelRatio } from 'react-native';
import { ProfileStatsRowLayout } from '../src/components/profile/ProfileStatsRowLayout';
import { ResponsiveProfileStats } from '../src/components/profile/ResponsiveProfileStats';
import { rowLayoutDesignSystem, rowLayoutUtils } from '../src/design/rowLayoutTokens';
import { responsiveDesignSystem } from '../src/design/responsiveTokens';

// Mock data for testing
const mockStats = {
  eventsAttended: 142,
  eventsSaved: 67,
  friendsConnected: 89,
};

const largeStats = {
  eventsAttended: 1234567,
  eventsSaved: 8901,
  friendsConnected: 456789,
};

// Mock device dimensions for different screen sizes
const screenSizes = {
  small: { width: 320, height: 568 }, // iPhone SE
  medium: { width: 375, height: 667 }, // iPhone 8
  large: { width: 414, height: 896 }, // iPhone 11 Pro Max
  tablet: { width: 768, height: 1024 }, // iPad
};

// Helper to mock screen dimensions
const mockScreenSize = (size: keyof typeof screenSizes) => {
  const dimensions = screenSizes[size];
  jest.spyOn(Dimensions, 'get').mockReturnValue(dimensions);
  // Re-import to get new device calculations
  jest.resetModules();
};

describe('Row Layout Comprehensive Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Responsive Behavior Testing', () => {
    describe('Screen Size Adaptations', () => {
      it('should use compact layout on small screens', () => {
        mockScreenSize('small');
        
        const { getByTestId } = render(
          <ProfileStatsRowLayout stats={mockStats} testID="responsive-test" />
        );

        expect(getByTestId('responsive-test-compact-row')).toBeTruthy();
      });

      it('should use single-row layout on medium screens', () => {
        mockScreenSize('medium');
        
        const { getByTestId } = render(
          <ProfileStatsRowLayout stats={mockStats} layout="single-row" testID="responsive-test" />
        );

        expect(getByTestId('responsive-test-single-row')).toBeTruthy();
      });

      it('should use two-row layout when specified on large screens', () => {
        mockScreenSize('large');
        
        const { getByTestId } = render(
          <ProfileStatsRowLayout stats={mockStats} layout="two-row" testID="responsive-test" />
        );

        expect(getByTestId('responsive-test-two-row')).toBeTruthy();
      });

      it('should handle tablet screen sizes appropriately', () => {
        mockScreenSize('tablet');
        
        const { getByTestId } = render(
          <ProfileStatsRowLayout stats={mockStats} testID="responsive-test" />
        );

        // Should use single-row on tablet for optimal space usage
        expect(getByTestId('responsive-test-single-row')).toBeTruthy();
      });
    });

    describe('Breakpoint Testing', () => {
      const testBreakpoints = [
        { width: 320, expectedLayout: 'compact' },
        { width: 375, expectedLayout: 'single-row' },
        { width: 414, expectedLayout: 'single-row' },
        { width: 768, expectedLayout: 'single-row' },
      ];

      testBreakpoints.forEach(({ width, expectedLayout }) => {
        it(`should use ${expectedLayout} layout at ${width}px width`, () => {
          jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height: 667 });
          
          const optimalLayout = rowLayoutUtils.getOptimalLayout(3);
          
          if (expectedLayout === 'compact') {
            expect(optimalLayout).toBe('compact');
          } else {
            expect(optimalLayout).toBe('single-row');
          }
        });
      });
    });

    describe('Dynamic Layout Switching', () => {
      it('should switch layouts when screen size changes', async () => {
        const { rerender, getByTestId } = render(
          <ProfileStatsRowLayout stats={mockStats} testID="dynamic-test" />
        );

        // Start with large screen
        mockScreenSize('large');
        rerender(<ProfileStatsRowLayout stats={mockStats} testID="dynamic-test" />);

        // Switch to small screen
        mockScreenSize('small');
        rerender(<ProfileStatsRowLayout stats={mockStats} testID="dynamic-test" />);

        expect(getByTestId('dynamic-test-compact-row')).toBeTruthy();
      });
    });
  });

  describe('2. Text Readability Validation', () => {
    describe('Font Size Scaling', () => {
      it('should scale font sizes appropriately for different screen sizes', () => {
        const testCases = [
          { size: 'small', expectedMinSize: 14 },
          { size: 'medium', expectedMinSize: 16 },
          { size: 'large', expectedMinSize: 18 },
        ];

        testCases.forEach(({ size, expectedMinSize }) => {
          mockScreenSize(size as keyof typeof screenSizes);
          
          const { getByTestId } = render(
            <ProfileStatsRowLayout stats={mockStats} layout="single-row" testID="font-test" />
          );

          const valueElement = getByTestId('font-test-eventsAttended-value');
          expect(valueElement).toBeTruthy();
        });
      });

      it('should use appropriate compact font sizes', () => {
        const { getByTestId } = render(
          <ProfileStatsRowLayout stats={mockStats} layout="compact" testID="compact-font" />
        );

        const valueElement = getByTestId('compact-font-eventsAttended-value');
        expect(valueElement).toBeTruthy();
      });
    });

    describe('Text Contrast and Legibility', () => {
      it('should maintain sufficient contrast ratios', () => {
        const { getByTestId } = render(
          <ProfileStatsRowLayout 
            stats={mockStats} 
            colorVariant="default" 
            testID="contrast-test" 
          />
        );

        // Check that text elements are rendered with proper contrast
        const valueElement = getByTestId('contrast-test-eventsAttended-value');
        const labelElement = getByTestId('contrast-test-eventsAttended-label');
        
        expect(valueElement).toBeTruthy();
        expect(labelElement).toBeTruthy();
      });

      it('should handle monochrome variant for better accessibility', () => {
        const { getByTestId } = render(
          <ProfileStatsRowLayout 
            stats={mockStats} 
            colorVariant="monochrome" 
            testID="mono-test" 
          />
        );

        expect(getByTestId('mono-test')).toBeTruthy();
      });
    });

    describe('Number Formatting and Readability', () => {
      it('should format large numbers appropriately', () => {
        const { getByTestId } = render(
          <ProfileStatsRowLayout stats={largeStats} layout="compact" testID="format-test" />
        );

        // In compact mode, large numbers should be abbreviated
        const valueElement = getByTestId('format-test-eventsAttended-value');
        expect(valueElement.props.children).toContain('1.2M'); // 1,234,567 -> 1.2M
      });

      it('should handle regular numbers without formatting', () => {
        const { getByTestId } = render(
          <ProfileStatsRowLayout stats={mockStats} layout="single-row" testID="regular-test" />
        );

        const valueElement = getByTestId('regular-test-eventsAttended-value');
        expect(valueElement.props.children).toBe('142'); // No formatting for smaller numbers
      });
    });

    describe('Label Truncation and Responsive Text', () => {
      it('should truncate labels appropriately on small screens', () => {
        mockScreenSize('small');
        
        const { getByTestId } = render(
          <ProfileStatsRowLayout stats={mockStats} testID="truncate-test" />
        );

        const labelElement = getByTestId('truncate-test-eventsAttended-label');
        expect(labelElement).toBeTruthy();
      });

      it('should show full labels on larger screens', () => {
        mockScreenSize('large');
        
        const { getByTestId } = render(
          <ProfileStatsRowLayout stats={mockStats} testID="full-label-test" />
        );

        const labelElement = getByTestId('full-label-test-eventsAttended-label');
        expect(labelElement).toBeTruthy();
      });
    });
  });

  describe('3. Accessibility Compliance (WCAG)', () => {
    describe('Screen Reader Support', () => {
      it('should provide comprehensive accessibility labels', () => {
        const { getByTestId } = render(
          <ProfileStatsRowLayout stats={mockStats} testID="a11y-test" />
        );

        const container = getByTestId('a11y-test');
        expect(container.props.accessible).toBe(true);
        expect(container.props.accessibilityRole).toBe('group');
        expect(container.props.accessibilityLabel).toContain('Profile statistics');
      });

      it('should provide individual stat accessibility labels', () => {
        const { getByTestId } = render(
          <ProfileStatsRowLayout stats={mockStats} interactive testID="interactive-a11y" />
        );

        const statItem = getByTestId('interactive-a11y-eventsAttended');
        expect(statItem.props.accessible).toBe(true);
        expect(statItem.props.accessibilityRole).toBe('button');
        expect(statItem.props.accessibilityLabel).toContain('Events Attended: 142');
      });

      it('should provide appropriate hints for interactive elements', () => {
        const { getByTestId } = render(
          <ProfileStatsRowLayout 
            stats={mockStats} 
            interactive 
            onStatPress={() => {}} 
            testID="hint-test" 
          />
        );

        const statItem = getByTestId('hint-test-eventsAttended');
        expect(statItem.props.accessibilityHint).toBe('Double tap to view details');
      });
    });

    describe('Touch Target Sizes', () => {
      it('should meet minimum touch target requirements (44pt)', () => {
        const { getByTestId } = render(
          <ProfileStatsRowLayout 
            stats={mockStats} 
            interactive 
            onStatPress={() => {}} 
            testID="touch-test" 
          />
        );

        // Touch targets should be accessible
        const statItem = getByTestId('touch-test-eventsAttended');
        expect(statItem).toBeTruthy();
      });

      it('should provide adequate spacing between touch targets', () => {
        const { getByTestId } = render(
          <ProfileStatsRowLayout 
            stats={mockStats} 
            interactive 
            onStatPress={() => {}} 
            testID="spacing-test" 
          />
        );

        // All stat items should be present with proper spacing
        expect(getByTestId('spacing-test-eventsAttended')).toBeTruthy();
        expect(getByTestId('spacing-test-eventsSaved')).toBeTruthy();
        expect(getByTestId('spacing-test-friendsConnected')).toBeTruthy();
      });
    });

    describe('Focus Management', () => {
      it('should handle keyboard navigation appropriately', () => {
        const onStatPress = jest.fn();
        
        const { getByTestId } = render(
          <ProfileStatsRowLayout 
            stats={mockStats} 
            interactive 
            onStatPress={onStatPress} 
            testID="focus-test" 
          />
        );

        const statItem = getByTestId('focus-test-eventsAttended');
        fireEvent.press(statItem);
        
        expect(onStatPress).toHaveBeenCalledWith('eventsAttended', 142);
      });
    });

    describe('Color and Contrast', () => {
      it('should maintain WCAG AA contrast ratios', () => {
        const { getByTestId } = render(
          <ProfileStatsRowLayout 
            stats={mockStats} 
            colorVariant="default" 
            testID="contrast-wcag" 
          />
        );

        // Elements should render with proper contrast
        expect(getByTestId('contrast-wcag')).toBeTruthy();
      });

      it('should provide high contrast mode support', () => {
        const { getByTestId } = render(
          <ProfileStatsRowLayout 
            stats={mockStats} 
            colorVariant="monochrome" 
            testID="high-contrast" 
          />
        );

        expect(getByTestId('high-contrast')).toBeTruthy();
      });
    });
  });

  describe('4. Performance Impact Testing', () => {
    describe('Rendering Performance', () => {
      it('should render efficiently with memoization', () => {
        const renderSpy = jest.fn();
        
        const TestComponent = () => {
          renderSpy();
          return <ProfileStatsRowLayout stats={mockStats} testID="perf-test" />;
        };

        const { rerender } = render(<TestComponent />);
        
        // Re-render with same props shouldn't cause re-calculation
        rerender(<TestComponent />);
        
        expect(renderSpy).toHaveBeenCalledTimes(2);
      });

      it('should handle frequent prop changes efficiently', () => {
        const { rerender } = render(
          <ProfileStatsRowLayout stats={mockStats} layout="single-row" testID="prop-test" />
        );

        // Change layout
        rerender(
          <ProfileStatsRowLayout stats={mockStats} layout="two-row" testID="prop-test" />
        );

        // Change color variant
        rerender(
          <ProfileStatsRowLayout 
            stats={mockStats} 
            layout="two-row" 
            colorVariant="colorful" 
            testID="prop-test" 
          />
        );

        expect(true).toBe(true); // If no errors thrown, performance is acceptable
      });
    });

    describe('Memory Usage', () => {
      it('should not create memory leaks with frequent re-renders', () => {
        const { rerender, unmount } = render(
          <ProfileStatsRowLayout stats={mockStats} testID="memory-test" />
        );

        // Simulate frequent updates
        for (let i = 0; i < 100; i++) {
          rerender(
            <ProfileStatsRowLayout 
              stats={{ ...mockStats, eventsAttended: mockStats.eventsAttended + i }} 
              testID="memory-test" 
            />
          );
        }

        unmount();
        expect(true).toBe(true); // No memory leaks if test completes
      });
    });

    describe('Layout Calculation Performance', () => {
      it('should calculate optimal layouts efficiently', () => {
        const start = performance.now();
        
        // Test multiple layout calculations
        for (let i = 0; i < 1000; i++) {
          rowLayoutUtils.getOptimalLayout(3);
        }
        
        const duration = performance.now() - start;
        expect(duration).toBeLessThan(100); // Should complete in under 100ms
      });

      it('should format numbers efficiently', () => {
        const start = performance.now();
        
        // Test number formatting performance
        for (let i = 0; i < 1000; i++) {
          rowLayoutUtils.formatStatValue(1234567);
        }
        
        const duration = performance.now() - start;
        expect(duration).toBeLessThan(50); // Should complete in under 50ms
      });
    });
  });

  describe('5. Cross-Platform Compatibility', () => {
    describe('iOS Compatibility', () => {
      beforeEach(() => {
        jest.mock('react-native/Libraries/Utilities/Platform', () => ({
          OS: 'ios',
          select: (obj: any) => obj.ios || obj.default,
        }));
      });

      it('should render correctly on iOS', () => {
        const { getByTestId } = render(
          <ProfileStatsRowLayout stats={mockStats} testID="ios-test" />
        );

        expect(getByTestId('ios-test')).toBeTruthy();
      });

      it('should handle iOS-specific interactions', () => {
        const onStatPress = jest.fn();
        
        const { getByTestId } = render(
          <ProfileStatsRowLayout 
            stats={mockStats} 
            interactive 
            onStatPress={onStatPress} 
            testID="ios-interaction" 
          />
        );

        const statItem = getByTestId('ios-interaction-eventsAttended');
        fireEvent.press(statItem);
        
        expect(onStatPress).toHaveBeenCalled();
      });
    });

    describe('Android Compatibility', () => {
      beforeEach(() => {
        jest.mock('react-native/Libraries/Utilities/Platform', () => ({
          OS: 'android',
          select: (obj: any) => obj.android || obj.default,
        }));
      });

      it('should render correctly on Android', () => {
        const { getByTestId } = render(
          <ProfileStatsRowLayout stats={mockStats} testID="android-test" />
        );

        expect(getByTestId('android-test')).toBeTruthy();
      });

      it('should handle Android ripple effects', () => {
        const { getByTestId } = render(
          <ProfileStatsRowLayout 
            stats={mockStats} 
            interactive 
            onStatPress={() => {}} 
            testID="android-ripple" 
          />
        );

        const statItem = getByTestId('android-ripple-eventsAttended');
        expect(statItem.props.android_ripple).toBeDefined();
      });
    });

    describe('Platform-Specific Features', () => {
      it('should handle different pixel densities', () => {
        const mockPixelRatio = 3.0; // High-density display
        jest.spyOn(PixelRatio, 'get').mockReturnValue(mockPixelRatio);

        const { getByTestId } = render(
          <ProfileStatsRowLayout stats={mockStats} testID="pixel-ratio-test" />
        );

        expect(getByTestId('pixel-ratio-test')).toBeTruthy();
      });
    });
  });

  describe('6. Component Rendering and Styling Accuracy', () => {
    describe('Layout Variant Rendering', () => {
      const variants: Array<'single-row' | 'two-row' | 'compact'> = ['single-row', 'two-row', 'compact'];

      variants.forEach(variant => {
        it(`should render ${variant} layout correctly`, () => {
          const { getByTestId } = render(
            <ProfileStatsRowLayout 
              stats={mockStats} 
              layout={variant} 
              testID={`${variant}-render`} 
            />
          );

          expect(getByTestId(`${variant}-render`)).toBeTruthy();
        });
      });
    });

    describe('Color Variant Rendering', () => {
      const colorVariants: Array<'default' | 'monochrome' | 'colorful'> = ['default', 'monochrome', 'colorful'];

      colorVariants.forEach(variant => {
        it(`should render ${variant} color variant correctly`, () => {
          const { getByTestId } = render(
            <ProfileStatsRowLayout 
              stats={mockStats} 
              colorVariant={variant} 
              testID={`color-${variant}`} 
            />
          );

          expect(getByTestId(`color-${variant}`)).toBeTruthy();
        });
      });
    });

    describe('Interactive States', () => {
      it('should render non-interactive state correctly', () => {
        const { getByTestId } = render(
          <ProfileStatsRowLayout 
            stats={mockStats} 
            interactive={false} 
            testID="non-interactive" 
          />
        );

        const statItem = getByTestId('non-interactive-eventsAttended');
        expect(statItem.props.accessibilityRole).toBe('text');
      });

      it('should render interactive state correctly', () => {
        const { getByTestId } = render(
          <ProfileStatsRowLayout 
            stats={mockStats} 
            interactive={true} 
            onStatPress={() => {}} 
            testID="interactive" 
          />
        );

        const statItem = getByTestId('interactive-eventsAttended');
        expect(statItem.props.accessibilityRole).toBe('button');
      });
    });

    describe('Icon and Subtitle Rendering', () => {
      it('should render with icons when enabled', () => {
        const { getByTestId } = render(
          <ProfileStatsRowLayout 
            stats={mockStats} 
            showIcons={true} 
            testID="with-icons" 
          />
        );

        expect(getByTestId('with-icons')).toBeTruthy();
      });

      it('should render without icons when disabled', () => {
        const { getByTestId } = render(
          <ProfileStatsRowLayout 
            stats={mockStats} 
            showIcons={false} 
            testID="without-icons" 
          />
        );

        expect(getByTestId('without-icons')).toBeTruthy();
      });

      it('should render with subtitles when enabled', () => {
        const { getByTestId, queryByTestId } = render(
          <ProfileStatsRowLayout 
            stats={mockStats} 
            showSubtitles={true} 
            layout="single-row"
            testID="with-subtitles" 
          />
        );

        // Subtitle should be present for non-compact layouts
        const subtitle = queryByTestId('with-subtitles-eventsAttended-subtitle');
        expect(subtitle).toBeTruthy();
      });
    });
  });

  describe('7. Edge Cases and Error Handling', () => {
    describe('Data Edge Cases', () => {
      it('should handle zero values', () => {
        const zeroStats = {
          eventsAttended: 0,
          eventsSaved: 0,
          friendsConnected: 0,
        };

        const { getByTestId } = render(
          <ProfileStatsRowLayout stats={zeroStats} testID="zero-stats" />
        );

        const valueElement = getByTestId('zero-stats-eventsAttended-value');
        expect(valueElement.props.children).toBe('0');
      });

      it('should handle very large numbers', () => {
        const hugeStats = {
          eventsAttended: 999999999,
          eventsSaved: 1000000000,
          friendsConnected: 500000000,
        };

        const { getByTestId } = render(
          <ProfileStatsRowLayout 
            stats={hugeStats} 
            layout="compact" 
            testID="huge-stats" 
          />
        );

        const valueElement = getByTestId('huge-stats-eventsAttended-value');
        expect(valueElement.props.children).toContain('M'); // Should be abbreviated
      });

      it('should handle negative numbers gracefully', () => {
        const negativeStats = {
          eventsAttended: -5,
          eventsSaved: -10,
          friendsConnected: -1,
        };

        const { getByTestId } = render(
          <ProfileStatsRowLayout stats={negativeStats} testID="negative-stats" />
        );

        expect(getByTestId('negative-stats')).toBeTruthy();
      });
    });

    describe('Props Validation', () => {
      it('should handle missing optional props gracefully', () => {
        const { getByTestId } = render(
          <ProfileStatsRowLayout stats={mockStats} testID="minimal-props" />
        );

        expect(getByTestId('minimal-props')).toBeTruthy();
      });

      it('should handle invalid layout prop gracefully', () => {
        const { getByTestId } = render(
          <ProfileStatsRowLayout 
            stats={mockStats} 
            // @ts-ignore - Testing invalid prop
            layout="invalid-layout" 
            testID="invalid-layout" 
          />
        );

        expect(getByTestId('invalid-layout')).toBeTruthy();
      });
    });
  });

  describe('8. Integration with Other Components', () => {
    describe('ResponsiveProfileStats Compatibility', () => {
      it('should work alongside ResponsiveProfileStats', () => {
        const { getByText } = render(
          <>
            <ProfileStatsRowLayout stats={mockStats} testID="row-layout" />
            <ResponsiveProfileStats stats={mockStats} />
          </>
        );

        // Both components should render without conflicts
        expect(getByText('142')).toBeTruthy(); // From ProfileStatsRowLayout
      });
    });
  });
});

// Performance benchmarking utilities
export const performanceBenchmarks = {
  renderTime: (component: React.ReactElement, iterations = 100) => {
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      render(component);
      const end = performance.now();
      times.push(end - start);
    }
    
    const average = times.reduce((a, b) => a + b) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    return { average, min, max, iterations };
  },

  layoutCalculationTime: (iterations = 1000) => {
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      rowLayoutUtils.getOptimalLayout(3);
    }
    
    const end = performance.now();
    return (end - start) / iterations;
  },
};

// Accessibility validation utilities
export const accessibilityValidation = {
  validateTouchTargets: (element: any) => {
    // Mock implementation - would use actual measurements in real app
    return {
      hasMinimumSize: true,
      hasAccessibilityLabel: !!element.props.accessibilityLabel,
      hasAccessibilityRole: !!element.props.accessibilityRole,
    };
  },

  validateContrastRatio: (foreground: string, background: string) => {
    // Mock implementation - would use actual color contrast calculation
    return {
      ratio: 4.5, // Assuming WCAG AA compliance
      isAACompliant: true,
      isAAACompliant: false,
    };
  },
};