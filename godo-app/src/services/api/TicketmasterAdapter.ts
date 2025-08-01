import { BaseEventAdapter } from './BaseEventAdapter';
import { 
  EventSource, 
  Event, 
  EventCategory, 
  EventAPIParams, 
  EventAPIResponse 
} from '../../types';

interface TicketmasterEvent {
  name: string;
  type: string;
  id: string;
  test: boolean;
  url: string;
  locale: string;
  images: Array<{
    ratio: string;
    url: string;
    width: number;
    height: number;
    fallback: boolean;
  }>;
  sales: {
    public: {
      startDateTime: string;
      startTBD: boolean;
      startTBA: boolean;
      endDateTime: string;
    };
    presales?: Array<{
      startDateTime: string;
      endDateTime: string;
      name: string;
    }>;
  };
  dates: {
    start: {
      localDate: string;
      localTime?: string;
      dateTime: string;
      dateTBD: boolean;
      dateTBA: boolean;
      timeTBA: boolean;
      noSpecificTime: boolean;
    };
    end?: {
      localDate: string;
      localTime?: string;
      dateTime: string;
      approximate: boolean;
    };
    timezone: string;
    status: {
      code: string;
    };
    spanMultipleDays: boolean;
  };
  classifications: Array<{
    primary: boolean;
    segment: {
      id: string;
      name: string;
    };
    genre: {
      id: string;
      name: string;
    };
    subGenre: {
      id: string;
      name: string;
    };
    type: {
      id: string;
      name: string;
    };
    subType: {
      id: string;
      name: string;
    };
    family: boolean;
  }>;
  promoter?: {
    id: string;
    name: string;
    description: string;
  };
  promoters?: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  info?: string;
  pleaseNote?: string;
  priceRanges?: Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
  }>;
  products?: Array<{
    name: string;
    id: string;
    url: string;
    type: string;
    classifications: Array<any>;
  }>;
  seatmap?: {
    staticUrl: string;
  };
  accessibility?: {
    ticketLimit: number;
    id: string;
  };
  ticketLimit?: {
    info: string;
    id: string;
  };
  ageRestrictions?: {
    legalAgeEnforced: boolean;
    id: string;
  };
  ticketing?: {
    safeTix: {
      enabled: boolean;
      inAppOnlyEnabled: boolean;
    };
  };
  _links: {
    self: {
      href: string;
    };
    attractions?: Array<{
      href: string;
    }>;
    venues?: Array<{
      href: string;
    }>;
  };
  _embedded?: {
    venues?: Array<TicketmasterVenue>;
    attractions?: Array<{
      name: string;
      type: string;
      id: string;
      test: boolean;
      url: string;
      locale: string;
      images: Array<{
        ratio: string;
        url: string;
        width: number;
        height: number;
        fallback: boolean;
      }>;
      classifications: Array<any>;
      upcomingEvents: {
        ticketmaster: number;
        _total: number;
        _filtered: number;
      };
      _links: {
        self: {
          href: string;
        };
      };
    }>;
  };
}

interface TicketmasterVenue {
  name: string;
  type: string;
  id: string;
  test: boolean;
  url: string;
  locale: string;
  images?: Array<{
    ratio: string;
    url: string;
    width: number;
    height: number;
    fallback: boolean;
  }>;
  postalCode: string;
  timezone: string;
  city: {
    name: string;
  };
  state: {
    name: string;
    stateCode: string;
  };
  country: {
    name: string;
    countryCode: string;
  };
  address: {
    line1: string;
    line2?: string;
  };
  location: {
    longitude: string;
    latitude: string;
  };
  markets: Array<{
    name: string;
    id: string;
  }>;
  dmas: Array<{
    id: number;
  }>;
  social?: {
    twitter?: {
      handle: string;
    };
  };
  boxOfficeInfo?: {
    phoneNumberDetail: string;
    openHoursDetail: string;
    acceptedPaymentDetail: string;
    willCallDetail: string;
  };
  parkingDetail?: string;
  accessibleSeatingDetail?: string;
  generalInfo?: {
    generalRule: string;
    childRule: string;
  };
  upcomingEvents: {
    ticketmaster: number;
    _total: number;
    _filtered: number;
  };
  _links: {
    self: {
      href: string;
    };
  };
}

