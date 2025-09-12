/**
 * Event Hooks
 * Custom hooks for event-related operations
 */

import { useState, useEffect, useCallback } from 'react';
import { Event, EventCategory, SwipeDirection } from '../types';
import { EventRepository } from '../repositories/EventRepository';
import { ApiEventService } from '../services/ApiEventService';
import { EventsListRequest, EventSearchRequest } from '../api/types';
import { useApi, useMutation } from './useApi';

/**
 * Hook for fetching events with filters
 */
export function useEvents(
  request: EventsListRequest = {},
  options: { immediate?: boolean } = {}
) {
  const eventRepository = EventRepository.getInstance();

  return useApi(() => eventRepository.getEvents(request), {
    immediate: options.immediate ?? true,
  });
}

/**
 * Hook for fetching a single event by ID
 */
export function useEvent(
  eventId: string,
  options: { immediate?: boolean } = {}
) {
  const eventRepository = EventRepository.getInstance();

  return useApi(
    () => eventRepository.getEventById(eventId).then(data => ({ data })),
    { immediate: options.immediate ?? true }
  );
}

/**
 * Hook for searching events
 */
export function useEventSearch() {
  const eventRepository = EventRepository.getInstance();
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const {
    mutate: search,
    data: searchResults,
    loading,
    error,
    reset,
  } = useMutation<Event[], EventSearchRequest>(request =>
    eventRepository
      .searchEvents(request)
      .then(data => ({ success: true, data }))
  );

  const searchEvents = useCallback(
    async (query: string, filters?: EventSearchRequest['filters']) => {
      if (query.trim()) {
        // Add to search history
        setSearchHistory(prev => {
          const newHistory = [
            query,
            ...prev.filter(item => item !== query),
          ].slice(0, 10);
          return newHistory;
        });

        await search({ query: query.trim(), filters });
      }
    },
    [search]
  );

  const clearSearch = useCallback(() => {
    reset();
  }, [reset]);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  return {
    searchEvents,
    searchResults: searchResults || [],
    loading,
    error,
    searchHistory,
    clearSearch,
    clearHistory,
  };
}

/**
 * Hook for featured events
 */
export function useFeaturedEvents(options: { immediate?: boolean } = {}) {
  const eventRepository = EventRepository.getInstance();

  return useApi(
    () =>
      eventRepository
        .getFeaturedEvents()
        .then(data => ({ success: true, data })),
    { immediate: options.immediate ?? true }
  );
}

/**
 * Hook for events by category
 */
export function useEventsByCategory(
  category: EventCategory,
  options: { immediate?: boolean } = {}
) {
  const eventRepository = EventRepository.getInstance();

  return useApi(
    () =>
      eventRepository
        .getEventsByCategory(category)
        .then(data => ({ success: true, data })),
    { immediate: options.immediate ?? true }
  );
}

/**
 * Hook for upcoming events
 */
export function useUpcomingEvents(
  days: number = 7,
  options: { immediate?: boolean } = {}
) {
  const eventRepository = EventRepository.getInstance();

  return useApi(
    () =>
      eventRepository
        .getUpcomingEvents(days)
        .then(data => ({ success: true, data })),
    { immediate: options.immediate ?? true }
  );
}

/**
 * Hook for event recommendations
 */
export function useEventRecommendations(
  limit: number = 20,
  options: { immediate?: boolean } = {}
) {
  const eventRepository = EventRepository.getInstance();

  return useApi(
    () =>
      eventRepository
        .getRecommendations(limit)
        .then(data => ({ success: true, data })),
    { immediate: options.immediate ?? true }
  );
}

/**
 * Hook for swiping events
 */
