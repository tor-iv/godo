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
  ticketUrl?: string;
  price?: {
    min: number;
    max: number;
    currency: string;
  };
  capacity?: number;
  attendeeCount?: number;
  source: EventSource;
  externalId: string;
  sourceUrl?: string;
  lastUpdated: Date;
  isActive: boolean;
  tags?: string[];
  venue?: {
    id?: string;
    website?: string;
    phone?: string;
    socialMedia?: {
      instagram?: string;
      facebook?: string;
      twitter?: string;
    };
  };
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

export enum SwipeDirection {
  RIGHT = 'private_calendar',
  LEFT = 'not_interested',
  UP = 'public_calendar',
  DOWN = 'save_later',
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