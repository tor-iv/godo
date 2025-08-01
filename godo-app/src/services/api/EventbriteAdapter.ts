import { BaseEventAdapter } from './BaseEventAdapter';
import { 
  EventSource, 
  Event, 
  EventCategory, 
  EventAPIParams, 
  EventAPIResponse 
} from '../../types';

interface EventbriteEvent {
  id: string;
  name: {
    text: string;
  };
  description: {
    text: string;
  };
  start: {
    utc: string;
    local: string;
  };
  end: {
    utc: string;
    local: string;
  };
  url: string;
  venue_id?: string;
  venue?: EventbriteVenue;
  ticket_availability?: {
    has_available_tickets: boolean;
    minimum_ticket_price?: {
      currency: string;
      value: number;
    };
    maximum_ticket_price?: {
      currency: string;
      value: number;
    };
  };
  capacity?: number;
  logo?: {
    url: string;
  };
  category_id?: string;
  subcategory_id?: string;
  tags?: string[];
}

interface EventbriteVenue {
  id: string;
  name: string;
  address: {
    address_1?: string;
    address_2?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
    localized_address_display: string;
  };
  latitude?: string;
  longitude?: string;
}

interface EventbriteSearchResponse {
  events: EventbriteEvent[];
  pagination: {
    object_count: number;
    page_number: number;
    page_size: number;
    page_count: number;
    has_more_items: boolean;
    continuation: string;
  };
}