export function useSwipeEvent() {
  const apiEventService = ApiEventService.getInstance();
  const [swipeHistory, setSwipeHistory] = useState<
    Array<{
      eventId: string;
      direction: SwipeDirection;
      timestamp: Date;
    }>
  >([]);

  const swipeEvent = useCallback(
    (eventId: string, direction: SwipeDirection) => {
      try {
        // Record swipe
        apiEventService.swipeEvent(eventId, direction);

        // Add to history
        setSwipeHistory(prev => [
          {
            eventId,
            direction,
            timestamp: new Date(),
          },
          ...prev.slice(0, 49),
        ]); // Keep last 50 swipes
      } catch (error) {
        console.error('Failed to swipe event:', error);
        throw error;
      }
    },
    [apiEventService]
  );

  const undoLastSwipe = useCallback(() => {
    const lastSwipe = swipeHistory[0];
    if (lastSwipe) {
      apiEventService.removeSwipe(lastSwipe.eventId);
      setSwipeHistory(prev => prev.slice(1));
    }
  }, [apiEventService, swipeHistory]);

  const getSwipeDirection = useCallback(
    (eventId: string): SwipeDirection | null => {
      return apiEventService.getSwipeDirection(eventId);
    },
    [apiEventService]
  );

  const hasBeenSwiped = useCallback(
    (eventId: string): boolean => {
      return apiEventService.hasBeenSwiped(eventId);
    },
    [apiEventService]
  );

  return {
    swipeEvent,
    undoLastSwipe,
    getSwipeDirection,
    hasBeenSwiped,
    swipeHistory,
  };
}

/**
 * Hook for calendar events
 */
export function useCalendarEvents() {
  const apiEventService = ApiEventService.getInstance();
  const [events, setEvents] = useState<{
    privateEvents: Event[];
    publicEvents: Event[];
    allEvents: Event[];
  }>({
    privateEvents: [],
    publicEvents: [],
    allEvents: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [privateEvents, publicEvents] = await Promise.all([
        Promise.resolve(apiEventService.getPrivateCalendarEvents()),
        Promise.resolve(apiEventService.getPublicCalendarEvents()),
      ]);

      const allEvents = apiEventService.getAllCalendarEvents();

      setEvents({
        privateEvents,
        publicEvents,
        allEvents,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  }, [apiEventService]);

  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  return {
    ...events,
    loading,
    error,
    refresh: refreshEvents,
  };
}

/**
 * Hook for event statistics
 */
export function useEventStats() {
  const apiEventService = ApiEventService.getInstance();
  const [stats, setStats] = useState(apiEventService.getSwipeStats());

  const refreshStats = useCallback(() => {
    setStats(apiEventService.getSwipeStats());
  }, [apiEventService]);

  // Update stats when component mounts and on interval
  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [refreshStats]);

  return {
    ...stats,
    refresh: refreshStats,
  };
}

/**
 * Hook for saving/unsaving events
 */
export function useSaveEvent() {
  const eventRepository = EventRepository.getInstance();

  const {
    mutate: saveEvent,
    loading: savingEvent,
    error: saveError,
  } = useMutation<void, string>(eventId =>
    eventRepository
      .saveEvent(eventId)
      .then(() => ({ success: true, data: undefined }))
  );

  const {
    mutate: unsaveEvent,
    loading: unsavingEvent,
    error: unsaveError,
  } = useMutation<void, string>(eventId =>
    eventRepository
      .unsaveEvent(eventId)
      .then(() => ({ success: true, data: undefined }))
  );

  return {
    saveEvent,
    unsaveEvent,
    loading: savingEvent || unsavingEvent,
    error: saveError || unsaveError,
  };
}

/**
 * Hook for infinite scroll events loading
 */
export function useInfiniteEvents(request: EventsListRequest = {}) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const eventRepository = EventRepository.getInstance();

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      setError(null);

      const response = await eventRepository.getEvents({
        ...request,
        page,
        limit: request.limit || 20,
      });

      setEvents(prev =>
        page === 1 ? response.events : [...prev, ...response.events]
      );
      setHasMore(response.meta.hasNext);
      setPage(prev => prev + 1);
    } catch (err: any) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [eventRepository, request, page, loading, hasMore]);

  const refresh = useCallback(async () => {
    setPage(1);
    setEvents([]);
    setHasMore(true);
    setError(null);
    await loadMore();
  }, [loadMore]);

  useEffect(() => {
    loadMore();
  }, []); // Load initial data

  return {
    events,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
