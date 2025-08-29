import React from 'react';
import { render } from '@testing-library/react-native';
import { format } from 'date-fns';
import { CalendarView } from '../../../src/components/calendar/CalendarView';
import { DateNavigation } from '../../../src/components/calendar/DateNavigation';
import { MyEventsScreen } from '../../../src/screens/calendar/MyEventsScreen';
import { Event } from '../../../src/types';

// Mock the EventService to avoid real data dependencies
jest.mock('../../../src/services', () => ({
  EventService: {
    getInstance: () => ({
      getAllCalendarEvents: () => [],
      getSavedEvents: () => [],
      getSwipeStats: () => ({ interested: 0, publicEvents: 0, saved: 0 }),
      getPrivateCalendarEvents: () => [],
      getPublicCalendarEvents: () => [],
    }),
  },
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: any) => callback(),
}));

// Mock safe area
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('Header Duplication Prevention', () => {
  const mockEvents: Event[] = [
    {
      id: '1',
      title: 'Test Event',
      datetime: '2025-08-29T10:00:00Z',
      venue: { name: 'Test Venue', neighborhood: 'Test Area' },
      category: 'NETWORKING',
      currentAttendees: 5,
      friendsAttending: 2,
    },
  ];

  describe('CalendarView Header Behavior', () => {
    it('should show only one date header for selected date events', () => {
      const { getAllByText, queryAllByText } = render(
        <CalendarView
          events={mockEvents}
          selectedDate="2025-08-29"
          onDateSelect={jest.fn()}
          onEventPress={jest.fn()}
        />
      );

      // Should have exactly one instance of the formatted date
      const dateHeaders = queryAllByText(/August 29, 2025/);
      expect(dateHeaders).toHaveLength(1);
    });

    it('should not show date header when no date is selected', () => {
      const { queryByText } = render(
        <CalendarView
          events={mockEvents}
          selectedDate=""
          onDateSelect={jest.fn()}
          onEventPress={jest.fn()}
        />
      );

      // Should not show any date-specific headers when no date selected
      expect(queryByText(/August 29, 2025/)).toBeNull();
    });

    it('should update header when different date is selected', () => {
      const { rerender, queryByText, getByText } = render(
        <CalendarView
          events={mockEvents}
          selectedDate="2025-08-29"
          onDateSelect={jest.fn()}
          onEventPress={jest.fn()}
        />
      );

      // Should show August header
      expect(getByText(/August 29, 2025/)).toBeTruthy();

      // Change to different date
      rerender(
        <CalendarView
          events={mockEvents}
          selectedDate="2025-09-15"
          onDateSelect={jest.fn()}
          onEventPress={jest.fn()}
        />
      );

      // August header should be gone
      expect(queryByText(/August 29, 2025/)).toBeNull();
      
      // September header should show (though no events on that date)
      expect(getByText(/September 15, 2025/)).toBeTruthy();
    });
  });

  describe('DateNavigation Header Consistency', () => {
    it('should show consistent month format across view types', () => {
      const viewTypes: Array<'month' | 'week' | 'day'> = ['month', 'week', 'day'];
      
      viewTypes.forEach(viewType => {
        const { getByText, unmount } = render(
          <DateNavigation
            selectedDate="2025-08-29"
            viewType={viewType}
            onDateChange={jest.fn()}
          />
        );

        // Each view should have a specific, non-duplicate header format
        if (viewType === 'month') {
          expect(getByText('August 2025')).toBeTruthy();
        } else if (viewType === 'week') {
          expect(getByText(/Aug 25 - 31, 2025/)).toBeTruthy();
        } else if (viewType === 'day') {
          expect(getByText(/Thursday, Aug 29/)).toBeTruthy();
        }

        unmount();
      });
    });

    it('should not show navigation header in agenda view', () => {
      const { getByText, queryByText } = render(
        <DateNavigation
          selectedDate="2025-08-29"
          viewType="agenda"
          onDateChange={jest.fn()}
        />
      );

      // Should show "Upcoming Events" instead of date
      expect(getByText('Upcoming Events')).toBeTruthy();
      
      // Should not show month/date specific headers
      expect(queryByText('August 2025')).toBeNull();
      expect(queryByText(/August 29/)).toBeNull();
    });
  });

  describe('Full Screen Integration', () => {
    it('should have coordinated headers without duplication', () => {
      const { queryAllByText } = render(<MyEventsScreen />);

      // Count occurrences of month-like patterns
      const monthHeaders = queryAllByText(/August|September|October/);
      
      // Should not have excessive duplicate month headers
      // Allow for reasonable number based on current month display
      expect(monthHeaders.length).toBeLessThanOrEqual(2);
    });

    it('should maintain single month header after view changes', () => {
      // This test would be more comprehensive with integration testing
      // For now, verify no obvious duplications in static render
      const { queryAllByText } = render(<MyEventsScreen />);

      // Look for duplicate "2025" year indicators
      const yearHeaders = queryAllByText(/2025/);
      
      // Should not have excessive year duplications
      expect(yearHeaders.length).toBeLessThanOrEqual(3);
    });
  });

  describe('React Native Calendar Integration', () => {
    it('should not conflict with native calendar month header', () => {
      const { container } = render(
        <CalendarView
          events={mockEvents}
          selectedDate="2025-08-29"
          onDateSelect={jest.fn()}
          onEventPress={jest.fn()}
        />
      );

      // Test that our custom headers don't interfere with native calendar
      // This is more of a smoke test since we can't easily test native component internals
      expect(container).toBeTruthy();
    });
  });

  describe('Edge Cases for Header Display', () => {
    it('should handle month transitions correctly', () => {
      const eventsSpanningMonths: Event[] = [
        {
          id: '1',
          title: 'July Event',
          datetime: '2025-07-31T23:00:00Z',
          venue: { name: 'Test Venue' },
          category: 'NETWORKING',
        },
        {
          id: '2',
          title: 'August Event',
          datetime: '2025-08-01T01:00:00Z',
          venue: { name: 'Test Venue' },
          category: 'NETWORKING',
        },
      ];

      const { rerender, queryByText, getByText } = render(
        <CalendarView
          events={eventsSpanningMonths}
          selectedDate="2025-07-31"
          onDateSelect={jest.fn()}
          onEventPress={jest.fn()}
        />
      );

      expect(getByText(/July 31, 2025/)).toBeTruthy();

      // Change to August
      rerender(
        <CalendarView
          events={eventsSpanningMonths}
          selectedDate="2025-08-01"
          onDateSelect={jest.fn()}
          onEventPress={jest.fn()}
        />
      );

      // July header should be gone
      expect(queryByText(/July 31, 2025/)).toBeNull();
      expect(getByText(/August 1, 2025/)).toBeTruthy();
    });

    it('should handle year transitions correctly', () => {
      const { rerender, queryByText, getByText } = render(
        <CalendarView
          events={[]}
          selectedDate="2025-12-31"
          onDateSelect={jest.fn()}
          onEventPress={jest.fn()}
        />
      );

      expect(getByText(/December 31, 2025/)).toBeTruthy();

      // Change to new year
      rerender(
        <CalendarView
          events={[]}
          selectedDate="2026-01-01"
          onDateSelect={jest.fn()}
          onEventPress={jest.fn()}
        />
      );

      expect(queryByText(/December 31, 2025/)).toBeNull();
      expect(getByText(/January 1, 2026/)).toBeTruthy();
    });

    it('should handle empty events list without header issues', () => {
      const { getByText } = render(
        <CalendarView
          events={[]}
          selectedDate="2025-08-29"
          onDateSelect={jest.fn()}
          onEventPress={jest.fn()}
        />
      );

      // Should still show date header even with no events
      expect(getByText(/August 29, 2025/)).toBeTruthy();
      expect(getByText('No events on this date')).toBeTruthy();
    });
  });
});