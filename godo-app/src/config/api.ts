const API_BASE_URL = __DEV__
  ? 'http://localhost:8000'
  : 'https://your-production-api.com';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    AUTH: {
      SIGNUP: '/api/v1/auth/register',
      SIGNIN: '/api/v1/auth/login',
      SIGNOUT: '/api/v1/auth/logout',
      REFRESH: '/api/v1/auth/refresh',
      ME: '/api/v1/auth/me',
    },
    USERS: {
      PROFILE: '/api/v1/users/profile',
    },
    EVENTS: {
      LIST: '/api/v1/events',
      CREATE: '/api/v1/events',
      BY_ID: (id: string) => `/api/v1/events/${id}`,
    },
    SWIPES: {
      LIST: '/api/v1/swipes',
      CREATE: '/api/v1/swipes',
    }
  },
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
};

export default API_CONFIG;