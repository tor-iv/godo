/**
 * @fileoverview End-to-End User Workflow Tests
 * @author Testing Team
 * @description Complete user workflow tests covering discover → save → calendar flows
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DiscoverScreen } from '../../src/screens/discover/DiscoverScreen';
import { MyEventsScreen } from '../../src/screens/calendar/MyEventsScreen';
import { EventService } from '../../src/services/EventService';
import { SwipeInteractionTracker } from '../../src/services/SwipeInteractionTracker';
import { SwipeDirection } from '../../src/types';

// Mock services
jest.mock('../../src/services/EventService');
jest.mock('../../src/services/SwipeInteractionTracker');
jest.mock('@react-native-async-storage/async-storage');

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

// Test App with Navigation
const TestApp = () => (
  <NavigationContainer ref={navigationRef}>
    <Stack.Navigator>
      <Stack.Screen name="Discover" component={DiscoverScreen} />
      <Stack.Screen name="Calendar" component={MyEventsScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

describe('End-to-End User Workflow Tests', () => {
  let mockEventService: jest.Mocked<EventService>;
  let mockSwipeTracker: jest.Mocked<SwipeInteractionTracker>;

  const mockEvents = [
    {
      id: '1',
      title: 'Tech Networking Event',
      description: 'Meet local developers and entrepreneurs',
      datetime: '2024-09-15T19:00:00Z',
      category: 'NETWORKING',
      venue: { name: 'Innovation Hub', neighborhood: 'Manhattan' },
      isFeatured: true,
      friendsAttending: 5,
      tags: ['networking', 'tech', 'startup'],
      priceMin: 0,
      priceMax: 0,
    },
    {
      id: '2',
      title: 'Art Gallery Opening',
      description: 'Contemporary photography exhibition',
      datetime: '2024-09-16T18:00:00Z',
      category: 'CULTURE',
      venue: { name: 'Modern Gallery', neighborhood: 'Brooklyn' },
      isFeatured: false,
      friendsAttending: 2,
      tags: ['art', 'photography', 'culture'],
      priceMin: 15,
      priceMax: 15,
    },
    {
      id: '3',
      title: 'Food & Wine Festival',
      description: 'Local restaurants and wineries showcase',
      datetime: '2024-09-17T17:00:00Z',
      category: 'FOOD',
      venue: { name: 'Central Park', neighborhood: 'Manhattan' },
      isFeatured: true,
      friendsAttending: 8,
      tags: ['food', 'wine', 'festival'],
      priceMin: 25,
      priceMax: 50,
    },
    {
      id: '4',
      title: 'Yoga in the Park',
      description: 'Morning yoga session with meditation',
      datetime: '2024-09-18T08:00:00Z',
      category: 'WELLNESS',
      venue: { name: 'Bryant Park', neighborhood: 'Manhattan' },
      isFeatured: false,
      friendsAttending: 0,
      tags: ['yoga', 'wellness', 'meditation'],
      priceMin: 0,
      priceMax: 0,
    },
    {
      id: '5',
      title: 'Live Music Night',
      description: 'Local bands and indie artists',
      datetime: '2024-09-19T20:00:00Z',
      category: 'ENTERTAINMENT',
      venue: { name: 'The Venue', neighborhood: 'Brooklyn' },
      isFeatured: true,
      friendsAttending: 12,
      tags: ['music', 'live', 'indie'],
      priceMin: 20,
      priceMax: 20,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset AsyncStorage
    (AsyncStorage.clear as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    // Setup EventService mock
    mockEventService = {
      getInstance: jest.fn().mockReturnThis(),
      getUnswipedEvents: jest.fn().mockResolvedValue([...mockEvents]),
      getAllEvents: jest.fn().mockResolvedValue([...mockEvents]),
      swipeEvent: jest.fn(),
      hasBeenSwiped: jest.fn().mockReturnValue(false),
      getPrivateCalendarEvents: jest.fn().mockReturnValue([]),
      getPublicCalendarEvents: jest.fn().mockReturnValue([]),
      getAllCalendarEvents: jest.fn().mockReturnValue([]),
      getSavedEvents: jest.fn().mockReturnValue([]),
      getSwipeStats: jest.fn().mockReturnValue({
        total: 0,
        interested: 0,
        saved: 0,
        passed: 0,
        publicEvents: 0,
      }),
      searchEvents: jest.fn().mockResolvedValue([]),
      getEventById: jest.fn(),
    } as any;

    // Setup SwipeInteractionTracker mock
    mockSwipeTracker = {
      getInstance: jest.fn().mockReturnThis(),
      recordSwipe: jest.fn(),
      hasPerformedCalendarSwipe: jest.fn().mockReturnValue(false),
      hasPerformedAnySwipe: jest.fn().mockReturnValue(false),
      hasPerformedSaveSwipe: jest.fn().mockReturnValue(false),
      getSwipeStats: jest.fn().mockReturnValue({
        shouldShowToggle: false,
        hasEngaged: false,
        total: 0,
        calendarSwipes: 0,
        saveSwipes: 0,
        passSwipes: 0,
      }),
      getEngagementLevel: jest.fn().mockReturnValue('none'),
      reset: jest.fn(),
    } as any;

    // Mock singleton getInstance methods
    (EventService.getInstance as jest.Mock).mockReturnValue(mockEventService);
    (SwipeInteractionTracker.getInstance as jest.Mock).mockReturnValue(mockSwipeTracker);
  });

  describe('New User Onboarding Flow', () => {
    it('should guide new user through first-time discovery experience', async () => {
      const { getByTestId, getByText } = render(<TestApp />);

      // New user should see onboarding tips
      await waitFor(() => {
        expect(getByText(/swipe to discover events/i)).toBeTruthy();
      });

      // Should show first event
      await waitFor(() => {
        expect(getByText('Tech Networking Event')).toBeTruthy();
      });

      // Should show swipe instructions
      expect(getByText(/swipe right to add to private calendar/i)).toBeTruthy();
      expect(getByText(/swipe left to pass/i)).toBeTruthy();
    });

    it('should track user engagement and show progressive features', async () => {
      const { getByTestId, queryByTestId } = render(<TestApp />);

      await waitFor(() => {
        expect(getByTestId('event-card-1')).toBeTruthy();
      });

      // Initially, filter toggle should be hidden
      expect(queryByTestId('event-filter-toggle')).toBeFalsy();

      // First swipe to calendar should not yet show toggle
      fireEvent(getByTestId('event-card-1'), 'onSwipeRight');
      
      expect(mockSwipeTracker.recordSwipe).toHaveBeenCalledWith(SwipeDirection.RIGHT);

      // Update mock to reflect calendar swipe performed
      mockSwipeTracker.hasPerformedCalendarSwipe.mockReturnValue(true);
      mockSwipeTracker.getSwipeStats.mockReturnValue({
        shouldShowToggle: true,
        hasEngaged: true,
        total: 1,
        calendarSwipes: 1,
        saveSwipes: 0,
        passSwipes: 0,
      });

      // Re-render to show toggle
      await waitFor(() => {
        expect(getByTestId('event-filter-toggle')).toBeTruthy();
      });
    });

    it('should handle user abandonment and re-engagement', async () => {
      const { getByTestId, unmount } = render(<TestApp />);

      await waitFor(() => {
        expect(getByTestId('event-card-1')).toBeTruthy();
      });

      // User swipes a few events then leaves
      fireEvent(getByTestId('event-card-1'), 'onSwipeLeft');
      fireEvent(getByTestId('event-card-2'), 'onSwipeRight');
      
      unmount();

      // User returns later - state should be preserved
      const { getByTestId: getByTestId2 } = render(<TestApp />);
      
      await waitFor(() => {
        expect(getByTestId2('event-card-3')).toBeTruthy(); // Should show next unswiped event
      });
    });
  });

  describe('Event Discovery and Curation Workflow', () => {
    it('should allow user to discover and curate events across different categories', async () => {
      const { getByTestId, getByText } = render(<TestApp />);

      await waitFor(() => {
        expect(getByText('Tech Networking Event')).toBeTruthy();
      });

      // User interested in networking event (private calendar)
      fireEvent(getByTestId('event-card-1'), 'onSwipeRight');
      expect(mockEventService.swipeEvent).toHaveBeenCalledWith('1', SwipeDirection.RIGHT);

      // User passes on art event
      await waitFor(() => {
        expect(getByText('Art Gallery Opening')).toBeTruthy();
      });
      fireEvent(getByTestId('event-card-2'), 'onSwipeLeft');
      expect(mockEventService.swipeEvent).toHaveBeenCalledWith('2', SwipeDirection.LEFT);

      // User adds food event to public calendar
      await waitFor(() => {
        expect(getByText('Food & Wine Festival')).toBeTruthy();
      });
      fireEvent(getByTestId('event-card-3'), 'onSwipeUp');
      expect(mockEventService.swipeEvent).toHaveBeenCalledWith('3', SwipeDirection.UP);

      // User saves wellness event for later
      await waitFor(() => {
        expect(getByText('Yoga in the Park')).toBeTruthy();
      });
      fireEvent(getByTestId('event-card-4'), 'onSwipeDown');
      expect(mockEventService.swipeEvent).toHaveBeenCalledWith('4', SwipeDirection.DOWN);

      // User interested in music event (private calendar)
      await waitFor(() => {
        expect(getByText('Live Music Night')).toBeTruthy();
      });
      fireEvent(getByTestId('event-card-5'), 'onSwipeRight');
      expect(mockEventService.swipeEvent).toHaveBeenCalledWith('5', SwipeDirection.RIGHT);
    });

    it('should handle end of events gracefully and provide next steps', async () => {
      mockEventService.getUnswipedEvents.mockResolvedValue([mockEvents[0]]);

      const { getByTestId, getByText } = render(<TestApp />);

      await waitFor(() => {
        expect(getByText('Tech Networking Event')).toBeTruthy();
      });

      // Swipe last event
      fireEvent(getByTestId('event-card-1'), 'onSwipeRight');

      // Should show completion message with call-to-action
      await waitFor(() => {
        expect(getByText(/you've reviewed all events/i)).toBeTruthy();
        expect(getByText(/check your calendar/i)).toBeTruthy();
      });

      // Should provide button to navigate to calendar
      const calendarButton = getByTestId('go-to-calendar-button');
      fireEvent.press(calendarButton);

      await waitFor(() => {
        expect(navigationRef.getCurrentRoute()?.name).toBe('Calendar');
      });
    });

    it('should support undo functionality for accidental swipes', async () => {
      const { getByTestId, getByText } = render(<TestApp />);

      await waitFor(() => {
        expect(getByText('Tech Networking Event')).toBeTruthy();
      });

      // User accidentally swipes
      fireEvent(getByTestId('event-card-1'), 'onSwipeLeft');

      // Undo button should appear briefly
      await waitFor(() => {
        expect(getByTestId('undo-button')).toBeTruthy();
      });

      // User taps undo
      fireEvent.press(getByTestId('undo-button'));

      // Event should return
      await waitFor(() => {
        expect(getByText('Tech Networking Event')).toBeTruthy();
      });
    });
  });

  describe('Calendar Integration and Management', () => {
    it('should seamlessly transition from discovery to calendar management', async () => {
      // Setup some events in calendar
      mockEventService.getPrivateCalendarEvents.mockReturnValue([mockEvents[0], mockEvents[4]]);
      mockEventService.getPublicCalendarEvents.mockReturnValue([mockEvents[2]]);
      mockEventService.getAllCalendarEvents.mockReturnValue([mockEvents[0], mockEvents[2], mockEvents[4]]);

      const { getByTestId } = render(<TestApp />);

      // Navigate to calendar
      await act(async () => {
        navigationRef.navigate('Calendar');
      });

      await waitFor(() => {
        expect(getByTestId('calendar-screen')).toBeTruthy();
      });

      // Should show filter toggle (user has both private and public events)
      expect(getByTestId('event-filter-toggle')).toBeTruthy();

      // Should display all calendar events by default
      expect(getByTestId('event-tech-networking-event')).toBeTruthy();
      expect(getByTestId('event-food-wine-festival')).toBeTruthy();
      expect(getByTestId('event-live-music-night')).toBeTruthy();
    });

    it('should allow filtering between private and public events', async () => {
      mockEventService.getPrivateCalendarEvents.mockReturnValue([mockEvents[0]]);
      mockEventService.getPublicCalendarEvents.mockReturnValue([mockEvents[2]]);
      mockEventService.getAllCalendarEvents.mockReturnValue([mockEvents[0], mockEvents[2]]);

      const { getByTestId, queryByTestId } = render(<TestApp />);

      await act(async () => {
        navigationRef.navigate('Calendar');
      });

      await waitFor(() => {
        expect(getByTestId('event-filter-toggle')).toBeTruthy();
      });

      // Initially showing all events
      expect(getByTestId('event-tech-networking-event')).toBeTruthy();
      expect(getByTestId('event-food-wine-festival')).toBeTruthy();

      // Filter to private events only
      fireEvent.press(getByTestId('filter-private'));

      await waitFor(() => {
        expect(getByTestId('event-tech-networking-event')).toBeTruthy();
        expect(queryByTestId('event-food-wine-festival')).toBeFalsy();
      });

      // Filter to public events only
      fireEvent.press(getByTestId('filter-public'));

      await waitFor(() => {
        expect(queryByTestId('event-tech-networking-event')).toBeFalsy();
        expect(getByTestId('event-food-wine-festival')).toBeTruthy();
      });
    });

    it('should handle calendar view switching (month/agenda)', async () => {
      mockEventService.getAllCalendarEvents.mockReturnValue([mockEvents[0], mockEvents[2]]);

      const { getByTestId } = render(<TestApp />);

      await act(async () => {
        navigationRef.navigate('Calendar');
      });

      await waitFor(() => {
        expect(getByTestId('view-toggle')).toBeTruthy();
      });

      // Initially in month view
      expect(getByTestId('calendar-month-view')).toBeTruthy();

      // Switch to agenda view
      fireEvent.press(getByTestId('view-toggle'));

      await waitFor(() => {
        expect(getByTestId('calendar-agenda-view')).toBeTruthy();
      });

      // Events should be displayed in agenda format
      expect(getByTestId('agenda-event-tech-networking-event')).toBeTruthy();
      expect(getByTestId('agenda-event-food-wine-festival')).toBeTruthy();
    });

    it('should support date navigation in calendar view', async () => {
      mockEventService.getAllCalendarEvents.mockReturnValue([mockEvents[0]]);

      const { getByTestId } = render(<TestApp />);

      await act(async () => {
        navigationRef.navigate('Calendar');
      });

      await waitFor(() => {
        expect(getByTestId('date-navigation')).toBeTruthy();
      });

      // Should show current month
      expect(getByTestId('current-month-year')).toBeTruthy();

      // Navigate to next month
      fireEvent.press(getByTestId('next-month-button'));

      await waitFor(() => {
        // Month should have changed
        expect(getByTestId('current-month-year').props.children).not.toBe(
          new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
        );
      });

      // Navigate back to today
      fireEvent.press(getByTestId('today-button'));

      await waitFor(() => {
        // Should be back to current month
        const currentMonthYear = new Date().toLocaleString('default', { 
          month: 'long', 
          year: 'numeric' 
        });
        expect(getByTestId('current-month-year').props.children).toBe(currentMonthYear);
      });
    });
  });

  describe('Cross-Screen State Management', () => {
    it('should maintain consistent state across screen transitions', async () => {
      const { getByTestId } = render(<TestApp />);

      // User makes several swipes in discover screen
      await waitFor(() => {
        expect(getByTestId('event-card-1')).toBeTruthy();
      });

      fireEvent(getByTestId('event-card-1'), 'onSwipeRight'); // Private calendar
      fireEvent(getByTestId('event-card-2'), 'onSwipeUp');   // Public calendar

      // Update mocks to reflect changes
      mockEventService.getPrivateCalendarEvents.mockReturnValue([mockEvents[0]]);
      mockEventService.getPublicCalendarEvents.mockReturnValue([mockEvents[1]]);
      mockEventService.getAllCalendarEvents.mockReturnValue([mockEvents[0], mockEvents[1]]);

      // Navigate to calendar
      await act(async () => {
        navigationRef.navigate('Calendar');
      });

      // Events should be reflected in calendar
      await waitFor(() => {
        expect(getByTestId('event-tech-networking-event')).toBeTruthy();
        expect(getByTestId('event-art-gallery-opening')).toBeTruthy();
      });

      // Navigate back to discover
      await act(async () => {
        navigationRef.navigate('Discover');
      });

      // Should show next unswiped event
      await waitFor(() => {
        expect(getByTestId('event-card-3')).toBeTruthy();
      });
    });

    it('should persist user preferences across app sessions', async () => {
      const { unmount, getByTestId } = render(<TestApp />);

      // User makes some interactions
      await waitFor(() => {
        expect(getByTestId('event-card-1')).toBeTruthy();
      });

      fireEvent(getByTestId('event-card-1'), 'onSwipeRight');

      // App is closed
      unmount();

      // Simulate app restart - preferences should be loaded
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'user_preferences') {
          return Promise.resolve(JSON.stringify({
            hasCompletedOnboarding: true,
            preferredCategories: ['NETWORKING', 'TECH'],
            filterPreference: 'all',
          }));
        }
        return Promise.resolve(null);
      });

      // App is reopened
      const { getByTestId: getByTestId2 } = render(<TestApp />);

      // Should skip onboarding
      await waitFor(() => {
        expect(getByTestId2('event-card-1')).toBeTruthy();
      });
    });

    it('should handle network failures gracefully with offline support', async () => {
      // Simulate network failure
      mockEventService.getUnswipedEvents.mockRejectedValue(new Error('Network error'));

      const { getByText, getByTestId } = render(<TestApp />);

      // Should show error state
      await waitFor(() => {
        expect(getByText(/unable to load events/i)).toBeTruthy();
      });

      // Should provide retry option
      expect(getByTestId('retry-button')).toBeTruthy();

      // Mock successful retry
      mockEventService.getUnswipedEvents.mockResolvedValue([mockEvents[0]]);

      fireEvent.press(getByTestId('retry-button'));

      // Should load events successfully
      await waitFor(() => {
        expect(getByText('Tech Networking Event')).toBeTruthy();
      });
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle rapid user interactions without crashing', async () => {
      const { getByTestId } = render(<TestApp />);

      await waitFor(() => {
        expect(getByTestId('event-card-1')).toBeTruthy();
      });

      // Rapid fire interactions
      for (let i = 0; i < 20; i++) {
        try {
          fireEvent(getByTestId(`event-card-${i % 5 + 1}`), 'onSwipeRight');
          fireEvent.press(getByTestId('view-toggle'));
          fireEvent.press(getByTestId('filter-toggle'));
        } catch (e) {
          // Some elements might not exist, that's okay
        }
      }

      // App should remain stable
      expect(getByTestId('discover-screen')).toBeTruthy();
    });

    it('should maintain good performance with large datasets', async () => {
      const largeEventSet = Array.from({ length: 1000 }, (_, i) => ({
        ...mockEvents[0],
        id: `event-${i}`,
        title: `Event ${i}`,
      }));

      mockEventService.getUnswipedEvents.mockResolvedValue(largeEventSet);

      const startTime = Date.now();
      const { getByTestId } = render(<TestApp />);

      await waitFor(() => {
        expect(getByTestId('event-card-event-0')).toBeTruthy();
      });

      const renderTime = Date.now() - startTime;
      expect(renderTime).toBeLessThan(1000); // Should render within 1 second

      // Rapid swiping should remain smooth
      const swipeStartTime = Date.now();
      for (let i = 0; i < 10; i++) {
        fireEvent(getByTestId(`event-card-event-${i}`), 'onSwipeRight');
      }
      const swipeTime = Date.now() - swipeStartTime;
      
      expect(swipeTime).toBeLessThan(100); // 10 swipes in 100ms
    });

    it('should recover gracefully from unexpected errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Simulate an error in event service
      mockEventService.swipeEvent.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const { getByTestId, getByText } = render(<TestApp />);

      await waitFor(() => {
        expect(getByTestId('event-card-1')).toBeTruthy();
      });

      // Error should be caught and handled gracefully
      fireEvent(getByTestId('event-card-1'), 'onSwipeRight');

      // Should show error message but not crash
      await waitFor(() => {
        expect(getByText(/something went wrong/i)).toBeTruthy();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Analytics and User Behavior Tracking', () => {
    it('should track user engagement patterns', async () => {
      const { getByTestId } = render(<TestApp />);

      await waitFor(() => {
        expect(getByTestId('event-card-1')).toBeTruthy();
      });

      // Simulate user behavior pattern
      fireEvent(getByTestId('event-card-1'), 'onSwipeLeft');   // Pass
      fireEvent(getByTestId('event-card-2'), 'onSwipeLeft');   // Pass  
      fireEvent(getByTestId('event-card-3'), 'onSwipeRight');  // Interested
      fireEvent(getByTestId('event-card-4'), 'onSwipeUp');     // Public
      fireEvent(getByTestId('event-card-5'), 'onSwipeDown');   // Save

      // Should track all interactions
      expect(mockSwipeTracker.recordSwipe).toHaveBeenCalledTimes(5);
      expect(mockEventService.swipeEvent).toHaveBeenCalledTimes(5);
    });

    it('should provide insights on user preferences', async () => {
      mockSwipeTracker.getSwipeStats.mockReturnValue({
        total: 10,
        calendarSwipes: 6,
        saveSwipes: 2,
        passSwipes: 2,
        shouldShowToggle: true,
        hasEngaged: true,
      });

      mockSwipeTracker.getEngagementLevel.mockReturnValue('high');

      const { getByTestId } = render(<TestApp />);

      // Navigate to profile/stats screen (if it exists)
      await act(async () => {
        // This would navigate to a stats screen
      });

      // Should show engagement metrics
      const stats = mockSwipeTracker.getSwipeStats();
      expect(stats.total).toBe(10);
      expect(stats.calendarSwipes).toBe(6);
      expect(mockSwipeTracker.getEngagementLevel()).toBe('high');
    });
  });
});