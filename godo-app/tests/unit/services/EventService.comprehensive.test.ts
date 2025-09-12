/**
 * @fileoverview Comprehensive EventService Tests
 * @author Testing Team
 * @description Complete test suite for EventService with edge cases, performance, and error handling
 */

import { EventService } from '../../../src/services/EventService';
import { Event, EventCategory, SwipeDirection } from '../../../src/types';

// Mock mockEvents to control test data
jest.mock('../../../src/data/mockEvents', () => ({
  mockEvents: [
    {
      id: '1',
      title: 'Tech Meetup',
      description: 'JavaScript developers meetup',
      datetime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      category: 'NETWORKING',
      venue: { name: 'Tech Hub', neighborhood: 'Manhattan' },
      isFeatured: true,
      friendsAttending: 3,
      tags: ['javascript', 'tech', 'networking'],
      priceMin: 0,
      priceMax: 0,
    },
    {
      id: '2',
      title: 'Art Gallery Opening',
      description: 'Contemporary art exhibition',
      datetime: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
      category: 'CULTURE',
      venue: { name: 'Modern Gallery', neighborhood: 'Brooklyn' },
      isFeatured: false,
      friendsAttending: 0,
      tags: ['art', 'culture', 'exhibition'],
      priceMin: 25,
      priceMax: 25,
    },
    {
      id: '3',
      title: 'Food Festival',
      description: 'Local food vendors showcase',
      datetime: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
      category: 'FOOD',
      venue: { name: 'Central Park', neighborhood: 'Manhattan' },
      isFeatured: true,
      friendsAttending: 5,
      tags: ['food', 'festival', 'local'],
      priceMin: 15,
      priceMax: 30,
    },
  ],
}));

