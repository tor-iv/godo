/**
 * Mock data factories for user testing
 */

export const createMockUser = (overrides = {}) => ({
  id: 'mock-user-id-123',
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: 'https://example.com/avatar.jpg',
  preferences: {
    categories: ['NETWORKING', 'CULTURE', 'PROFESSIONAL'],
    neighborhoods: ['Manhattan', 'Brooklyn', 'Queens'],
  },
  age: 28,
  location_neighborhood: 'Manhattan',
  privacy_level: 'PRIVATE',
  profile_image_url: 'https://example.com/profile.jpg',
  is_active: true,
  last_login: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockUserProfile = (overrides = {}) => ({
  id: 'mock-user-id-123',
  full_name: 'John Doe',
  age: 28,
  location_neighborhood: 'Manhattan',
  profile_image_url: 'https://example.com/profile.jpg',
  privacy_level: 'PRIVATE',
  mutual_friends_count: 5,
  ...overrides,
});

export const createMockUserCreate = (overrides = {}) => ({
  email: 'newuser@example.com',
  full_name: 'New User',
  age: 25,
  location_neighborhood: 'Brooklyn',
  privacy_level: 'PRIVATE',
  password: 'SecurePass123!',
  phone_number: '+1234567890',
  ...overrides,
});

export const createMockUserUpdate = (overrides = {}) => ({
  full_name: 'Updated Name',
  age: 30,
  location_neighborhood: 'Queens',
  privacy_level: 'FRIENDS_ONLY',
  preferences: {
    categories: ['FOOD', 'NIGHTLIFE'],
    notifications: true,
    privacy: {
      showAge: false,
      showLocation: true,
    },
  },
  profile_image_url: 'https://example.com/new-avatar.jpg',
  push_token: 'mock-push-token-123',
  ...overrides,
});

export const createMockUserPreferences = (overrides = {}) => ({
  user_id: 'mock-user-id-123',
  category: 'NETWORKING',
  preference_score: 0.8,
  neighborhood: 'Manhattan',
  time_preference: 'evening',
  price_sensitivity: 0.6,
  social_preference: 0.7,
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockAuthToken = (overrides = {}) => ({
  access_token: 'mock-access-token-xyz',
  refresh_token: 'mock-refresh-token-abc',
  token_type: 'bearer',
  expires_in: 3600,
  user: createMockUserProfile(),
  ...overrides,
});

export const createMockFriendSuggestion = (overrides = {}) => ({
  user: createMockUserProfile(),
  reason: 'mutual_friends',
  mutual_friends: [
    createMockUserProfile({ id: 'friend-1', full_name: 'Friend One' }),
    createMockUserProfile({ id: 'friend-2', full_name: 'Friend Two' }),
  ],
  confidence_score: 0.75,
  ...overrides,
});

// Mock user settings for different privacy levels
export const mockPrivateUser = createMockUser({
  privacy_level: 'PRIVATE',
  preferences: {
    categories: ['NETWORKING'],
    neighborhoods: ['Manhattan'],
  },
});

export const mockPublicUser = createMockUser({
  privacy_level: 'PUBLIC',
  full_name: 'Public User',
  age: 32,
  location_neighborhood: 'Brooklyn',
});

export const mockFriendsOnlyUser = createMockUser({
  privacy_level: 'FRIENDS_ONLY',
  full_name: 'Friends Only User',
  age: 27,
});

// Invalid user data for validation testing
export const invalidUserData = {
  tooYoung: createMockUserCreate({ age: 17 }),
  tooOld: createMockUserCreate({ age: 51 }),
  invalidEmail: createMockUserCreate({ email: 'not-an-email' }),
  weakPassword: createMockUserCreate({ password: '123' }),
  noUppercase: createMockUserCreate({ password: 'nouppercase123!' }),
  noLowercase: createMockUserCreate({ password: 'NOLOWERCASE123!' }),
  noNumber: createMockUserCreate({ password: 'NoNumbersHere!' }),
  invalidPhone: createMockUserCreate({ phone_number: '123-456-7890-invalid' }),
  longName: createMockUserCreate({ 
    full_name: 'A'.repeat(300) // Exceeds max length
  }),
  longNeighborhood: createMockUserCreate({ 
    location_neighborhood: 'B'.repeat(150) // Exceeds max length
  }),
};

// Mock API responses
export const mockAPIResponses = {
  loginSuccess: {
    status: 200,
    data: createMockAuthToken(),
  },
  loginFailure: {
    status: 401,
    error: 'Invalid credentials',
  },
  userCreated: {
    status: 201,
    data: createMockUserProfile(),
  },
  userUpdated: {
    status: 200,
    data: createMockUserProfile({ full_name: 'Updated Name' }),
  },
  validationError: {
    status: 422,
    error: 'Validation failed',
    details: [
      { field: 'email', message: 'Invalid email format' },
      { field: 'password', message: 'Password too weak' },
    ],
  },
  serverError: {
    status: 500,
    error: 'Internal server error',
  },
};