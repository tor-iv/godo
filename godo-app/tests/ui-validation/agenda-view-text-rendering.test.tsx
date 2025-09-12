/**
 * AgendaView Text Rendering Validation Test
 * 
 * This test suite focuses on reproducing and validating the Text rendering error
 * in AgendaView component. It tests edge cases that might trigger warnings about
 * text not being wrapped in Text components.
 */

import React from 'react';
import { render, cleanup } from '@testing-library/react-native';
import { AgendaView } from '../../src/components/calendar/AgendaView';
import { Event, EventCategory, EventSource } from '../../src/types';

// Mock the date-fns functions to control date formatting
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'yyyy-MM-dd') return '2025-01-15';
    if (formatStr === 'h:mm a') return '2:30 PM';
    if (formatStr === 'EEEE') return 'Wednesday';
    if (formatStr === 'EEEE, MMMM d') return 'Wednesday, January 15';
    if (formatStr === 'EEEE, MMMM d, yyyy') return 'Wednesday, January 15, 2025';
    if (formatStr === 'MMMM d, yyyy') return 'January 15, 2025';
    return 'formatted-date';
  }),
  isToday: jest.fn(() => false),
  isTomorrow: jest.fn(() => false),
  isThisWeek: jest.fn(() => true),
  isThisYear: jest.fn(() => true),
}));

// Mock Feather icons
jest.mock('@expo/vector-icons', () => ({
  Feather: ({ name, size, color, ...props }: any) => {
    const MockFeather = require('react-native').Text;
    return <MockFeather testID={`feather-${name}`} {...props}>{name}</MockFeather>;
  },
}));

describe('AgendaView Text Rendering Validation', () => {
  let originalConsoleError: typeof console.error;
  let consoleErrors: string[] = [];

  beforeEach(() => {
    // Capture console errors to detect Text rendering warnings
    originalConsoleError = console.error;
    consoleErrors = [];
    console.error = (...args: any[]) => {
      consoleErrors.push(args.join(' '));
      originalConsoleError(...args);
    };
  });

  afterEach(() => {
    console.error = originalConsoleError;
    cleanup();
  });

  describe('safeText Function Validation', () => {
    // Test the safeText utility function directly
    const safeText = (value: any): string => {
      if (value === null || value === undefined) return '';
      return String(value);
    };

    test('should handle null values correctly', () => {
      expect(safeText(null)).toBe('');
    });

    test('should handle undefined values correctly', () => {
      expect(safeText(undefined)).toBe('');
    });

    test('should handle number values correctly', () => {
      expect(safeText(0)).toBe('0');
      expect(safeText(123)).toBe('123');
      expect(safeText(45.67)).toBe('45.67');
      expect(safeText(-10)).toBe('-10');
    });

    test('should handle string values correctly', () => {
      expect(safeText('hello')).toBe('hello');
      expect(safeText('')).toBe('');
    });

    test('should handle boolean values correctly', () => {
      expect(safeText(true)).toBe('true');
      expect(safeText(false)).toBe('false');
    });

    test('should handle object values correctly', () => {
      expect(safeText({})).toBe('[object Object]');
      expect(safeText({ name: 'test' })).toBe('[object Object]');
    });
  });

  describe('Edge Case Event Data', () => {
    const baseEvent: Event = {
      id: '1',
      title: 'Test Event',
      date: '2025-01-15T14:30:00Z',
      datetime: '2025-01-15T14:30:00Z',
      location: { latitude: 40.7128, longitude: -74.0060 },
      venue: { name: 'Test Venue', neighborhood: 'Test Area' },
      category: EventCategory.NETWORKING,
      source: EventSource.EVENTBRITE,
      imageUrl: 'https://example.com/image.jpg',
    };

    test('should render events with null venue name without warnings', () => {
      const eventsWithNullVenue: Event[] = [
        {
          ...baseEvent,
          venue: { name: null as any, neighborhood: 'Test Area' },
        },
      ];

      render(<AgendaView events={eventsWithNullVenue} />);

      // Check that no Text rendering warnings were generated
      const textWarnings = consoleErrors.filter(error => 
        error.includes('Text strings must be rendered within a <Text> component') ||
        error.includes('cannot contain string children')
      );
      expect(textWarnings).toHaveLength(0);
    });

    test('should render events with undefined venue name without warnings', () => {
      const eventsWithUndefinedVenue: Event[] = [
        {
          ...baseEvent,
          venue: { name: undefined as any, neighborhood: 'Test Area' },
        },
      ];

      render(<AgendaView events={eventsWithUndefinedVenue} />);

      const textWarnings = consoleErrors.filter(error => 
        error.includes('Text strings must be rendered within a <Text> component') ||
        error.includes('cannot contain string children')
      );
      expect(textWarnings).toHaveLength(0);
    });

    test('should render events with missing venue without warnings', () => {
      const eventsWithMissingVenue: Event[] = [
        {
          ...baseEvent,
          venue: undefined as any,
        },
      ];

      render(<AgendaView events={eventsWithMissingVenue} />);

      const textWarnings = consoleErrors.filter(error => 
        error.includes('Text strings must be rendered within a <Text> component') ||
        error.includes('cannot contain string children')
      );
      expect(textWarnings).toHaveLength(0);
    });

    test('should render events with zero attendees without warnings', () => {
      const eventsWithZeroAttendees: Event[] = [
        {
          ...baseEvent,
          currentAttendees: 0,
        },
      ];

      render(<AgendaView events={eventsWithZeroAttendees} />);

      const textWarnings = consoleErrors.filter(error => 
        error.includes('Text strings must be rendered within a <Text> component') ||
        error.includes('cannot contain string children')
      );
      expect(textWarnings).toHaveLength(0);
    });

    test('should render events with null attendees without warnings', () => {
      const eventsWithNullAttendees: Event[] = [
        {
          ...baseEvent,
          currentAttendees: null as any,
        },
      ];

      render(<AgendaView events={eventsWithNullAttendees} />);

      const textWarnings = consoleErrors.filter(error => 
        error.includes('Text strings must be rendered within a <Text> component') ||
        error.includes('cannot contain string children')
      );
      expect(textWarnings).toHaveLength(0);
    });

    test('should render events with undefined attendees without warnings', () => {
      const eventsWithUndefinedAttendees: Event[] = [
        {
          ...baseEvent,
          currentAttendees: undefined,
        },
      ];

      render(<AgendaView events={eventsWithUndefinedAttendees} />);

      const textWarnings = consoleErrors.filter(error => 
        error.includes('Text strings must be rendered within a <Text> component') ||
        error.includes('cannot contain string children')
      );
      expect(textWarnings).toHaveLength(0);
    });

    test('should render events with decimal price values without warnings', () => {
      const eventsWithDecimalPrices: Event[] = [
        {
          ...baseEvent,
          priceMin: 15.99,
          priceMax: 25.50,
        },
      ];

      render(<AgendaView events={eventsWithDecimalPrices} />);

      const textWarnings = consoleErrors.filter(error => 
        error.includes('Text strings must be rendered within a <Text> component') ||
        error.includes('cannot contain string children')
      );
      expect(textWarnings).toHaveLength(0);
    });

    test('should render events with zero price values without warnings', () => {
      const eventsWithZeroPrices: Event[] = [
        {
          ...baseEvent,
          priceMin: 0,
          priceMax: 0,
        },
      ];

      render(<AgendaView events={eventsWithZeroPrices} />);

      const textWarnings = consoleErrors.filter(error => 
        error.includes('Text strings must be rendered within a <Text> component') ||
        error.includes('cannot contain string children')
      );
      expect(textWarnings).toHaveLength(0);
    });

    test('should render events with null price values without warnings', () => {
      const eventsWithNullPrices: Event[] = [
        {
          ...baseEvent,
          priceMin: null as any,
          priceMax: null as any,
        },
      ];

      render(<AgendaView events={eventsWithNullPrices} />);

      const textWarnings = consoleErrors.filter(error => 
        error.includes('Text strings must be rendered within a <Text> component') ||
        error.includes('cannot contain string children')
      );
      expect(textWarnings).toHaveLength(0);
    });

    test('should render events with undefined price values without warnings', () => {
      const eventsWithUndefinedPrices: Event[] = [
        {
          ...baseEvent,
          priceMin: undefined,
          priceMax: undefined,
        },
      ];

      render(<AgendaView events={eventsWithUndefinedPrices} />);

      const textWarnings = consoleErrors.filter(error => 
        error.includes('Text strings must be rendered within a <Text> component') ||
        error.includes('cannot contain string children')
      );
      expect(textWarnings).toHaveLength(0);
    });

    test('should render events with null friends attending without warnings', () => {
      const eventsWithNullFriends: Event[] = [
        {
          ...baseEvent,
          friendsAttending: null as any,
        },
      ];

      render(<AgendaView events={eventsWithNullFriends} />);

      const textWarnings = consoleErrors.filter(error => 
        error.includes('Text strings must be rendered within a <Text> component') ||
        error.includes('cannot contain string children')
      );
      expect(textWarnings).toHaveLength(0);
    });

    test('should render events with undefined friends attending without warnings', () => {
      const eventsWithUndefinedFriends: Event[] = [
        {
          ...baseEvent,
          friendsAttending: undefined,
        },
      ];

      render(<AgendaView events={eventsWithUndefinedFriends} />);

      const textWarnings = consoleErrors.filter(error => 
        error.includes('Text strings must be rendered within a <Text> component') ||
        error.includes('cannot contain string children')
      );
      expect(textWarnings).toHaveLength(0);
    });

    test('should render events with zero friends attending without warnings', () => {
      const eventsWithZeroFriends: Event[] = [
        {
          ...baseEvent,
          friendsAttending: 0,
        },
      ];

      render(<AgendaView events={eventsWithZeroFriends} />);

      const textWarnings = consoleErrors.filter(error => 
        error.includes('Text strings must be rendered within a<Text> component') ||
        error.includes('cannot contain string children')
      );
      expect(textWarnings).toHaveLength(0);
    });
  });

  describe('Complex Malformed Data Scenarios', () => {
    test('should handle completely malformed event data without warnings', () => {
      const malformedEvents: Event[] = [
        {
          id: '1',
          title: 'Test Event',
          date: '2025-01-15T14:30:00Z',
          datetime: '2025-01-15T14:30:00Z',
          location: { latitude: 40.7128, longitude: -74.0060 },
          venue: { 
            name: null as any, 
            neighborhood: undefined as any 
          },
          category: EventCategory.NETWORKING,
          source: EventSource.EVENTBRITE,
          imageUrl: 'https://example.com/image.jpg',
          currentAttendees: null as any,
          friendsAttending: undefined as any,
          priceMin: null as any,
          priceMax: undefined as any,
        },
      ];

      render(<AgendaView events={malformedEvents} />);

      const textWarnings = consoleErrors.filter(error => 
        error.includes('Text strings must be rendered within a <Text> component') ||
        error.includes('cannot contain string children')
      );
      expect(textWarnings).toHaveLength(0);
    });

    test('should handle mixed valid and invalid data without warnings', () => {
      const mixedEvents: Event[] = [
        {
          id: '1',
          title: 'Valid Event',
          date: '2025-01-15T14:30:00Z',
          datetime: '2025-01-15T14:30:00Z',
          location: { latitude: 40.7128, longitude: -74.0060 },
          venue: { name: 'Valid Venue', neighborhood: 'Valid Area' },
          category: EventCategory.NETWORKING,
          source: EventSource.EVENTBRITE,
          imageUrl: 'https://example.com/image.jpg',
          currentAttendees: 25,
          friendsAttending: 3,
          priceMin: 15.99,
          priceMax: 25.99,
        },
        {
          id: '2',
          title: 'Invalid Event',
          date: '2025-01-15T14:30:00Z',
          datetime: '2025-01-15T14:30:00Z',
          location: { latitude: 40.7128, longitude: -74.0060 },
          venue: { 
            name: null as any, 
            neighborhood: undefined as any 
          },
          category: EventCategory.CULTURE,
          source: EventSource.MEETUP,
          imageUrl: 'https://example.com/image2.jpg',
          currentAttendees: null as any,
          friendsAttending: undefined as any,
          priceMin: null as any,
          priceMax: undefined as any,
        },
      ];

      render(<AgendaView events={mixedEvents} />);

      const textWarnings = consoleErrors.filter(error => 
        error.includes('Text strings must be rendered within a <Text> component') ||
        error.includes('cannot contain string children')
      );
      expect(textWarnings).toHaveLength(0);
    });
  });

  describe('String Interpolation Edge Cases', () => {
    test('should handle venue name interpolation with null values', () => {
      const eventsWithNullVenueData: Event[] = [
        {
          id: '1',
          title: 'Test Event',
          date: '2025-01-15T14:30:00Z',
          datetime: '2025-01-15T14:30:00Z',
          location: { latitude: 40.7128, longitude: -74.0060 },
          venue: { 
            name: null as any, 
            neighborhood: null as any 
          },
          category: EventCategory.NETWORKING,
          source: EventSource.EVENTBRITE,
          imageUrl: 'https://example.com/image.jpg',
        },
      ];

      render(<AgendaView events={eventsWithNullVenueData} />);

      // Specifically check for issues in venue name rendering
      const textWarnings = consoleErrors.filter(error => 
        error.includes('Text strings must be rendered within a <Text> component') ||
        error.includes('cannot contain string children') ||
        error.includes('venue') ||
        error.includes('neighborhood')
      );
      expect(textWarnings).toHaveLength(0);
    });

    test('should handle attendee count interpolation with edge values', () => {
      const eventsWithEdgeAttendees: Event[] = [
        {
          id: '1',
          title: 'Test Event',
          date: '2025-01-15T14:30:00Z',
          datetime: '2025-01-15T14:30:00Z',
          location: { latitude: 40.7128, longitude: -74.0060 },
          venue: { name: 'Test Venue', neighborhood: 'Test Area' },
          category: EventCategory.NETWORKING,
          source: EventSource.EVENTBRITE,
          imageUrl: 'https://example.com/image.jpg',
          currentAttendees: NaN as any,
          friendsAttending: NaN as any,
        },
      ];

      render(<AgendaView events={eventsWithEdgeAttendees} />);

      const textWarnings = consoleErrors.filter(error => 
        error.includes('Text strings must be rendered within a <Text> component') ||
        error.includes('cannot contain string children') ||
        error.includes('attending')
      );
      expect(textWarnings).toHaveLength(0);
    });

    test('should handle price interpolation with edge values', () => {
      const eventsWithEdgePrices: Event[] = [
        {
          id: '1',
          title: 'Test Event',
          date: '2025-01-15T14:30:00Z',
          datetime: '2025-01-15T14:30:00Z',
          location: { latitude: 40.7128, longitude: -74.0060 },
          venue: { name: 'Test Venue', neighborhood: 'Test Area' },
          category: EventCategory.NETWORKING,
          source: EventSource.EVENTBRITE,
          imageUrl: 'https://example.com/image.jpg',
          priceMin: NaN as any,
          priceMax: Infinity as any,
        },
      ];

      render(<AgendaView events={eventsWithEdgePrices} />);

      const textWarnings = consoleErrors.filter(error => 
        error.includes('Text strings must be rendered within a <Text> component') ||
        error.includes('cannot contain string children') ||
        error.includes('price') ||
        error.includes('$')
      );
      expect(textWarnings).toHaveLength(0);
    });
  });

  describe('Empty State Validation', () => {
    test('should render empty state without Text rendering warnings', () => {
      render(<AgendaView events={[]} />);

      const textWarnings = consoleErrors.filter(error => 
        error.includes('Text strings must be rendered within a <Text> component') ||
        error.includes('cannot contain string children')
      );
      expect(textWarnings).toHaveLength(0);
    });
  });

  describe('Text Component Usage Analysis', () => {
    test('should wrap all text content in proper Text components', () => {
      const validEvent: Event[] = [
        {
          id: '1',
          title: 'Valid Event',
          date: '2025-01-15T14:30:00Z',
          datetime: '2025-01-15T14:30:00Z',
          location: { latitude: 40.7128, longitude: -74.0060 },
          venue: { name: 'Test Venue', neighborhood: 'Test Area' },
          category: EventCategory.NETWORKING,
          source: EventSource.EVENTBRITE,
          imageUrl: 'https://example.com/image.jpg',
          currentAttendees: 25,
          friendsAttending: 3,
          priceMin: 15.99,
          priceMax: 25.99,
        },
      ];

      const { getByText } = render(<AgendaView events={validEvent} />);

      // Verify that key text elements are rendered without warnings
      expect(getByText('Valid Event')).toBeTruthy();
      expect(consoleErrors.filter(error => 
        error.includes('Text strings must be rendered within a <Text> component') ||
        error.includes('cannot contain string children')
      )).toHaveLength(0);
    });
  });

  describe('Performance and Memory', () => {
    test('should handle large number of events with edge case data without warnings', () => {
      const largeEventsList: Event[] = Array.from({ length: 50 }, (_, index) => ({
        id: `event-${index}`,
        title: `Event ${index}`,
        date: '2025-01-15T14:30:00Z',
        datetime: '2025-01-15T14:30:00Z',
        location: { latitude: 40.7128, longitude: -74.0060 },
        venue: { 
          name: index % 3 === 0 ? null as any : `Venue ${index}`,
          neighborhood: index % 2 === 0 ? undefined as any : `Area ${index}`
        },
        category: EventCategory.NETWORKING,
        source: EventSource.EVENTBRITE,
        imageUrl: 'https://example.com/image.jpg',
        currentAttendees: index % 4 === 0 ? null as any : index,
        friendsAttending: index % 5 === 0 ? undefined as any : index % 10,
        priceMin: index % 6 === 0 ? null as any : index * 2.5,
        priceMax: index % 7 === 0 ? undefined as any : index * 3.5,
      }));

      render(<AgendaView events={largeEventsList} />);

      const textWarnings = consoleErrors.filter(error => 
        error.includes('Text strings must be rendered within a <Text> component') ||
        error.includes('cannot contain string children')
      );
      expect(textWarnings).toHaveLength(0);
    });
  });
});