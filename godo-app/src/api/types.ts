/**
 * API Types and Interfaces
 * Comprehensive type definitions for API requests and responses
 */

import { Event, EventCategory, SwipeDirection, User } from '../types';

/**
 * Base API Response Interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  meta?: {
    pagination?: PaginationMeta;
    timestamp: string;
    requestId: string;
  };
}

/**
 * Pagination Metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * API Error Response
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
  statusCode?: number;
  meta?: {
    timestamp: string;
    requestId: string;
    path: string;
  };
}

/**
 * Authentication Types
 */
export interface LoginRequest {
  email: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  dateOfBirth?: string;
  preferences?: {
    categories: EventCategory[];
    neighborhoods: string[];
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  password: string;
  confirmPassword: string;
}

/**
 * User Types
 */
export interface UserProfileUpdateRequest {
  name?: string;
  email?: string;
  dateOfBirth?: string;
  bio?: string;
  location?: string;
  avatar?: string;
}

export interface UserPreferencesUpdateRequest {
  categories?: EventCategory[];
  neighborhoods?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  notifications?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy?: {
    profileVisible: boolean;
    activityVisible: boolean;
  };
}

/**
 * Event Types
 */
export interface EventsListRequest {
  page?: number;
  limit?: number;
  category?: EventCategory;
  neighborhood?: string;
  dateFrom?: string;
  dateTo?: string;
  priceMin?: number;
  priceMax?: number;
  featured?: boolean;
  search?: string;
  sortBy?: 'date' | 'popularity' | 'distance' | 'price';
  sortOrder?: 'asc' | 'desc';
}

export interface EventsListResponse {
  events: Event[];
  meta: PaginationMeta;
  filters?: {
    categories: Array<{ value: EventCategory; count: number }>;
    neighborhoods: Array<{ value: string; count: number }>;
    priceRanges: Array<{ min: number; max: number; count: number }>;
  };
}

export interface EventDetailResponse extends Event {
  attendees?: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  recommendations?: Event[];
  isSaved?: boolean;
  userSwipeDirection?: SwipeDirection;
}

export interface EventSearchRequest {
  query: string;
  page?: number;
  limit?: number;
  filters?: {
    category?: EventCategory;
    neighborhood?: string;
    dateFrom?: string;
    dateTo?: string;
    priceMin?: number;
    priceMax?: number;
  };
}

/**
 * Swipe Types
 */
export interface SwipeRecordRequest {
  eventId: string;
  direction: SwipeDirection;
  timestamp: string;
  metadata?: {
    deviceInfo?: string;
    location?: {
      lat: number;
      lng: number;
    };
    sessionId?: string;
  };
}

export interface SwipeHistoryRequest {
  page?: number;
  limit?: number;
  direction?: SwipeDirection;
  dateFrom?: string;
  dateTo?: string;
}

export interface SwipeHistoryResponse {
  swipes: Array<{
    id: string;
    eventId: string;
    event?: Event;
    direction: SwipeDirection;
    timestamp: string;
  }>;
  meta: PaginationMeta;
}

export interface SwipeStatsResponse {
  total: number;
  byDirection: Record<SwipeDirection, number>;
  byCategory: Record<EventCategory, number>;
  byTimeframe: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  streaks: {
    current: number;
    longest: number;
  };
  preferences: {
    favoriteCategories: Array<{ category: EventCategory; count: number }>;
    favoriteNeighborhoods: Array<{ neighborhood: string; count: number }>;
  };
}

/**
 * Calendar Types
 */
export interface CalendarEventsRequest {
  dateFrom?: string;
  dateTo?: string;
  type?: 'private' | 'public' | 'all';
  includeDetails?: boolean;
}

export interface CalendarEventsResponse {
  events: Array<
    Event & {
      calendarType: 'private' | 'public';
      addedAt: string;
    }
  >;
  summary: {
    totalEvents: number;
    privateEvents: number;
    publicEvents: number;
    upcomingEvents: number;
  };
}

export interface CalendarSyncRequest {
  provider: 'google' | 'apple' | 'outlook';
  events: string[]; // Event IDs to sync
  syncType: 'export' | 'import';
}

/**
 * Notification Types
 */
export interface NotificationsListRequest {
  page?: number;
  limit?: number;
  type?: 'event_reminder' | 'friend_activity' | 'system' | 'marketing';
  read?: boolean;
}

export interface Notification {
  id: string;
  type: 'event_reminder' | 'friend_activity' | 'system' | 'marketing';
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
  readAt?: string;
}

export interface NotificationsListResponse {
  notifications: Notification[];
  meta: PaginationMeta;
  unreadCount: number;
}

export interface NotificationSettingsResponse {
  email: {
    eventReminders: boolean;
    friendActivity: boolean;
    newsletter: boolean;
    promotions: boolean;
  };
  push: {
    eventReminders: boolean;
    friendActivity: boolean;
    breaking: boolean;
    promotions: boolean;
  };
  sms: {
    eventReminders: boolean;
    security: boolean;
  };
}

/**
 * Analytics Types
 */
export interface AnalyticsEventRequest {
  event: string;
  properties?: Record<string, any>;
  timestamp?: string;
  sessionId?: string;
  userId?: string;
}

export interface UserBehaviorAnalytics {
  sessionDuration: number;
  screenViews: Array<{
    screen: string;
    duration: number;
    timestamp: string;
  }>;
  interactions: Array<{
    type: 'tap' | 'swipe' | 'scroll';
    target: string;
    timestamp: string;
  }>;
  crashes: Array<{
    error: string;
    stackTrace: string;
    timestamp: string;
  }>;
}

/**
 * Network & Connectivity Types
 */
export interface NetworkState {
  isConnected: boolean;
  type?: string;
  isInternetReachable?: boolean;
  isWifiEnabled?: boolean;
}

export interface RetryConfig {
  attempts: number;
  delay: number;
  backoff?: 'linear' | 'exponential';
  retryOn?: number[];
}

/**
 * Cache Types
 */
export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

export interface CacheConfig {
  ttl?: number;
  maxSize?: number;
  strategy?: 'LRU' | 'FIFO';
}

/**
 * Request/Response Interceptor Types
 */
export interface RequestInterceptorConfig {
  auth?: boolean;
  retry?: RetryConfig;
  cache?: CacheConfig;
  timeout?: number;
}

export interface ResponseInterceptorConfig {
  errorHandler?: boolean;
  successHandler?: boolean;
  caching?: boolean;
  analytics?: boolean;
}
