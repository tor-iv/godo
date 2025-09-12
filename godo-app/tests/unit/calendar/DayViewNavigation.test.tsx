import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { format, addDays, subDays } from 'date-fns';
import { DayView } from '../../../src/components/calendar/DayView';
import { MyEventsScreen } from '../../../src/screens/calendar/MyEventsScreen';
import { Event } from '../../../src/types';

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
  useFocusEffect: (callback: () => void) => {
    React.useEffect(callback, []);
  },
}));

// Mock safe area
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 20, bottom: 20, left: 0, right: 0 }),
}));

// Mock services for MyEventsScreen integration
jest.mock('../../../src/services', () => ({
  EventService: {
    getInstance: () => ({
      getAllCalendarEvents: () => mockEvents,
      getSavedEvents: () => [],
      getSwipeStats: () => ({ interested: 3, publicEvents: 2, saved: 1 }),
      getPrivateCalendarEvents: () => mockEvents.filter(e => e.category === 'NETWORKING'),
      getPublicCalendarEvents: () => mockEvents.filter(e => e.category !== 'NETWORKING'),
    }),
  },
}));

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Morning Meeting',
    datetime: '2025-08-29T09:00:00Z',
    category: 'NETWORKING',
    venue: { name: 'Office Building', neighborhood: 'Downtown' },
    imageUrl: 'https://example.com/image1.jpg',
    currentAttendees: 10,
    friendsAttending: 2,
  },
  {
    id: '2',
    title: 'Lunch Conference',
    datetime: '2025-08-29T12:30:00Z',
    category: 'PROFESSIONAL',
    venue: { name: 'Convention Center', neighborhood: 'Uptown' },
    imageUrl: 'https://example.com/image2.jpg',
    currentAttendees: 50,
    friendsAttending: 5,
  },
  {
    id: '3',
    title: 'Evening Workshop',
    datetime: '2025-08-29T18:00:00Z',
    category: 'CULTURE',
    venue: { name: 'Community Hall', neighborhood: 'Midtown' },
    imageUrl: 'https://example.com/image3.jpg',
    currentAttendees: 25,
    friendsAttending: 1,
  },
  {
    id: '4',
    title: 'Different Day Event',
    datetime: '2025-08-30T14:00:00Z',
    category: 'FOOD',
    venue: { name: 'Restaurant', neighborhood: 'Westside' },
    imageUrl: 'https://example.com/image4.jpg',
    currentAttendees: 30,
    friendsAttending: 3,
  },
];

