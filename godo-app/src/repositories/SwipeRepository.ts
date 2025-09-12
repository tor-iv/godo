/**
 * Swipe Repository
 * Handles all swipe-related API operations
 */

import { BaseRepository } from './BaseRepository';
import { API_ENDPOINTS } from '../config/api.config';
import { SwipeDirection } from '../types';
import {
  SwipeRecordRequest,
  SwipeHistoryRequest,
  SwipeHistoryResponse,
  SwipeStatsResponse,
} from '../api/types';

/**
 * Swipe Repository Class
 */
export class SwipeRepository extends BaseRepository {
  private static instance: SwipeRepository;

  private constructor() {
    super('/swipes', {
      cache: {
        ttl: 2 * 60 * 1000, // 2 minutes for swipe data
        maxSize: 50,
      },
      retry: {
        attempts: 2,
        delay: 1000,
      },
    });
  }

  public static getInstance(): SwipeRepository {
    if (!SwipeRepository.instance) {
      SwipeRepository.instance = new SwipeRepository();
    }
    return SwipeRepository.instance;
  }

  /**
   * Record a swipe action
   */
  async recordSwipe(request: SwipeRecordRequest): Promise<void> {
    try {
      if (this.shouldUseMockData()) {
        console.log('Mock: Recorded swipe:', request);
        return;
      }

      const response = await this.post(
        API_ENDPOINTS.SWIPES.RECORD,
        request,
        { cache: false } // Don't cache POST requests
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to record swipe');
      }

      // Clear related cache
      this.clearCache();
    } catch (error) {
      this.handleError(error, 'record swipe');
    }
  }

