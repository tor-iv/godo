import { BaseEventAdapter } from './BaseEventAdapter';
import { 
  EventSource, 
  Event, 
  EventCategory, 
  EventAPIParams, 
  EventAPIResponse 
} from '../../types';

interface NYCEventsCalendarEvent {
  event_id: string;
  event_name: string;
  event_description?: string;
  start_date_time: string;
  end_date_time?: string;
  event_type: string;
  event_category?: string;
  agency: string;
  event_location?: string;
  event_address?: string;
  latitude?: string;
  longitude?: string;
  event_website?: string;
  event_phone?: string;
  cost?: string;
  registration_required?: string;
  accessibility_notes?: string;
}

interface NYCStreetEvent {
  objectid: string;
  eventtype: string;
  eventsubtype?: string;
  agency: string;
  eventname: string;
  eventdesc?: string;
  startdate: string;
  enddate?: string;
  street?: string;
  fromstreet?: string;
  tostreet?: string;
  borough: string;
  communityboard?: string;
  policyprecinct?: string;
  latitude?: number;
  longitude?: number;
  eventtime?: string;
}

export class NYCOpenDataAdapter extends BaseEventAdapter {
  source = EventSource.NYC_CULTURAL;
  private eventsApiUrl = 'https://api.nyc.gov/public/api/GetCalendarEvents';
  private streetEventsUrl = 'https://data.cityofnewyork.us/resource/tvpp-9vvx.json';
  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    super();
    this.apiKey = apiKey;
  }

  async fetchEvents(params: EventAPIParams): Promise<EventAPIResponse> {
    try {
      const events: Event[] = [];
      
      // Fetch events from NYC Events Calendar API
      await this.fetchCalendarEvents(events, params);
      
      // Fetch street events from NYC Open Data
      await this.fetchStreetEvents(events, params);

      // Sort by date
      events.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Apply limit
      const limitedEvents = params.limit ? events.slice(0, params.limit) : events;

      return {
        events: limitedEvents,
        totalCount: events.length,
        hasMore: params.limit ? events.length > params.limit : false,
        nextCursor: undefined,
      };
    } catch (error) {
      console.error('Error fetching events from NYC Open Data:', error);
      throw error;
    }
  }

  private async fetchCalendarEvents(events: Event[], params: EventAPIParams): Promise<void> {
    try {
      const searchParams = this.buildCalendarSearchParams(params);
      const url = `${this.eventsApiUrl}?${searchParams}`;
      
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      
      if (this.apiKey) {
        headers['X-App-Token'] = this.apiKey;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        console.warn(`NYC Events API error: ${response.status} ${response.statusText}`);
        return;
      }

      const data: NYCEventsCalendarEvent[] = await response.json();
      
      for (const nycEvent of data) {
        try {
          const event = this.transformCalendarEvent(nycEvent);
          if (event && this.validateEvent(event)) {
            events.push(event);
          }
        } catch (error) {
          console.warn('Failed to transform NYC calendar event:', nycEvent.event_id, error);
        }
      }
    } catch (error) {
      console.warn('Error fetching NYC calendar events:', error);
      // Don't throw - continue with other sources
    }
  }

  private async fetchStreetEvents(events: Event[], params: EventAPIParams): Promise<void> {
    try {
      const searchParams = this.buildStreetEventsSearchParams(params);
      const url = `${this.streetEventsUrl}?${searchParams}`;
      
      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`NYC Street Events API error: ${response.status} ${response.statusText}`);
        return;
      }

      const data: NYCStreetEvent[] = await response.json();
      
      for (const streetEvent of data) {
        try {
          const event = this.transformStreetEvent(streetEvent);
          if (event && this.validateEvent(event)) {
            events.push(event);
          }
        } catch (error) {
          console.warn('Failed to transform NYC street event:', streetEvent.objectid, error);
        }
      }
    } catch (error) {
      console.warn('Error fetching NYC street events:', error);
      // Don't throw - continue with other sources
    }
  }

  transformEvent(externalEvent: any): Event {
    // This method handles both calendar and street events
    if (externalEvent.event_id) {
      return this.transformCalendarEvent(externalEvent as NYCEventsCalendarEvent);
    } else {
      return this.transformStreetEvent(externalEvent as NYCStreetEvent);
    }
  }

  private transformCalendarEvent(nycEvent: NYCEventsCalendarEvent): Event {
    const startDate = new Date(nycEvent.start_date_time);
    
    // Extract location information
    const coordinates = this.extractCoordinates(
      nycEvent.latitude, 
      nycEvent.longitude
    );

    const location = {
      name: nycEvent.event_location || 'NYC Event Location',
      address: nycEvent.event_address || 'New York, NY',
      coordinates,
    };

    // Determine category from event type
    const category = this.mapNYCEventCategory(nycEvent.event_type, nycEvent.event_category);

    // Parse cost information
    const price = this.parsePrice(nycEvent.cost);

    return {
      id: this.generateInternalId(this.source, nycEvent.event_id),
      title: nycEvent.event_name,
      description: nycEvent.event_description || `${nycEvent.event_type} event hosted by ${nycEvent.agency}.`,
      date: startDate,
      location,
      category,
      imageUrl: '', // NYC Events API doesn't typically provide images
      ticketUrl: nycEvent.event_website ? nycEvent.event_website : undefined,
      price,
      source: this.source,
      externalId: nycEvent.event_id,
      sourceUrl: nycEvent.event_website ? nycEvent.event_website : undefined,
      lastUpdated: new Date(),
      isActive: true,
      tags: this.extractCalendarEventTags(nycEvent),
      venue: {
        phone: nycEvent.event_phone ? nycEvent.event_phone : undefined,
      },
    };
  }

  private transformStreetEvent(streetEvent: NYCStreetEvent): Event {
    const startDate = new Date(streetEvent.startdate);
    
    // Create location from street information
    const coordinates = streetEvent.latitude && streetEvent.longitude ? {
      lat: streetEvent.latitude,
      lng: streetEvent.longitude,
    } : { lat: 0, lng: 0 };

    const locationName = streetEvent.street || 'Street Event Location';
    const address = this.buildStreetAddress(streetEvent);

    const location = {
      name: locationName,
      address,
      coordinates,
    };

    // Determine category from event type
    const category = this.mapStreetEventCategory(streetEvent.eventtype, streetEvent.eventsubtype);

    return {
      id: this.generateInternalId(this.source, `street_${streetEvent.objectid}`),
      title: streetEvent.eventname,
      description: streetEvent.eventdesc || `${streetEvent.eventtype} in ${streetEvent.borough}. Organized by ${streetEvent.agency}.`,
      date: startDate,
      location,
      category,
      imageUrl: '',
      price: {
        min: 0,
        max: 0,
        currency: 'USD',
      }, // Most street events are free
      source: this.source,
      externalId: streetEvent.objectid,
      lastUpdated: new Date(),
      isActive: true,
      tags: this.extractStreetEventTags(streetEvent),
    };
  }

  private buildCalendarSearchParams(params: EventAPIParams): string {
    const searchParams = new URLSearchParams();
    
    // Date range
    if (params.dateRange) {
      const startDate = params.dateRange.start.toISOString().split('T')[0];
      const endDate = params.dateRange.end.toISOString().split('T')[0];
      if (startDate && endDate) {
        searchParams.append('start_date', startDate);
        searchParams.append('end_date', endDate);
      }
    } else {
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      if (today && futureDate) {
        searchParams.append('start_date', today);
        searchParams.append('end_date', futureDate);
      }
    }

    // Limit
    if (params.limit) {
      searchParams.append('$limit', params.limit.toString());
    }

    // Offset
    if (params.offset) {
      searchParams.append('$offset', params.offset.toString());
    }

    return searchParams.toString();
  }

  private buildStreetEventsSearchParams(params: EventAPIParams): string {
    const searchParams = new URLSearchParams();
    
    // Date range
    if (params.dateRange) {
      const startDate = params.dateRange.start.toISOString().split('T')[0];
      const endDate = params.dateRange.end.toISOString().split('T')[0];
      searchParams.append('$where', `startdate >= '${startDate}' AND startdate <= '${endDate}'`);
    } else {
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

  private extractCoordinates(lat?: string, lng?: string): { lat: number; lng: number } {
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      if (!isNaN(latitude) && !isNaN(longitude)) {
        return { lat: latitude, lng: longitude };
      }
    }
    
    // Default to NYC center if no coordinates
    return { lat: 40.7831, lng: -73.9712 };
  }

  private parsePrice(costString?: string): { min: number; max: number; currency: string } | undefined {
    if (!costString || costString.toLowerCase().includes('free')) {
      return { min: 0, max: 0, currency: 'USD' };
    }

    // Try to extract price from string
    const priceMatch = costString.match(/\$(\d+(?:\.\d{2})?)/);
    if (priceMatch && priceMatch[1]) {
      const price = parseFloat(priceMatch[1]);
      return { min: price, max: price, currency: 'USD' };
    }

    return undefined;
  }

  private mapNYCEventCategory(eventType: string, eventCategory?: string): EventCategory {
    const type = eventType.toLowerCase();
    const category = eventCategory?.toLowerCase() || '';
    
    if (type.includes('cultural') || type.includes('art') || type.includes('museum') || category.includes('culture')) {
      return EventCategory.CULTURE;
    }
    if (type.includes('fitness') || type.includes('health') || type.includes('sports') || category.includes('fitness')) {
      return EventCategory.FITNESS;
    }
    if (type.includes('food') || type.includes('restaurant') || category.includes('food')) {
      return EventCategory.FOOD;
    }
    if (type.includes('outdoor') || type.includes('park') || category.includes('outdoor')) {
      return EventCategory.OUTDOOR;
    }
    if (type.includes('business') || type.includes('professional') || category.includes('business')) {
      return EventCategory.PROFESSIONAL;
    }
    if (type.includes('networking') || category.includes('networking')) {
      return EventCategory.NETWORKING;
    }

    return EventCategory.CULTURE;
  }

  private mapStreetEventCategory(eventType: string, eventSubType?: string): EventCategory {
    const type = eventType.toLowerCase();
    const subType = eventSubType?.toLowerCase() || '';
    
    if (type.includes('festival') || type.includes('fair') || type.includes('parade')) {
      return EventCategory.CULTURE;
    }
    if (type.includes('run') || type.includes('race') || type.includes('marathon') || subType.includes('sports')) {
      return EventCategory.FITNESS;
    }
    if (type.includes('food') || subType.includes('food')) {
      return EventCategory.FOOD;
    }
    if (type.includes('market') || type.includes('farmers')) {
      return EventCategory.FOOD;
    }

    return EventCategory.OUTDOOR; // Default for street events
  }

  private buildStreetAddress(streetEvent: NYCStreetEvent): string {
    const parts: string[] = [];
    
    if (streetEvent.street) {
      parts.push(streetEvent.street);
      
      if (streetEvent.fromstreet && streetEvent.tostreet) {
        parts.push(`between ${streetEvent.fromstreet} and ${streetEvent.tostreet}`);
      } else if (streetEvent.fromstreet) {
        parts.push(`near ${streetEvent.fromstreet}`);
      }
    }
    
    if (streetEvent.borough) {
      parts.push(streetEvent.borough);
    }
    
    parts.push('NY');
    
    return parts.join(', ');
  }

  private extractCalendarEventTags(event: NYCEventsCalendarEvent): string[] {
    const tags: string[] = ['nyc', 'government', 'public'];
    
    if (event.agency) {
      const agencyTag = event.agency.toLowerCase().replace(/\s+/g, '-');
      if (agencyTag) {
        tags.push(agencyTag);
      }
    }
    
    if (event.event_type) {
      tags.push(event.event_type.toLowerCase().replace(/\s+/g, '-'));
    }
    
    if (event.event_category) {
      tags.push(event.event_category.toLowerCase().replace(/\s+/g, '-'));
    }
    
    return tags;
  }

  private extractStreetEventTags(event: NYCStreetEvent): string[] {
    const tags: string[] = ['nyc', 'street-event', 'public'];
    
    if (event.borough) {
      tags.push(event.borough.toLowerCase().replace(/\s+/g, '-'));
    }
    
    if (event.eventtype) {
      tags.push(event.eventtype.toLowerCase().replace(/\s+/g, '-'));
    }
    
    if (event.agency) {
      tags.push(event.agency.toLowerCase().replace(/\s+/g, '-'));
    }
    
    return tags;
  }
}