# Testing Rules - Event Discovery App

## Testing Strategy Overview

### Testing Pyramid
1. **Unit Tests (70%)** - Individual functions and components
2. **Integration Tests (20%)** - Component interactions and API calls
3. **E2E Tests (10%)** - Complete user workflows

### Testing Tools Stack
- **Unit/Integration**: Jest + React Native Testing Library
- **E2E**: Detox (iOS/Android)
- **Mocking**: MSW (Mock Service Worker) for API calls
- **Test Data**: Factory pattern with realistic NYC event data
- **Coverage**: Jest coverage reports (target: 80%+)

## Unit Testing Patterns

### Component Testing Setup
```typescript
// __tests__/components/EventCard.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { EventCard } from '../src/components/EventCard';
import { mockEvent, mockSwipeHandler } from '../__mocks__/testData';

describe('EventCard', () => {
  const defaultProps = {
    event: mockEvent,
    onSwipe: jest.fn(),
    isVisible: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders event information correctly', () => {
    const { getByText, getByTestId } = render(<EventCard {...defaultProps} />);
    
    expect(getByText(mockEvent.title)).toBeTruthy();
    expect(getByText(mockEvent.location)).toBeTruthy();
    expect(getByTestId('event-image')).toBeTruthy();
  });

  it('calls onSwipe with correct direction on right swipe', async () => {
    const onSwipeMock = jest.fn();
    const { getByTestId } = render(
      <EventCard {...defaultProps} onSwipe={onSwipeMock} />
    );

    const card = getByTestId('swipeable-card');
    
    // Simulate right swipe gesture
    fireEvent(card, 'onGestureEvent', {
      nativeEvent: {
        translationX: 100,
        translationY: 0,
        velocityX: 500,
        velocityY: 0,
      }
    });

    await waitFor(() => {
      expect(onSwipeMock).toHaveBeenCalledWith('right');
    });
  });

  it('displays friend indicators when friends are interested', () => {
    const eventWithFriends = {
      ...mockEvent,
      friendCount: 3,
      interestedFriends: ['friend1', 'friend2', 'friend3']
    };

    const { getByText, getByTestId } = render(
      <EventCard {...defaultProps} event={eventWithFriends} />
    );

    expect(getByTestId('friend-indicator')).toBeTruthy();
    expect(getByText('3 friends interested')).toBeTruthy();
  });
});
```

### Service Layer Testing
```typescript
// __tests__/services/eventService.test.ts
import { eventService } from '../src/services/eventService';
import { supabase } from '../src/config/supabase';
import { mockEvents, mockUser } from '../__mocks__/testData';

// Mock Supabase
jest.mock('../src/config/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      upsert: jest.fn(),
    })),
  }
}));

describe('EventService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEventsForUser', () => {
    it('fetches events successfully', async () => {
      const mockRpc = supabase.rpc as jest.Mock;
      mockRpc.mockResolvedValue({ data: mockEvents, error: null });

      const result = await eventService.getEventsForUser(mockUser.id, 'now');

      expect(mockRpc).toHaveBeenCalledWith('get_user_feed', {
        user_uuid: mockUser.id,
        time_filter: 'now',
        limit_count: 20
      });
      expect(result).toEqual(mockEvents);
    });

    it('throws error when Supabase call fails', async () => {
      const mockRpc = supabase.rpc as jest.Mock;
      mockRpc.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      await expect(
        eventService.getEventsForUser(mockUser.id, 'now')
      ).rejects.toThrow('Database error');
    });

    it('handles network timeout gracefully', async () => {
      const mockRpc = supabase.rpc as jest.Mock;
      mockRpc.mockRejectedValue(new Error('Network timeout'));

      await expect(
        eventService.getEventsForUser(mockUser.id, 'now')
      ).rejects.toThrow('Failed to fetch events');
    });
  });

  describe('recordSwipe', () => {
    it('records swipe with correct parameters', async () => {
      const mockFrom = supabase.from as jest.Mock;
      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      
      mockFrom.mockReturnValue({ upsert: mockUpsert });

      await eventService.recordSwipe(mockUser.id, 'event-123', 'right');

      expect(mockFrom).toHaveBeenCalledWith('user_swipes');
      expect(mockUpsert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        event_id: 'event-123',
        swipe_direction: 'right'
      }, {
        onConflict: 'user_id,event_id'
      });
    });
  });
});
```