  /**
   * Get swipe history with pagination
   */
  async getSwipeHistory(
    request: SwipeHistoryRequest = {}
  ): Promise<SwipeHistoryResponse> {
    try {
      if (this.shouldUseMockData()) {
        return this.getMockSwipeHistory(request);
      }

      const response = await this.get<SwipeHistoryResponse>(
        API_ENDPOINTS.SWIPES.HISTORY,
        request,
        {
          cacheKey: this.generateCacheKey('swipe_history', request),
          cacheTTL: 5 * 60 * 1000, // 5 minutes
        }
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to load swipe history');
    } catch (error) {
      console.error('SwipeRepository: Failed to get swipe history:', error);

      // Fallback to mock data
      if (!this.shouldUseMockData()) {
        return this.getMockSwipeHistory(request);
      }

      throw error;
    }
  }

  /**
   * Get swipe statistics
   */
  async getSwipeStats(): Promise<SwipeStatsResponse> {
    try {
      if (this.shouldUseMockData()) {
        return this.getMockSwipeStats();
      }

      const response = await this.get<SwipeStatsResponse>(
        API_ENDPOINTS.SWIPES.STATS,
        undefined,
        {
          cacheKey: 'swipe_stats',
          cacheTTL: 10 * 60 * 1000, // 10 minutes
        }
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to load swipe statistics');
    } catch (error) {
      console.error('SwipeRepository: Failed to get swipe stats:', error);

      // Fallback to mock data
      if (!this.shouldUseMockData()) {
        return this.getMockSwipeStats();
      }

      throw error;
    }
  }

  /**
   * Undo last swipe for an event
   */
  async undoSwipe(eventId: string): Promise<void> {
    try {
      if (this.shouldUseMockData()) {
        console.log(`Mock: Undid swipe for event ${eventId}`);
        return;
      }

      const response = await this.post(
        API_ENDPOINTS.SWIPES.UNDO,
        { eventId },
        { cache: false }
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to undo swipe');
      }

      // Clear related cache
      this.clearCache();
    } catch (error) {
      this.handleError(error, 'undo swipe');
    }
  }

  /**
   * Get swipes for specific event IDs
   */
  async getSwipesForEvents(eventIds: string[]): Promise<
    Array<{
      eventId: string;
      direction: SwipeDirection;
      timestamp: string;
    }>
  > {
    try {
      if (this.shouldUseMockData()) {
        // Return mock data for specified event IDs
        return eventIds.map(eventId => ({
          eventId,
          direction: SwipeDirection.RIGHT, // Mock direction
          timestamp: new Date().toISOString(),
        }));
      }

      const response = await this.post<{
        swipes: Array<{
          eventId: string;
          direction: SwipeDirection;
          timestamp: string;
        }>;
      }>(
        '/swipes/batch',
        { eventIds },
        {
          cacheKey: this.generateCacheKey('swipes_batch', { eventIds }),
          cacheTTL: 5 * 60 * 1000,
        }
      );

      if (response.success && response.data) {
        return response.data.swipes;
      }

      throw new Error(response.message || 'Failed to get swipes for events');
    } catch (error) {
      console.error('SwipeRepository: Failed to get swipes for events:', error);
      return [];
    }
  }

  /**
   * Bulk record multiple swipes (for offline sync)
   */
  async recordSwipesBatch(swipes: SwipeRecordRequest[]): Promise<void> {
    try {
      if (this.shouldUseMockData()) {
        console.log('Mock: Recorded batch swipes:', swipes);
        return;
      }

      const response = await this.post(
        '/swipes/batch',
        { swipes },
        { cache: false }
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to record swipes batch');
      }

      // Clear related cache
      this.clearCache();
    } catch (error) {
      this.handleError(error, 'record swipes batch');
    }
  }

  /**
   * Mock data helper methods
   */
  private getMockSwipeHistory(
    request: SwipeHistoryRequest
  ): SwipeHistoryResponse {
    // Generate mock swipe history
    const mockSwipes = [
      {
        id: 'swipe_1',
        eventId: '1',
        direction: SwipeDirection.RIGHT,
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      },
      {
        id: 'swipe_2',
        eventId: '2',
        direction: SwipeDirection.UP,
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      },
      {
        id: 'swipe_3',
        eventId: '3',
        direction: SwipeDirection.DOWN,
        timestamp: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
      },
    ];

    // Apply direction filter
    let filteredSwipes = mockSwipes;
    if (request.direction) {
      filteredSwipes = mockSwipes.filter(
        swipe => swipe.direction === request.direction
      );
    }

    // Apply pagination
    const page = request.page || 1;
    const limit = request.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSwipes = filteredSwipes.slice(startIndex, endIndex);

    return {
      swipes: paginatedSwipes,
      meta: {
        page,
        limit,
        total: filteredSwipes.length,
        totalPages: Math.ceil(filteredSwipes.length / limit),
        hasNext: endIndex < filteredSwipes.length,
        hasPrev: page > 1,
      },
    };
  }

  private getMockSwipeStats(): SwipeStatsResponse {
    return {
      total: 25,
      byDirection: {
        [SwipeDirection.RIGHT]: 10,
        [SwipeDirection.UP]: 5,
        [SwipeDirection.DOWN]: 7,
        [SwipeDirection.LEFT]: 3,
      },
      byCategory: {
        NETWORKING: 8,
        CULTURE: 6,
        FITNESS: 4,
        FOOD: 3,
        NIGHTLIFE: 2,
        OUTDOOR: 1,
        PROFESSIONAL: 1,
      },
      byTimeframe: {
        today: 5,
        thisWeek: 15,
        thisMonth: 25,
      },
      streaks: {
        current: 3,
        longest: 7,
      },
      preferences: {
        favoriteCategories: [
          { category: 'NETWORKING', count: 8 },
          { category: 'CULTURE', count: 6 },
          { category: 'FITNESS', count: 4 },
        ],
        favoriteNeighborhoods: [
          { neighborhood: 'Williamsburg', count: 6 },
          { neighborhood: 'East Village', count: 5 },
          { neighborhood: 'Dumbo', count: 4 },
        ],
      },
    };
  }
}
