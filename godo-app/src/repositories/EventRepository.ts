/**
 * Event Repository
 * Handles all event-related API operations with mock data fallback
 */

import { BaseRepository } from './BaseRepository';
import { API_ENDPOINTS } from '../config/api.config';
import { mockEvents } from '../data/mockEvents';
import { Event, EventCategory, SwipeDirection } from '../types';
import {
  EventsListRequest,
  EventsListResponse,
  EventDetailResponse,
  EventSearchRequest,
  ApiResponse,
} from '../api/types';

/**
 * Event Repository Class
 */
export class EventRepository extends BaseRepository<Event> {
  private static instance: EventRepository;

  private constructor() {
    super(API_ENDPOINTS.EVENTS.LIST.replace('/events', ''), {
      cache: {
        ttl: 10 * 60 * 1000, // 10 minutes for events
        maxSize: 200,
      },
      retry: {
        attempts: 3,
        delay: 2000,
      },
    });
  }

  public static getInstance(): EventRepository {
    if (!EventRepository.instance) {
      EventRepository.instance = new EventRepository();
    }
    return EventRepository.instance;
  }

  /**
   * Get all events with filtering and pagination
   */
  async getEvents(
    request: EventsListRequest = {}
  ): Promise<EventsListResponse> {
    try {
      // Use mock data if configured
      if (this.shouldUseMockData()) {
        return this.getMockEventsResponse(request);
      }

      const response = await this.get<EventsListResponse>(
        API_ENDPOINTS.EVENTS.LIST,
        request,
        {
          cacheKey: this.generateCacheKey('events_list', request),
          cacheTTL: 10 * 60 * 1000, // 10 minutes
        }
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to load events');
    } catch (error) {
      console.error('EventRepository: Failed to get events:', error);

      // Fallback to mock data on error
      if (!this.shouldUseMockData()) {
        console.warn('Falling back to mock data due to API error');
        return this.getMockEventsResponse(request);
      }

      throw error;
    }
  }

  /**
   * Get event by ID
   */
  async getEventById(id: string): Promise<Event | null> {
    try {
      // Use mock data if configured
      if (this.shouldUseMockData()) {
        const event = mockEvents.find(e => e.id === id);
        return event || null;
      }

      const response = await this.get<EventDetailResponse>(
        API_ENDPOINTS.EVENTS.DETAIL(id),
        undefined,
        {
          cacheKey: `event_detail_${id}`,
          cacheTTL: 15 * 60 * 1000, // 15 minutes
        }
      );

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error(`EventRepository: Failed to get event ${id}:`, error);

      // Fallback to mock data
      if (!this.shouldUseMockData()) {
        const event = mockEvents.find(e => e.id === id);
        return event || null;
      }

      return null;
    }
  }

  /**
   * Search events
   */
  async searchEvents(request: EventSearchRequest): Promise<Event[]> {
    try {
      // Use mock data if configured
      if (this.shouldUseMockData()) {
        return this.getMockSearchResults(request);
      }

      const response = await this.get<{ events: Event[] }>(
        API_ENDPOINTS.EVENTS.SEARCH,
        request,
        {
          cacheKey: this.generateCacheKey('events_search', request),
          cacheTTL: 5 * 60 * 1000, // 5 minutes
        }
      );

      if (response.success && response.data) {
        return response.data.events;
      }

      throw new Error(response.message || 'Search failed');
    } catch (error) {
      console.error('EventRepository: Search failed:', error);

      // Fallback to mock search
      if (!this.shouldUseMockData()) {
        return this.getMockSearchResults(request);
      }

      throw error;
    }
  }

  /**
   * Get featured events
   */
  async getFeaturedEvents(): Promise<Event[]> {
    try {
      // Use mock data if configured
      if (this.shouldUseMockData()) {
        return mockEvents.filter(event => event.isFeatured);
      }

      const response = await this.get<{ events: Event[] }>(
        API_ENDPOINTS.EVENTS.FEATURED,
        undefined,
        {
          cacheKey: 'featured_events',
          cacheTTL: 30 * 60 * 1000, // 30 minutes
        }
      );

      if (response.success && response.data) {
        return response.data.events;
      }

      throw new Error(response.message || 'Failed to load featured events');
    } catch (error) {
      console.error('EventRepository: Failed to get featured events:', error);

      // Fallback to mock data
      if (!this.shouldUseMockData()) {
        return mockEvents.filter(event => event.isFeatured);
      }

      throw error;
    }
  }

  /**
   * Get events by category
   */
  async getEventsByCategory(category: EventCategory): Promise<Event[]> {
    try {
      // Use mock data if configured
      if (this.shouldUseMockData()) {
        return mockEvents.filter(event => event.category === category);
      }

      const response = await this.get<{ events: Event[] }>(
        API_ENDPOINTS.EVENTS.BY_CATEGORY(category),
        undefined,
        {
          cacheKey: `events_category_${category}`,
          cacheTTL: 15 * 60 * 1000, // 15 minutes
        }
      );

      if (response.success && response.data) {
        return response.data.events;
      }

      throw new Error(response.message || `Failed to load ${category} events`);
    } catch (error) {
      console.error(
        `EventRepository: Failed to get ${category} events:`,
        error
      );

      // Fallback to mock data
      if (!this.shouldUseMockData()) {
        return mockEvents.filter(event => event.category === category);
      }

      throw error;
    }
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(days: number = 7): Promise<Event[]> {
    try {
      // Use mock data if configured
      if (this.shouldUseMockData()) {
        return this.getMockUpcomingEvents(days);
      }

      const response = await this.get<{ events: Event[] }>(
        API_ENDPOINTS.EVENTS.UPCOMING,
        { days },
        {
          cacheKey: `upcoming_events_${days}d`,
          cacheTTL: 5 * 60 * 1000, // 5 minutes
        }
      );

      if (response.success && response.data) {
        return response.data.events;
      }

      throw new Error(response.message || 'Failed to load upcoming events');
    } catch (error) {
      console.error('EventRepository: Failed to get upcoming events:', error);

      // Fallback to mock data
      if (!this.shouldUseMockData()) {
        return this.getMockUpcomingEvents(days);
      }

      throw error;
    }
  }

  /**
   * Get personalized event recommendations
   */
  async getRecommendations(limit: number = 20): Promise<Event[]> {
    try {
      // Use mock data if configured
      if (this.shouldUseMockData()) {
        // Simple recommendation: return featured events and some random ones
        const featured = mockEvents.filter(event => event.isFeatured);
        const others = mockEvents
          .filter(event => !event.isFeatured)
          .sort(() => 0.5 - Math.random())
          .slice(0, limit - featured.length);

        return [...featured, ...others].slice(0, limit);
      }

      const response = await this.get<{ events: Event[] }>(
        API_ENDPOINTS.EVENTS.RECOMMENDATIONS,
        { limit },
        {
          cacheKey: `recommendations_${limit}`,
          cacheTTL: 15 * 60 * 1000, // 15 minutes
        }
      );

      if (response.success && response.data) {
        return response.data.events;
      }

      throw new Error(response.message || 'Failed to load recommendations');
    } catch (error) {
      console.error('EventRepository: Failed to get recommendations:', error);

      // Fallback to simple mock recommendations
      if (!this.shouldUseMockData()) {
        return mockEvents.slice(0, limit);
      }

      throw error;
    }
  }

  /**
   * Save event to user's saved list
   */
  async saveEvent(eventId: string): Promise<void> {
    try {
      if (this.shouldUseMockData()) {
        // In mock mode, just log the action
        console.log(`Mock: Saved event ${eventId}`);
        return;
      }

      const response = await this.post(
        API_ENDPOINTS.EVENTS.SAVE(eventId),
        undefined,
        { cache: false }
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to save event');
      }

      // Clear cache to refresh data
      this.clearCache();
    } catch (error) {
      this.handleError(error, 'save event');
    }
  }

  /**
   * Remove event from user's saved list
   */
  async unsaveEvent(eventId: string): Promise<void> {
    try {
      if (this.shouldUseMockData()) {
        // In mock mode, just log the action
        console.log(`Mock: Unsaved event ${eventId}`);
        return;
      }

      const response = await this.delete(API_ENDPOINTS.EVENTS.UNSAVE(eventId), {
        cache: false,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to unsave event');
      }

      // Clear cache to refresh data
      this.clearCache();
    } catch (error) {
      this.handleError(error, 'unsave event');
    }
  }

  /**
   * Mock data helper methods
   */
  private getMockEventsResponse(
    request: EventsListRequest
  ): EventsListResponse {
    let filteredEvents = [...mockEvents];

    // Apply category filter
    if (request.category) {
      filteredEvents = filteredEvents.filter(
        event => event.category === request.category
      );
    }

    // Apply search filter
    if (request.search) {
      const searchLower = request.search.toLowerCase();
      filteredEvents = filteredEvents.filter(
        event =>
          event.title.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower) ||
          event.venue.name.toLowerCase().includes(searchLower)
      );
    }

    // Apply date filter
    if (request.dateFrom || request.dateTo) {
      filteredEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.datetime);
        if (request.dateFrom && eventDate < new Date(request.dateFrom))
          return false;
        if (request.dateTo && eventDate > new Date(request.dateTo))
          return false;
        return true;
      });
    }

    // Apply price filter
    if (request.priceMin !== undefined || request.priceMax !== undefined) {
      filteredEvents = filteredEvents.filter(event => {
        const price = event.priceMin || 0;
        if (request.priceMin !== undefined && price < request.priceMin)
          return false;
        if (request.priceMax !== undefined && price > request.priceMax)
          return false;
        return true;
      });
    }

    // Apply pagination
    const page = request.page || 1;
    const limit = request.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

    return {
      events: paginatedEvents,
      meta: {
        page,
        limit,
        total: filteredEvents.length,
        totalPages: Math.ceil(filteredEvents.length / limit),
        hasNext: endIndex < filteredEvents.length,
        hasPrev: page > 1,
      },
    };
  }

  private getMockSearchResults(request: EventSearchRequest): Event[] {
    const query = request.query.toLowerCase();
    return mockEvents.filter(
      event =>
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.venue.name.toLowerCase().includes(query) ||
        event.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }

  private getMockUpcomingEvents(days: number): Event[] {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return mockEvents
      .filter(event => {
        const eventDate = new Date(event.datetime);
        return eventDate >= now && eventDate <= futureDate;
      })
      .sort(
        (a, b) =>
          new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
      );
  }
}