### Hook Testing
```typescript
// __tests__/hooks/useEvents.test.ts
import { renderHook, waitFor } from '@testing-library/react-native';
import { useEvents } from '../src/hooks/useEvents';
import { eventService } from '../src/services/eventService';
import { mockEvents } from '../__mocks__/testData';

jest.mock('../src/services/eventService');

describe('useEvents', () => {
  const mockEventService = eventService as jest.Mocked<typeof eventService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads events on mount', async () => {
    mockEventService.getEventsForUser.mockResolvedValue(mockEvents);

    const { result } = renderHook(() => useEvents('user-123', 'now'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.events).toEqual(mockEvents);
    expect(result.current.error).toBe(null);
  });

  it('handles loading errors', async () => {
    const errorMessage = 'Failed to load events';
    mockEventService.getEventsForUser.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useEvents('user-123', 'now'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.events).toEqual([]);
  });

  it('refetches events when time filter changes', async () => {
    mockEventService.getEventsForUser.mockResolvedValue(mockEvents);

    const { result, rerender } = renderHook(
      ({ timeFilter }) => useEvents('user-123', timeFilter),
      { initialProps: { timeFilter: 'now' as const } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    rerender({ timeFilter: 'planning' as const });

    expect(mockEventService.getEventsForUser).toHaveBeenCalledTimes(2);
    expect(mockEventService.getEventsForUser).toHaveBeenLastCalledWith(
      'user-123',
      'planning'
    );
  });
});
```

## Integration Testing

### Screen Integration Tests
```typescript
// __tests__/screens/DiscoverScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { DiscoverScreen } from '../src/screens/DiscoverScreen';
import { AuthProvider } from '../src/contexts/AuthContext';
import { mockUser, mockEvents } from '../__mocks__/testData';

const MockedDiscoverScreen = () => (
  <NavigationContainer>
    <AuthProvider initialUser={mockUser}>
      <DiscoverScreen />
    </AuthProvider>
  </NavigationContainer>
);

describe('DiscoverScreen Integration', () => {
  it('loads and displays events on screen load', async () => {
    const { getByText, getByTestId } = render(<MockedDiscoverScreen />);

    // Should show loading initially
    expect(getByTestId('loading-spinner')).toBeTruthy();

    // Wait for events to load
    await waitFor(() => {
      expect(getByText(mockEvents[0].title)).toBeTruthy();
    });

    // Should show toggle buttons
    expect(getByText('Happening Now')).toBeTruthy();
    expect(getByText('Planning Ahead')).toBeTruthy();
  });

  it('toggles between now and planning modes', async () => {
    const { getByText, getByTestId } = render(<MockedDiscoverScreen />);

    await waitFor(() => {
      expect(getByTestId('event-stack')).toBeTruthy();
    });

    // Tap planning toggle
    fireEvent.press(getByText('Planning Ahead'));

    // Should reload events with planning filter
    await waitFor(() => {
      expect(getByTestId('loading-spinner')).toBeTruthy();
    });
  });

  it('handles swipe actions and updates state', async () => {
    const { getByTestId } = render(<MockedDiscoverScreen />);

    await waitFor(() => {
      expect(getByTestId('event-card-0')).toBeTruthy();
    });

    const firstCard = getByTestId('event-card-0');

    // Simulate right swipe
    fireEvent(firstCard, 'onSwipe', 'right');

    // Card should be removed from stack
    await waitFor(() => {
      expect(() => getByTestId('event-card-0')).toThrow();
    });
  });
});
```

### API Integration Tests
```typescript
// __tests__/integration/api.test.ts
import { supabase } from '../src/config/supabase';
import { testUser, cleanupTestData } from '../__mocks__/testHelpers';

describe('API Integration Tests', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it('completes full swipe workflow', async () => {
    // Create test event
    const { data: event } = await supabase
      .from('events')
      .insert({
        title: 'Test Event',
        date_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        location: 'Test Location',
        category: 'networking'
      })
      .select()
      .single();

    // Record swipe
    const { error: swipeError } = await supabase
      .from('user_swipes')
      .insert({
        user_id: testUser.id,
        event_id: event.id,
        swipe_direction: 'right'
      });

    expect(swipeError).toBeNull();

    // Verify event appears in calendar
    const { data: calendarEvents } = await supabase
      .from('user_swipes')
      .select(`
        events (
          id, title, location
        )
      `)
      .eq('user_id', testUser.id)
      .eq('swipe_direction', 'right');

    expect(calendarEvents).toHaveLength(1);
    expect(calendarEvents[0].events.title).toBe('Test Event');
  });

  it('handles friend interest workflow', async () => {
    // Create friendship between test users
    const { data: friendship } = await supabase
      .from('friendships')
      .insert({
        user_id: testUser.id,
        friend_id: 'friend-user-id',
        status: 'accepted'
      });

    // Both users swipe right on same event
    const eventId = 'test-event-id';
    
    await Promise.all([
      supabase.from('user_swipes').insert({
        user_id: testUser.id,
        event_id: eventId,
        swipe_direction: 'right'
      }),
      supabase.from('user_swipes').insert({
        user_id: 'friend-user-id',
        event_id: eventId,
        swipe_direction: 'right'
      })
    ]);

    // Query should show mutual interest
    const { data: mutualInterest } = await supabase
      .rpc('get_friend_interests_for_event', {
        user_uuid: testUser.id,
        event_uuid: eventId
      });

    expect(mutualInterest).toContain('friend-user-id');
  });
});
```

