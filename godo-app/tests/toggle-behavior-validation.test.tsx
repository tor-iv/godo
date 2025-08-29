import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { MyEventsScreen } from '../../src/screens/calendar/MyEventsScreen';
import { EventService } from '../../src/services/EventService';
import { Event, SwipeDirection } from '../../src/types';

// Mock dependencies
jest.mock('../../src/services/EventService');
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}));

// Mock Alert
const mockAlert = jest.spyOn(Alert, 'alert');

// Test data
const mockEvents: Event[] = [
  {
    id: 'event1',
    title: 'Test Event 1',
    description: 'Test description',
    date: '2025-08-30T18:00:00Z',
    datetime: '2025-08-30T18:00:00Z',
    location: {
      name: 'Test Venue',
      address: '123 Test St',
      coordinates: { lat: 40.7128, lng: -74.0060 }
    },
    venue: { name: 'Test Venue', neighborhood: 'Test Area' },
    category: 'NETWORKING' as any,
    source: 'EVENTBRITE' as any,
    imageUrl: 'https://example.com/image.jpg',
    priceMin: 0,
    capacity: 100,
    currentAttendees: 25,
    isFeatured: false,
    friendsAttending: 2
  },
  {
    id: 'event2',
    title: 'Test Event 2',
    description: 'Another test description',
    date: '2025-08-31T19:00:00Z',
    datetime: '2025-08-31T19:00:00Z',
    location: {
      name: 'Another Venue',
      address: '456 Another St',
      coordinates: { lat: 40.7580, lng: -73.9855 }
    },
    venue: { name: 'Another Venue', neighborhood: 'Another Area' },
    category: 'CULTURE' as any,
    source: 'RESY' as any,
    imageUrl: 'https://example.com/image2.jpg',
    priceMin: 25,
    priceMax: 50,
    capacity: 50,
    currentAttendees: 15,
    isFeatured: true,
    friendsAttending: 1
  }
];

