import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { CalendarView } from '../../../src/components/calendar/CalendarView';
import { MyEventsScreen } from '../../../src/screens/calendar/MyEventsScreen';
import { Event } from '../../../src/types';

// Mock the calendar navigation and date components
jest.mock('react-native-calendars', () => ({
  Calendar: ({ onDayPress, markedDates, current }: any) => {
    const mockCurrentMonth = current ? current.substring(0, 7) : '2025-08';
    const mockDays = [
      `${mockCurrentMonth}-01`,
      `${mockCurrentMonth}-15`, 
      `${mockCurrentMonth}-28`,
    ];
    
    return (
      <div data-testid="calendar" data-current-month={mockCurrentMonth}>
        {mockDays.map(date => (
          <div
            key={date}
            data-testid={`calendar-day-${date}`}
            data-selected={markedDates?.[date]?.selected || false}
            onPress={() => onDayPress?.({ dateString: date })}
          >
            {date}
          </div>
        ))}
      </div>
    );
  },
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
  useFocusEffect: (callback: () => void) => {
    const mockReact = require('react');
    mockReact.useEffect(callback, []);
  },
}));

// Mock safe area
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 20, bottom: 20, left: 0, right: 0 }),
}));

// Mock services
jest.mock('../../../src/services', () => ({
  EventService: {
    getInstance: () => ({
      getAllCalendarEvents: () => mockEvents,
      getSavedEvents: () => [],
      getSwipeStats: () => ({ interested: 5, publicEvents: 3, saved: 2 }),
      getPrivateCalendarEvents: () => mockEvents.filter(e => e.category === 'NETWORKING'),
      getPublicCalendarEvents: () => mockEvents.filter(e => e.category !== 'NETWORKING'),
    }),
  },
}));

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'August Event 1',
    datetime: '2025-08-15T10:00:00Z',
    category: 'NETWORKING',
    venue: { name: 'Venue 1', neighborhood: 'Downtown' },
    imageUrl: 'https://example.com/image1.jpg',
    currentAttendees: 25,
    friendsAttending: 3,
  },
  {
    id: '2',
    title: 'August Event 2',
    datetime: '2025-08-28T14:00:00Z',
    category: 'CULTURE',
    venue: { name: 'Venue 2', neighborhood: 'Uptown' },
    imageUrl: 'https://example.com/image2.jpg',
    currentAttendees: 15,
    friendsAttending: 1,
  },
  {
    id: '3',
    title: 'September Event',
    datetime: '2025-09-05T18:00:00Z',
    category: 'FOOD',
    venue: { name: 'Venue 3', neighborhood: 'Midtown' },
    imageUrl: 'https://example.com/image3.jpg',
    currentAttendees: 30,
    friendsAttending: 2,
  },
];

