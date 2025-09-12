import { Event, EventCategory, SwipeDirection } from '../types';
import { mockEvents } from '../data/mockEvents';
import { ApiEventService } from './ApiEventService';
import { getCurrentEnvironment } from '../config/api.config';

export class EventService {
  private static instance: EventService;
  private events: Event[] = [];
  private swipedEvents: Map<string, SwipeDirection> = new Map();
  private apiEventService: ApiEventService;
  private useApiLayer: boolean;

  private constructor() {
    this.events = [...mockEvents];
    this.apiEventService = ApiEventService.getInstance();

    // Determine whether to use API layer based on environment
    const env = getCurrentEnvironment();
    this.useApiLayer = !env.api.enableMockMode && !env.features.mockData;

    // Add some test swiped events for debugging (only in mock mode)
    if (!this.useApiLayer) {
      this.swipeEvent('1', SwipeDirection.RIGHT); // Private event
      this.swipeEvent('2', SwipeDirection.UP); // Public event
      this.swipeEvent('3', SwipeDirection.RIGHT); // Private event
      this.swipeEvent('4', SwipeDirection.UP); // Public event
    }
  }

  public static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }

  // Get all events
  public async getAllEvents(): Promise<Event[]> {
    try {
      if (this.useApiLayer) {
        return await this.apiEventService.getAllEvents();
      }
    } catch (error) {
      // API fallback - silent fallback to mock data
    }

    // Fallback to mock data
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...this.events];
  }

  // Get events that haven't been swiped yet
  public async getUnswipedEvents(): Promise<Event[]> {
    try {
      if (this.useApiLayer) {
        return await this.apiEventService.getUnswipedEvents();
      }
    } catch (error) {
      // API fallback - silent fallback to mock data
    }

    // Fallback to local implementation
    const allEvents = await this.getAllEvents();
    return allEvents.filter(event => !this.swipedEvents.has(event.id));
  }

  // Get events by category
  public async getEventsByCategory(category: EventCategory): Promise<Event[]> {
    try {
      if (this.useApiLayer) {
        return await this.apiEventService.getEventsByCategory(category);
      }
    } catch (error) {
      // API fallback - silent fallback to mock data
    }

    // Fallback to local implementation
    const allEvents = await this.getAllEvents();
    return allEvents.filter(event => event.category === category);
  }

  // Get featured events
  public async getFeaturedEvents(): Promise<Event[]> {
    try {
      if (this.useApiLayer) {
        return await this.apiEventService.getFeaturedEvents();
      }
    } catch (error) {
      // API fallback - silent fallback to mock data
    }

    // Fallback to local implementation
    const allEvents = await this.getAllEvents();
    return allEvents.filter(event => event.isFeatured);
  }

  // Get events with friends attending
  public async getEventsWithFriends(): Promise<Event[]> {
    try {
      if (this.useApiLayer) {
        return await this.apiEventService.getEventsWithFriends();
      }
    } catch (error) {
      // API fallback - silent fallback to mock data
    }

    // Fallback to local implementation
    const allEvents = await this.getAllEvents();
    return allEvents.filter(
      event => event.friendsAttending && event.friendsAttending > 0
    );
  }

  // Get upcoming events in next N days
  public async getUpcomingEvents(days: number = 7): Promise<Event[]> {
    try {
      if (this.useApiLayer) {
        return await this.apiEventService.getUpcomingEvents(days);
      }
    } catch (error) {
      // API fallback - silent fallback to mock data
    }

    // Fallback to local implementation
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const allEvents = await this.getAllEvents();
    return allEvents
      .filter(event => {
        const eventDate = new Date(event.datetime);
        return eventDate >= now && eventDate <= futureDate;
      })
      .sort(
        (a, b) =>
          new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
      );
  }

  // Record a swipe action
  public swipeEvent(eventId: string, direction: SwipeDirection): void {
    // Always update local cache for immediate UI response
    this.swipedEvents.set(eventId, direction);

    // If using API layer, delegate to API service
    if (this.useApiLayer) {
      try {
        this.apiEventService.swipeEvent(eventId, direction);
      } catch (error) {
        // API swipe recording failed - local cache is still updated
        // Local cache is still updated for UI responsiveness
      }
    }
  }

  // Get swiped events by direction
  public getSwipedEvents(direction: SwipeDirection): Event[] {
    try {
      if (this.useApiLayer) {
        return this.apiEventService.getSwipedEvents(direction);
      }
    } catch (error) {
      // API fallback - silent fallback to mock data
    }

    // Fallback to local implementation
    const swipedEventIds = Array.from(this.swipedEvents.entries())
      .filter(([_, swipeDirection]) => swipeDirection === direction)
      .map(([eventId, _]) => eventId);

    return this.events.filter(event => swipedEventIds.includes(event.id));
  }

  // Get events for private calendar (right swipes)
  public getPrivateCalendarEvents(): Event[] {
    try {
      if (this.useApiLayer) {
        return this.apiEventService.getPrivateCalendarEvents();
      }
    } catch (error) {
      // API fallback - silent fallback to mock data
    }

    // Fallback to local implementation
    const events = this.getSwipedEvents(SwipeDirection.RIGHT);
    return events;
  }

  // Get events for public calendar (up swipes)
  public getPublicCalendarEvents(): Event[] {
    try {
      if (this.useApiLayer) {
        return this.apiEventService.getPublicCalendarEvents();
      }
    } catch (error) {
      // API fallback - silent fallback to mock data
    }

    // Fallback to local implementation
    const events = this.getSwipedEvents(SwipeDirection.UP);
    return events;
  }

  // Get saved events (down swipes)
  public getSavedEvents(): Event[] {
    try {
      if (this.useApiLayer) {
        return this.apiEventService.getSavedEvents();
      }
    } catch (error) {
      // API fallback - silent fallback to mock data
    }

    // Fallback to local implementation
    return this.getSwipedEvents(SwipeDirection.DOWN);
  }

  // Get all calendar events (right + up swipes)
  public getAllCalendarEvents(): Event[] {
    try {
      if (this.useApiLayer) {
        return this.apiEventService.getAllCalendarEvents();
      }
    } catch (error) {
      // API fallback - silent fallback to mock data
    }

    // Fallback to local implementation
    return [
      ...this.getPrivateCalendarEvents(),
      ...this.getPublicCalendarEvents(),
    ].sort(
      (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );
  }

  /**
   * Additional API-enabled methods
   */

  // Get personalized recommendations
  public async getRecommendations(limit: number = 20): Promise<Event[]> {
    try {
      if (this.useApiLayer) {
        return await this.apiEventService.getRecommendations(limit);
      }
    } catch (error) {
      // API fallback - silent fallback to mock data
    }

    // Fallback: return featured events + random selection
    const featuredEvents = await this.getFeaturedEvents();
    const allEvents = await this.getAllEvents();
    const nonFeaturedEvents = allEvents
      .filter(event => !event.isFeatured)
      .sort(() => 0.5 - Math.random());

    return [...featuredEvents, ...nonFeaturedEvents].slice(0, limit);
  }

  // Clear local data (useful for logout)
  public clearLocalData(): void {
    this.swipedEvents.clear();

    if (this.useApiLayer) {
      try {
        this.apiEventService.clearLocalData();
      } catch (error) {
        // API clear local data failed - local cache still cleared
      }
    }
  }

  // Sync with API (useful for app startup)
  public async syncWithServer(): Promise<void> {
    if (this.useApiLayer) {
      try {
        await this.apiEventService.syncWithServer();

        // Update local cache from API data if needed
        // Successfully synced with server
      } catch (error) {
        // Server sync failed - operation continues
      }
    }
  }

  // Get current mode
  public isUsingApiLayer(): boolean {
    return this.useApiLayer;
  }

  // Force switch to API mode (for testing or user preference)
  public enableApiMode(enabled: boolean = true): void {
    this.useApiLayer = enabled;
  }

  // Check if event has been swiped
  public hasBeenSwiped(eventId: string): boolean {
    try {
      if (this.useApiLayer) {
        return this.apiEventService.hasBeenSwiped(eventId);
      }
    } catch (error) {
      // API fallback - silent fallback to mock data
    }

    // Fallback to local implementation
    return this.swipedEvents.has(eventId);
  }

  // Get swipe direction for event
  public getSwipeDirection(eventId: string): SwipeDirection | null {
    try {
      if (this.useApiLayer) {
        return this.apiEventService.getSwipeDirection(eventId);
      }
    } catch (error) {
      // API fallback - silent fallback to mock data
    }

    // Fallback to local implementation
    return this.swipedEvents.get(eventId) || null;
  }

  // Remove swipe (undo action)
  public removeSwipe(eventId: string): void {
    // Always update local cache immediately
    this.swipedEvents.delete(eventId);

    // If using API layer, sync with API
    if (this.useApiLayer) {
      try {
        this.apiEventService.removeSwipe(eventId);
      } catch (error) {
        // API swipe removal failed - local cache still updated
        // Local cache is still updated
      }
    }
  }

  // Get event by ID
  public async getEventById(eventId: string): Promise<Event | null> {
    try {
      if (this.useApiLayer) {
        return await this.apiEventService.getEventById(eventId);
      }
    } catch (error) {
      // API fallback - silent fallback to mock data
    }

    // Fallback to local implementation
    const allEvents = await this.getAllEvents();
    return allEvents.find(event => event.id === eventId) || null;
  }

  // Search events
  public async searchEvents(query: string): Promise<Event[]> {
    try {
      if (this.useApiLayer) {
        return await this.apiEventService.searchEvents(query);
      }
    } catch (error) {
      // API fallback - silent fallback to mock data
    }

    // Fallback to local implementation
    const allEvents = await this.getAllEvents();
    const lowercaseQuery = query.toLowerCase();

    return allEvents.filter(
      event =>
        event.title.toLowerCase().includes(lowercaseQuery) ||
        event.description?.toLowerCase().includes(lowercaseQuery) ||
        event.venue.name.toLowerCase().includes(lowercaseQuery) ||
        event.venue.neighborhood?.toLowerCase().includes(lowercaseQuery) ||
        event.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  // Get statistics
  public getSwipeStats(): {
    total: number;
    interested: number;
    saved: number;
    passed: number;
    publicEvents: number;
  } {
    try {
      if (this.useApiLayer) {
        return this.apiEventService.getSwipeStats();
      }
    } catch (error) {
      // API fallback - silent fallback to mock data
    }

    // Fallback to local implementation
    const swipedEntries = Array.from(this.swipedEvents.values());

    return {
      total: swipedEntries.length,
      interested: swipedEntries.filter(dir => dir === SwipeDirection.RIGHT)
        .length,
      saved: swipedEntries.filter(dir => dir === SwipeDirection.DOWN).length,
      passed: swipedEntries.filter(dir => dir === SwipeDirection.LEFT).length,
      publicEvents: swipedEntries.filter(dir => dir === SwipeDirection.UP)
        .length,
    };
  }
}