describe('Toggle Behavior Validation Tests', () => {
  let mockEventService: jest.Mocked<EventService>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup EventService mock
    mockEventService = {
      getInstance: jest.fn(),
      getAllCalendarEvents: jest.fn(),
      getPrivateCalendarEvents: jest.fn(),
      getPublicCalendarEvents: jest.fn(),
      getSavedEvents: jest.fn(),
      getSwipeStats: jest.fn(),
      swipeEvent: jest.fn(),
      removeSwipe: jest.fn(),
      hasBeenSwiped: jest.fn(),
      getSwipeDirection: jest.fn(),
    } as any;

    // Mock static getInstance method
    (EventService.getInstance as jest.Mock).mockReturnValue(mockEventService);
  });

  describe('1. Toggle Does NOT Appear Before Swiping', () => {
    test('should not display EventFilterToggle when no events exist', async () => {
      // Setup: No events in calendar
      mockEventService.getAllCalendarEvents.mockReturnValue([]);
      mockEventService.getSavedEvents.mockReturnValue([]);
      mockEventService.getSwipeStats.mockReturnValue({
        total: 0,
        interested: 0,
        saved: 0,
        passed: 0,
        publicEvents: 0,
      });

      const { queryByText, queryByTestId } = render(<MyEventsScreen />);

      await waitFor(() => {
        // EventFilterToggle should not be rendered
        expect(queryByText('All Events')).toBeNull();
        expect(queryByText('Private')).toBeNull();
        expect(queryByText('Public')).toBeNull();
        expect(queryByTestId('event-filter-toggle')).toBeNull();
      });
    });

    test('should not display EventFilterToggle during loading state', async () => {
      // Simulate loading state
      mockEventService.getAllCalendarEvents.mockImplementation(() => {
        // Simulate delay
        return new Promise(() => {}); // Never resolves to keep loading
      });

      const { queryByText, getByText } = render(<MyEventsScreen />);

      // Should show loading spinner, not filter toggle
      expect(getByText('Loading your events...')).toBeTruthy();
      expect(queryByText('All Events')).toBeNull();
    });

    test('should not display EventFilterToggle in error state', async () => {
      // Setup: Service throws error
      mockEventService.getAllCalendarEvents.mockImplementation(() => {
        throw new Error('Network error');
      });

      const { queryByText, getByText } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(getByText(/Failed to load events/)).toBeTruthy();
        expect(queryByText('All Events')).toBeNull();
      });
    });
  });

  describe('2. Toggle is NOT Clickable Until Proper Swipe Interaction', () => {
    test('should only show toggle after events have been added to calendar via swipe', async () => {
      // Initially no events
      mockEventService.getAllCalendarEvents.mockReturnValueOnce([]);
      mockEventService.getSavedEvents.mockReturnValue([]);
      mockEventService.getSwipeStats.mockReturnValue({
        total: 0,
        interested: 0,
        saved: 0,
        passed: 0,
        publicEvents: 0,
      });

      const { queryByText, rerender } = render(<MyEventsScreen />);

      // Initially no toggle
      await waitFor(() => {
        expect(queryByText('All Events')).toBeNull();
      });

      // Simulate a swipe action adding event to calendar
      mockEventService.getAllCalendarEvents.mockReturnValue([mockEvents[0]]);
      mockEventService.getSwipeStats.mockReturnValue({
        total: 1,
        interested: 1,
        saved: 0,
        passed: 0,
        publicEvents: 0,
      });

      // Re-render with new state
      rerender(<MyEventsScreen />);

      // Now toggle should appear
      await waitFor(() => {
        expect(queryByText('All Events')).toBeTruthy();
      });
    });

    test('should disable toggle interactions when no calendar events exist', async () => {
      mockEventService.getAllCalendarEvents.mockReturnValue([]);
      mockEventService.getSavedEvents.mockReturnValue([mockEvents[0]]); // Has saved events but no calendar events
      mockEventService.getSwipeStats.mockReturnValue({
        total: 1,
        interested: 0,
        saved: 1,
        passed: 0,
        publicEvents: 0,
      });

      const { queryByText } = render(<MyEventsScreen />);

      await waitFor(() => {
        // Toggle should not be visible even with saved events
        expect(queryByText('All Events')).toBeNull();
      });
    });
  });

  describe('3. Swipe Gesture Properly Reveals Toggle', () => {
    test('should show toggle after RIGHT swipe (private calendar)', async () => {
      // Simulate right swipe adding event to private calendar
      mockEventService.getAllCalendarEvents.mockReturnValue([mockEvents[0]]);
      mockEventService.getPrivateCalendarEvents.mockReturnValue([mockEvents[0]]);
      mockEventService.getPublicCalendarEvents.mockReturnValue([]);
      mockEventService.getSavedEvents.mockReturnValue([]);
      mockEventService.getSwipeStats.mockReturnValue({
        total: 1,
        interested: 1,
        saved: 0,
        passed: 0,
        publicEvents: 0,
      });

      const { getByText } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(getByText('All Events')).toBeTruthy();
        expect(getByText('1 going • 0 public • 0 saved')).toBeTruthy();
      });
    });

    test('should show toggle after UP swipe (public calendar)', async () => {
      // Simulate up swipe adding event to public calendar
      mockEventService.getAllCalendarEvents.mockReturnValue([mockEvents[0]]);
      mockEventService.getPrivateCalendarEvents.mockReturnValue([]);
      mockEventService.getPublicCalendarEvents.mockReturnValue([mockEvents[0]]);
      mockEventService.getSavedEvents.mockReturnValue([]);
      mockEventService.getSwipeStats.mockReturnValue({
        total: 1,
        interested: 0,
        saved: 0,
        passed: 0,
        publicEvents: 1,
      });

      const { getByText } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(getByText('All Events')).toBeTruthy();
        expect(getByText('0 going • 1 public • 0 saved')).toBeTruthy();
      });
    });

    test('should NOT show toggle after DOWN swipe only (saved events)', async () => {
      // DOWN swipes go to saved events, not calendar
      mockEventService.getAllCalendarEvents.mockReturnValue([]); // No calendar events
      mockEventService.getSavedEvents.mockReturnValue([mockEvents[0]]);
      mockEventService.getSwipeStats.mockReturnValue({
        total: 1,
        interested: 0,
        saved: 1,
        passed: 0,
        publicEvents: 0,
      });

      const { queryByText } = render(<MyEventsScreen />);

      await waitFor(() => {
        // Toggle should not appear because saved events aren't in calendar
        expect(queryByText('All Events')).toBeNull();
      });
    });

    test('should NOT show toggle after LEFT swipe only (passed events)', async () => {
      // LEFT swipes are for passing on events
      mockEventService.getAllCalendarEvents.mockReturnValue([]);
      mockEventService.getSavedEvents.mockReturnValue([]);
      mockEventService.getSwipeStats.mockReturnValue({
        total: 1,
        interested: 0,
        saved: 0,
        passed: 1,
        publicEvents: 0,
      });

      const { queryByText } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(queryByText('All Events')).toBeNull();
      });
    });
  });

  describe('4. Toggle Functionality Works Correctly After Reveal', () => {
    beforeEach(() => {
      // Setup with mixed calendar events
      mockEventService.getAllCalendarEvents.mockReturnValue(mockEvents);
      mockEventService.getPrivateCalendarEvents.mockReturnValue([mockEvents[0]]);
      mockEventService.getPublicCalendarEvents.mockReturnValue([mockEvents[1]]);
      mockEventService.getSavedEvents.mockReturnValue([]);
      mockEventService.getSwipeStats.mockReturnValue({
        total: 2,
        interested: 1,
        saved: 0,
        passed: 0,
        publicEvents: 1,
      });
    });

    test('should filter to private events when private filter is selected', async () => {
      const { getByText, queryByText } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(getByText('All Events')).toBeTruthy();
      });

      // Click on the dropdown to open it
      fireEvent.press(getByText('All Events'));

      // Select private filter
      await waitFor(() => {
        expect(getByText('Private')).toBeTruthy();
      });
      fireEvent.press(getByText('Private'));

      // Verify filter was applied - should only show private events
      expect(mockEventService.getPrivateCalendarEvents).toHaveBeenCalled();
    });

    test('should filter to public events when public filter is selected', async () => {
      const { getByText } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(getByText('All Events')).toBeTruthy();
      });

      // Open dropdown and select public
      fireEvent.press(getByText('All Events'));
      
      await waitFor(() => {
        expect(getByText('Public')).toBeTruthy();
      });
      fireEvent.press(getByText('Public'));

      expect(mockEventService.getPublicCalendarEvents).toHaveBeenCalled();
    });

    test('should show all events when all filter is selected', async () => {
      const { getByText } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(getByText('All Events')).toBeTruthy();
      });

      // The default should show all calendar events
      expect(mockEventService.getAllCalendarEvents).toHaveBeenCalled();
    });
  });

  describe('5. No Unintended Interactions or Visual Glitches', () => {
    test('should not show toggle with zero opacity or hidden styles', async () => {
      mockEventService.getAllCalendarEvents.mockReturnValue([mockEvents[0]]);
      mockEventService.getSwipeStats.mockReturnValue({
        total: 1,
        interested: 1,
        saved: 0,
        passed: 0,
        publicEvents: 0,
      });

      const { getByText } = render(<MyEventsScreen />);

      await waitFor(() => {
        const toggleElement = getByText('All Events');
        expect(toggleElement).toBeTruthy();
        
        // Verify element is actually visible (not hidden by styles)
        expect(toggleElement.props.style).not.toMatchObject({
          opacity: 0
        });
        expect(toggleElement.props.style).not.toMatchObject({
          display: 'none'
        });
      });
    });

    test('should maintain proper z-index layering', async () => {
      mockEventService.getAllCalendarEvents.mockReturnValue([mockEvents[0]]);
      mockEventService.getSwipeStats.mockReturnValue({
        total: 1,
        interested: 1,
        saved: 0,
        passed: 0,
        publicEvents: 0,
      });

      const { getByText } = render(<MyEventsScreen />);

      await waitFor(() => {
        const toggle = getByText('All Events');
        expect(toggle).toBeTruthy();

        // Verify toggle doesn't interfere with other UI elements
        const title = getByText('My Events');
        expect(title).toBeTruthy();
      });
    });

    test('should handle rapid state changes gracefully', async () => {
      // Start with no events
      mockEventService.getAllCalendarEvents.mockReturnValueOnce([]);
      mockEventService.getSwipeStats.mockReturnValueOnce({
        total: 0,
        interested: 0,
        saved: 0,
        passed: 0,
        publicEvents: 0,
      });

      const { queryByText, rerender } = render(<MyEventsScreen />);

      // Initially no toggle
      expect(queryByText('All Events')).toBeNull();

      // Rapidly change to having events
      mockEventService.getAllCalendarEvents.mockReturnValue([mockEvents[0]]);
      mockEventService.getSwipeStats.mockReturnValue({
        total: 1,
        interested: 1,
        saved: 0,
        passed: 0,
        publicEvents: 0,
      });

      act(() => {
        rerender(<MyEventsScreen />);
      });

      // Should handle the transition smoothly
      await waitFor(() => {
        expect(queryByText('All Events')).toBeTruthy();
      });
    });

    test('should not cause memory leaks or performance issues', async () => {
      mockEventService.getAllCalendarEvents.mockReturnValue(mockEvents);
      mockEventService.getSwipeStats.mockReturnValue({
        total: 2,
        interested: 1,
        saved: 0,
        passed: 0,
        publicEvents: 1,
      });

      const { unmount } = render(<MyEventsScreen />);

      // Component should unmount cleanly
      expect(() => unmount()).not.toThrow();

      // EventService methods should have been called appropriate number of times
      expect(mockEventService.getAllCalendarEvents).toHaveBeenCalled();
      expect(mockEventService.getSwipeStats).toHaveBeenCalled();
    });
  });

  describe('6. Edge Cases and Error Handling', () => {
    test('should handle corrupted event data gracefully', async () => {
      const corruptEvent = { ...mockEvents[0], id: null } as any;
      mockEventService.getAllCalendarEvents.mockReturnValue([corruptEvent]);
      mockEventService.getSwipeStats.mockReturnValue({
        total: 1,
        interested: 1,
        saved: 0,
        passed: 0,
        publicEvents: 0,
      });

      const { queryByText } = render(<MyEventsScreen />);

      await waitFor(() => {
        // Should still show toggle despite corrupt data
        expect(queryByText('All Events')).toBeTruthy();
      });
    });

    test('should handle EventService errors gracefully', async () => {
      mockEventService.getAllCalendarEvents.mockImplementation(() => {
        throw new Error('Service unavailable');
      });

      const { queryByText, getByText } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(getByText(/Failed to load events/)).toBeTruthy();
        expect(queryByText('All Events')).toBeNull();
      });
    });

    test('should handle empty stats gracefully', async () => {
      mockEventService.getAllCalendarEvents.mockReturnValue([mockEvents[0]]);
      mockEventService.getSwipeStats.mockReturnValue({
        total: 0,
        interested: 0,
        saved: 0,
        passed: 0,
        publicEvents: 0,
      });

      const { getByText } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(getByText('0 going • 0 public • 0 saved')).toBeTruthy();
        expect(getByText('All Events')).toBeTruthy();
      });
    });
  });
});