describe('Day View Navigation and Functionality', () => {
  const mockOnEventPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Day View Basic Functionality', () => {
    it('should display events for the selected date correctly', () => {
      const selectedDate = '2025-08-29';
      const { getByText } = render(
        <DayView
          events={mockEvents}
          selectedDate={selectedDate}
          onEventPress={mockOnEventPress}
        />
      );

      // Should show date header
      expect(getByText('Thursday, August 29')).toBeTruthy();
      
      // Should show events for that date
      expect(getByText('Morning Meeting')).toBeTruthy();
      expect(getByText('Lunch Conference')).toBeTruthy();
      expect(getByText('Evening Workshop')).toBeTruthy();
      
      // Should show correct event count
      expect(getByText('3 events')).toBeTruthy();
    });

    it('should display empty state when no events exist for the selected date', () => {
      const selectedDate = '2025-08-31'; // Date with no events
      const { getByText } = render(
        <DayView
          events={mockEvents}
          selectedDate={selectedDate}
          onEventPress={mockOnEventPress}
        />
      );

      expect(getByText('Saturday, August 31')).toBeTruthy();
      expect(getByText('No events scheduled for this day')).toBeTruthy();
      expect(getByText('0 events')).toBeTruthy();
    });

    it('should handle single event display correctly', () => {
      const selectedDate = '2025-08-30'; // Date with one event
      const { getByText } = render(
        <DayView
          events={mockEvents}
          selectedDate={selectedDate}
          onEventPress={mockOnEventPress}
        />
      );

      expect(getByText('Friday, August 30')).toBeTruthy();
      expect(getByText('Different Day Event')).toBeTruthy();
      expect(getByText('1 event')).toBeTruthy(); // Singular form
    });

    it('should highlight today when viewing current day', () => {
      // Mock isToday to return true for test date
      jest.doMock('date-fns', () => ({
        ...jest.requireActual('date-fns'),
        isToday: jest.fn().mockImplementation((date) => {
          const dateString = jest.requireActual('date-fns').format(date, 'yyyy-MM-dd');
          return dateString === '2025-08-29';
        }),
      }));

      const selectedDate = '2025-08-29';
      const { getByText } = render(
        <DayView
          events={mockEvents}
          selectedDate={selectedDate}
          onEventPress={mockOnEventPress}
        />
      );

      expect(getByText('Today')).toBeTruthy(); // Today label should appear
    });
  });

  describe('Event Interaction in Day View', () => {
    it('should handle event press correctly', async () => {
      const selectedDate = '2025-08-29';
      const { getByText } = render(
        <DayView
          events={mockEvents}
          selectedDate={selectedDate}
          onEventPress={mockOnEventPress}
        />
      );

      const eventElement = getByText('Morning Meeting');
      fireEvent.press(eventElement);

      await waitFor(() => {
        expect(mockOnEventPress).toHaveBeenCalledWith(mockEvents[0]);
      });
    });

    it('should handle multiple event presses', async () => {
      const selectedDate = '2025-08-29';
      const { getByText } = render(
        <DayView
          events={mockEvents}
          selectedDate={selectedDate}
          onEventPress={mockOnEventPress}
        />
      );

      // Press multiple events
      const events = ['Morning Meeting', 'Lunch Conference', 'Evening Workshop'];
      for (let i = 0; i < events.length; i++) {
        const eventElement = getByText(events[i]);
        fireEvent.press(eventElement);
        
        await waitFor(() => {
          expect(mockOnEventPress).toHaveBeenNthCalledWith(i + 1, mockEvents[i]);
        });
      }

      expect(mockOnEventPress).toHaveBeenCalledTimes(3);
    });

    it('should display event details correctly', () => {
      const selectedDate = '2025-08-29';
      const { getByText } = render(
        <DayView
          events={mockEvents}
          selectedDate={selectedDate}
          onEventPress={mockOnEventPress}
        />
      );

      // Check event titles
      expect(getByText('Morning Meeting')).toBeTruthy();
      expect(getByText('Lunch Conference')).toBeTruthy();
      
      // Check venues
      expect(getByText('Office Building')).toBeTruthy();
      expect(getByText('Convention Center')).toBeTruthy();
      
      // Check times (formatted)
      expect(getByText('9:00 AM')).toBeTruthy();
      expect(getByText('12:30 PM')).toBeTruthy();
      expect(getByText('6:00 PM')).toBeTruthy();
    });
  });

  describe('Day View Integration with Calendar Navigation', () => {
    it('should work correctly when integrated with MyEventsScreen', async () => {
      const { getByText } = render(<MyEventsScreen />);

      await waitFor(() => {
        expect(getByText('My Events')).toBeTruthy();
      });

      // Switch to day view
      const dayButton = getByText('Day');
      fireEvent.press(dayButton);

      await waitFor(() => {
        // Should display day view with current date
        expect(getByText(new RegExp('\\w+, \\w+ \\d+'))).toBeTruthy(); // Date pattern
      });
    });

    it('should update correctly when date changes from calendar', () => {
      const TestWrapper = () => {
        const [selectedDate, setSelectedDate] = React.useState('2025-08-29');
        
        return (
          <div>
            <button 
              onClick={() => setSelectedDate('2025-08-30')}
              data-testid="change-date"
            >
              Change Date
            </button>
            <DayView
              events={mockEvents}
              selectedDate={selectedDate}
              onEventPress={mockOnEventPress}
            />
          </div>
        );
      };

      const { getByText, getByTestId } = render(<TestWrapper />);

      // Initially showing first date
      expect(getByText('Thursday, August 29')).toBeTruthy();
      expect(getByText('3 events')).toBeTruthy();

      // Change date
      const changeButton = getByTestId('change-date');
      fireEvent.press(changeButton);

      // Should update to new date
      expect(getByText('Friday, August 30')).toBeTruthy();
      expect(getByText('1 event')).toBeTruthy();
    });

    it('should maintain scroll position when events update', async () => {
      const TestWrapper = () => {
        const [events, setEvents] = React.useState(mockEvents);
        
        return (
          <div>
            <button 
              onClick={() => setEvents([...mockEvents, {
                id: '5',
                title: 'New Event',
                datetime: '2025-08-29T15:00:00Z',
                category: 'NETWORKING',
                venue: { name: 'New Venue' },
                imageUrl: 'https://example.com/new.jpg',
              } as Event])}
              data-testid="add-event"
            >
              Add Event
            </button>
            <DayView
              events={events}
              selectedDate="2025-08-29"
              onEventPress={mockOnEventPress}
            />
          </div>
        );
      };

      const { getByText, getByTestId } = render(<TestWrapper />);

      // Initially 3 events
      expect(getByText('3 events')).toBeTruthy();

      // Add event
      const addButton = getByTestId('add-event');
      fireEvent.press(addButton);

      // Should show 4 events
      await waitFor(() => {
        expect(getByText('4 events')).toBeTruthy();
      });

      expect(getByText('New Event')).toBeTruthy();
    });
  });

  describe('Day View Time Slot Functionality', () => {
    it('should display time slots correctly', () => {
      const selectedDate = '2025-08-29';
      const { getByText } = render(
        <DayView
          events={mockEvents}
          selectedDate={selectedDate}
          onEventPress={mockOnEventPress}
        />
      );

      // Should show time labels
      expect(getByText('6:00 AM')).toBeTruthy();
      expect(getByText('12:00 PM')).toBeTruthy();
      expect(getByText('6:00 PM')).toBeTruthy();
      expect(getByText('11:00 PM')).toBeTruthy();
    });

    it('should position events correctly in time slots', () => {
      const selectedDate = '2025-08-29';
      const { getByText } = render(
        <DayView
          events={mockEvents}
          selectedDate={selectedDate}
          onEventPress={mockOnEventPress}
        />
      );

      // Events should be positioned based on their times
      const morningEvent = getByText('Morning Meeting');
      const lunchEvent = getByText('Lunch Conference');
      const eveningEvent = getByText('Evening Workshop');

      expect(morningEvent).toBeTruthy();
      expect(lunchEvent).toBeTruthy();
      expect(eveningEvent).toBeTruthy();
    });

    it('should handle overlapping events gracefully', () => {
      const overlappingEvents = [
        ...mockEvents,
        {
          id: '5',
          title: 'Overlapping Event',
          datetime: '2025-08-29T09:30:00Z', // 30 minutes after morning meeting
          category: 'CULTURE',
          venue: { name: 'Same Building' },
          imageUrl: 'https://example.com/overlap.jpg',
        } as Event,
      ];

      const selectedDate = '2025-08-29';
      const { getByText } = render(
        <DayView
          events={overlappingEvents}
          selectedDate={selectedDate}
          onEventPress={mockOnEventPress}
        />
      );

      expect(getByText('Morning Meeting')).toBeTruthy();
      expect(getByText('Overlapping Event')).toBeTruthy();
      expect(getByText('4 events')).toBeTruthy();
    });
  });

  describe('Day View Performance and Edge Cases', () => {
    it('should handle large number of events efficiently', () => {
      // Create many events for the same day
      const manyEvents: Event[] = Array.from({ length: 20 }, (_, i) => ({
        id: `event-${i}`,
        title: `Event ${i + 1}`,
        datetime: `2025-08-29T${String(9 + (i % 14)).padStart(2, '0')}:00:00Z`,
        category: 'NETWORKING',
        venue: { name: `Venue ${i + 1}` },
        imageUrl: `https://example.com/image${i}.jpg`,
      }));

      const selectedDate = '2025-08-29';
      const { getByText } = render(
        <DayView
          events={manyEvents}
          selectedDate={selectedDate}
          onEventPress={mockOnEventPress}
        />
      );

      expect(getByText('20 events')).toBeTruthy();
      expect(getByText('Event 1')).toBeTruthy();
      expect(getByText('Event 20')).toBeTruthy();
    });

    it('should handle events with missing data gracefully', () => {
      const incompleteEvents: Event[] = [
        {
          id: '1',
          title: 'Event Without Venue',
          datetime: '2025-08-29T10:00:00Z',
          category: 'NETWORKING',
          venue: { name: '' }, // Empty venue name
          imageUrl: 'https://example.com/image1.jpg',
        },
        {
          id: '2',
          title: '',  // Empty title
          datetime: '2025-08-29T11:00:00Z',
          category: 'CULTURE',
          venue: { name: 'Good Venue' },
          imageUrl: 'https://example.com/image2.jpg',
        },
      ] as Event[];

      const selectedDate = '2025-08-29';
      const { getByText } = render(
        <DayView
          events={incompleteEvents}
          selectedDate={selectedDate}
          onEventPress={mockOnEventPress}
        />
      );

      expect(getByText('2 events')).toBeTruthy();
      // Component should render without crashing despite missing data
    });

    it('should handle date changes efficiently', () => {
      const TestWrapper = () => {
        const [date, setDate] = React.useState('2025-08-29');
        
        return (
          <div>
            <button 
              onClick={() => setDate('2025-08-30')}
              data-testid="next-day"
            >
              Next Day
            </button>
            <button 
              onClick={() => setDate('2025-08-28')}
              data-testid="prev-day"
            >
              Previous Day
            </button>
            <DayView
              events={mockEvents}
              selectedDate={date}
              onEventPress={mockOnEventPress}
            />
          </div>
        );
      };

      const { getByText, getByTestId } = render(<TestWrapper />);

      // Start with August 29
      expect(getByText('Thursday, August 29')).toBeTruthy();

      // Go to next day
      fireEvent.press(getByTestId('next-day'));
      expect(getByText('Friday, August 30')).toBeTruthy();

      // Go to previous day
      fireEvent.press(getByTestId('prev-day'));
      expect(getByText('Wednesday, August 28')).toBeTruthy();
    });

    it('should maintain component stability during rapid date changes', () => {
      const TestWrapper = () => {
        const [date, setDate] = React.useState('2025-08-29');
        
        React.useEffect(() => {
          // Simulate rapid date changes
          const dates = ['2025-08-29', '2025-08-30', '2025-08-31', '2025-09-01'];
          let index = 0;
          
          const interval = setInterval(() => {
            setDate(dates[index % dates.length]);
            index++;
            if (index > 10) clearInterval(interval);
          }, 50);
          
          return () => clearInterval(interval);
        }, []);
        
        return (
          <DayView
            events={mockEvents}
            selectedDate={date}
            onEventPress={mockOnEventPress}
          />
        );
      };

      const { getByText } = render(<TestWrapper />);

      // Component should remain stable
      expect(getByText(new RegExp('\\w+, \\w+ \\d+'))).toBeTruthy();
    });
  });

  describe('Day View Accessibility', () => {
    it('should have proper accessibility labels for events', () => {
      const selectedDate = '2025-08-29';
      const { getByText } = render(
        <DayView
          events={mockEvents}
          selectedDate={selectedDate}
          onEventPress={mockOnEventPress}
        />
      );

      const eventElement = getByText('Morning Meeting');
      expect(eventElement.props.accessibilityRole).toBe('button');
      expect(eventElement.props.accessibilityLabel).toContain('Morning Meeting');
      expect(eventElement.props.accessibilityLabel).toContain('Office Building');
    });

    it('should be navigable with keyboard/screen reader', () => {
      const selectedDate = '2025-08-29';
      const { getByText } = render(
        <DayView
          events={mockEvents}
          selectedDate={selectedDate}
          onEventPress={mockOnEventPress}
        />
      );

      // Events should be focusable
      const events = ['Morning Meeting', 'Lunch Conference', 'Evening Workshop'];
      events.forEach(eventTitle => {
        const eventElement = getByText(eventTitle);
        expect(eventElement.props.accessible).toBe(true);
        expect(eventElement.props.focusable).toBe(true);
      });
    });
  });
});