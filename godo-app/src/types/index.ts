// Navigation types
export type TabParamList = {
  Calendar: undefined;
  Discover: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  EditProfile: { user?: User };
  Settings: undefined;
  AccountManagement: undefined;
  ChangeEmail: undefined;
  ChangePassword: undefined;
  ChangePhoneNumber: undefined;
  TwoFactorAuth: undefined;
  SubscriptionManagement: undefined;
  BillingHistory: undefined;
  StorageManagement: undefined;
  ConnectedApps: undefined;
  PrivacySettings: undefined;
  ProfileVisibility: undefined;
  LanguageSelection: undefined;
  DataExport: undefined;
  DeleteAccount: undefined;
  DeleteAccountConfirmation: undefined;
  Security: undefined;
  Terms: undefined;
  PrivacyPolicy: undefined;
  Support: undefined;
  Privacy: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: { user?: User };
  Settings: undefined;
  AccountManagement: undefined;
  ChangeEmail: undefined;
  ChangePassword: undefined;
  ChangePhoneNumber: undefined;
  TwoFactorAuth: undefined;
  SubscriptionManagement: undefined;
  BillingHistory: undefined;
  StorageManagement: undefined;
  ConnectedApps: undefined;
  PrivacySettings: undefined;
  ProfileVisibility: undefined;
  LanguageSelection: undefined;
  DataExport: undefined;
  DeleteAccount: undefined;
  DeleteAccountConfirmation: undefined;
  Security: undefined;
  Terms: undefined;
  PrivacyPolicy: undefined;
  Support: undefined;
  Privacy: undefined;
};

// Event types
export enum EventCategory {
  NETWORKING = 'NETWORKING',
  CULTURE = 'CULTURE',
  FITNESS = 'FITNESS',
  FOOD = 'FOOD',
  NIGHTLIFE = 'NIGHTLIFE',
  OUTDOOR = 'OUTDOOR',
  PROFESSIONAL = 'PROFESSIONAL',
}

export enum EventSource {
  EVENTBRITE = 'EVENTBRITE',
  RESY = 'RESY',
  NYC_PARKS = 'NYC_PARKS',
  MET_MUSEUM = 'MET_MUSEUM',
  NYC_OPEN_DATA = 'NYC_OPEN_DATA',
  TICKETMASTER = 'TICKETMASTER',
}

export interface Location {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface Venue {
  name: string;
  neighborhood?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO string for consistency
  datetime: string; // ISO string for compatibility
  location: Location;
  venue: Venue;
  category: EventCategory;
  source: EventSource;
  imageUrl?: string;
  priceMin?: number;
  priceMax?: number;
  capacity?: number;
  currentAttendees?: number;
  isFeatured?: boolean;
  friendsAttending?: number;
  tags?: string[];
}

// Swipe types
export enum SwipeDirection {
  LEFT = 'left', // Not interested
  RIGHT = 'right', // Add to private calendar
  UP = 'up', // Share/add to public calendar
  DOWN = 'down', // Save for later
}

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: {
    categories: EventCategory[];
    neighborhoods: string[];
  };
}
