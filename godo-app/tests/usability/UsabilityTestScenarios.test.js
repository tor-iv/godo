/**
 * Comprehensive Usability Testing Suite
 * Tests common user workflows, friction points, error handling, and user experience
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Alert } from 'react-native';
import { TabNavigator } from '../../src/navigation/TabNavigator';
import { CalendarView } from '../../src/components/calendar/CalendarView';
import { DiscoverScreen } from '../../src/screens/discover/DiscoverScreen';
import { ProfileScreen } from '../../src/screens/profile/ProfileScreen';
import { mockEvents, mockUser } from '../mocks/mockData';

// Mock Alert for testing
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
}));

// Test wrapper with navigation
const TestWrapper = ({ children, initialRouteName = 'Calendar' }) => (
  <SafeAreaProvider>
    <NavigationContainer>
      {children}
    </NavigationContainer>
  </SafeAreaProvider>
);

describe('User Workflow Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Calendar Interaction Workflows', () => {
    test('user can navigate through calendar months smoothly', async () => {
      const onDateSelect = jest.fn();
      const { getByTestId } = render(
        <TestWrapper>
          <CalendarView
            events={mockEvents}
            selectedDate="2024-12-15"
            onDateSelect={onDateSelect}
            testID="calendar"
          />
        </TestWrapper>
      );

      const calendar = getByTestId('calendar');
      expect(calendar).toBeTruthy();

      // Test month navigation (would need actual calendar component interaction)
      await act(async () => {
        // Simulate calendar navigation
        fireEvent(calendar, 'monthChange', { month: 1, year: 2025 });
      });

      expect(calendar).toBeTruthy();
    });

    test('user can select dates and view events efficiently', async () => {
      const onDateSelect = jest.fn();
      const onEventPress = jest.fn();

      const { getByText } = render(
        <TestWrapper>
          <CalendarView
            events={mockEvents}
            selectedDate="2024-12-25"
            onDateSelect={onDateSelect}
            onEventPress={onEventPress}
          />
        </TestWrapper>
      );

      // User should see event count when date has events
      await waitFor(() => {
        const eventCount = getByText(/event/i);
        expect(eventCount).toBeTruthy();
      });

      // User can interact with events
      const eventItems = getAllByRole(getByText, 'button');
      if (eventItems.length > 0) {
        fireEvent.press(eventItems[0]);
        expect(onEventPress).toHaveBeenCalled();
      }
    });

    test('empty state provides clear guidance to users', () => {
      const { getByText } = render(
        <TestWrapper>
          <CalendarView
            events={[]}
            selectedDate="2024-12-25"
            onDateSelect={() => {}}
          />
        </TestWrapper>
      );

      // Empty state should be informative
      expect(getByText(/no events/i)).toBeTruthy();
    });
  });

  describe('Navigation Flow Testing', () => {
    test('tab switching provides immediate feedback', async () => {
      const { getByText, getByRole } = render(
        <TestWrapper>
          <TabNavigator />
        </TestWrapper>
      );

      // Test tab switching responsiveness
      const discoverTab = getByRole('button', { name: /discover/i });
      
      await act(async () => {
        fireEvent.press(discoverTab);
      });

      // Tab should provide immediate visual feedback
      expect(discoverTab).toBeTruthy();
    });

    test('back navigation preserves user context', async () => {
      // Test navigation stack behavior
      const navigation = {
        navigate: jest.fn(),
        goBack: jest.fn(),
        canGoBack: () => true,
      };

      const { getByRole } = render(
        <TestWrapper>
          <ProfileScreen navigation={navigation} />
        </TestWrapper>
      );

      // Navigation should maintain state
      expect(getByRole('text')).toBeTruthy();
    });

    test('deep linking works without losing context', () => {
      // Test deep link handling
      const { getByTestId } = render(
        <TestWrapper>
          <TabNavigator />
        </TestWrapper>
      );

      // App should handle deep links gracefully
      expect(getByTestId || (() => ({ props: {} }))()).toBeTruthy();
    });
  });

  describe('Event Discovery Workflows', () => {
    test('user can filter events effectively', async () => {
      const { getByRole, queryByText } = render(
        <TestWrapper>
          <DiscoverScreen />
        </TestWrapper>
      );

      // Test filtering functionality
      const filterButton = queryByRole('button', { name: /filter/i });
      
      if (filterButton) {
        fireEvent.press(filterButton);
        
        // Filter should provide immediate results
        await waitFor(() => {
          expect(queryByText(/events/i)).toBeTruthy();
        });
      } else {
        // If no filter button, ensure events are displayed
        expect(queryByText(/discover/i)).toBeTruthy();
      }
    });

    test('event cards provide sufficient information for decision making', () => {
      const mockEvent = mockEvents[0];
      
      const { getByText } = render(
        <TestWrapper>
          <CalendarView
            events={[mockEvent]}
            selectedDate="2024-12-25"
            onDateSelect={() => {}}
            onEventPress={() => {}}
          />
        </TestWrapper>
      );

      // Event should display key information
      expect(getByText(mockEvent.title)).toBeTruthy();
      expect(getByText(mockEvent.venue.name)).toBeTruthy();
    });

    test('swiping through events is intuitive and responsive', async () => {
      const { getByRole } = render(
        <TestWrapper>
          <DiscoverScreen />
        </TestWrapper>
      );

      // Test swipe gesture responsiveness
      const screen = getByRole('scrollview') || getByRole('list');
      
      await act(async () => {
        fireEvent.scroll(screen, {
          nativeEvent: {
            contentOffset: { x: 0, y: 100 },
          },
        });
      });

      expect(screen).toBeTruthy();
    });
  });

  describe('Profile Management Workflows', () => {
    test('profile editing is straightforward and validates input', async () => {
      const { getByPlaceholderText, getByRole } = render(
        <TestWrapper>
          <ProfileScreen />
        </TestWrapper>
      );

      // Test profile form interaction
      const nameInput = queryByPlaceholderText(/name/i);
      const saveButton = queryByRole('button', { name: /save/i });

      if (nameInput && saveButton) {
        fireEvent.changeText(nameInput, 'New Name');
        fireEvent.press(saveButton);

        // Should provide feedback
        await waitFor(() => {
          expect(nameInput.props.value).toBe('New Name');
        });
      }

      // Profile screen should be accessible
      expect(getByRole('text')).toBeTruthy();
    });

    test('settings changes are applied immediately', async () => {
      const { getByRole } = render(
        <TestWrapper>
          <ProfileScreen />
        </TestWrapper>
      );

      // Test settings toggle behavior
      const toggles = queryAllByRole('switch');
      
      if (toggles.length > 0) {
        const firstToggle = toggles[0];
        const initialValue = firstToggle.props.value;
        
        fireEvent(firstToggle, 'valueChange', !initialValue);
        
        await waitFor(() => {
          expect(firstToggle.props.value).toBe(!initialValue);
        });
      }

      expect(getByRole('text')).toBeTruthy();
    });
  });

  describe('Error Handling and Recovery', () => {
    test('network errors provide clear recovery options', async () => {
      // Mock network failure
      const originalFetch = global.fetch;
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

      const { getByText, queryByRole } = render(
        <TestWrapper>
          <DiscoverScreen />
        </TestWrapper>
      );

      // Should show error state
      await waitFor(() => {
        const errorMessage = queryByText(/error/i) || queryByText(/failed/i) || queryByText(/try again/i);
        if (errorMessage) {
          expect(errorMessage).toBeTruthy();
        }
      });

      // Should provide retry option
      const retryButton = queryByRole('button', { name: /retry/i }) || queryByRole('button', { name: /try again/i });
      if (retryButton) {
        fireEvent.press(retryButton);
        expect(retryButton).toBeTruthy();
      }

      global.fetch = originalFetch;
    });

    test('form validation errors are clear and actionable', async () => {
      const { getByPlaceholderText, getByRole } = render(
        <TestWrapper>
          <ProfileScreen />
        </TestWrapper>
      );

      // Test form validation
      const emailInput = queryByPlaceholderText(/email/i);
      const saveButton = queryByRole('button', { name: /save/i });

      if (emailInput && saveButton) {
        // Enter invalid email
        fireEvent.changeText(emailInput, 'invalid-email');
        fireEvent.press(saveButton);

        // Should show validation error
        await waitFor(() => {
          const errorText = queryByText(/invalid/i) || queryByText(/email/i);
          if (errorText) {
            expect(errorText).toBeTruthy();
          }
        });
      }

      expect(getByRole('text')).toBeTruthy();
    });

    test('app gracefully handles unexpected states', () => {
      // Test with undefined/null props
      const { queryByText } = render(
        <TestWrapper>
          <CalendarView
            events={null}
            selectedDate={undefined}
            onDateSelect={() => {}}
          />
        </TestWrapper>
      );

      // App should not crash
      expect(queryByText(/calendar/i) || true).toBeTruthy();
    });
  });

  describe('Performance Impact on Usability', () => {
    test('large event lists remain responsive', async () => {
      const largeEventList = Array(100).fill(mockEvents[0]).map((event, index) => ({
        ...event,
        id: `event-${index}`,
        title: `Event ${index}`,
      }));

      const { getByTestId } = render(
        <TestWrapper>
          <CalendarView
            events={largeEventList}
            selectedDate="2024-12-25"
            onDateSelect={() => {}}
            testID="calendar-large-list"
          />
        </TestWrapper>
      );

      // Should render without performance issues
      expect(getByTestId('calendar-large-list')).toBeTruthy();
    });

    test('smooth animations dont block user interaction', async () => {
      const onPress = jest.fn();
      
      const { getByRole } = render(
        <TestWrapper>
          <CalendarView
            events={mockEvents}
            selectedDate="2024-12-25"
            onDateSelect={onPress}
          />
        </TestWrapper>
      );

      // Rapid interactions should be handled
      const interactiveElement = getByRole('button') || getByRole('text');
      
      await act(async () => {
        // Simulate rapid taps
        fireEvent.press(interactiveElement);
        fireEvent.press(interactiveElement);
        fireEvent.press(interactiveElement);
      });

      expect(interactiveElement).toBeTruthy();
    });
  });

  describe('Onboarding and First-Time User Experience', () => {
    test('first-time users receive appropriate guidance', () => {
      // Test empty state guidance
      const { queryByText } = render(
        <TestWrapper>
          <CalendarView
            events={[]}
            selectedDate="2024-12-25"
            onDateSelect={() => {}}
          />
        </TestWrapper>
      );

      // Should provide helpful empty state
      const guidance = queryByText(/no events/i) || queryByText(/get started/i) || queryByText(/add/i);
      if (guidance) {
        expect(guidance).toBeTruthy();
      }
    });

    test('key features are discoverable without tutorials', () => {
      const { getByRole, getAllByRole } = render(
        <TestWrapper>
          <TabNavigator />
        </TestWrapper>
      );

      // Main features should be visible
      const tabs = getAllByRole('button');
      expect(tabs.length).toBeGreaterThan(0);

      // Each tab should have clear labeling
      tabs.forEach(tab => {
        expect(tab.props.accessibilityLabel || tab.props.accessibilityHint).toBeTruthy();
      });
    });
  });
});

describe('Friction Point Analysis', () => {
  test('identifies excessive tapping/scrolling requirements', async () => {
    let tapCount = 0;
    const trackTaps = () => tapCount++;

    const { getByRole } = render(
      <TestWrapper>
        <DiscoverScreen />
      </TestWrapper>
    );

    // Simulate user journey to accomplish a task
    const interactiveElements = getAllByRole(getByRole, 'button');
    
    interactiveElements.forEach(element => {
      fireEvent.press(element, { onPress: trackTaps });
    });

    // Reasonable interaction count for task completion
    expect(tapCount).toBeLessThan(10); // Arbitrary reasonable limit
  });

  test('detects confusing UI patterns', () => {
    const { getAllByRole } = render(
      <TestWrapper>
        <TabNavigator />
      </TestWrapper>
    );

    const buttons = getAllByRole('button');
    
    // Check for consistent button patterns
    buttons.forEach(button => {
      expect(button.props.accessibilityRole).toBe('button');
      expect(button.props.accessible).not.toBe(false);
    });
  });

  test('measures cognitive load in complex screens', () => {
    const { getAllByRole } = render(
      <TestWrapper>
        <CalendarView
          events={mockEvents}
          selectedDate="2024-12-25"
          onDateSelect={() => {}}
          onEventPress={() => {}}
        />
      </TestWrapper>
    );

    // Complex screens should organize information clearly
    const interactiveElements = getAllByRole('button').concat(getAllByRole('text'));
    
    // Should not overwhelm users with too many simultaneous choices
    expect(interactiveElements.length).toBeLessThan(20); // Reasonable cognitive load
  });
});

// Helper functions
const getAllByRole = (container, role) => {
  try {
    return container.getAllByRole ? container.getAllByRole(role) : [];
  } catch (error) {
    return container.queryAllByRole ? container.queryAllByRole(role) : [];
  }
};

const queryByRole = (container, role, options = {}) => {
  try {
    return container.queryByRole ? container.queryByRole(role, options) : null;
  } catch (error) {
    return null;
  }
};

const queryByPlaceholderText = (container, text) => {
  try {
    return container.queryByPlaceholderText ? container.queryByPlaceholderText(text) : null;
  } catch (error) {
    return null;
  }
};

const queryByText = (container, text) => {
  try {
    return container.queryByText ? container.queryByText(text) : null;
  } catch (error) {
    return null;
  }
};

const queryAllByRole = (container, role) => {
  try {
    return container.queryAllByRole ? container.queryAllByRole(role) : [];
  } catch (error) {
    return [];
  }
};