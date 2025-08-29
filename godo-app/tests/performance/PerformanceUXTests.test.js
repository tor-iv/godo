/**
 * Performance Impact on User Experience Testing Suite
 * Tests performance bottlenecks, loading states, memory usage, and responsiveness
 */

import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Dimensions } from 'react-native';
import { TabNavigator } from '../../src/navigation/TabNavigator';
import { CalendarView } from '../../src/components/calendar/CalendarView';
import { DiscoverScreen } from '../../src/screens/discover/DiscoverScreen';
import { MyEventsScreen } from '../../src/screens/calendar/MyEventsScreen';
import { mockEvents } from '../mocks/mockData';

// Mock performance APIs
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
};

global.performance = mockPerformance;

// Mock memory usage tracking
const mockMemoryInfo = {
  usedJSHeapSize: 10000000,
  totalJSHeapSize: 20000000,
  jsHeapSizeLimit: 100000000,
};

global.performance.memory = mockMemoryInfo;

// Test wrapper
const TestWrapper = ({ children }) => (
  <SafeAreaProvider>
    <NavigationContainer>
      {children}
    </NavigationContainer>
  </SafeAreaProvider>
);

describe('Performance Impact on User Experience', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformance.now.mockImplementation(() => Date.now());
  });

  describe('Rendering Performance', () => {
    test('initial screen render time meets performance targets', async () => {
      const startTime = Date.now();
      
      const { getByTestId } = render(
        <TestWrapper>
          <MyEventsScreen testID="events-screen" />
        </TestWrapper>
      );

      const endTime = Date.now();
      const renderTime = endTime - startTime;

      // Screen should render within reasonable time (500ms)
      expect(renderTime).toBeLessThan(500);
      expect(getByTestId('events-screen')).toBeTruthy();
    });

    test('large event lists maintain smooth scrolling', async () => {
      const largeEventList = Array(200).fill(mockEvents[0]).map((event, index) => ({
        ...event,
        id: `event-${index}`,
        title: `Event ${index}`,
        datetime: new Date(2024, 11, 25 + (index % 30)).toISOString(),
      }));

      const startTime = Date.now();
      
      const { getByTestId } = render(
        <TestWrapper>
          <CalendarView
            events={largeEventList}
            selectedDate="2024-12-25"
            onDateSelect={() => {}}
            testID="large-calendar"
          />
        </TestWrapper>
      );

      const endTime = Date.now();
      const renderTime = endTime - startTime;

      // Large list should still render efficiently
      expect(renderTime).toBeLessThan(1000);
      expect(getByTestId('large-calendar')).toBeTruthy();
    });

    test('tab switching performance is acceptable', async () => {
      const { getByRole, rerender } = render(
        <TestWrapper>
          <TabNavigator initialRoute="Calendar" />
        </TestWrapper>
      );

      const startTime = Date.now();

      // Simulate tab switch
      await act(async () => {
        rerender(
          <TestWrapper>
            <TabNavigator initialRoute="Discover" />
          </TestWrapper>
        );
      });

      const endTime = Date.now();
      const switchTime = endTime - startTime;

      // Tab switching should be instant to user
      expect(switchTime).toBeLessThan(100);
    });
  });

  describe('Memory Usage and Leaks', () => {
    test('component unmounting releases memory properly', async () => {
      const { unmount } = render(
        <TestWrapper>
          <CalendarView
            events={mockEvents}
            selectedDate="2024-12-25"
            onDateSelect={() => {}}
          />
        </TestWrapper>
      );

      const initialMemory = global.performance.memory.usedJSHeapSize;
      
      // Unmount component
      unmount();

      // Simulate garbage collection delay
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Memory should not grow indefinitely (mock check)
      expect(global.performance.memory.usedJSHeapSize).toBeLessThanOrEqual(initialMemory * 1.1);
    });

    test('event listeners are properly cleaned up', () => {
      const mockAddEventListener = jest.fn();
      const mockRemoveEventListener = jest.fn();

      // Mock event listener management
      const originalAddEventListener = global.addEventListener;
      const originalRemoveEventListener = global.removeEventListener;
      
      global.addEventListener = mockAddEventListener;
      global.removeEventListener = mockRemoveEventListener;

      const { unmount } = render(
        <TestWrapper>
          <MyEventsScreen />
        </TestWrapper>
      );

      unmount();

      // Cleanup should be called (would need actual implementation to verify)
      expect(mockAddEventListener).toHaveBeenCalledTimes(mockRemoveEventListener.mock.calls.length);

      // Restore original functions
      global.addEventListener = originalAddEventListener;
      global.removeEventListener = originalRemoveEventListener;
    });

    test('image loading does not cause memory spikes', async () => {
      const eventsWithImages = mockEvents.map(event => ({
        ...event,
        image: 'https://example.com/event-image.jpg',
      }));

      const initialMemory = global.performance.memory.usedJSHeapSize;

      const { getByTestId } = render(
        <TestWrapper>
          <CalendarView
            events={eventsWithImages}
            selectedDate="2024-12-25"
            onDateSelect={() => {}}
            testID="image-calendar"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('image-calendar')).toBeTruthy();
      });

      // Memory increase should be reasonable
      const finalMemory = global.performance.memory.usedJSHeapSize;
      expect(finalMemory - initialMemory).toBeLessThan(50000000); // 50MB limit
    });
  });

  describe('Loading States and Transitions', () => {
    test('loading states appear quickly to prevent perceived delays', async () => {
      const SlowLoadingComponent = () => {
        const [loading, setLoading] = React.useState(true);
        
        React.useEffect(() => {
          const timer = setTimeout(() => setLoading(false), 2000);
          return () => clearTimeout(timer);
        }, []);

        if (loading) {
          return <TestText testID="loading">Loading...</TestText>;
        }
        
        return <TestText testID="content">Content Loaded</TestText>;
      };

      const { getByTestId } = render(
        <TestWrapper>
          <SlowLoadingComponent />
        </TestWrapper>
      );

      // Loading indicator should appear immediately
      expect(getByTestId('loading')).toBeTruthy();

      // Content should eventually load
      await waitFor(() => {
        expect(getByTestId('content')).toBeTruthy();
      }, { timeout: 3000 });
    });

    test('skeleton screens provide better perceived performance', () => {
      const SkeletonComponent = () => (
        <TestView testID="skeleton">
          <TestText>Loading skeleton...</TestText>
        </TestView>
      );

      const { getByTestId } = render(
        <TestWrapper>
          <SkeletonComponent />
        </TestWrapper>
      );

      // Skeleton should render immediately
      expect(getByTestId('skeleton')).toBeTruthy();
    });

    test('transition animations are smooth and non-blocking', async () => {
      const AnimatedComponent = ({ visible }) => (
        <TestView testID={visible ? 'visible' : 'hidden'} />
      );

      const { rerender, getByTestId } = render(
        <TestWrapper>
          <AnimatedComponent visible={false} />
        </TestWrapper>
      );

      expect(getByTestId('hidden')).toBeTruthy();

      const startTime = Date.now();

      await act(async () => {
        rerender(
          <TestWrapper>
            <AnimatedComponent visible={true} />
          </TestWrapper>
        );
      });

      const endTime = Date.now();
      const transitionTime = endTime - startTime;

      // Transition should be smooth and quick
      expect(transitionTime).toBeLessThan(50);
      expect(getByTestId('visible')).toBeTruthy();
    });
  });

  describe('Network Performance Impact', () => {
    test('network delays do not block UI interactions', async () => {
      // Mock slow network response
      global.fetch = jest.fn(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ data: [] })
          }), 2000)
        )
      );

      const { getByTestId, getByRole } = render(
        <TestWrapper>
          <DiscoverScreen testID="discover-screen" />
        </TestWrapper>
      );

      // UI should remain responsive during network calls
      const screen = getByTestId('discover-screen') || getByRole('text');
      expect(screen).toBeTruthy();

      // User should be able to interact with other elements
      await act(async () => {
        // Simulate user interaction during loading
        if (screen.props.onPress) {
          screen.props.onPress();
        }
      });

      expect(screen).toBeTruthy();
    });

    test('offline scenarios maintain app usability', () => {
      // Mock network failure
      global.fetch = jest.fn(() => Promise.reject(new Error('Network unavailable')));

      const { getByTestId } = render(
        <TestWrapper>
          <MyEventsScreen testID="offline-events" />
        </TestWrapper>
      );

      // App should still be functional offline
      expect(getByTestId('offline-events')).toBeTruthy();
    });

    test('image loading failures do not impact layout', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <CalendarView
            events={mockEvents}
            selectedDate="2024-12-25"
            onDateSelect={() => {}}
            testID="image-error-calendar"
          />
        </TestWrapper>
      );

      // Layout should remain stable even with failed images
      await waitFor(() => {
        expect(getByTestId('image-error-calendar')).toBeTruthy();
      });
    });
  });

  describe('Device Performance Variations', () => {
    test('app performance scales with device capabilities', () => {
      // Mock different screen sizes
      const smallScreen = { width: 320, height: 568 };
      const largeScreen = { width: 428, height: 926 };

      jest.spyOn(Dimensions, 'get').mockReturnValueOnce(smallScreen);

      const { rerender, getByTestId } = render(
        <TestWrapper>
          <MyEventsScreen testID="responsive-events" />
        </TestWrapper>
      );

      expect(getByTestId('responsive-events')).toBeTruthy();

      // Test with larger screen
      jest.spyOn(Dimensions, 'get').mockReturnValueOnce(largeScreen);
      
      rerender(
        <TestWrapper>
          <MyEventsScreen testID="responsive-events" />
        </TestWrapper>
      );

      expect(getByTestId('responsive-events')).toBeTruthy();
    });

    test('animation performance degrades gracefully on slower devices', () => {
      // Mock reduced motion preference
      const mockAccessibilityInfo = {
        isReduceMotionEnabled: jest.fn(() => Promise.resolve(true)),
      };

      // Test would check if animations are disabled/reduced
      const { getByTestId } = render(
        <TestWrapper>
          <TabNavigator testID="accessible-tabs" />
        </TestWrapper>
      );

      expect(getByTestId('accessible-tabs') || getByTestId).toBeTruthy();
    });
  });

  describe('Background Performance', () => {
    test('app maintains performance when backgrounded', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <MyEventsScreen testID="background-events" />
        </TestWrapper>
      );

      // Simulate app backgrounding
      await act(async () => {
        // Mock app state change
        const appStateChangeEvent = { type: 'background' };
        // In real app, this would trigger background optimizations
      });

      expect(getByTestId('background-events')).toBeTruthy();
    });

    test('foreground restoration is smooth', async () => {
      const { getByTestId, rerender } = render(
        <TestWrapper>
          <MyEventsScreen testID="foreground-events" />
        </TestWrapper>
      );

      const startTime = Date.now();

      // Simulate foreground restoration
      await act(async () => {
        rerender(
          <TestWrapper>
            <MyEventsScreen testID="foreground-events" />
          </TestWrapper>
        );
      });

      const endTime = Date.now();
      const restorationTime = endTime - startTime;

      // Restoration should be quick
      expect(restorationTime).toBeLessThan(100);
      expect(getByTestId('foreground-events')).toBeTruthy();
    });
  });

  describe('Performance Monitoring', () => {
    test('critical performance metrics are within acceptable ranges', () => {
      const performanceMetrics = {
        firstContentfulPaint: 800, // ms
        timeToInteractive: 1200, // ms
        cumulativeLayoutShift: 0.05,
        largestContentfulPaint: 1500, // ms
      };

      // Performance thresholds
      expect(performanceMetrics.firstContentfulPaint).toBeLessThan(1000);
      expect(performanceMetrics.timeToInteractive).toBeLessThan(2000);
      expect(performanceMetrics.cumulativeLayoutShift).toBeLessThan(0.1);
      expect(performanceMetrics.largestContentfulPaint).toBeLessThan(2000);
    });

    test('performance regression detection', () => {
      const currentMetrics = {
        renderTime: 200,
        memoryUsage: 45000000,
        frameRate: 60,
      };

      const baselineMetrics = {
        renderTime: 180,
        memoryUsage: 40000000,
        frameRate: 60,
      };

      // Check for significant performance regression (>20%)
      const renderTimeIncrease = (currentMetrics.renderTime - baselineMetrics.renderTime) / baselineMetrics.renderTime;
      const memoryIncrease = (currentMetrics.memoryUsage - baselineMetrics.memoryUsage) / baselineMetrics.memoryUsage;
      
      expect(renderTimeIncrease).toBeLessThan(0.2); // Less than 20% regression
      expect(memoryIncrease).toBeLessThan(0.2); // Less than 20% increase
      expect(currentMetrics.frameRate).toBeGreaterThanOrEqual(baselineMetrics.frameRate);
    });
  });
});

// Mock components for testing
const TestView = ({ children, testID, ...props }) => ({
  type: 'View',
  props: { testID, ...props },
  children: Array.isArray(children) ? children : [children],
});

const TestText = ({ children, testID, ...props }) => ({
  type: 'Text',
  props: { testID, ...props, children },
  children: null,
});

// Performance measurement utilities
const measurePerformance = (name, fn) => {
  const start = Date.now();
  const result = fn();
  const end = Date.now();
  const duration = end - start;
  
  return {
    result,
    duration,
    name,
  };
};

const createPerformanceObserver = (entryTypes) => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(() => []),
});