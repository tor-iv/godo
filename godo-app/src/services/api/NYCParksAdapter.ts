import { BaseEventAdapter } from './BaseEventAdapter';
import { 
  EventSource, 
  Event, 
  EventCategory, 
  EventAPIParams, 
  EventAPIResponse 
} from '../../types';

interface NYCParksEvent {
  eventid: string;
  eventname: string;
  eventdescription: string;
  startdate: string;
  enddate: string;
  location: string;
  latitude: string;
  longitude: string;
  eventtype: string;
  borough: string;
  parkname: string;
  eventlink?: string;
}

export class NYCParksAdapter extends BaseEventAdapter {
  source = EventSource.NYC_PARKS;
  private baseUrl = 'https://data.cityofnewyork.us/resource/8end-qv57.json';

  async fetchEvents(params: EventAPIParams): Promise<EventAPIResponse> {
    try {
      const searchParams = this.buildSearchParams(params);
      const response = await fetch(`${this.baseUrl}?${searchParams}`);

      if (!response.ok) {
        throw new Error(`NYC Parks API error: ${response.status} ${response.statusText}`);
      }

      const data: NYCParksEvent[] = await response.json();
      
      const transformedEvents: Event[] = [];
      for (const parksEvent of data) {
        try {
          const event = this.transformEvent(parksEvent);
          if (this.validateEvent(event)) {
            transformedEvents.push(event);
          }
        } catch (error) {
          console.warn('Failed to transform NYC Parks event:', parksEvent.eventid, error);
        }
      }

      return {
        events: transformedEvents,
        totalCount: transformedEvents.length, // NYC Open Data doesn't provide total count
        hasMore: transformedEvents.length === (params.limit || 50),
        nextCursor: undefined,
      };
    } catch (error) {
      console.error('Error fetching events from NYC Parks:', error);
      throw error;
    }
  }

  transformEvent(externalEvent: NYCParksEvent): Event {
    const startDate = new Date(externalEvent.startdate);
    const coordinates = {
      lat: parseFloat(externalEvent.latitude) || 0,
      lng: parseFloat(externalEvent.longitude) || 0,
    };

    return {
      id: this.generateInternalId(this.source, externalEvent.eventid),
      title: externalEvent.eventname,
      description: externalEvent.eventdescription || '',
      date: startDate,
      location: {
        name: externalEvent.parkname || externalEvent.location,
        address: `${externalEvent.location}, ${externalEvent.borough}, NY`,
        coordinates,
      },
      category: this.mapParksEventType(externalEvent.eventtype),
      imageUrl: '', // NYC Parks doesn't typically provide event images
      ticketUrl: externalEvent.eventlink || undefined,
      price: {
        min: 0,
        max: 0,
        currency: 'USD',
      }, // Most NYC Parks events are free
      source: this.source,
      externalId: externalEvent.eventid,
      sourceUrl: externalEvent.eventlink || undefined,
      lastUpdated: new Date(),
      isActive: true,
      tags: [externalEvent.borough.toLowerCase(), 'parks', 'nyc'],
    };
  }

  private buildSearchParams(params: EventAPIParams): string {
    const searchParams = new URLSearchParams();
    
    // Date range
    if (params.dateRange) {
      searchParams.append('$where', 
        `startdate >= '${params.dateRange.start.toISOString().split('T')[0]}' AND startdate <= '${params.dateRange.end.toISOString().split('T')[0]}'`
      );
    } else {
      // Default to future events
      const today = new Date().toISOString().split('T')[0];
      searchParams.append('$where', `startdate >= '${today}'`);
    }

    // Limit
    searchParams.append('$limit', (params.limit || 50).toString());
    
    // Offset
    if (params.offset) {
      searchParams.append('$offset', params.offset.toString());
    }

    // Order by date
    searchParams.append('$order', 'startdate ASC');

    return searchParams.toString();
  }

  private mapParksEventType(eventType: string): EventCategory {
    const type = eventType?.toLowerCase() || '';
    
    if (type.includes('fitness') || type.includes('sports') || type.includes('yoga') || type.includes('exercise')) {
      return EventCategory.FITNESS;
    }
    if (type.includes('outdoor') || type.includes('nature') || type.includes('hiking') || type.includes('walking')) {
      return EventCategory.OUTDOOR;
    }
    if (type.includes('culture') || type.includes('art') || type.includes('music') || type.includes('performance')) {
      return EventCategory.CULTURE;
    }
    if (type.includes('food') || type.includes('festival') || type.includes('market')) {
      return EventCategory.FOOD;
    }

    // Default to outdoor for parks events
    return EventCategory.OUTDOOR;
  }
}