interface TicketmasterSearchResponse {
  _embedded?: {
    events: TicketmasterEvent[];
  };
  _links: {
    self: {
      href: string;
    };
    next?: {
      href: string;
      templated: boolean;
    };
    prev?: {
      href: string;
      templated: boolean;
    };
  };
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export class TicketmasterAdapter extends BaseEventAdapter {
  source = EventSource.EVENTBRITE; // Using EVENTBRITE source type for now
  private baseUrl = 'https://app.ticketmaster.com/discovery/v2';
  private apiKey: string;
  private nycDmaId = '345'; // New York DMA ID

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  async fetchEvents(params: EventAPIParams): Promise<EventAPIResponse> {
    try {
      const searchParams = this.buildSearchParams(params);
      const url = `${this.baseUrl}/events.json?${searchParams}`;
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Ticketmaster API error: ${response.status} ${response.statusText}`);
      }

      const data: TicketmasterSearchResponse = await response.json();
      
      if (!data._embedded?.events) {
        return {
          events: [],
          totalCount: 0,
          hasMore: false,
          nextCursor: undefined,
        };
      }

      // Transform and validate events
      const transformedEvents: Event[] = [];
      for (const ticketmasterEvent of data._embedded.events) {
        try {
          const event = this.transformEvent(ticketmasterEvent);
          if (this.validateEvent(event)) {
            transformedEvents.push(event);
          }
        } catch (error) {
          console.warn('Failed to transform Ticketmaster event:', ticketmasterEvent.id, error);
        }
      }

      return {
        events: transformedEvents,
        totalCount: data.page.totalElements,
        hasMore: data.page.number < data.page.totalPages - 1,
        nextCursor: data._links.next?.href,
      };
    } catch (error) {
      console.error('Error fetching events from Ticketmaster:', error);
      throw error;
    }
  }

  transformEvent(externalEvent: TicketmasterEvent): Event {
    const venue = externalEvent._embedded?.venues?.[0];
    const startDateTime = new Date(externalEvent.dates.start.dateTime);
    
    // Extract venue information
    const location = {
      name: venue?.name || 'TBD',
      address: venue ? this.formatVenueAddress(venue) : '',
      coordinates: venue?.location ? {
        lat: parseFloat(venue.location.latitude),
        lng: parseFloat(venue.location.longitude),
      } : { lat: 0, lng: 0 },
    };

    // Determine category from classification
    const category = this.mapTicketmasterCategory(externalEvent.classifications);

    // Extract price information
    let price;
    if (externalEvent.priceRanges && externalEvent.priceRanges.length > 0) {
      const priceRange = externalEvent.priceRanges[0];
      if (priceRange) {
        price = {
          min: priceRange.min,
          max: priceRange.max,
          currency: priceRange.currency,
        };
      }
    }

    // Get best quality image
    const imageUrl = this.getBestImage(externalEvent.images);

    // Create description
    const description = this.createEventDescription(externalEvent);

    return {
      id: this.generateInternalId(this.source, externalEvent.id),
      title: externalEvent.name,
      description,
      date: startDateTime,
      location,
      category,
      imageUrl,
      ticketUrl: externalEvent.url,
      price,
      source: this.source,
      externalId: externalEvent.id,
      sourceUrl: externalEvent.url,
      lastUpdated: new Date(),
      isActive: externalEvent.dates.status.code === 'onsale',
      tags: this.extractTags(externalEvent),
      venue: venue ? {
        id: venue.id,
        website: venue.url,
        phone: venue.boxOfficeInfo?.phoneNumberDetail,
        socialMedia: venue.social?.twitter ? {
          twitter: venue.social.twitter.handle,
        } : undefined,
      } : undefined,
    };
  }

  private buildSearchParams(params: EventAPIParams): string {
    const searchParams = new URLSearchParams();
    
    // API Key
    searchParams.append('apikey', this.apiKey);
    
    // Location - default to NYC
    if (params.location) {
      searchParams.append('latlong', `${params.location.lat},${params.location.lng}`);
      searchParams.append('radius', (params.location.radius || 25).toString());
      searchParams.append('unit', 'miles');
    } else {
      // Default to NYC area
      searchParams.append('dmaId', this.nycDmaId);
    }

    // Date range
    if (params.dateRange) {
      searchParams.append('startDateTime', params.dateRange.start.toISOString());
      searchParams.append('endDateTime', params.dateRange.end.toISOString());
    } else {
      // Default to events starting from now
      searchParams.append('startDateTime', new Date().toISOString());
    }

    // Search query
    if (params.search) {
      searchParams.append('keyword', params.search);
    }

    // Pagination
    searchParams.append('size', (params.limit || 20).toString());
    if (params.offset) {
      const page = Math.floor(params.offset / (params.limit || 20));
      searchParams.append('page', page.toString());
    }

    // Additional filters
    searchParams.append('sort', 'date,asc');
    searchParams.append('includeTest', 'false');
    
    return searchParams.toString();
  }

  private formatVenueAddress(venue: TicketmasterVenue): string {
    const parts: string[] = [];
    
    if (venue.address.line1) parts.push(venue.address.line1);
    if (venue.address.line2) parts.push(venue.address.line2);
    if (venue.city.name) parts.push(venue.city.name);
    if (venue.state.stateCode) parts.push(venue.state.stateCode);
    if (venue.postalCode) parts.push(venue.postalCode);
    
    return parts.join(', ');
  }

  private mapTicketmasterCategory(classifications: TicketmasterEvent['classifications']): EventCategory {
    if (!classifications || classifications.length === 0) {
      return EventCategory.CULTURE;
    }

    const primaryClassification = classifications.find(c => c.primary) || classifications[0];
    if (!primaryClassification) {
      return EventCategory.CULTURE;
    }
    
    const segment = primaryClassification.segment?.name?.toLowerCase() || '';
    const genre = primaryClassification.genre?.name?.toLowerCase() || '';

    // Map Ticketmaster segments/genres to our categories
    if (segment.includes('music') || genre.includes('concert')) {
      return EventCategory.CULTURE;
    }
    if (segment.includes('sports')) {
      return EventCategory.FITNESS;
    }
    if (segment.includes('arts') || segment.includes('theatre')) {
      return EventCategory.CULTURE;
    }
    if (genre.includes('comedy') || genre.includes('nightlife')) {
      return EventCategory.NIGHTLIFE;
    }
    if (segment.includes('miscellaneous')) {
      // Check genre for more specific categorization
      if (genre.includes('food') || genre.includes('wine')) {
        return EventCategory.FOOD;
      }
      if (genre.includes('business') || genre.includes('conference')) {
        return EventCategory.PROFESSIONAL;
      }
    }

    // Default to culture for entertainment events
    return EventCategory.CULTURE;
  }

  private getBestImage(images: TicketmasterEvent['images']): string {
    if (!images || images.length === 0) return '';

    // Prefer 16:9 ratio images, then largest images
    const preferred = images.find(img => img.ratio === '16_9' && !img.fallback);
    if (preferred) return preferred.url;

    // Fallback to largest image
    const sorted = images
      .filter(img => !img.fallback)
      .sort((a, b) => (b.width * b.height) - (a.width * a.height));
    
    return sorted[0]?.url || images[0]?.url || '';
  }

  private createEventDescription(event: TicketmasterEvent): string {
    const parts: string[] = [];
    
    if (event.info) {
      parts.push(event.info);
    }
    
    if (event.pleaseNote) {
      parts.push(`Please note: ${event.pleaseNote}`);
    }
    
    // Add classification info
    const primaryClassification = event.classifications.find(c => c.primary) || event.classifications[0];
    if (primaryClassification && primaryClassification.genre) {
      parts.push(`Genre: ${primaryClassification.genre.name}.`);
    }
    
    // Add venue info if available
    const venue = event._embedded?.venues?.[0];
    if (venue) {
      parts.push(`Venue: ${venue.name}.`);
      if (venue.generalInfo?.generalRule) {
        parts.push(venue.generalInfo.generalRule);
      }
    }
    
    return parts.join(' ') || `Experience ${event.name} live!`;
  }

  private extractTags(event: TicketmasterEvent): string[] {
    const tags: string[] = ['ticketmaster', 'live-event'];
    
    // Add classification tags
    event.classifications.forEach(classification => {
      if (classification.segment?.name) {
        tags.push(classification.segment.name.toLowerCase().replace(/\s+/g, '-'));
      }
      if (classification.genre?.name) {
        tags.push(classification.genre.name.toLowerCase().replace(/\s+/g, '-'));
      }
    });
    
    // Add venue city
    const venue = event._embedded?.venues?.[0];
    if (venue?.city.name) {
      tags.push(venue.city.name.toLowerCase().replace(/\s+/g, '-'));
    }
    
    return tags;
  }
}