## Mock Data & Test Utilities

### Test Data Factory
```typescript
// __mocks__/testData.ts
import { Event, User, SwipeDirection } from '../src/types';

export const mockUser: User = {
  id: 'test-user-123',
  email: 'test@example.com',
  fullName: 'Test User',
  location: 'NYC',
  interests: ['networking', 'fitness'],
  calendarPrivacy: 'private',
  onboardingCompleted: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const createMockEvent = (overrides: Partial<Event> = {}): Event => ({
  id: 'event-123',
  title: 'Test Networking Event',
  description: 'A great networking opportunity in NYC',
  dateTime: new Date(Date.now() + 86400000), // Tomorrow
  endTime: new Date(Date.now() + 86400000 + 7200000), // +2 hours
  location: 'Manhattan, NYC',
  venueName: 'Test Venue',
  address: '123 Test St, New York, NY',
  imageUrl: 'https://example.com/test-image.jpg',
  externalUrl: 'https://example.com/event',
  category: 'networking',
  eventType: 'general',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  friendCount: 0,
  interestedFriends: [],
  ...overrides,
});

export const mockEvents: Event[] = [
  createMockEvent({
    id: 'event-1',
    title: 'Morning Yoga Class',
    category: 'fitness',
    location: 'Central Park',
  }),
  createMockEvent({
    id: 'event-2',
    title: 'Tech Networking Happy Hour',
    category: 'networking',
    location: 'SoHo',
    friendCount: 3,
  }),
  createMockEvent({
    id: 'event-3',
    title: 'Art Gallery Opening',
    category: 'culture',
    location: 'Chelsea',
  }),
];

export const mockSwipeHandler = jest.fn((direction: SwipeDirection) => {
  console.log(`Swiped ${direction}`);
});
```

### Test Helpers
```typescript
// __mocks__/testHelpers.ts
import { supabase } from '../src/config/supabase';

export const testUser = {
  id: 'test-user-123',
  email: 'test@eventapp.test',
};

export const cleanupTestData = async () => {
  // Clean up test data between tests
  await Promise.all([
    supabase.from('user_swipes').delete().eq('user_id', testUser.id),
    supabase.from('friendships').delete().eq('user_id', testUser.id),
    supabase.from('events').delete().like('title', 'Test %'),
  ]);
};

export const createTestEvent = async (overrides = {}) => {
  const { data, error } = await supabase
    .from('events')
    .insert({
      title: 'Test Event',
      date_time: new Date(Date.now() + 86400000).toISOString(),
      location: 'Test Location',
      category: 'networking',
      is_active: true,
      ...overrides,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const createTestSwipe = async (eventId: string, direction: SwipeDirection) => {
  const { data, error } = await supabase
    .from('user_swipes')
    .insert({
      user_id: testUser.id,
      event_id: eventId,
      swipe_direction: direction,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

### Mock Service Worker Setup
```typescript
// __mocks__/server.ts
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { mockEvents } from './testData';

export const server = setupServer(
  // Mock Supabase REST API calls
  rest.post('https://test-project.supabase.co/rest/v1/rpc/get_user_feed', (req, res, ctx) => {
    return res(ctx.json(mockEvents));
  }),

  rest.post('https://test-project.supabase.co/rest/v1/user_swipes', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ success: true }));
  }),

  // Mock external APIs
  rest.get('https://api.resy.com/venues', (req, res, ctx) => {
    return res(
      ctx.json({
        venues: [
          {
            id: 'venue-1',
            name: 'Test Restaurant',
            location: 'NYC',
            availability: ['2024-12-01T19:00:00Z'],
          },
        ],
      })
    );
  }),
);