export class EventbriteAdapter extends BaseEventAdapter {
  source = EventSource.EVENTBRITE;
  private baseUrl = 'https://www.eventbriteapi.com/v3';
  private apiKey: string;

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  async fetchEvents(params: EventAPIParams): Promise<EventAPIResponse> {
    try {
      const searchParams = this.buildSearchParams(params);
      const response = await fetch(`${this.baseUrl}/events/search/?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Eventbrite API error: ${response.status} ${response.statusText}`);
      }

      const data: EventbriteSearchResponse = await response.json();
      
      // Transform and validate events
      const transformedEvents: Event[] = [];
      for (const eventbriteEvent of data.events) {
        try {
          // Fetch venue details if needed
          if (eventbriteEvent.venue_id && !eventbriteEvent.venue) {
            eventbriteEvent.venue = await this.fetchVenue(eventbriteEvent.venue_id);
          }
          
          const event = this.transformEvent(eventbriteEvent);
          if (this.validateEvent(event)) {
            transformedEvents.push(event);
          }
        } catch (error) {
          console.warn('Failed to transform Eventbrite event:', eventbriteEvent.id, error);
        }
      }

      return {
        events: transformedEvents,
        totalCount: data.pagination.object_count,
        hasMore: data.pagination.has_more_items,
        nextCursor: data.pagination.continuation,
      };
    } catch (error) {
      console.error('Error fetching events from Eventbrite:', error);
      throw error;
    }
  }

  transformEvent(externalEvent: EventbriteEvent): Event {
    const venue = externalEvent.venue;
    const startDate = new Date(externalEvent.start.utc);
    
    // Extract coordinates from venue
    let coordinates = { lat: 0, lng: 0 };
    if (venue?.latitude && venue?.longitude) {
      coordinates = {
        lat: parseFloat(venue.latitude),
        lng: parseFloat(venue.longitude),
      };
    }

    // Determine category from Eventbrite category/subcategory
    const category = this.mapEventbriteCategory(
      externalEvent.category_id,
      externalEvent.subcategory_id,
      externalEvent.name.text,
      externalEvent.description?.text
    );

    // Extract price information
    let price;
    if (externalEvent.ticket_availability?.minimum_ticket_price) {
      const minPrice = externalEvent.ticket_availability.minimum_ticket_price.value / 100;
      const maxPrice = externalEvent.ticket_availability.maximum_ticket_price?.value 
        ? externalEvent.ticket_availability.maximum_ticket_price.value / 100 
        : minPrice;
      
      price = {
        min: minPrice,
        max: maxPrice,
        currency: externalEvent.ticket_availability.minimum_ticket_price.currency,
      };
    }

    return {
      id: this.generateInternalId(this.source, externalEvent.id),
      title: externalEvent.name.text,
      description: externalEvent.description?.text || '',
      date: startDate,
      location: {
        name: venue?.name || 'TBD',
        address: venue?.address?.localized_address_display || '',
        coordinates,
      },
      category,
      imageUrl: externalEvent.logo?.url || '',
      ticketUrl: externalEvent.url,
      price: price || undefined,
      capacity: externalEvent.capacity,
      source: this.source,
      externalId: externalEvent.id,
      sourceUrl: externalEvent.url,
      lastUpdated: new Date(),
      isActive: true,
      tags: externalEvent.tags,
      venue: venue ? {
        id: venue.id,
      } : undefined,
    };
  }

  private buildSearchParams(params: EventAPIParams): string {
    const searchParams = new URLSearchParams();
    
    // Location parameters
    if (params.location) {
      searchParams.append('location.latitude', params.location.lat.toString());
      searchParams.append('location.longitude', params.location.lng.toString());
      searchParams.append('location.within', `${params.location.radius || 10}mi`);
    } else {
      // Default to NYC area
      searchParams.append('location.address', 'New York, NY');
    }

    // Date range
    if (params.dateRange) {
      searchParams.append('start_date.range_start', params.dateRange.start.toISOString());
      searchParams.append('start_date.range_end', params.dateRange.end.toISOString());
    } else {
      // Default to events starting from now
      searchParams.append('start_date.range_start', new Date().toISOString());
    }

    // Search query
    if (params.search) {
      searchParams.append('q', params.search);
    }

    // Pagination
    searchParams.append('page_size', (params.limit || 50).toString());
    if (params.offset) {
      searchParams.append('page', Math.floor(params.offset / (params.limit || 50) + 1).toString());
    }

    // Additional filters
    searchParams.append('sort_by', 'date');
    searchParams.append('expand', 'venue,ticket_availability');
    
    return searchParams.toString();
  }

  private async fetchVenue(venueId: string): Promise<EventbriteVenue> {
    const response = await fetch(`${this.baseUrl}/venues/${venueId}/`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch venue ${venueId}: ${response.statusText}`);
    }

    return response.json();
  }

  private mapEventbriteCategory(
    categoryId?: string,
    subcategoryId?: string,
    title?: string,
    description?: string
  ): EventCategory {
    const text = `${title || ''} ${description || ''}`.toLowerCase();
    
    // Eventbrite category mappings (common category IDs)
    const categoryMappings: { [key: string]: EventCategory } = {
      '101': EventCategory.PROFESSIONAL, // Business & Professional
      '102': EventCategory.FOOD, // Food & Drink
      '103': EventCategory.CULTURE, // Music
      '105': EventCategory.CULTURE, // Performing & Visual Arts
      '108': EventCategory.FITNESS, // Sports & Fitness
      '109': EventCategory.OUTDOOR, // Travel & Outdoor
      '110': EventCategory.CULTURE, // Community & Culture
      '113': EventCategory.NIGHTLIFE, // Seasonal & Holiday
      '115': EventCategory.FITNESS, // Health & Wellness
      '116': EventCategory.PROFESSIONAL, // Science & Technology
    };

    if (categoryId && categoryMappings[categoryId]) {
      return categoryMappings[categoryId];
    }

    // Text-based categorization as fallback
    if (text.includes('networking') || text.includes('professional') || text.includes('business')) {
      return EventCategory.NETWORKING;
    }
    if (text.includes('food') || text.includes('drink') || text.includes('restaurant') || text.includes('wine') || text.includes('cocktail')) {
      return EventCategory.FOOD;
    }
    if (text.includes('art') || text.includes('music') || text.includes('culture') || text.includes('museum') || text.includes('gallery')) {
      return EventCategory.CULTURE;
    }
    if (text.includes('fitness') || text.includes('yoga') || text.includes('workout') || text.includes('gym') || text.includes('run')) {
      return EventCategory.FITNESS;
    }
    if (text.includes('outdoor') || text.includes('park') || text.includes('hiking') || text.includes('beach') || text.includes('garden')) {
      return EventCategory.OUTDOOR;
    }
    if (text.includes('party') || text.includes('nightlife') || text.includes('club') || text.includes('bar') || text.includes('dance')) {
      return EventCategory.NIGHTLIFE;
    }

    // Default fallback
    return EventCategory.PROFESSIONAL;
  }
}