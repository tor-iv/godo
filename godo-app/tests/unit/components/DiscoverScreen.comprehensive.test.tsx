/**
 * @fileoverview Comprehensive Discover Screen Component Tests
 * @author Testing Team
 * @description Complete test suite for Discover screen with swipe functionality, state management, and user interactions
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { DiscoverScreen } from '../../../src/screens/discover/DiscoverScreen';
import { EventService } from '../../../src/services/EventService';
import { SwipeInteractionTracker } from '../../../src/services/SwipeInteractionTracker';
import { SwipeDirection } from '../../../src/types';

// Mock services
jest.mock('../../../src/services/EventService');
jest.mock('../../../src/services/SwipeInteractionTracker');

// Mock React Navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  dispatch: jest.fn(),
  canGoBack: () => false,
  getId: () => 'test-id',
  isFocused: () => true,
  addListener: jest.fn(),
  removeListener: jest.fn(),
};

// Mock Gesture Handler components
jest.mock('react-native-gesture-handler', () => ({
  ...jest.requireActual('react-native-gesture-handler'),
  PanGestureHandler: ({ children, onGestureEvent }: any) => children,
  State: { END: 5 },
}));

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated/mock'),
  useSharedValue: (initial: any) => ({ value: initial }),
  useAnimatedStyle: (fn: any) => fn(),
  useAnimatedGestureHandler: (handlers: any) => handlers,
  withSpring: (value: any) => value,
  withTiming: (value: any) => value,
  runOnJS: (fn: any) => fn,
  interpolate: (value: any, input: any, output: any) => output[0],
}));

describe('DiscoverScreen - Comprehensive Tests', () => {
  let mockEventService: jest.Mocked<EventService>;
  let mockSwipeTracker: jest.Mocked<SwipeInteractionTracker>;

  const mockEvents = [
    {
      id: '1',
      title: 'Tech Meetup',
      description: 'JavaScript developers meetup',
      datetime: '2024-09-15T19:00:00Z',
      category: 'NETWORKING',
      venue: { name: 'Tech Hub', neighborhood: 'Manhattan' },
      isFeatured: true,
      friendsAttending: 3,
      tags: ['javascript', 'tech'],
      priceMin: 0,
      priceMax: 0,
    },
    {
      id: '2',
      title: 'Art Gallery',
      description: 'Contemporary art exhibition',
      datetime: '2024-09-16T18:00:00Z',
      category: 'CULTURE',
      venue: { name: 'Gallery Modern', neighborhood: 'Brooklyn' },
      isFeatured: false,
      friendsAttending: 0,
      tags: ['art', 'culture'],
      priceMin: 25,
      priceMax: 25,
    },
  ];

  const MockedDiscoverScreen = (props: any) => (
    <NavigationContainer>
      <DiscoverScreen navigation={mockNavigation} route={{} as any} {...props} />
    </NavigationContainer>
  );

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup EventService mock
    mockEventService = {
      getInstance: jest.fn().mockReturnThis(),
      getUnswipedEvents: jest.fn().mockResolvedValue(mockEvents),
      swipeEvent: jest.fn(),
      hasBeenSwiped: jest.fn().mockReturnValue(false),
      getAllEvents: jest.fn().mockResolvedValue(mockEvents),
      getEventById: jest.fn(),
      searchEvents: jest.fn(),
      getSwipeStats: jest.fn().mockReturnValue({
        total: 0,
        interested: 0,
        saved: 0,
        passed: 0,
        publicEvents: 0,
      }),
    } as any;

    // Setup SwipeInteractionTracker mock
    mockSwipeTracker = {
      getInstance: jest.fn().mockReturnThis(),
      recordSwipe: jest.fn(),
      hasPerformedCalendarSwipe: jest.fn().mockReturnValue(false),
      hasPerformedAnySwipe: jest.fn().mockReturnValue(false),
      getSwipeStats: jest.fn().mockReturnValue({
        shouldShowToggle: false,
        hasEngaged: false,
      }),
    } as any;

    // Mock singleton getInstance methods
    (EventService.getInstance as jest.Mock).mockReturnValue(mockEventService);
    (SwipeInteractionTracker.getInstance as jest.Mock).mockReturnValue(mockSwipeTracker);
  });

  describe('Component Rendering', () => {
    it('should render without crashing', async () => {
      const { getByTestId } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        expect(getByTestId).toBeDefined();
      });
    });

    it('should display events when loaded', async () => {
      const { getByText } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        expect(getByText('Tech Meetup')).toBeTruthy();
        expect(getByText('Art Gallery')).toBeTruthy();
      });
    });

    it('should show loading state initially', async () => {
      mockEventService.getUnswipedEvents.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockEvents), 100))
      );

      const { getByTestId } = render(<MockedDiscoverScreen />);
      
      // Should show loading initially
      expect(getByTestId('loading-indicator')).toBeTruthy();
      
      // Should show content after loading
      await waitFor(() => {
        expect(getByText('Tech Meetup')).toBeTruthy();
      }, { timeout: 200 });
    });

    it('should handle empty events list gracefully', async () => {
      mockEventService.getUnswipedEvents.mockResolvedValue([]);
      
      const { getByText } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        expect(getByText(/no events/i)).toBeTruthy();
      });
    });

    it('should handle API errors gracefully', async () => {
      mockEventService.getUnswipedEvents.mockRejectedValue(new Error('API Error'));
      
      const { getByText } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        expect(getByText(/error/i)).toBeTruthy();
      });
    });
  });

  describe('Event Card Display', () => {
    it('should display all event information correctly', async () => {
      const { getByText } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        // Event titles
        expect(getByText('Tech Meetup')).toBeTruthy();
        expect(getByText('Art Gallery')).toBeTruthy();
        
        // Event descriptions
        expect(getByText('JavaScript developers meetup')).toBeTruthy();
        expect(getByText('Contemporary art exhibition')).toBeTruthy();
        
        // Venue information
        expect(getByText('Tech Hub')).toBeTruthy();
        expect(getByText('Gallery Modern')).toBeTruthy();
        
        // Neighborhood
        expect(getByText('Manhattan')).toBeTruthy();
        expect(getByText('Brooklyn')).toBeTruthy();
      });
    });

    it('should show featured badge for featured events', async () => {
      const { getByTestId } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        expect(getByTestId('featured-badge-1')).toBeTruthy();
      });
    });

    it('should display friends attending count', async () => {
      const { getByText } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        expect(getByText('3 friends attending')).toBeTruthy();
      });
    });

    it('should show price information correctly', async () => {
      const { getByText } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        expect(getByText('Free')).toBeTruthy();
        expect(getByText('$25')).toBeTruthy();
      });
    });

    it('should format dates and times correctly', async () => {
      const { getByText } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        // Should show formatted date/time
        expect(getByText(/Sep 15/)).toBeTruthy();
        expect(getByText(/7:00 PM/)).toBeTruthy();
      });
    });
  });

  describe('Swipe Functionality', () => {
    it('should handle right swipe (interested)', async () => {
      const { getByTestId } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        const eventCard = getByTestId('event-card-1');
        expect(eventCard).toBeTruthy();
      });

      // Simulate swipe gesture
      const eventCard = getByTestId('event-card-1');
      fireEvent(eventCard, 'onSwipeRight');
      
      expect(mockEventService.swipeEvent).toHaveBeenCalledWith('1', SwipeDirection.RIGHT);
      expect(mockSwipeTracker.recordSwipe).toHaveBeenCalledWith(SwipeDirection.RIGHT);
    });

    it('should handle left swipe (pass)', async () => {
      const { getByTestId } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        const eventCard = getByTestId('event-card-1');
        expect(eventCard).toBeTruthy();
      });

      fireEvent(getByTestId('event-card-1'), 'onSwipeLeft');
      
      expect(mockEventService.swipeEvent).toHaveBeenCalledWith('1', SwipeDirection.LEFT);
      expect(mockSwipeTracker.recordSwipe).toHaveBeenCalledWith(SwipeDirection.LEFT);
    });

    it('should handle up swipe (public calendar)', async () => {
      const { getByTestId } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        const eventCard = getByTestId('event-card-1');
        expect(eventCard).toBeTruthy();
      });

      fireEvent(getByTestId('event-card-1'), 'onSwipeUp');
      
      expect(mockEventService.swipeEvent).toHaveBeenCalledWith('1', SwipeDirection.UP);
      expect(mockSwipeTracker.recordSwipe).toHaveBeenCalledWith(SwipeDirection.UP);
    });

    it('should handle down swipe (save)', async () => {
      const { getByTestId } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        const eventCard = getByTestId('event-card-1');
        expect(eventCard).toBeTruthy();
      });

      fireEvent(getByTestId('event-card-1'), 'onSwipeDown');
      
      expect(mockEventService.swipeEvent).toHaveBeenCalledWith('1', SwipeDirection.DOWN);
      expect(mockSwipeTracker.recordSwipe).toHaveBeenCalledWith(SwipeDirection.DOWN);
    });

    it('should show next event after swipe', async () => {
      const { getByTestId, queryByTestId } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        expect(getByTestId('event-card-1')).toBeTruthy();
      });

      // Swipe first event
      fireEvent(getByTestId('event-card-1'), 'onSwipeRight');
      
      await waitFor(() => {
        // First event should be gone
        expect(queryByTestId('event-card-1')).toBeFalsy();
        // Second event should now be visible
        expect(getByTestId('event-card-2')).toBeTruthy();
      });
    });

    it('should show completion message when all events are swiped', async () => {
      mockEventService.getUnswipedEvents.mockResolvedValueOnce([mockEvents[0]]);
      
      const { getByTestId, getByText } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        expect(getByTestId('event-card-1')).toBeTruthy();
      });

      // Swipe the last event
      fireEvent(getByTestId('event-card-1'), 'onSwipeRight');
      
      await waitFor(() => {
        expect(getByText(/no more events/i)).toBeTruthy();
      });
    });
  });

  describe('Animation and Visual Feedback', () => {
    it('should provide visual feedback during swipe', async () => {
      const { getByTestId } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        const eventCard = getByTestId('event-card-1');
        expect(eventCard).toBeTruthy();
      });

      const eventCard = getByTestId('event-card-1');
      
      // Simulate swipe start
      fireEvent(eventCard, 'onGestureBegin');
      
      // Should show swipe indicators
      expect(getByTestId('swipe-indicator-right')).toBeTruthy();
      expect(getByTestId('swipe-indicator-left')).toBeTruthy();
    });

    it('should animate card exit after swipe', async () => {
      const { getByTestId } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        const eventCard = getByTestId('event-card-1');
        expect(eventCard).toBeTruthy();
      });

      // Should trigger exit animation
      fireEvent(getByTestId('event-card-1'), 'onSwipeRight');
      
      // Animation should be applied (mock would capture this)
      expect(getByTestId('event-card-1')).toHaveStyle({
        transform: expect.any(Array),
      });
    });
  });

  describe('Filter Toggle Integration', () => {
    it('should show filter toggle when user has swiped to calendar', async () => {
      mockSwipeTracker.hasPerformedCalendarSwipe.mockReturnValue(true);
      mockSwipeTracker.getSwipeStats.mockReturnValue({
        shouldShowToggle: true,
        hasEngaged: true,
      });

      const { getByTestId } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        expect(getByTestId('event-filter-toggle')).toBeTruthy();
      });
    });

    it('should hide filter toggle initially', async () => {
      mockSwipeTracker.hasPerformedCalendarSwipe.mockReturnValue(false);
      
      const { queryByTestId } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        expect(queryByTestId('event-filter-toggle')).toBeFalsy();
      });
    });

    it('should update filter toggle visibility after swipe', async () => {
      const { getByTestId, queryByTestId } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        // Initially hidden
        expect(queryByTestId('event-filter-toggle')).toBeFalsy();
      });

      // Mock that calendar swipe was performed
      mockSwipeTracker.hasPerformedCalendarSwipe.mockReturnValue(true);
      
      // Swipe to trigger update
      fireEvent(getByTestId('event-card-1'), 'onSwipeRight');
      
      await waitFor(() => {
        expect(getByTestId('event-filter-toggle')).toBeTruthy();
      });
    });
  });

  describe('Navigation Integration', () => {
    it('should navigate to event details when card is tapped', async () => {
      const { getByTestId } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        const eventCard = getByTestId('event-card-1');
        expect(eventCard).toBeTruthy();
      });

      fireEvent.press(getByTestId('event-card-1'));
      
      expect(mockNavigate).toHaveBeenCalledWith('EventDetails', { eventId: '1' });
    });

    it('should navigate to calendar when calendar button is pressed', async () => {
      mockSwipeTracker.hasPerformedCalendarSwipe.mockReturnValue(true);
      
      const { getByTestId } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        expect(getByTestId('calendar-button')).toBeTruthy();
      });

      fireEvent.press(getByTestId('calendar-button'));
      
      expect(mockNavigate).toHaveBeenCalledWith('Calendar');
    });
  });

  describe('Performance Considerations', () => {
    it('should handle rapid swipes without crashing', async () => {
      const { getByTestId } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        expect(getByTestId('event-card-1')).toBeTruthy();
      });

      // Rapid fire swipes
      const eventCard = getByTestId('event-card-1');
      for (let i = 0; i < 10; i++) {
        fireEvent(eventCard, 'onSwipeRight');
      }
      
      // Should not crash
      expect(mockEventService.swipeEvent).toHaveBeenCalledTimes(10);
    });

    it('should efficiently update UI after swipe', async () => {
      const { getByTestId } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        expect(getByTestId('event-card-1')).toBeTruthy();
      });

      const startTime = Date.now();
      fireEvent(getByTestId('event-card-1'), 'onSwipeRight');
      
      await waitFor(() => {
        expect(getByTestId('event-card-2')).toBeTruthy();
      });
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100); // Should be fast
    });
  });

  describe('Error Handling', () => {
    it('should handle swipe errors gracefully', async () => {
      mockEventService.swipeEvent.mockImplementation(() => {
        throw new Error('Swipe failed');
      });
      
      const { getByTestId } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        expect(getByTestId('event-card-1')).toBeTruthy();
      });

      // Should not crash on swipe error
      expect(() => {
        fireEvent(getByTestId('event-card-1'), 'onSwipeRight');
      }).not.toThrow();
    });

    it('should show error message when event loading fails', async () => {
      mockEventService.getUnswipedEvents.mockRejectedValue(new Error('Network error'));
      
      const { getByText } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        expect(getByText(/error loading events/i)).toBeTruthy();
      });
    });

    it('should provide retry functionality on error', async () => {
      mockEventService.getUnswipedEvents.mockRejectedValueOnce(new Error('Network error'));
      
      const { getByText, getByTestId } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        expect(getByTestId('retry-button')).toBeTruthy();
      });

      // Mock successful retry
      mockEventService.getUnswipedEvents.mockResolvedValue(mockEvents);
      
      fireEvent.press(getByTestId('retry-button'));
      
      await waitFor(() => {
        expect(getByText('Tech Meetup')).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', async () => {
      const { getByLabelText } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        expect(getByLabelText(/swipe right to add to private calendar/i)).toBeTruthy();
        expect(getByLabelText(/swipe left to pass/i)).toBeTruthy();
        expect(getByLabelText(/swipe up to add to public calendar/i)).toBeTruthy();
        expect(getByLabelText(/swipe down to save/i)).toBeTruthy();
      });
    });

    it('should support voice-over navigation', async () => {
      const { getByTestId } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        const eventCard = getByTestId('event-card-1');
        expect(eventCard.props.accessible).toBe(true);
        expect(eventCard.props.accessibilityRole).toBe('button');
      });
    });

    it('should announce swipe actions to screen reader', async () => {
      const { getByTestId } = render(<MockedDiscoverScreen />);
      
      await waitFor(() => {
        expect(getByTestId('event-card-1')).toBeTruthy();
      });

      fireEvent(getByTestId('event-card-1'), 'onSwipeRight');
      
      // Should announce the action
      expect(getByTestId('accessibility-announcement')).toBeTruthy();
    });
  });
});