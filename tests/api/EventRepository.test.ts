/**
 * EventRepository Tests
 * Tests for event repository implementation
 */

import { EventRepository } from '../../godo-app/src/repositories/EventRepository';
import { HttpClient } from '../../godo-app/src/api/HttpClient';
import { mockEvents } from '../../godo-app/src/data/mockEvents';
import { EventCategory } from '../../godo-app/src/types';

// Mock dependencies
jest.mock('../../godo-app/src/api/HttpClient');

describe('EventRepository', () => {
  let eventRepository: EventRepository;
  let mockHttpClient: jest.Mocked<HttpClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset singleton
    (EventRepository as any).instance = undefined;
    
    // Mock HttpClient
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      clearCache: jest.fn(),
      getCacheStats: jest.fn(() => ({ size: 0, keys: [] })),
    } as any;

    (HttpClient.getInstance as jest.Mock).mockReturnValue(mockHttpClient);
    
    eventRepository = EventRepository.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = EventRepository.getInstance();
      const instance2 = EventRepository.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getEvents', () => {
    it('should fetch events from API when not in mock mode', async () => {
      const mockResponse = {
        success: true,
        data: {
          events: mockEvents.slice(0, 5),
          meta: {
            page: 1,
            limit: 5,
            total: 5,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        },
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);
      jest.spyOn(eventRepository as any, 'shouldUseMockData').mockReturnValue(false);

      const result = await eventRepository.getEvents({ limit: 5 });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/events',
        { limit: 5 },
        expect.objectContaining({
          cacheKey: expect.any(String),
          cacheTTL: 10 * 60 * 1000,
        })
      );

      expect(result.events).toHaveLength(5);
      expect(result.meta.total).toBe(5);
    });

    it('should return mock data when in mock mode', async () => {
      jest.spyOn(eventRepository as any, 'shouldUseMockData').mockReturnValue(true);

      const result = await eventRepository.getEvents({ limit: 5 });

      expect(mockHttpClient.get).not.toHaveBeenCalled();
      expect(result.events).toHaveLength(5);
      expect(result.events[0]).toHaveProperty('id');
      expect(result.events[0]).toHaveProperty('title');
    });

    it('should filter events by category in mock mode', async () => {
      jest.spyOn(eventRepository as any, 'shouldUseMockData').mockReturnValue(true);

      const result = await eventRepository.getEvents({
        category: EventCategory.NETWORKING,
        limit: 10,
      });

      expect(result.events.every(event => event.category === EventCategory.NETWORKING)).toBe(true);
    });

    it('should apply search filter in mock mode', async () => {
      jest.spyOn(eventRepository as any, 'shouldUseMockData').mockReturnValue(true);

      const result = await eventRepository.getEvents({
        search: 'networking',
        limit: 10,
      });

      expect(
        result.events.some(event => 
          event.title.toLowerCase().includes('networking') ||
          event.description?.toLowerCase().includes('networking')
        )
      ).toBe(true);
    });

    it('should handle API errors gracefully', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('API Error'));
      jest.spyOn(eventRepository as any, 'shouldUseMockData').mockReturnValue(false);

      const result = await eventRepository.getEvents();

      // Should fallback to mock data
      expect(result.events.length).toBeGreaterThan(0);
    });
  });

  describe('getEventById', () => {
    it('should fetch single event by ID', async () => {
      const mockEvent = mockEvents[0];
      mockHttpClient.get.mockResolvedValue({
        success: true,
        data: mockEvent,
      });

      jest.spyOn(eventRepository as any, 'shouldUseMockData').mockReturnValue(false);

      const result = await eventRepository.getEventById('1');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/events/1',
        undefined,
        expect.objectContaining({
          cacheKey: 'event_detail_1',
          cacheTTL: 15 * 60 * 1000,
        })
      );

      expect(result).toEqual(mockEvent);
    });

    it('should return null for non-existent event', async () => {
      mockHttpClient.get.mockResolvedValue({
        success: false,
        data: null,
      });

      jest.spyOn(eventRepository as any, 'shouldUseMockData').mockReturnValue(false);

      const result = await eventRepository.getEventById('999');

      expect(result).toBeNull();
    });

    it('should return mock event when in mock mode', async () => {
      jest.spyOn(eventRepository as any, 'shouldUseMockData').mockReturnValue(true);

      const result = await eventRepository.getEventById('1');

      expect(mockHttpClient.get).not.toHaveBeenCalled();
      expect(result).toBeTruthy();
      expect(result?.id).toBe('1');
    });
  });

  describe('searchEvents', () => {
    it('should search events via API', async () => {
      const searchResults = mockEvents.slice(0, 3);
      mockHttpClient.get.mockResolvedValue({
        success: true,
        data: { events: searchResults },
      });

      jest.spyOn(eventRepository as any, 'shouldUseMockData').mockReturnValue(false);

      const result = await eventRepository.searchEvents({
        query: 'networking',
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/events/search',
        { query: 'networking' },
        expect.objectContaining({
          cacheKey: expect.any(String),
          cacheTTL: 5 * 60 * 1000,
        })
      );

      expect(result).toEqual(searchResults);
    });

    it('should search mock events when in mock mode', async () => {
      jest.spyOn(eventRepository as any, 'shouldUseMockData').mockReturnValue(true);

      const result = await eventRepository.searchEvents({
        query: 'rooftop',
      });

      expect(mockHttpClient.get).not.toHaveBeenCalled();
      expect(result.length).toBeGreaterThan(0);
      expect(
        result.some(event => 
          event.title.toLowerCase().includes('rooftop') ||
          event.tags?.some(tag => tag.toLowerCase().includes('rooftop'))
        )
      ).toBe(true);
    });
  });

  describe('getFeaturedEvents', () => {
    it('should fetch featured events from API', async () => {
      const featuredEvents = mockEvents.filter(e => e.isFeatured);
      mockHttpClient.get.mockResolvedValue({
        success: true,
        data: { events: featuredEvents },
      });

      jest.spyOn(eventRepository as any, 'shouldUseMockData').mockReturnValue(false);

      const result = await eventRepository.getFeaturedEvents();

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/events/featured',
        undefined,
        expect.objectContaining({
          cacheKey: 'featured_events',
          cacheTTL: 30 * 60 * 1000,
        })
      );

      expect(result).toEqual(featuredEvents);
    });

    it('should return featured mock events when in mock mode', async () => {
      jest.spyOn(eventRepository as any, 'shouldUseMockData').mockReturnValue(true);

      const result = await eventRepository.getFeaturedEvents();

      expect(mockHttpClient.get).not.toHaveBeenCalled();
      expect(result.every(event => event.isFeatured)).toBe(true);
    });
  });

  describe('getEventsByCategory', () => {
    it('should fetch events by category from API', async () => {
      const categoryEvents = mockEvents.filter(e => e.category === EventCategory.CULTURE);
      mockHttpClient.get.mockResolvedValue({
        success: true,
        data: { events: categoryEvents },
      });

      jest.spyOn(eventRepository as any, 'shouldUseMockData').mockReturnValue(false);

      const result = await eventRepository.getEventsByCategory(EventCategory.CULTURE);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/events/category/CULTURE',
        undefined,
        expect.objectContaining({
          cacheKey: 'events_category_CULTURE',
          cacheTTL: 15 * 60 * 1000,
        })
      );

      expect(result).toEqual(categoryEvents);
    });

    it('should return category mock events when in mock mode', async () => {
      jest.spyOn(eventRepository as any, 'shouldUseMockData').mockReturnValue(true);

      const result = await eventRepository.getEventsByCategory(EventCategory.FITNESS);

      expect(mockHttpClient.get).not.toHaveBeenCalled();
      expect(result.every(event => event.category === EventCategory.FITNESS)).toBe(true);
    });
  });

  describe('saveEvent', () => {
    it('should save event via API', async () => {
      mockHttpClient.post.mockResolvedValue({
        success: true,
        data: undefined,
      });

      jest.spyOn(eventRepository as any, 'shouldUseMockData').mockReturnValue(false);

      await eventRepository.saveEvent('1');

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/events/1/save',
        undefined,
        { cache: false }
      );

      expect(mockHttpClient.clearCache).toHaveBeenCalled();
    });

    it('should handle save event in mock mode', async () => {
      jest.spyOn(eventRepository as any, 'shouldUseMockData').mockReturnValue(true);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await eventRepository.saveEvent('1');

      expect(mockHttpClient.post).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Mock: Saved event 1');
      
      consoleSpy.mockRestore();
    });

    it('should handle save event error', async () => {
      mockHttpClient.post.mockRejectedValue(new Error('Save failed'));
      jest.spyOn(eventRepository as any, 'shouldUseMockData').mockReturnValue(false);

      await expect(eventRepository.saveEvent('1')).rejects.toThrow('Save failed');
    });
  });

  describe('getRecommendations', () => {
    it('should fetch recommendations from API', async () => {
      const recommendations = mockEvents.slice(0, 10);
      mockHttpClient.get.mockResolvedValue({
        success: true,
        data: { events: recommendations },
      });

      jest.spyOn(eventRepository as any, 'shouldUseMockData').mockReturnValue(false);

      const result = await eventRepository.getRecommendations(10);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/events/recommendations',
        { limit: 10 },
        expect.objectContaining({
          cacheKey: 'recommendations_10',
          cacheTTL: 15 * 60 * 1000,
        })
      );

      expect(result).toEqual(recommendations);
    });

    it('should return mock recommendations when in mock mode', async () => {
      jest.spyOn(eventRepository as any, 'shouldUseMockData').mockReturnValue(true);

      const result = await eventRepository.getRecommendations(5);

      expect(mockHttpClient.get).not.toHaveBeenCalled();
      expect(result).toHaveLength(5);
    });
  });
});