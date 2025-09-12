/**
 * API Event Service
 * Replaces the existing EventService with API integration while maintaining
 * backward compatibility with the existing interface
 */

import { Event, EventCategory, SwipeDirection } from '../types';
import { EventRepository } from '../repositories/EventRepository';
import { SwipeRepository } from '../repositories/SwipeRepository';
import { EventsListRequest } from '../api/types';
import { SwipeInteractionTracker } from './SwipeInteractionTracker';

/**
 * API Event Service Class
 * Drop-in replacement for the existing EventService with API integration
 */
export class ApiEventService {
  private static instance: ApiEventService;
  private eventRepository: EventRepository;
  private swipeRepository: SwipeRepository;
  private swipeTracker: SwipeInteractionTracker;

  // Local cache for immediate UI responses
  private localSwipeCache: Map<string, SwipeDirection> = new Map();

  private constructor() {
    this.eventRepository = EventRepository.getInstance();
    this.swipeRepository = SwipeRepository.getInstance();
    this.swipeTracker = SwipeInteractionTracker.getInstance();

    this.loadLocalSwipes();
  }

  public static getInstance(): ApiEventService {
    if (!ApiEventService.instance) {
      ApiEventService.instance = new ApiEventService();
    }
    return ApiEventService.instance;
  }

  /**
   * Get all events with optional filtering
   * Maintains compatibility with the original EventService interface
   */
  public async getAllEvents(): Promise<Event[]> {
    try {
      const response = await this.eventRepository.getEvents({
        limit: 100, // Get a reasonable number of events
      });
      return response.events;
    } catch (error) {
      // Failed to get all events - returning empty array
      return [];
    }
  }

  /**
   * Get events that haven't been swiped yet
   * Enhanced with server-side filtering when available
   */
  public async getUnswipedEvents(): Promise<Event[]> {
    try {
      const allEvents = await this.getAllEvents();

      // Filter out locally swiped events for immediate UI response
      const unswipedEvents = allEvents.filter(
        event => !this.localSwipeCache.has(event.id)
      );

      // TODO: In a real implementation, this would be handled server-side
      // The API would track user swipes and only return unswipped events

      return unswipedEvents;
    } catch (error) {
      // Failed to get unswiped events - returning empty array
      return [];
    }
  }

  /**
   * Get events by category
   */
  public async getEventsByCategory(category: EventCategory): Promise<Event[]> {
    try {
      return await this.eventRepository.getEventsByCategory(category);
    } catch (error) {
      // Failed to get category events - returning empty array
      return [];
    }
  }

  /**
   * Get featured events
   */
  public async getFeaturedEvents(): Promise<Event[]> {
    try {
      return await this.eventRepository.getFeaturedEvents();
    } catch (error) {
      // Failed to get featured events - returning empty array
      return [];
    }
  }

  /**
   * Get events with friends attending
   * Note: This would require additional API integration for social features
   */
  public async getEventsWithFriends(): Promise<Event[]> {
    try {
      // For now, filter from all events based on friendsAttending field
      const allEvents = await this.getAllEvents();
      return allEvents.filter(
        event => event.friendsAttending && event.friendsAttending > 0
      );
    } catch (error) {
      // Failed to get events with friends - returning empty array
      return [];
    }
  }

  /**
   * Get upcoming events in next N days
   */
  public async getUpcomingEvents(days: number = 7): Promise<Event[]> {
    try {
      return await this.eventRepository.getUpcomingEvents(days);
    } catch (error) {
      // Failed to get upcoming events - returning empty array
      return [];
    }
  }

  /**
   * Record a swipe action
   * Immediately updates local cache and syncs with API
   */
  public swipeEvent(eventId: string, direction: SwipeDirection): void {
    try {
      // Update local cache immediately for responsive UI
      this.localSwipeCache.set(eventId, direction);

      // Track interaction
      this.swipeTracker.recordSwipe(direction);

      // Sync with API in background
      this.syncSwipeWithAPI(eventId, direction);

      // Save to local storage for persistence
      this.saveLocalSwipes();
    } catch (error) {
      // Failed to record swipe - local cache still updated for UI responsiveness
    }
  }

  /**
   * Get swiped events by direction
   */
  public getSwipedEvents(direction: SwipeDirection): Event[] {
    try {
      // Filter events from local cache
      const swipedEventIds = Array.from(this.localSwipeCache.entries())
        .filter(([_, swipeDirection]) => swipeDirection === direction)
        .map(([eventId, _]) => eventId);

      // Note: In a real implementation, this would fetch from cache or API
      // For now, we'll return an empty array and let the calendar service handle it
      return [];
    } catch (error) {
      // Failed to get swiped events - returning empty array
      return [];
    }
  }

  /**
   * Get events for private calendar (right swipes)
   */
  public getPrivateCalendarEvents(): Event[] {
    return this.getSwipedEvents(SwipeDirection.RIGHT);
  }

  /**
   * Get events for public calendar (up swipes)
   */
  public getPublicCalendarEvents(): Event[] {
    return this.getSwipedEvents(SwipeDirection.UP);
  }

