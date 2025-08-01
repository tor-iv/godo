export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: {
    name: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  category: EventCategory;
  imageUrl: string;
  ticketUrl?: string | undefined;
  price?:
    | {
        min: number;
        max: number;
        currency: string;
      }
    | undefined;
  capacity?: number | undefined;
  attendeeCount?: number | undefined;
  source: EventSource;
  externalId: string;
  sourceUrl?: string | undefined;
  lastUpdated: Date;
  isActive: boolean;
  tags?: string[] | undefined;
  venue?:
    | {
        id?: string | undefined;
        website?: string | undefined;
        phone?: string | undefined;
        socialMedia?:
          | {
              instagram?: string | undefined;
              facebook?: string | undefined;
              twitter?: string | undefined;
            }
          | undefined;
      }
    | undefined;
}

export enum EventCategory {
  NETWORKING = 'networking',
  CULTURE = 'culture',
  FITNESS = 'fitness',
  FOOD = 'food',
  NIGHTLIFE = 'nightlife',
  OUTDOOR = 'outdoor',
  PROFESSIONAL = 'professional',
}

export enum EventSource {
  EVENTBRITE = 'eventbrite',
  RESY = 'resy',
  OPENTABLE = 'opentable',
  PARTIFUL = 'partiful',
  NYC_PARKS = 'nyc_parks',
  NYC_CULTURAL = 'nyc_cultural',
  MEETUP = 'meetup',
  FACEBOOK_EVENTS = 'facebook_events',
  MANUAL = 'manual',
}

export enum SwipeDirection {
  RIGHT = 'RIGHT',
  LEFT = 'LEFT',
  UP = 'UP',
  DOWN = 'DOWN',
}

export enum FeedMode {
  HAPPENING_NOW = 'happening_now',
  PLANNING_AHEAD = 'planning_ahead',
}

export interface User {
  id: string;
  email: string;
  profile: UserProfile;
  preferences: UserPreferences;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  age: number;
  location: string;
  avatarUrl?: string;
}

export interface UserPreferences {
  categories: EventCategory[];
  priceRange: {
    min: number;
    max: number;
  };
  radius: number;
  notifications: boolean;
}

export interface SwipeAction {
  userId: string;
  eventId: string;
  direction: SwipeDirection;
  timestamp: Date;
}

export interface EventAPIParams {
  location?: {
    lat: number;
    lng: number;
    radius?: number;
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
  categories?: EventCategory[];
  limit?: number;
  offset?: number;
  search?: string;
}

export interface EventAPIResponse {
  events: Event[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string | undefined;
}

export interface EventAPIAdapter {
  source: EventSource;
  fetchEvents(params: EventAPIParams): Promise<EventAPIResponse>;
  transformEvent(externalEvent: any): Event;
  validateEvent(event: Event): boolean;
}

export interface EventSyncResult {
  source: EventSource;
  totalFetched: number;
  newEvents: number;
  updatedEvents: number;
  errors: string[];
  lastSync: Date;
}
