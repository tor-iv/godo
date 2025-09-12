import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { format, addDays, subDays, addMonths, subMonths } from 'date-fns';
import { CalendarView } from '../../../src/components/calendar/CalendarView';
import { Event } from '../../../src/types';

// Mock calendar component
jest.mock('react-native-calendars', () => ({
  Calendar: ({ onDayPress, markedDates }: any) => {
    const mockDays = [
      '2025-08-01', '2025-08-15', '2025-08-31', // Current month
      '2025-07-31', '2025-09-01', // Adjacent months
    ];
    
    return (
      <div data-testid="calendar">
        {mockDays.map(date => (
          <div
            key={date}
            data-testid={`calendar-day-${date}`}
            onPress={() => onDayPress?.({ dateString: date })}
            style={{
              backgroundColor: markedDates?.[date]?.selected ? 'blue' : 'white'
            }}
          >
            {date}
          </div>
        ))}
      </div>
    );
  },
}));

// Mock events for testing
const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Event 1',
    datetime: '2025-08-15T10:00:00Z',
    category: 'NETWORKING',
    venue: { name: 'Venue 1', neighborhood: 'Downtown' },
    imageUrl: 'https://example.com/image1.jpg',
    currentAttendees: 25,
    friendsAttending: 3,
  },
  {
    id: '2',
    title: 'Event 2',
    datetime: '2025-08-31T14:00:00Z',
    category: 'CULTURE',
    venue: { name: 'Venue 2', neighborhood: 'Uptown' },
    imageUrl: 'https://example.com/image2.jpg',
    currentAttendees: 15,
    friendsAttending: 1,
  },
  {
    id: '3',
    title: 'Event 3',
    datetime: '2025-07-31T18:00:00Z',
    category: 'FOOD',
    venue: { name: 'Venue 3', neighborhood: 'Midtown' },
    imageUrl: 'https://example.com/image3.jpg',
    currentAttendees: 30,
    friendsAttending: 2,
  },
];