  /**
   * Get saved events (down swipes)
   */
  public getSavedEvents(): Event[] {
    return this.getSwipedEvents(SwipeDirection.DOWN);
  }

  /**
   * Get all calendar events (right + up swipes)
   */
  public getAllCalendarEvents(): Event[] {
    const privateEvents = this.getPrivateCalendarEvents();
    const publicEvents = this.getPublicCalendarEvents();

    return [...privateEvents, ...publicEvents].sort(
      (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );
  }

  /**
   * Check if event has been swiped
   */
  public hasBeenSwiped(eventId: string): boolean {
    return this.localSwipeCache.has(eventId);
  }

  /**
   * Get swipe direction for event
   */
  public getSwipeDirection(eventId: string): SwipeDirection | null {
    return this.localSwipeCache.get(eventId) || null;
  }

  /**
   * Remove swipe (undo action)
   */
  public removeSwipe(eventId: string): void {
    try {
      // Remove from local cache
      this.localSwipeCache.delete(eventId);

      // Sync with API
      this.undoSwipeWithAPI(eventId);

      // Save updated cache
      this.saveLocalSwipes();
    } catch (error) {
      // Failed to remove swipe
    }
  }

  /**
   * Get event by ID
   */
  public async getEventById(eventId: string): Promise<Event | null> {
    try {
      return await this.eventRepository.getEventById(eventId);
    } catch (error) {
      // Failed to get event by ID - returning null
      return null;
    }
  }

  /**
   * Search events
   */
  public async searchEvents(query: string): Promise<Event[]> {
    try {
      return await this.eventRepository.searchEvents({ query });
    } catch (error) {
      // Failed to search events - returning empty array
      return [];
    }
  }

  /**
   * Get statistics
   */
  public getSwipeStats(): {
    total: number;
    interested: number;
    saved: number;
    passed: number;
    publicEvents: number;
  } {
    const swipeEntries = Array.from(this.localSwipeCache.values());

    return {
      total: swipeEntries.length,
      interested: swipeEntries.filter(dir => dir === SwipeDirection.RIGHT)
        .length,
      saved: swipeEntries.filter(dir => dir === SwipeDirection.DOWN).length,
      passed: swipeEntries.filter(dir => dir === SwipeDirection.LEFT).length,
      publicEvents: swipeEntries.filter(dir => dir === SwipeDirection.UP)
        .length,
    };
  }

  /**
   * Get personalized event recommendations
   */
  public async getRecommendations(limit: number = 20): Promise<Event[]> {
    try {
      return await this.eventRepository.getRecommendations(limit);
    } catch (error) {
      // Failed to get recommendations - returning empty array
      return [];
    }
  }

  /**
   * Sync swipe with API
   */
  private async syncSwipeWithAPI(
    eventId: string,
    direction: SwipeDirection
  ): Promise<void> {
    try {
      await this.swipeRepository.recordSwipe({
        eventId,
        direction,
        timestamp: new Date().toISOString(),
        metadata: {
          sessionId: this.getSessionId(),
        },
      });
    } catch (error) {
      // Failed to sync swipe with API - local cache maintained for UI responsiveness
      // Don't throw error to maintain UI responsiveness
    }
  }

  /**
   * Undo swipe with API
   */
  private async undoSwipeWithAPI(eventId: string): Promise<void> {
    try {
      await this.swipeRepository.undoSwipe(eventId);
    } catch (error) {
      // Failed to undo swipe with API
    }
  }

  /**
   * Load local swipes from storage
   */
  private async loadLocalSwipes(): Promise<void> {
    try {
      const stored =
        await this.eventRepository['secureStorage'].getItem<
          Array<[string, SwipeDirection]>
        >('local_swipes');
      if (stored) {
        this.localSwipeCache = new Map(stored);
      }
    } catch (error) {
      // Failed to load local swipes
    }
  }

  /**
   * Save local swipes to storage
   */
  private async saveLocalSwipes(): Promise<void> {
    try {
      const swipeArray = Array.from(this.localSwipeCache.entries());
      await this.eventRepository['secureStorage'].setItem(
        'local_swipes',
        swipeArray
      );
    } catch (error) {
      // Failed to save local swipes
    }
  }

  /**
   * Get or create session ID
   */
  private getSessionId(): string {
    // This would typically be managed by a session service
    return `session_${Date.now()}`;
  }

  /**
   * Clear all local data (useful for logout)
   */
  public clearLocalData(): void {
    this.localSwipeCache.clear();
    this.saveLocalSwipes();
    this.eventRepository.clearCache();
  }

  /**
   * Sync local swipes with server (useful for app startup)
   */
  public async syncWithServer(): Promise<void> {
    try {
      // Get server swipes and merge with local
      const serverSwipes = await this.swipeRepository.getSwipeHistory({
        limit: 1000, // Get recent swipes
      });

      // Merge server swipes with local cache
      for (const swipe of serverSwipes.swipes) {
        this.localSwipeCache.set(swipe.eventId, swipe.direction);
      }

      // Save merged data locally
      await this.saveLocalSwipes();
    } catch (error) {
      // Failed to sync with server
    }
  }
}
