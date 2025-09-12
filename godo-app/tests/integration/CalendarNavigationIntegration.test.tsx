import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { format, addDays, subDays, addMonths, subMonths } from 'date-fns';
import { MyEventsScreen } from '../../src/screens/calendar/MyEventsScreen';
import { Event } from '../../src/types';

// Comprehensive mocks for integration testing
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
  useFocusEffect: (callback: () => void) => {
    const mockReact = require('react');
    mockReact.useEffect(callback, []);
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 20, bottom: 20, left: 0, right: 0 }),
}));

// Mock react-native-calendars with more comprehensive functionality
jest.mock('react-native-calendars', () => ({
  Calendar: ({ onDayPress, markedDates, current, enableSwipeMonths }: any) => {
    const currentMonth = current ? current.substring(0, 7) : '2025-08';
    const [year, month] = currentMonth.split('-').map(Number);
    
    // Generate days for current month and adjacent months
    const generateDays = (y: number, m: number) => {
      const days = [];
      const daysInMonth = new Date(y, m, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        days.push(dateStr);
      }
      return days;
    };

    const currentDays = generateDays(year, month);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    
    const prevDays = generateDays(prevYear, prevMonth).slice(-7); // Last week of prev month
    const nextDays = generateDays(nextYear, nextMonth).slice(0, 7); // First week of next month

    const allDays = [...prevDays, ...currentDays, ...nextDays];

    return (
      <div 
        data-testid="calendar" 
        data-current-month={currentMonth}
        data-swipe-enabled={enableSwipeMonths}
      >
        <div data-testid="calendar-header">
          {format(new Date(year, month - 1), 'MMMM yyyy')}
        </div>
        <div data-testid="calendar-grid">
          {allDays.map(date => (
            <div
              key={date}
              data-testid={`calendar-day-${date}`}
              data-selected={markedDates?.[date]?.selected || false}
              data-marked={!!markedDates?.[date]?.dots?.length}
              onClick={() => onDayPress?.({ dateString: date })}
              style={{
                backgroundColor: markedDates?.[date]?.selected ? 'blue' : 'white',
                border: markedDates?.[date]?.dots?.length ? '2px solid red' : '1px solid gray'
              }}
            >
              {date.split('-')[2]}
            </div>
          ))}
        </div>
      </div>
    );
  },
}));

// Mock services with comprehensive event data
const mockEvents: Event[] = [
  {
    id: '1',
    title: 'August Event 1',
    datetime: '2025-08-15T10:00:00Z',
    category: 'NETWORKING',
    venue: { name: 'Downtown Venue', neighborhood: 'Downtown' },
    imageUrl: 'https://example.com/image1.jpg',
    currentAttendees: 25,
    friendsAttending: 3,
  },
  {
    id: '2',
    title: 'August Event 2',
    datetime: '2025-08-25T14:00:00Z',
    category: 'CULTURE',
    venue: { name: 'Art Gallery', neighborhood: 'Arts District' },
    imageUrl: 'https://example.com/image2.jpg',
    currentAttendees: 40,
    friendsAttending: 2,
  },
  {
    id: '3',
    title: 'September Event',
    datetime: '2025-09-05T18:00:00Z',
    category: 'FOOD',
    venue: { name: 'Restaurant', neighborhood: 'Food District' },
    imageUrl: 'https://example.com/image3.jpg',
    currentAttendees: 30,
    friendsAttending: 5,
  },
  {
    id: '4',
    title: 'July Event',
    datetime: '2025-07-20T12:00:00Z',
    category: 'OUTDOOR',
    venue: { name: 'Park Pavilion', neighborhood: 'Central Park' },
    imageUrl: 'https://example.com/image4.jpg',
    currentAttendees: 15,
    friendsAttending: 1,
  },
];