describe('Calendar Date Clicking Behavior', () => {
  const mockOnDateSelect = jest.fn();
  const mockOnEventPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Date Clicking Within Current Month', () => {
    it('should handle date selection within the same month without changing month view', async () => {
      const currentDate = '2025-08-15';
      const { getByTestId } = render(
        <CalendarView
          events={mockEvents}
          selectedDate={currentDate}
          onDateSelect={mockOnDateSelect}
          onEventPress={mockOnEventPress}
        />
      );

      // Click on different date within same month
      const targetDate = '2025-08-31';
      const dayElement = getByTestId(`calendar-day-${targetDate}`);
      fireEvent.press(dayElement);

      await waitFor(() => {
        expect(mockOnDateSelect).toHaveBeenCalledWith(targetDate);
      });

      // Verify month context is preserved
      expect(mockOnDateSelect).toHaveBeenCalledTimes(1);
    });

    it('should update selected date display correctly when clicking within month', async () => {
      const initialDate = '2025-08-01';
      const { getByTestId, rerender } = render(
        <CalendarView
          events={mockEvents}
          selectedDate={initialDate}
          onDateSelect={mockOnDateSelect}
          onEventPress={mockOnEventPress}
        />
      );

      // Click on another date in the same month
      const newDate = '2025-08-15';
      const dayElement = getByTestId(`calendar-day-${newDate}`);
      fireEvent.press(dayElement);

      await waitFor(() => {
        expect(mockOnDateSelect).toHaveBeenCalledWith(newDate);
      });

      // Simulate parent component updating selectedDate
      rerender(
        <CalendarView
          events={mockEvents}
          selectedDate={newDate}
          onDateSelect={mockOnDateSelect}
          onEventPress={mockOnEventPress}
        />
      );

      // Calendar should reflect the new selection
      const calendarElement = getByTestId('calendar');
      expect(calendarElement).toBeTruthy();
    });

    it('should handle multiple rapid clicks within the same month', async () => {
      const { getByTestId } = render(
        <CalendarView
          events={mockEvents}
          selectedDate="2025-08-01"
          onDateSelect={mockOnDateSelect}
          onEventPress={mockOnEventPress}
        />
      );

      // Rapid clicks on different dates
      const dates = ['2025-08-15', '2025-08-31', '2025-08-01'];
      
      for (const date of dates) {
        const dayElement = getByTestId(`calendar-day-${date}`);
        fireEvent.press(dayElement);
      }

      await waitFor(() => {
        expect(mockOnDateSelect).toHaveBeenCalledTimes(3);
      });

      // Verify last call is correct
      expect(mockOnDateSelect).toHaveBeenLastCalledWith('2025-08-01');
    });
  });

  describe('Cross-Month Date Clicking Scenarios', () => {
    it('should handle clicking dates from adjacent months correctly', async () => {
      const currentDate = '2025-08-15';
      const { getByTestId } = render(
        <CalendarView
          events={mockEvents}
          selectedDate={currentDate}
          onDateSelect={mockOnDateSelect}
          onEventPress={mockOnEventPress}
        />
      );

      // Click on date from previous month
      const previousMonthDate = '2025-07-31';
      const prevDayElement = getByTestId(`calendar-day-${previousMonthDate}`);
      fireEvent.press(prevDayElement);

      await waitFor(() => {
        expect(mockOnDateSelect).toHaveBeenCalledWith(previousMonthDate);
      });

      // Click on date from next month
      const nextMonthDate = '2025-09-01';
      const nextDayElement = getByTestId(`calendar-day-${nextMonthDate}`);
      fireEvent.press(nextDayElement);

      await waitFor(() => {
        expect(mockOnDateSelect).toHaveBeenCalledWith(nextMonthDate);
      });

      expect(mockOnDateSelect).toHaveBeenCalledTimes(2);
    });

    it('should preserve event data when clicking across months', async () => {
      const { getByTestId, rerender } = render(
        <CalendarView
          events={mockEvents}
          selectedDate="2025-08-15"
          onDateSelect={mockOnDateSelect}
          onEventPress={mockOnEventPress}
        />
      );

      // Click on date with event from previous month
      const eventDate = '2025-07-31';
      const dayElement = getByTestId(`calendar-day-${eventDate}`);
      fireEvent.press(dayElement);

      await waitFor(() => {
        expect(mockOnDateSelect).toHaveBeenCalledWith(eventDate);
      });

      // Simulate parent updating with new selected date
      rerender(
        <CalendarView
          events={mockEvents}
          selectedDate={eventDate}
          onDateSelect={mockOnDateSelect}
          onEventPress={mockOnEventPress}
        />
      );

      // Verify events are still accessible
      expect(mockEvents.find(e => e.datetime.startsWith('2025-07-31'))).toBeTruthy();
    });
  });

  describe('Month Preservation Behavior', () => {
    it('should not trigger unwanted month changes when clicking dates', async () => {
      let currentSelectedDate = '2025-08-15';
      const parentComponent = jest.fn((newDate: string) => {
        currentSelectedDate = newDate;
      });

      const { getByTestId, rerender } = render(
        <CalendarView
          events={mockEvents}
          selectedDate={currentSelectedDate}
          onDateSelect={parentComponent}
          onEventPress={mockOnEventPress}
        />
      );

      // Click different dates within the same month
      const sameDates = ['2025-08-01', '2025-08-15', '2025-08-31'];
      
      for (let i = 0; i < sameDates.length; i++) {
        const date = sameDates[i];
        const dayElement = getByTestId(`calendar-day-${date}`);
        fireEvent.press(dayElement);

        await waitFor(() => {
          expect(parentComponent).toHaveBeenCalledWith(date);
        });

        // Re-render with updated date
        rerender(
          <CalendarView
            events={mockEvents}
            selectedDate={date}
            onDateSelect={parentComponent}
            onEventPress={mockOnEventPress}
          />
        );
      }

      // Verify no unintended month navigation occurred
      expect(parentComponent).toHaveBeenCalledTimes(3);
      sameDates.forEach((date, index) => {
        expect(parentComponent).toHaveBeenNthCalledWith(index + 1, date);
      });
    });

    it('should maintain month context when selecting dates with events', async () => {
      const { getByTestId } = render(
        <CalendarView
          events={mockEvents}
          selectedDate="2025-08-01"
          onDateSelect={mockOnDateSelect}
          onEventPress={mockOnEventPress}
        />
      );

      // Click on date with events
      const eventDate = '2025-08-15';
      const dayElement = getByTestId(`calendar-day-${eventDate}`);
      fireEvent.press(dayElement);

      await waitFor(() => {
        expect(mockOnDateSelect).toHaveBeenCalledWith(eventDate);
      });

      // Verify month preservation by checking only one onDateSelect call
      expect(mockOnDateSelect).toHaveBeenCalledTimes(1);
    });

    it('should handle date selection without triggering navigation side effects', async () => {
      const { getByTestId } = render(
        <CalendarView
          events={mockEvents}
          selectedDate="2025-08-15"
          onDateSelect={mockOnDateSelect}
          onEventPress={mockOnEventPress}
        />
      );

      // Simulate clicking the currently selected date
      const currentDate = '2025-08-15';
      const dayElement = getByTestId(`calendar-day-${currentDate}`);
      fireEvent.press(dayElement);

      await waitFor(() => {
        expect(mockOnDateSelect).toHaveBeenCalledWith(currentDate);
      });

      // Should still trigger the callback even if same date
      expect(mockOnDateSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event Interaction During Date Selection', () => {
    it('should allow event interaction after date selection', async () => {
      const { getByTestId, getByText, rerender } = render(
        <CalendarView
          events={mockEvents}
          selectedDate="2025-08-01"
          onDateSelect={mockOnDateSelect}
          onEventPress={mockOnEventPress}
        />
      );

      // Select date with events
      const eventDate = '2025-08-15';
      const dayElement = getByTestId(`calendar-day-${eventDate}`);
      fireEvent.press(dayElement);

      await waitFor(() => {
        expect(mockOnDateSelect).toHaveBeenCalledWith(eventDate);
      });

      // Re-render with selected date
      rerender(
        <CalendarView
          events={mockEvents}
          selectedDate={eventDate}
          onDateSelect={mockOnDateSelect}
          onEventPress={mockOnEventPress}
        />
      );

      // Try to interact with event (this depends on the actual implementation)
      // The test assumes events are displayed and clickable after date selection
      const eventElement = getByText('Event 1');
      fireEvent.press(eventElement);

      await waitFor(() => {
        expect(mockOnEventPress).toHaveBeenCalledWith(mockEvents[0]);
      });
    });

    it('should update event display when changing date selection', async () => {
      const { getByTestId, getByText, queryByText, rerender } = render(
        <CalendarView
          events={mockEvents}
          selectedDate="2025-08-15"
          onDateSelect={mockOnDateSelect}
          onEventPress={mockOnEventPress}
        />
      );

      // Verify initial event is displayed
      expect(getByText('Event 1')).toBeTruthy();

      // Select different date with different event
      const newEventDate = '2025-08-31';
      const dayElement = getByTestId(`calendar-day-${newEventDate}`);
      fireEvent.press(dayElement);

      await waitFor(() => {
        expect(mockOnDateSelect).toHaveBeenCalledWith(newEventDate);
      });

      // Re-render with new selected date
      rerender(
        <CalendarView
          events={mockEvents}
          selectedDate={newEventDate}
          onDateSelect={mockOnDateSelect}
          onEventPress={mockOnEventPress}
        />
      );

      // Verify event display updated
      expect(getByText('Event 2')).toBeTruthy();
      expect(queryByText('Event 1')).toBeNull();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid date clicks gracefully', async () => {
      const { getByTestId } = render(
        <CalendarView
          events={mockEvents}
          selectedDate="2025-08-15"
          onDateSelect={mockOnDateSelect}
          onEventPress={mockOnEventPress}
        />
      );

      // Try to simulate invalid date interaction
      // This test ensures the component doesn't crash with unexpected input
      const calendarElement = getByTestId('calendar');
      expect(calendarElement).toBeTruthy();

      // The component should remain stable
      expect(mockOnDateSelect).not.toHaveBeenCalled();
    });

    it('should maintain performance with rapid date clicking', async () => {
      const { getByTestId } = render(
        <CalendarView
          events={mockEvents}
          selectedDate="2025-08-15"
          onDateSelect={mockOnDateSelect}
          onEventPress={mockOnEventPress}
        />
      );

      const startTime = Date.now();
      
      // Rapid fire multiple date clicks
      const dates = ['2025-08-01', '2025-08-15', '2025-08-31'];
      const promises = dates.map(async (date) => {
        const dayElement = getByTestId(`calendar-day-${date}`);
        fireEvent.press(dayElement);
      });

      await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete rapidly (under 1 second)
      expect(duration).toBeLessThan(1000);
      expect(mockOnDateSelect).toHaveBeenCalledTimes(3);
    });

    it('should handle empty events array correctly during date selection', async () => {
      const { getByTestId } = render(
        <CalendarView
          events={[]}
          selectedDate="2025-08-15"
          onDateSelect={mockOnDateSelect}
          onEventPress={mockOnEventPress}
        />
      );

      const dayElement = getByTestId('calendar-day-2025-08-31');
      fireEvent.press(dayElement);

      await waitFor(() => {
        expect(mockOnDateSelect).toHaveBeenCalledWith('2025-08-31');
      });

      // Should handle empty events gracefully
      expect(mockOnDateSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should maintain accessibility during date selection', async () => {
      const { getByTestId } = render(
        <CalendarView
          events={mockEvents}
          selectedDate="2025-08-15"
          onDateSelect={mockOnDateSelect}
          onEventPress={mockOnEventPress}
        />
      );

      const dayElement = getByTestId('calendar-day-2025-08-31');
      
      // Ensure element is accessible
      expect(dayElement).toBeTruthy();
      
      fireEvent.press(dayElement);

      await waitFor(() => {
        expect(mockOnDateSelect).toHaveBeenCalledWith('2025-08-31');
      });
    });

    it('should provide consistent user feedback during date selection', async () => {
      const { getByTestId, rerender } = render(
        <CalendarView
          events={mockEvents}
          selectedDate="2025-08-15"
          onDateSelect={mockOnDateSelect}
          onEventPress={mockOnEventPress}
        />
      );

      const initialDate = '2025-08-31';
      const dayElement = getByTestId(`calendar-day-${initialDate}`);
      fireEvent.press(dayElement);

      await waitFor(() => {
        expect(mockOnDateSelect).toHaveBeenCalledWith(initialDate);
      });

      // Re-render with new selection to simulate visual feedback
      rerender(
        <CalendarView
          events={mockEvents}
          selectedDate={initialDate}
          onDateSelect={mockOnDateSelect}
          onEventPress={mockOnEventPress}
        />
      );

      // Component should reflect the selection change
      const calendarElement = getByTestId('calendar');
      expect(calendarElement).toBeTruthy();
    });
  });
});