describe('Month Preservation During Date Selection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Current Month Date Selection', () => {
    it('should maintain the current month when clicking dates within the same month', async () => {
      const mockOnDateSelect = jest.fn();
      const currentMonth = '2025-08';
      
      const { getByTestId } = render(
        <CalendarView
          events={mockEvents}
          selectedDate="2025-08-01"
          onDateSelect={mockOnDateSelect}
          onEventPress={jest.fn()}
        />
      );

      const calendarElement = getByTestId('calendar');
      expect(calendarElement.getAttribute('data-current-month')).toBe(currentMonth);

      // Click different dates within the same month
      const dates = ['2025-08-15', '2025-08-28'];
      
      for (const date of dates) {
        const dayElement = getByTestId(`calendar-day-${date}`);
        fireEvent.press(dayElement);
        
        await waitFor(() => {
          expect(mockOnDateSelect).toHaveBeenCalledWith(date);
        });
      }

      // Calendar should still display the same month
      expect(calendarElement.getAttribute('data-current-month')).toBe(currentMonth);
    });

    it('should preserve month context when selecting multiple dates in sequence', async () => {
      const mockOnDateSelect = jest.fn();
      
      const TestComponent = () => {
        const [selectedDate, setSelectedDate] = React.useState('2025-08-01');
        
        const handleDateSelect = (date: string) => {
          setSelectedDate(date);
          mockOnDateSelect(date);
        };

        return (
          <CalendarView
            events={mockEvents}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onEventPress={jest.fn()}
          />
        );
      };

      const { getByTestId } = render(<TestComponent />);

      const calendarElement = getByTestId('calendar');
      const initialMonth = calendarElement.getAttribute('data-current-month');

      // Select multiple dates in sequence
      const dateSequence = ['2025-08-15', '2025-08-28', '2025-08-01'];
      
      for (let i = 0; i < dateSequence.length; i++) {
        const date = dateSequence[i];
        const dayElement = getByTestId(`calendar-day-${date}`);
        fireEvent.press(dayElement);
        
        await waitFor(() => {
          expect(mockOnDateSelect).toHaveBeenNthCalledWith(i + 1, date);
        });
        
        // Month should remain consistent
        expect(calendarElement.getAttribute('data-current-month')).toBe(initialMonth);
      }
    });

    it('should not trigger month navigation when rapidly clicking dates', async () => {
      const mockOnDateSelect = jest.fn();
      
      const { getByTestId } = render(
        <CalendarView
          events={mockEvents}
          selectedDate="2025-08-15"
          onDateSelect={mockOnDateSelect}
          onEventPress={jest.fn()}
        />
      );

      const calendarElement = getByTestId('calendar');
      const originalMonth = calendarElement.getAttribute('data-current-month');

      // Rapid fire clicks on different dates
      const rapidDates = ['2025-08-01', '2025-08-15', '2025-08-28'];
      
      // Fire all clicks without waiting
      rapidDates.forEach(date => {
        const dayElement = getByTestId(`calendar-day-${date}`);
        fireEvent.press(dayElement);
      });

      // Wait for all callbacks to complete
      await waitFor(() => {
        expect(mockOnDateSelect).toHaveBeenCalledTimes(3);
      });

      // Month should be preserved throughout rapid clicking
      expect(calendarElement.getAttribute('data-current-month')).toBe(originalMonth);
    });
  });

  describe('Month Boundary Behavior', () => {
    it('should handle end-of-month date selection correctly', async () => {
      const mockOnDateSelect = jest.fn();
      
      const { getByTestId } = render(
        <CalendarView
          events={mockEvents}
          selectedDate="2025-08-01"
          onDateSelect={mockOnDateSelect}
          onEventPress={jest.fn()}
        />
      );

      // Click on last day of month
      const lastDayElement = getByTestId('calendar-day-2025-08-28');
      fireEvent.press(lastDayElement);

      await waitFor(() => {
        expect(mockOnDateSelect).toHaveBeenCalledWith('2025-08-28');
      });

      // Month context should be maintained
      const calendarElement = getByTestId('calendar');
      expect(calendarElement.getAttribute('data-current-month')).toBe('2025-08');
    });

    it('should handle first-of-month date selection correctly', async () => {
      const mockOnDateSelect = jest.fn();
      
      const { getByTestId } = render(
        <CalendarView
          events={mockEvents}
          selectedDate="2025-08-15"
          onDateSelect={mockOnDateSelect}
          onEventPress={jest.fn()}
        />
      );

      // Click on first day of month
      const firstDayElement = getByTestId('calendar-day-2025-08-01');
      fireEvent.press(firstDayElement);

      await waitFor(() => {
        expect(mockOnDateSelect).toHaveBeenCalledWith('2025-08-01');
      });

      // Month context should be maintained
      const calendarElement = getByTestId('calendar');
      expect(calendarElement.getAttribute('data-current-month')).toBe('2025-08');
    });

    it('should preserve month when clicking already selected date', async () => {
      const mockOnDateSelect = jest.fn();
      const selectedDate = '2025-08-15';
      
      const { getByTestId } = render(
        <CalendarView
          events={mockEvents}
          selectedDate={selectedDate}
          onDateSelect={mockOnDateSelect}
          onEventPress={jest.fn()}
        />
      );

      const calendarElement = getByTestId('calendar');
      const initialMonth = calendarElement.getAttribute('data-current-month');

      // Click on the already selected date
      const selectedDayElement = getByTestId(`calendar-day-${selectedDate}`);
      expect(selectedDayElement.getAttribute('data-selected')).toBe('true');
      
      fireEvent.press(selectedDayElement);

      await waitFor(() => {
        expect(mockOnDateSelect).toHaveBeenCalledWith(selectedDate);
      });

      // Month should be preserved
      expect(calendarElement.getAttribute('data-current-month')).toBe(initialMonth);
    });
  });

  describe('Integration with MyEventsScreen', () => {
    it('should maintain month integrity in full MyEventsScreen component', async () => {
      const { getByTestId, getByText } = render(<MyEventsScreen />);

      // Wait for component to load
      await waitFor(() => {
        expect(getByText('My Events')).toBeTruthy();
      });

      // Find calendar and verify it's displaying current month
      const calendarElement = getByTestId('calendar');
      const currentMonth = calendarElement.getAttribute('data-current-month');
      expect(currentMonth).toBeTruthy();

      // Click on a date within the current month
      const dayElement = getByTestId('calendar-day-2025-08-15');
      fireEvent.press(dayElement);

      // Month should remain the same
      await waitFor(() => {
        expect(calendarElement.getAttribute('data-current-month')).toBe(currentMonth);
      });
    });

    it('should preserve month when switching between view types after date selection', async () => {
      const { getByTestId, getByText } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(getByText('My Events')).toBeTruthy();
      });

      // Click on a date
      const dayElement = getByTestId('calendar-day-2025-08-15');
      fireEvent.press(dayElement);

      // Switch to different view (if view toggle exists)
      const weekButton = getByText('Week');
      fireEvent.press(weekButton);

      // Switch back to month view
      const monthButton = getByText('Month');
      fireEvent.press(monthButton);

      // Calendar should still show the correct month context
      const calendarElement = getByTestId('calendar');
      expect(calendarElement.getAttribute('data-current-month')).toBe('2025-08');
    });
  });

  describe('Event-Driven Month Preservation', () => {
    it('should maintain month when selecting dates with events', async () => {
      const mockOnDateSelect = jest.fn();
      const mockOnEventPress = jest.fn();
      
      const { getByTestId, getByText } = render(
        <CalendarView
          events={mockEvents}
          selectedDate="2025-08-01"
          onDateSelect={mockOnDateSelect}
          onEventPress={mockOnEventPress}
        />
      );

      const calendarElement = getByTestId('calendar');
      const originalMonth = calendarElement.getAttribute('data-current-month');

      // Select date with events
      const eventDateElement = getByTestId('calendar-day-2025-08-15');
      fireEvent.press(eventDateElement);

      await waitFor(() => {
        expect(mockOnDateSelect).toHaveBeenCalledWith('2025-08-15');
      });

      // Month should be preserved
      expect(calendarElement.getAttribute('data-current-month')).toBe(originalMonth);

      // Event should be clickable without affecting month
      const eventElement = getByText('August Event 1');
      fireEvent.press(eventElement);

      await waitFor(() => {
        expect(mockOnEventPress).toHaveBeenCalledWith(mockEvents[0]);
      });

      // Month should still be preserved after event interaction
      expect(calendarElement.getAttribute('data-current-month')).toBe(originalMonth);
    });

    it('should maintain month context when filtering events', async () => {
      const { getByTestId, getByText } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(getByText('My Events')).toBeTruthy();
      });

      const calendarElement = getByTestId('calendar');
      const originalMonth = calendarElement.getAttribute('data-current-month');

      // Change filter (if filter toggle exists)
      const filterElement = getByText('Private');
      fireEvent.press(filterElement);

      // Select a date after filtering
      const dayElement = getByTestId('calendar-day-2025-08-15');
      fireEvent.press(dayElement);

      // Month should be preserved despite filtering
      await waitFor(() => {
        expect(calendarElement.getAttribute('data-current-month')).toBe(originalMonth);
      });
    });
  });

  describe('State Management and Month Consistency', () => {
    it('should maintain consistent month state across component re-renders', async () => {
      const TestComponent = () => {
        const [selectedDate, setSelectedDate] = React.useState('2025-08-01');
        const [events, setEvents] = React.useState(mockEvents);
        
        return (
          <div>
            <button onClick={() => setEvents([...mockEvents, {
              id: '4',
              title: 'New Event',
              datetime: '2025-08-20T10:00:00Z',
              category: 'NETWORKING',
              venue: { name: 'New Venue' },
              imageUrl: 'https://example.com/new.jpg',
            } as Event])}>
              Add Event
            </button>
            <CalendarView
              events={events}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              onEventPress={jest.fn()}
            />
          </div>
        );
      };

      const { getByTestId, getByText } = render(<TestComponent />);

      const calendarElement = getByTestId('calendar');
      const originalMonth = calendarElement.getAttribute('data-current-month');

      // Add event (triggers re-render)
      const addButton = getByText('Add Event');
      fireEvent.press(addButton);

      // Select a date after state change
      const dayElement = getByTestId('calendar-day-2025-08-15');
      fireEvent.press(dayElement);

      // Month should remain consistent
      await waitFor(() => {
        expect(calendarElement.getAttribute('data-current-month')).toBe(originalMonth);
      });
    });

    it('should handle prop changes without unwanted month navigation', async () => {
      const TestWrapper = () => {
        const [selectedDate, setSelectedDate] = React.useState('2025-08-01');
        const [viewType, setViewType] = React.useState<'month' | 'week'>('month');
        
        return (
          <div>
            <button onClick={() => setViewType(viewType === 'month' ? 'week' : 'month')}>
              Toggle View
            </button>
            {viewType === 'month' && (
              <CalendarView
                events={mockEvents}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                onEventPress={jest.fn()}
              />
            )}
          </div>
        );
      };

      const { getByTestId, getByText } = render(<TestWrapper />);

      let calendarElement = getByTestId('calendar');
      const originalMonth = calendarElement.getAttribute('data-current-month');

      // Change view type and back
      const toggleButton = getByText('Toggle View');
      fireEvent.press(toggleButton);
      fireEvent.press(toggleButton);

      // Calendar should be back with preserved month
      calendarElement = getByTestId('calendar');
      expect(calendarElement.getAttribute('data-current-month')).toBe(originalMonth);
    });
  });
});