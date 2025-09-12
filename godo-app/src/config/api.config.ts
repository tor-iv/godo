/**
 * API Configuration
 * Environment-based configuration for API endpoints and settings
 */

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  cacheTTL: number;
  enableLogging: boolean;
  enableMockMode: boolean;
}

export interface Environment {
  name: 'development' | 'staging' | 'production';
  api: ApiConfig;
  features: {
    mockData: boolean;
    analytics: boolean;
    crashReporting: boolean;
  };
}

const environments: Record<string, Environment> = {
  development: {
    name: 'development',
    api: {
      baseUrl: __DEV__
        ? 'http://localhost:3000/api'
        : 'https://dev-api.godo.app/api',
      timeout: 15000,
      retryAttempts: 2,
      retryDelay: 1000,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      enableLogging: true,
      enableMockMode: true,
    },
    features: {
      mockData: true,
      analytics: false,
      crashReporting: false,
    },
  },
  staging: {
    name: 'staging',
    api: {
      baseUrl: 'https://staging-api.godo.app/api',
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 2000,
      cacheTTL: 10 * 60 * 1000, // 10 minutes
      enableLogging: true,
      enableMockMode: false,
    },
    features: {
      mockData: false,
      analytics: true,
      crashReporting: true,
    },
  },
  production: {
    name: 'production',
    api: {
      baseUrl: 'https://api.godo.app/api',
      timeout: 8000,
      retryAttempts: 3,
      retryDelay: 3000,
      cacheTTL: 30 * 60 * 1000, // 30 minutes
      enableLogging: false,
      enableMockMode: false,
    },
    features: {
      mockData: false,
      analytics: true,
      crashReporting: true,
    },
  },
};

/**
 * Get current environment configuration
 * Falls back to development if NODE_ENV is not set
 */
export const getCurrentEnvironment = (): Environment => {
  const env = process.env.NODE_ENV || 'development';
  return environments[env] || environments.development;
};

/**
 * Get API configuration for current environment
 */
export const getApiConfig = (): ApiConfig => {
  return getCurrentEnvironment().api;
};

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // User
  USER: {
    PROFILE: '/user/profile',
    PREFERENCES: '/user/preferences',
    SETTINGS: '/user/settings',
    AVATAR: '/user/avatar',
    DELETE: '/user/delete',
  },

  // Events
  EVENTS: {
    LIST: '/events',
    DETAIL: (id: string) => `/events/${id}`,
    SEARCH: '/events/search',
    FEATURED: '/events/featured',
    BY_CATEGORY: (category: string) => `/events/category/${category}`,
    UPCOMING: '/events/upcoming',
    RECOMMENDATIONS: '/events/recommendations',
    SAVE: (id: string) => `/events/${id}/save`,
    UNSAVE: (id: string) => `/events/${id}/unsave`,
  },

  // Swipes & Interactions
  SWIPES: {
    RECORD: '/swipes/record',
    HISTORY: '/swipes/history',
    STATS: '/swipes/stats',
    UNDO: '/swipes/undo',
  },

  // Calendar
  CALENDAR: {
    EVENTS: '/calendar/events',
    PRIVATE: '/calendar/private',
    PUBLIC: '/calendar/public',
    SYNC: '/calendar/sync',
    EXPORT: '/calendar/export',
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    SETTINGS: '/notifications/settings',
    SUBSCRIBE: '/notifications/subscribe',
    UNSUBSCRIBE: '/notifications/unsubscribe',
  },

  // Analytics
  ANALYTICS: {
    TRACK_EVENT: '/analytics/track',
    USER_BEHAVIOR: '/analytics/behavior',
    APP_USAGE: '/analytics/usage',
  },
} as const;

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Cache Keys
 */
export const CACHE_KEYS = {
  USER_PROFILE: 'user_profile',
  USER_PREFERENCES: 'user_preferences',
  EVENTS_LIST: 'events_list',
  FEATURED_EVENTS: 'featured_events',
  SWIPE_STATS: 'swipe_stats',
  CALENDAR_EVENTS: 'calendar_events',
  NOTIFICATIONS: 'notifications',
} as const;
