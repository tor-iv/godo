import { EventAPIAdapter, EventAPIParams, EventAPIResponse, Event, EventSyncResult } from '../../types';
import { EventbriteAdapter } from './EventbriteAdapter';
import { NYCParksAdapter } from './NYCParksAdapter';
import { MetMuseumAdapter } from './MetMuseumAdapter';
import { TicketmasterAdapter } from './TicketmasterAdapter';
import { NYCOpenDataAdapter } from './NYCOpenDataAdapter';

export class EventAggregatorService {
  private adapters: EventAPIAdapter[] = [];

  registerAdapter(adapter: EventAPIAdapter): void {
    this.adapters.push(adapter);
  }

  static create(config: {
    eventbriteApiKey?: string;
    ticketmasterApiKey?: string;
    nycApiKey?: string;
    includeNYCParks?: boolean;
    includeMetMuseum?: boolean;
    includeNYCOpenData?: boolean;
  }): EventAggregatorService {
    const service = new EventAggregatorService();
    
    if (config.eventbriteApiKey) {
      service.registerAdapter(new EventbriteAdapter(config.eventbriteApiKey));
    }
    
    if (config.ticketmasterApiKey) {
      service.registerAdapter(new TicketmasterAdapter(config.ticketmasterApiKey));
    }
    
    if (config.includeNYCParks) {
      service.registerAdapter(new NYCParksAdapter());
    }
    
    if (config.includeMetMuseum) {
      service.registerAdapter(new MetMuseumAdapter());
    }
    
    if (config.includeNYCOpenData) {
      service.registerAdapter(new NYCOpenDataAdapter(config.nycApiKey));
    }
    
    return service;
  }

  async fetchEventsFromAllSources(params: EventAPIParams): Promise<EventAPIResponse> {
    const allResults = await Promise.allSettled(
      this.adapters.map(adapter => adapter.fetchEvents(params))
    );

    const successfulResults = allResults
      .filter((result): result is PromiseFulfilledResult<EventAPIResponse> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);

    const failedResults = allResults
      .filter(result => result.status === 'rejected')
      .map(result => (result as PromiseRejectedResult).reason);

    if (failedResults.length > 0) {
      console.warn('Some event sources failed:', failedResults);
    }

    // Combine all events
    const allEvents = successfulResults.flatMap(response => response.events);
    
    // Remove duplicates and sort
    const uniqueEvents = this.deduplicateEvents(allEvents);
    const sortedEvents = uniqueEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Apply limit if specified
    const limitedEvents = params.limit ? sortedEvents.slice(0, params.limit) : sortedEvents;

    return {
      events: limitedEvents,
      totalCount: sortedEvents.length,
      hasMore: params.limit ? sortedEvents.length > params.limit : false,
      nextCursor: undefined, // Pagination with aggregated results is complex
    };
  }

  async syncFromSource(adapter: EventAPIAdapter, params: EventAPIParams): Promise<EventSyncResult> {
    const startTime = new Date();
    
    try {
      const response = await adapter.fetchEvents(params);
      
      return {
        source: adapter.source,
        totalFetched: response.events.length,
        newEvents: response.events.length, // Would need storage layer to determine what's actually new
        updatedEvents: 0,
        errors: [],
        lastSync: startTime,
      };
    } catch (error) {
      return {
        source: adapter.source,
        totalFetched: 0,
        newEvents: 0,
        updatedEvents: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        lastSync: startTime,
      };
    }
  }

  async syncAllSources(params: EventAPIParams): Promise<EventSyncResult[]> {
    return Promise.all(
      this.adapters.map(adapter => this.syncFromSource(adapter, params))
    );
  }

  private deduplicateEvents(events: Event[]): Event[] {
    const uniqueEvents = new Map<string, Event>();
    
    for (const event of events) {
      // Check for potential duplicates based on title, date, and location
      const eventKey = this.generateEventKey(event);
      
      if (!uniqueEvents.has(eventKey)) {
        uniqueEvents.set(eventKey, event);
      } else {
        // If duplicate found, prefer the one with more complete data
        const existing = uniqueEvents.get(eventKey)!;
        if (this.eventHasMoreCompleteData(event, existing)) {
          uniqueEvents.set(eventKey, event);
        }
      }
    }
    
    return Array.from(uniqueEvents.values());
  }

  private generateEventKey(event: Event): string {
    // Create a key for deduplication based on normalized title, date, and location
    const normalizedTitle = event.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const dateKey = event.date.toISOString().split('T')[0]; // Just the date part
    const locationKey = event.location.name.toLowerCase().replace(/[^\w\s]/g, '').trim();
    
    return `${normalizedTitle}_${dateKey}_${locationKey}`;
  }

  private eventHasMoreCompleteData(event1: Event, event2: Event): boolean {
    let score1 = 0;
    let score2 = 0;
    
    // Score based on data completeness
    if (event1.imageUrl) score1++;
    if (event2.imageUrl) score2++;
    
    if (event1.price) score1++;
    if (event2.price) score2++;
    
    if (event1.capacity) score1++;
    if (event2.capacity) score2++;
    
    if (event1.attendeeCount) score1++;
    if (event2.attendeeCount) score2++;
    
    if (event1.venue) score1++;
    if (event2.venue) score2++;
    
    if (event1.tags && event1.tags.length > 0) score1++;
    if (event2.tags && event2.tags.length > 0) score2++;
    
    return score1 > score2;
  }
}