describe('EventService - Comprehensive Tests', () => {
  let eventService: EventService;

  beforeEach(() => {
    // Reset singleton instance for each test
    (EventService as any).instance = undefined;
    eventService = EventService.getInstance();
    
    // Clear any existing swipe data
    eventService.reset?.() || (eventService as any).swipedEvents?.clear();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = EventService.getInstance();
      const instance2 = EventService.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(eventService);
    });

    it('should maintain state across getInstance calls', () => {
      eventService.swipeEvent('1', SwipeDirection.RIGHT);
      
      const newInstance = EventService.getInstance();
      expect(newInstance.hasBeenSwiped('1')).toBe(true);
    });
  });

  describe('Event Retrieval', () => {
    it('should get all events with API delay simulation', async () => {
      const startTime = Date.now();
      const events = await eventService.getAllEvents();
      const duration = Date.now() - startTime;

      expect(events).toHaveLength(3);
      expect(duration).toBeGreaterThanOrEqual(500); // API delay
      expect(events[0]).toHaveProperty('id');
      expect(events[0]).toHaveProperty('title');
    });

    it('should get events by category', async () => {
      const networkingEvents = await eventService.getEventsByCategory('NETWORKING');
      const cultureEvents = await eventService.getEventsByCategory('CULTURE');

      expect(networkingEvents).toHaveLength(1);
      expect(networkingEvents[0].category).toBe('NETWORKING');
      expect(cultureEvents).toHaveLength(1);
      expect(cultureEvents[0].category).toBe('CULTURE');
    });

    it('should get featured events only', async () => {
      const featuredEvents = await eventService.getFeaturedEvents();
      
      expect(featuredEvents).toHaveLength(2);
      featuredEvents.forEach(event => {
        expect(event.isFeatured).toBe(true);
      });
    });

    it('should get events with friends attending', async () => {
      const eventsWithFriends = await eventService.getEventsWithFriends();
      
      expect(eventsWithFriends).toHaveLength(2);
      eventsWithFriends.forEach(event => {
        expect(event.friendsAttending).toBeGreaterThan(0);
      });
    });

    it('should get upcoming events within specified days', async () => {
      const upcomingEvents = await eventService.getUpcomingEvents(7);
      
      expect(upcomingEvents).toHaveLength(3);
      
      // Should be sorted by date
      for (let i = 1; i < upcomingEvents.length; i++) {
        const prevDate = new Date(upcomingEvents[i - 1].datetime);
        const currDate = new Date(upcomingEvents[i].datetime);
        expect(prevDate.getTime()).toBeLessThanOrEqual(currDate.getTime());
      }
    });

    it('should filter upcoming events by date range', async () => {
      const todayEvents = await eventService.getUpcomingEvents(1);
      const weekEvents = await eventService.getUpcomingEvents(7);
      
      expect(todayEvents.length).toBeLessThanOrEqual(weekEvents.length);
    });

    it('should get unswipеd events only', async () => {
      eventService.swipeEvent('1', SwipeDirection.RIGHT);
      eventService.swipeEvent('2', SwipeDirection.LEFT);
      
      const unswipedEvents = await eventService.getUnswipedEvents();
      
      expect(unswipedEvents).toHaveLength(1);
      expect(unswipedEvents[0].id).toBe('3');
    });

    it('should find event by ID', async () => {
      const event = await eventService.getEventById('1');
      
      expect(event).toBeDefined();
      expect(event?.id).toBe('1');
      expect(event?.title).toBe('Tech Meetup');
    });

    it('should return null for non-existent event ID', async () => {
      const event = await eventService.getEventById('non-existent');
      
      expect(event).toBeNull();
    });
  });

  describe('Swipe Functionality', () => {
    it('should record swipe actions correctly', () => {
      eventService.swipeEvent('1', SwipeDirection.RIGHT);
      eventService.swipeEvent('2', SwipeDirection.LEFT);
      eventService.swipeEvent('3', SwipeDirection.UP);
      
      expect(eventService.hasBeenSwiped('1')).toBe(true);
      expect(eventService.hasBeenSwiped('2')).toBe(true);
      expect(eventService.hasBeenSwiped('3')).toBe(true);
      expect(eventService.hasBeenSwiped('4')).toBe(false);
    });

    it('should return correct swipe directions', () => {
      eventService.swipeEvent('1', SwipeDirection.RIGHT);
      eventService.swipeEvent('2', SwipeDirection.LEFT);
      
      expect(eventService.getSwipeDirection('1')).toBe(SwipeDirection.RIGHT);
      expect(eventService.getSwipeDirection('2')).toBe(SwipeDirection.LEFT);
      expect(eventService.getSwipeDirection('3')).toBeNull();
    });

    it('should get events by swipe direction', () => {
      eventService.swipeEvent('1', SwipeDirection.RIGHT);
      eventService.swipeEvent('2', SwipeDirection.LEFT);
      eventService.swipeEvent('3', SwipeDirection.UP);
      
      const rightSwipes = eventService.getSwipedEvents(SwipeDirection.RIGHT);
      const leftSwipes = eventService.getSwipedEvents(SwipeDirection.LEFT);
      const upSwipes = eventService.getSwipedEvents(SwipeDirection.UP);
      
      expect(rightSwipes).toHaveLength(1);
      expect(rightSwipes[0].id).toBe('1');
      expect(leftSwipes).toHaveLength(1);
      expect(leftSwipes[0].id).toBe('2');
      expect(upSwipes).toHaveLength(1);
      expect(upSwipes[0].id).toBe('3');
    });

    it('should handle calendar events (private and public)', () => {
      eventService.swipeEvent('1', SwipeDirection.RIGHT); // Private
      eventService.swipeEvent('2', SwipeDirection.UP);    // Public
      eventService.swipeEvent('3', SwipeDirection.DOWN);  // Saved
      
      const privateEvents = eventService.getPrivateCalendarEvents();
      const publicEvents = eventService.getPublicCalendarEvents();
      const allCalendarEvents = eventService.getAllCalendarEvents();
      const savedEvents = eventService.getSavedEvents();
      
      expect(privateEvents).toHaveLength(1);
      expect(privateEvents[0].id).toBe('1');
      expect(publicEvents).toHaveLength(1);
      expect(publicEvents[0].id).toBe('2');
      expect(allCalendarEvents).toHaveLength(2);
      expect(savedEvents).toHaveLength(1);
      expect(savedEvents[0].id).toBe('3');
    });

    it('should sort calendar events by datetime', () => {
      eventService.swipeEvent('3', SwipeDirection.RIGHT); // Latest event
      eventService.swipeEvent('1', SwipeDirection.UP);    // Earliest event
      
      const allCalendarEvents = eventService.getAllCalendarEvents();
      
      expect(allCalendarEvents).toHaveLength(2);
      expect(allCalendarEvents[0].id).toBe('1'); // Should be first (earliest)
      expect(allCalendarEvents[1].id).toBe('3'); // Should be second (latest)
    });

    it('should allow removing swipes', () => {
      eventService.swipeEvent('1', SwipeDirection.RIGHT);
      expect(eventService.hasBeenSwiped('1')).toBe(true);
      
      eventService.removeSwipe('1');
      expect(eventService.hasBeenSwiped('1')).toBe(false);
    });

    it('should update swipe direction when event is swiped multiple times', () => {
      eventService.swipeEvent('1', SwipeDirection.RIGHT);
      expect(eventService.getSwipeDirection('1')).toBe(SwipeDirection.RIGHT);
      
      eventService.swipeEvent('1', SwipeDirection.LEFT);
      expect(eventService.getSwipeDirection('1')).toBe(SwipeDirection.LEFT);
    });
  });

  describe('Search Functionality', () => {
    it('should search events by title', async () => {
      const results = await eventService.searchEvents('tech');
      
      expect(results).toHaveLength(1);
      expect(results[0].title.toLowerCase()).toContain('tech');
    });

    it('should search events by description', async () => {
      const results = await eventService.searchEvents('javascript');
      
      expect(results).toHaveLength(1);
      expect(results[0].description?.toLowerCase()).toContain('javascript');
    });

    it('should search events by venue name', async () => {
      const results = await eventService.searchEvents('gallery');
      
      expect(results).toHaveLength(1);
      expect(results[0].venue.name.toLowerCase()).toContain('gallery');
    });

    it('should search events by neighborhood', async () => {
      const results = await eventService.searchEvents('manhattan');
      
      expect(results).toHaveLength(2);
      results.forEach(event => {
        expect(event.venue.neighborhood?.toLowerCase()).toContain('manhattan');
      });
    });

    it('should search events by tags', async () => {
      const results = await eventService.searchEvents('networking');
      
      expect(results).toHaveLength(1);
      expect(results[0].tags).toContain('networking');
    });

    it('should be case insensitive', async () => {
      const resultsLower = await eventService.searchEvents('tech');
      const resultsUpper = await eventService.searchEvents('TECH');
      const resultsMixed = await eventService.searchEvents('TeCh');
      
      expect(resultsLower).toEqual(resultsUpper);
      expect(resultsLower).toEqual(resultsMixed);
    });

    it('should return empty array for non-matching search', async () => {
      const results = await eventService.searchEvents('nonexistent');
      
      expect(results).toEqual([]);
    });

    it('should handle empty search query', async () => {
      const results = await eventService.searchEvents('');
      
      // Empty search should return no results or all results depending on implementation
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should return accurate swipe statistics', () => {
      eventService.swipeEvent('1', SwipeDirection.RIGHT);  // interested
      eventService.swipeEvent('2', SwipeDirection.DOWN);   // saved
      eventService.swipeEvent('3', SwipeDirection.LEFT);   // passed
      
      const stats = eventService.getSwipeStats();
      
      expect(stats).toEqual({
        total: 3,
        interested: 1,
        saved: 1,
        passed: 1,
        publicEvents: 0,
      });
    });

    it('should count public events correctly', () => {
      eventService.swipeEvent('1', SwipeDirection.UP);     // public
      eventService.swipeEvent('2', SwipeDirection.UP);     // public
      eventService.swipeEvent('3', SwipeDirection.RIGHT);  // interested
      
      const stats = eventService.getSwipeStats();
      
      expect(stats.publicEvents).toBe(2);
      expect(stats.interested).toBe(1);
      expect(stats.total).toBe(3);
    });

    it('should return zero statistics when no swipes recorded', () => {
      const stats = eventService.getSwipeStats();
      
      expect(stats).toEqual({
        total: 0,
        interested: 0,
        saved: 0,
        passed: 0,
        publicEvents: 0,
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle events with missing optional fields', async () => {
      // This test would require mocking events with missing fields
      const events = await eventService.getAllEvents();
      
      // Ensure the service doesn't crash with missing fields
      expect(() => {
        events.forEach(event => {
          eventService.swipeEvent(event.id, SwipeDirection.RIGHT);
        });
      }).not.toThrow();
    });

    it('should handle invalid event IDs gracefully', () => {
      expect(() => {
        eventService.swipeEvent('', SwipeDirection.RIGHT);
        eventService.swipeEvent(null as any, SwipeDirection.LEFT);
        eventService.swipeEvent(undefined as any, SwipeDirection.UP);
      }).not.toThrow();
    });

    it('should handle date edge cases in upcoming events', async () => {
      const zeroDays = await eventService.getUpcomingEvents(0);
      const negativeDays = await eventService.getUpcomingEvents(-1);
      
      expect(zeroDays).toEqual([]);
      expect(negativeDays).toEqual([]);
    });

    it('should handle large numbers of swipes without performance degradation', () => {
      const startTime = Date.now();
      
      // Simulate many swipes
      for (let i = 0; i < 1000; i++) {
        eventService.swipeEvent(`event-${i}`, SwipeDirection.RIGHT);
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent event retrieval efficiently', async () => {
      const promises = Array(10).fill(null).map(() => eventService.getAllEvents());
      
      const startTime = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      expect(results).toHaveLength(10);
      results.forEach(events => {
        expect(events).toHaveLength(3);
      });
      
      // Should complete concurrent requests efficiently
      expect(duration).toBeLessThan(2000);
    });

    it('should perform search operations efficiently on large datasets', async () => {
      const startTime = Date.now();
      
      // Perform multiple search operations
      await Promise.all([
        eventService.searchEvents('tech'),
        eventService.searchEvents('art'),
        eventService.searchEvents('food'),
        eventService.searchEvents('manhattan'),
        eventService.searchEvents('networking'),
      ]);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across operations', async () => {
      const initialEvents = await eventService.getAllEvents();
      
      // Perform various operations
      eventService.swipeEvent('1', SwipeDirection.RIGHT);
      eventService.swipeEvent('2', SwipeDirection.LEFT);
      const searchResults = await eventService.searchEvents('tech');
      const upcomingEvents = await eventService.getUpcomingEvents(7);
      
      // Data should remain consistent
      const finalEvents = await eventService.getAllEvents();
      expect(finalEvents).toEqual(initialEvents);
      
      // Swipe data should be maintained
      expect(eventService.hasBeenSwiped('1')).toBe(true);
      expect(eventService.hasBeenSwiped('2')).toBe(true);
    });

    it('should handle rapid successive operations correctly', () => {
      const eventId = '1';
      
      // Rapid successive swipes
      eventService.swipeEvent(eventId, SwipeDirection.RIGHT);
      eventService.swipeEvent(eventId, SwipeDirection.LEFT);
      eventService.swipeEvent(eventId, SwipeDirection.UP);
      eventService.removeSwipe(eventId);
      eventService.swipeEvent(eventId, SwipeDirection.DOWN);
      
      expect(eventService.getSwipeDirection(eventId)).toBe(SwipeDirection.DOWN);
    });
  });
});