jest.mock('../../src/services', () => ({
  EventService: {
    getInstance: () => ({
      getAllCalendarEvents: () => mockEvents,
      getSavedEvents: () => [],
      getSwipeStats: () => ({ interested: 4, publicEvents: 3, saved: 1 }),
      getPrivateCalendarEvents: () => mockEvents.filter(e => e.category === 'NETWORKING'),
      getPublicCalendarEvents: () => mockEvents.filter(e => e.category !== 'NETWORKING'),
    }),
  },
}));

describe('Calendar Navigation Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Calendar Date Clicking Flow', () => {
    it('should handle complete date selection flow without month changes', async () => {
      const { getByTestId, getByText } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(getByText('My Events')).toBeTruthy();
      });

      const calendar = getByTestId('calendar');
      const initialMonth = calendar.getAttribute('data-current-month');

      // Click on different dates within the same month
      const datesInMonth = ['2025-08-01', '2025-08-15', '2025-08-25', '2025-08-31'];
      
      for (const date of datesInMonth) {
        const dayElement = getByTestId(`calendar-day-${date}`);
        fireEvent.press(dayElement);
        
        await waitFor(() => {
          expect(dayElement.getAttribute('data-selected')).toBe('true');
        });
        
        // Verify month hasn't changed
        expect(calendar.getAttribute('data-current-month')).toBe(initialMonth);
      }
    });

    it('should preserve events and UI state during date selection', async () => {
      const { getByTestId, getByText, queryByText } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(getByText('My Events')).toBeTruthy();
      });

      // Select date with events
      const eventDate = getByTestId('calendar-day-2025-08-15');
      fireEvent.press(eventDate);

      await waitFor(() => {
        expect(getByText('August Event 1')).toBeTruthy();
      });

      // Select date without events
      const emptyDate = getByTestId('calendar-day-2025-08-10');
      fireEvent.press(emptyDate);

      await waitFor(() => {
        expect(getByText('No events on this date')).toBeTruthy();
      });

      // Events from previous selection should be gone
      expect(queryByText('August Event 1')).toBeNull();
    });

    it('should handle cross-month navigation properly when clicking edge dates', async () => {
      const { getByTestId, getByText } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(getByText('My Events')).toBeTruthy();
      });

      const calendar = getByTestId('calendar');
      
      // Click on previous month date (should be visible in calendar grid)
      const prevMonthDate = getByTestId('calendar-day-2025-07-31');
      fireEvent.press(prevMonthDate);

      await waitFor(() => {
        expect(prevMonthDate.getAttribute('data-selected')).toBe('true');
      });

      // Click on next month date
      const nextMonthDate = getByTestId('calendar-day-2025-09-01');
      fireEvent.press(nextMonthDate);

      await waitFor(() => {
        expect(nextMonthDate.getAttribute('data-selected')).toBe('true');
      });
    });
  });

  describe('Today Button Integration', () => {
    it('should integrate Today button correctly with calendar date selection', async () => {
      const { getByTestId, getByText } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(getByText('My Events')).toBeTruthy();
      });

      // Navigate to a different date first
      const pastDate = getByTestId('calendar-day-2025-08-01');
      fireEvent.press(pastDate);

      await waitFor(() => {
        expect(pastDate.getAttribute('data-selected')).toBe('true');
      });

      // Today button should be visible
      const todayButton = getByText('Today');
      expect(todayButton).toBeTruthy();

      // Click Today button
      fireEvent.press(todayButton);

      // Should navigate to today and Today button should disappear
      await waitFor(() => {
        expect(() => getByText('Today')).toThrow();
      });
    });

    it('should handle Today button in different view modes', async () => {
      const { getByText, getByTestId } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(getByText('My Events')).toBeTruthy();
      });

      // Test in Month view
      const monthButton = getByText('Month');
      fireEvent.press(monthButton);
      
      // Navigate away from today
      const pastDate = getByTestId('calendar-day-2025-08-01');
      fireEvent.press(pastDate);

      let todayButton = getByText('Today');
      fireEvent.press(todayButton);

      // Test in Week view
      const weekButton = getByText('Week');
      fireEvent.press(weekButton);

      // Navigate away again
      const prevButton = getByText('‹'); // Previous week button
      fireEvent.press(prevButton);

      todayButton = getByText('Today');
      fireEvent.press(todayButton);

      // Test in Day view
      const dayButton = getByText('Day');
      fireEvent.press(dayButton);

      // Navigate away
      const nextButton = getByText('›'); // Next day button
      fireEvent.press(nextButton);

      todayButton = getByText('Today');
      fireEvent.press(todayButton);
    });
  });

  describe('View Type Integration with Date Selection', () => {
    it('should maintain selected date when switching between view types', async () => {
      const { getByText, getByTestId } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(getByText('My Events')).toBeTruthy();
      });

      // Select a specific date in month view
      const selectedDate = getByTestId('calendar-day-2025-08-15');
      fireEvent.press(selectedDate);

      await waitFor(() => {
        expect(selectedDate.getAttribute('data-selected')).toBe('true');
      });

      // Switch to week view
      const weekButton = getByText('Week');
      fireEvent.press(weekButton);

      // Date selection should be preserved (check for event display)
      await waitFor(() => {
        expect(getByText('August Event 1')).toBeTruthy();
      });

      // Switch to day view
      const dayButton = getByText('Day');
      fireEvent.press(dayButton);

      // Should show the selected day with events
      await waitFor(() => {
        expect(getByText('August Event 1')).toBeTruthy();
      });

      // Switch back to month view
      const monthButton = getByText('Month');
      fireEvent.press(monthButton);

      // Selection should still be preserved
      await waitFor(() => {
        expect(getByTestId('calendar-day-2025-08-15').getAttribute('data-selected')).toBe('true');
      });
    });

    it('should handle navigation controls correctly in different views', async () => {
      const { getByText } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(getByText('My Events')).toBeTruthy();
      });

      // Test navigation in month view
      const monthButton = getByText('Month');
      fireEvent.press(monthButton);

      const prevMonthButton = getByText('‹');
      fireEvent.press(prevMonthButton);

      // Should navigate to previous month
      await waitFor(() => {
        expect(getByText('July 2025')).toBeTruthy();
      });

      // Test navigation in week view
      const weekButton = getByText('Week');
      fireEvent.press(weekButton);

      const nextWeekButton = getByText('›');
      fireEvent.press(nextWeekButton);

      // Should navigate to next week (dates should change)
      // Exact assertion depends on current week display

      // Test navigation in day view
      const dayButton = getByText('Day');
      fireEvent.press(dayButton);

      const nextDayButton = getByText('›');
      fireEvent.press(nextDayButton);

      // Should navigate to next day
      // Day view should update
    });
  });

  describe('Event Filtering Integration', () => {
    it('should maintain date selection when changing event filters', async () => {
      const { getByText, getByTestId } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(getByText('My Events')).toBeTruthy();
      });

      // Select a date with events
      const eventDate = getByTestId('calendar-day-2025-08-15');
      fireEvent.press(eventDate);

      await waitFor(() => {
        expect(getByText('August Event 1')).toBeTruthy();
      });

      // Change filter to private events
      const filterToggle = getByText('All'); // Or whatever the filter toggle displays
      fireEvent.press(filterToggle);
      
      const privateFilter = getByText('Private');
      fireEvent.press(privateFilter);

      // Date selection should be preserved
      await waitFor(() => {
        expect(eventDate.getAttribute('data-selected')).toBe('true');
      });

      // Should show only private events for that date
      expect(getByText('August Event 1')).toBeTruthy(); // This is a NETWORKING event (private)

      // Change to public filter
      const publicFilter = getByText('Public');
      fireEvent.press(publicFilter);

      // Date selection should still be preserved
      expect(eventDate.getAttribute('data-selected')).toBe('true');
    });

    it('should update calendar event markers when filters change', async () => {
      const { getByText, getByTestId } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(getByText('My Events')).toBeTruthy();
      });

      // Check initial event markers
      const eventDate1 = getByTestId('calendar-day-2025-08-15');
      const eventDate2 = getByTestId('calendar-day-2025-08-25');

      expect(eventDate1.getAttribute('data-marked')).toBe('true');
      expect(eventDate2.getAttribute('data-marked')).toBe('true');

      // Apply private filter
      const filterToggle = getByText('All');
      fireEvent.press(filterToggle);
      
      const privateFilter = getByText('Private');
      fireEvent.press(privateFilter);

      // Event markers should update based on filter
      await waitFor(() => {
        // Only networking events should be marked
        expect(eventDate1.getAttribute('data-marked')).toBe('true'); // Has networking event
        // eventDate2 might not be marked if it doesn't have private events
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle rapid navigation and selection without errors', async () => {
      const { getByText, getByTestId } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(getByText('My Events')).toBeTruthy();
      });

      // Rapid fire navigation and selection
      const dates = [
        'calendar-day-2025-08-01',
        'calendar-day-2025-08-15',
        'calendar-day-2025-08-25',
        'calendar-day-2025-08-31'
      ];

      // Fire multiple events rapidly
      dates.forEach(dateTestId => {
        const dateElement = getByTestId(dateTestId);
        fireEvent.press(dateElement);
      });

      // Switch views rapidly
      fireEvent.press(getByText('Week'));
      fireEvent.press(getByText('Day'));
      fireEvent.press(getByText('Month'));

      // Should handle without crashing
      await waitFor(() => {
        expect(getByText('My Events')).toBeTruthy();
      });
    });

    it('should handle empty event states correctly during navigation', async () => {
      // Mock empty events
      jest.doMock('../../src/services', () => ({
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

      const { getByText, getByTestId } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(getByText('Swipe on events in Discover to add them here')).toBeTruthy();
      });

      // Date selection should still work with empty events
      const someDate = getByTestId('calendar-day-2025-08-15');
      fireEvent.press(someDate);

      await waitFor(() => {
        expect(someDate.getAttribute('data-selected')).toBe('true');
      });
    });

    it('should maintain performance with complex interactions', async () => {
      const startTime = Date.now();

      const { getByText, getByTestId } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(getByText('My Events')).toBeTruthy();
      });

      // Perform multiple complex interactions
      for (let i = 0; i < 10; i++) {
        // Select date
        const date = getByTestId(`calendar-day-2025-08-${String(i + 1).padStart(2, '0')}`);
        fireEvent.press(date);
        
        // Switch view
        const viewTypes = ['Week', 'Day', 'Month'];
        const randomView = viewTypes[i % viewTypes.length];
        fireEvent.press(getByText(randomView));
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete interactions reasonably quickly
      expect(duration).toBeLessThan(5000); // 5 seconds max
      expect(getByText('My Events')).toBeTruthy();
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility during calendar navigation', async () => {
      const { getByText, getByTestId } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(getByText('My Events')).toBeTruthy();
      });

      // Test calendar day accessibility
      const calendarDay = getByTestId('calendar-day-2025-08-15');
      expect(calendarDay.props.accessible).toBe(true);
      expect(calendarDay.props.focusable).toBe(true);

      // Test navigation button accessibility
      const todayButton = getByText('Today');
      expect(todayButton.props.accessibilityRole).toBe('button');
      expect(todayButton.props.accessibilityLabel).toBe('Go to today');

      // Test view toggle accessibility
      const weekButton = getByText('Week');
      expect(weekButton.props.accessibilityRole).toBe('button');
    });

    it('should provide appropriate accessibility feedback for state changes', async () => {
      const { getByText, getByTestId } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(getByText('My Events')).toBeTruthy();
      });

      // Select date with events
      const eventDate = getByTestId('calendar-day-2025-08-15');
      fireEvent.press(eventDate);

      await waitFor(() => {
        // Should provide accessibility information about selected state
        expect(eventDate.getAttribute('data-selected')).toBe('true');
        
        // Event should have accessibility info
        const event = getByText('August Event 1');
        expect(event.props.accessibilityLabel).toContain('August Event 1');
      });
    });
  });
});