// Edge case tests for text rendering validation
// These tests verify that all text content is properly wrapped in Text components

import React from 'react';
import { render } from '@testing-library/react-native';
import { EventCard } from '../src/components/events/EventCard';
import { SwipeOverlay } from '../src/components/events/SwipeOverlay';
import { SwipeCard } from '../src/components/events/SwipeCard';
import { SwipeDirection } from '../src/types';
import { formatPrice, formatFriendsAttending, formatEventDate } from '../src/utils';

// Mock animated values for testing
const mockSharedValue = (value) => ({
  value,
  addListener: jest.fn(),
  removeListener: jest.fn(),
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return {
    ...Reanimated,
    useSharedValue: jest.fn().mockImplementation(mockSharedValue),
    useAnimatedStyle: jest.fn().mockReturnValue({}),
    useAnimatedGestureHandler: jest.fn().mockReturnValue({}),
  };
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => ({
  PanGestureHandler: ({ children }) => children,
}));

describe('Text Rendering Edge Cases', () => {
  describe('EventCard with problematic data', () => {
    it('should handle undefined/null event properties', () => {
      const problematicEvent = {
        id: 'test-1',
        title: undefined,
        description: null,
        category: null,
        venue: {
          name: undefined,
          neighborhood: null,
        },
        priceMin: undefined,
        priceMax: null,
        friendsAttending: 0,
        currentAttendees: null,
        capacity: undefined,
        date: new Date(),
      };

      expect(() => {
        render(<EventCard event={problematicEvent} />);
      }).not.toThrow();
    });

    it('should handle special characters in text content', () => {
      const specialCharEvent = {
        id: 'test-2',
        title: 'Event with "quotes" & symbols < > { } [ ]',
        description: 'Description with émojis 🎉 and àccénts',
        category: 'CULTURE',
        venue: {
          name: 'Venue with symbols $%^&*()_+',
          neighborhood: 'Neighborhood with • bullets',
        },
        priceMin: 25,
        priceMax: 50,
        friendsAttending: 3,
        currentAttendees: 47,
        capacity: 100,
        date: new Date(),
        imageUrl: 'https://example.com/image.jpg',
      };

      expect(() => {
        render(<EventCard event={specialCharEvent} />);
      }).not.toThrow();
    });

    it('should handle very long text content', () => {
      const longTextEvent = {
        id: 'test-3',
        title: 'A'.repeat(200), // Very long title
        description: 'B'.repeat(1000), // Very long description
        category: 'NETWORKING',
        venue: {
          name: 'C'.repeat(100),
          neighborhood: 'D'.repeat(50),
        },
        priceMin: 0,
        friendsAttending: 999,
        currentAttendees: 9999,
        capacity: 10000,
        date: new Date(),
        imageUrl: 'https://example.com/image.jpg',
      };

      expect(() => {
        render(<EventCard event={longTextEvent} />);
      }).not.toThrow();
    });

    it('should handle empty strings', () => {
      const emptyStringEvent = {
        id: 'test-4',
        title: '',
        description: '',
        category: '',
        venue: {
          name: '',
          neighborhood: '',
        },
        priceMin: 0,
        friendsAttending: 0,
        currentAttendees: 0,
        capacity: 0,
        date: new Date(),
        imageUrl: '',
      };

      expect(() => {
        render(<EventCard event={emptyStringEvent} />);
      }).not.toThrow();
    });

    it('should handle numbers as strings correctly', () => {
      const numberEvent = {
        id: 'test-5',
        title: '2024 Annual Conference',
        description: 'Join us for the 5th annual tech conference',
        category: 'PROFESSIONAL',
        venue: {
          name: 'Building 123',
          neighborhood: 'District 9',
        },
        priceMin: 25.99,
        priceMax: 49.99,
        friendsAttending: 7,
        currentAttendees: 142,
        capacity: 500,
        date: new Date(),
        imageUrl: 'https://example.com/image.jpg',
      };

      expect(() => {
        render(<EventCard event={numberEvent} />);
      }).not.toThrow();
    });
  });

  describe('SwipeOverlay text rendering', () => {
    it('should render overlay text without errors', () => {
      const translateX = mockSharedValue(50);
      const translateY = mockSharedValue(0);

      expect(() => {
        render(<SwipeOverlay translateX={translateX} translateY={translateY} />);
      }).not.toThrow();
    });
  });

  describe('Utility function edge cases', () => {
    it('formatPrice should return strings for all inputs', () => {
      expect(typeof formatPrice(undefined, undefined)).toBe('string');
      expect(typeof formatPrice(null, null)).toBe('string');
      expect(typeof formatPrice(0, 0)).toBe('string');
      expect(typeof formatPrice(-5, 10)).toBe('string');
      expect(typeof formatPrice(NaN, 25)).toBe('string');
    });

    it('formatFriendsAttending should return strings for all inputs', () => {
      expect(typeof formatFriendsAttending(undefined)).toBe('string');
      expect(typeof formatFriendsAttending(null)).toBe('string');
      expect(typeof formatFriendsAttending(0)).toBe('string');
      expect(typeof formatFriendsAttending(-1)).toBe('string');
      expect(typeof formatFriendsAttending(NaN)).toBe('string');
    });

    it('formatEventDate should handle invalid dates', () => {
      expect(() => formatEventDate(null)).not.toThrow();
      expect(() => formatEventDate(undefined)).not.toThrow();
      expect(() => formatEventDate(new Date('invalid'))).not.toThrow();
      expect(() => formatEventDate('not-a-date')).not.toThrow();
    });
  });

  describe('SwipeCard gesture handling', () => {
    it('should handle swipe gestures without text rendering errors', () => {
      const testEvent = {
        id: 'swipe-test',
        title: 'Swipe Test Event',
        description: 'Testing swipe functionality',
        category: 'NETWORKING',
        venue: { name: 'Test Venue', neighborhood: 'Test Area' },
        date: new Date(),
        imageUrl: 'https://example.com/test.jpg',
        priceMin: 25,
        currentAttendees: 50,
        capacity: 100,
      };

      const mockOnSwipe = jest.fn();

      expect(() => {
        render(
          <SwipeCard
            event={testEvent}
            onSwipe={mockOnSwipe}
            index={0}
            totalCards={3}
          />
        );
      }).not.toThrow();
    });
  });
});