// Setup and teardown
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## End-to-End Testing

### Detox E2E Setup
```typescript
// e2e/firstTest.e2e.ts
import { device, expect, element, by } from 'detox';

describe('Event Discovery App E2E', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete onboarding flow', async () => {
    // Welcome screen
    await expect(element(by.text('Welcome to EventApp'))).toBeVisible();
    await element(by.text('Get Started')).tap();

    // Login screen
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('testpassword');
    await element(by.text('Sign In')).tap();

    // Should navigate to main app
    await expect(element(by.text('Discover'))).toBeVisible();
  });

  it('should swipe through events', async () => {
    // Navigate to discover tab
    await element(by.text('Discover')).tap();

    // Wait for events to load
    await expect(element(by.id('event-card-0'))).toBeVisible();

    // Swipe right on first event
    await element(by.id('event-card-0')).swipe('right');

    // Should show next event
    await expect(element(by.id('event-card-1'))).toBeVisible();

    // Swipe up to save
    await element(by.id('event-card-1')).swipe('up');

    // Navigate to My Events
    await element(by.text('My Events')).tap();

    // Should see saved event in appropriate section
    await expect(element(by.text('Saved for Later'))).toBeVisible();
  });

  it('should toggle between now and planning modes', async () => {
    await element(by.text('Discover')).tap();

    // Should start with "Happening Now"
    await expect(element(by.id('now-toggle'))).toHaveText('Happening Now');

    // Tap planning toggle
    await element(by.id('planning-toggle')).tap();

    // Should show planning events
    await expect(element(by.id('planning-toggle'))).toHaveText('Planning Ahead');
  });
});
```

## Performance Testing

### Performance Monitoring
```typescript
// __tests__/performance/swipePerformance.test.ts
import { performance } from 'perf_hooks';
import { render } from '@testing-library/react-native';
import { EventStack } from '../src/components/EventStack';
import { mockEvents } from '../__mocks__/testData';

describe('Swipe Performance', () => {
  it('should handle rapid swipes without lag', async () => {
    const { getByTestId } = render(
      <EventStack events={mockEvents} onSwipe={jest.fn()} />
    );

    const startTime = performance.now();

    // Simulate rapid swipes
    for (let i = 0; i < 10; i++) {
      const card = getByTestId(`event-card-${i}`);
      fireEvent(card, 'onSwipe', 'right');
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should complete in under 100ms
    expect(duration).toBeLessThan(100);
  });

  it('should maintain 60fps during animations', () => {
    // Performance monitoring during animation tests
    jest.setTimeout(5000);

    const { getByTestId } = render(
      <EventStack events={mockEvents} onSwipe={jest.fn()} />
    );

    // Monitor frame rate during swipe animation
    const frameRates: number[] = [];
    let lastTime = performance.now();

    const measureFrameRate = () => {
      const currentTime = performance.now();
      const fps = 1000 / (currentTime - lastTime);
      frameRates.push(fps);
      lastTime = currentTime;
    };

    // Trigger animation
    const card = getByTestId('event-card-0');
    fireEvent(card, 'onSwipe', 'right');

    // Measure for 1 second
    const interval = setInterval(measureFrameRate, 16); // ~60fps
    setTimeout(() => {
      clearInterval(interval);
      
      const averageFps = frameRates.reduce((a, b) => a + b, 0) / frameRates.length;
      expect(averageFps).toBeGreaterThan(55); // Allow some variance from 60fps
    }, 1000);
  });
});
```

## Test Configuration

### Jest Configuration
```typescript
// jest.config.js
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-reanimated|react-native-gesture-handler|@supabase)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.types.ts',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testTimeout: 10000,
};
```

### Test Setup
```typescript
// jest.setup.js
import 'react-native-gesture-handler/jestSetup';
import { server } from './__mocks__/server';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Supabase
jest.mock('./src/config/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
    rpc: jest.fn(),
  },
}));

// Setup MSW
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Global test utilities
global.console = {
  ...console,
  warn: jest.fn(), // Suppress warnings in tests
  error: jest.fn(), // Suppress errors in tests
};
```

## Test Automation & CI

### GitHub Actions Test Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  e2e:
    runs-on: macos-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup React Native
        uses: ./.github/actions/setup-rn

      - name: Build app for testing
        run: