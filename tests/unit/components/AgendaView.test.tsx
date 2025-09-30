import React from 'react';
import { render } from '@testing-library/react-native';
import { AgendaView } from '../../../src/components/calendar/AgendaView';
import { Event } from '../../../src/types';

// Mock data for testing
const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Test Event',
    datetime: '2024-09-15T10:00:00Z',
    category: 'NETWORKING',
    imageUrl: 'https://example.com/image.jpg',
    venue: {
      id: '1',
      name: 'Test Venue',
      neighborhood: 'Test Neighborhood',
    },
    currentAttendees: 5,
    friendsAttending: 2,
    priceMin: 10,
    priceMax: 20,
  },
  {
    id: '2',
    title: null as any, // Testing null title
    datetime: '2024-09-15T14:00:00Z',
    category: 'CULTURE',
    imageUrl: 'https://example.com/image2.jpg',
    venue: {
      id: '2',
      name: null as any, // Testing null venue name
      neighborhood: undefined as any, // Testing undefined neighborhood
    },
    currentAttendees: undefined as any, // Testing undefined attendees
    friendsAttending: undefined as any, // Testing undefined friends
    priceMin: undefined as any, // Testing undefined price
    priceMax: undefined as any,
  },
];

describe('AgendaView Text Rendering Fix', () => {
  it('should render without "Text strings must be rendered within a <Text> component" error', () => {
    // This test will fail if there are any text rendering issues
    expect(() => {
      render(
        <AgendaView
          events={mockEvents}
          onEventPress={jest.fn()}
        />
      );
    }).not.toThrow();
  });

  it('should handle null and undefined values safely', () => {
    const { getByText } = render(
      <AgendaView
        events={mockEvents}
        onEventPress={jest.fn()}
      />
    );

    // Should render default text for null/undefined values
    expect(getByText('Unknown Venue')).toBeTruthy();
    expect(getByText('0 attending')).toBeTruthy();
  });

  it('should render venue information correctly when available', () => {
    const { getByText } = render(
      <AgendaView
        events={[mockEvents[0]]}
        onEventPress={jest.fn()}
      />
    );

    // Should render venue name and neighborhood
    expect(getByText('Test Venue, Test Neighborhood')).toBeTruthy();
    expect(getByText('5 attending')).toBeTruthy();
    expect(getByText('2 friends interested')).toBeTruthy();
    expect(getByText('$10 - $20')).toBeTruthy();
  });

  it('should render price information correctly', () => {
    const eventWithSinglePrice = {
      ...mockEvents[0],
      priceMax: 10, // Same as priceMin
    };

    const { getByText } = render(
      <AgendaView
        events={[eventWithSinglePrice]}
        onEventPress={jest.fn()}
      />
    );

    expect(getByText('$10')).toBeTruthy();
  });

  it('should handle empty events array', () => {
    const { getByText } = render(
      <AgendaView
        events={[]}
        onEventPress={jest.fn()}
      />
    );

    expect(getByText('No Events Scheduled')).toBeTruthy();
  });
});