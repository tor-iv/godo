/**
 * Mock data for testing
 */

export const mockEvents = [
  {
    id: '1',
    title: 'Coffee & Code Networking',
    description: 'Join fellow developers for morning coffee and casual networking.',
    datetime: '2024-12-25T09:00:00Z',
    category: 'NETWORKING',
    venue: {
      name: 'Tech Hub Café',
      address: '123 Developer St',
      neighborhood: 'Tech District',
      city: 'San Francisco',
      coordinates: { lat: 37.7749, lng: -122.4194 }
    },
    currentAttendees: 25,
    maxAttendees: 50,
    friendsAttending: 3,
    price: 0,
    tags: ['networking', 'coffee', 'developers'],
    image: 'https://example.com/coffee-networking.jpg'
  },
  {
    id: '2',
    title: 'Startup Pitch Night',
    description: 'Watch emerging startups pitch their ideas to investors.',
    datetime: '2024-12-25T19:00:00Z',
    category: 'PROFESSIONAL',
    venue: {
      name: 'Innovation Center',
      address: '456 Startup Ave',
      neighborhood: 'Financial District',
      city: 'San Francisco',
      coordinates: { lat: 37.7849, lng: -122.4094 }
    },
    currentAttendees: 120,
    maxAttendees: 200,
    friendsAttending: 1,
    price: 25,
    tags: ['startup', 'pitch', 'investors'],
    image: 'https://example.com/startup-pitch.jpg'
  },
  {
    id: '3',
    title: 'Art Gallery Opening',
    description: 'Contemporary art exhibition featuring local artists.',
    datetime: '2024-12-26T18:00:00Z',
    category: 'CULTURE',
    venue: {
      name: 'Modern Art Gallery',
      address: '789 Culture St',
      neighborhood: 'Arts District',
      city: 'San Francisco',
      coordinates: { lat: 37.7649, lng: -122.4294 }
    },
    currentAttendees: 45,
    maxAttendees: 100,
    friendsAttending: 2,
    price: 15,
    tags: ['art', 'gallery', 'culture'],
    image: 'https://example.com/art-gallery.jpg'
  },
  {
    id: '4',
    title: 'Morning Yoga in the Park',
    description: 'Start your day with peaceful yoga in beautiful Golden Gate Park.',
    datetime: '2024-12-27T07:00:00Z',
    category: 'FITNESS',
    venue: {
      name: 'Golden Gate Park',
      address: 'Golden Gate Park',
      neighborhood: 'Richmond',
      city: 'San Francisco',
      coordinates: { lat: 37.7694, lng: -122.4862 }
    },
    currentAttendees: 15,
    maxAttendees: 30,
    friendsAttending: 0,
    price: 20,
    tags: ['yoga', 'fitness', 'outdoor'],
    image: 'https://example.com/morning-yoga.jpg'
  },
  {
    id: '5',
    title: 'Food Truck Festival',
    description: 'Taste cuisines from around the world at this food truck gathering.',
    datetime: '2024-12-28T12:00:00Z',
    category: 'FOOD',
    venue: {
      name: 'Civic Center Plaza',
      address: 'Civic Center Plaza',
      neighborhood: 'Civic Center',
      city: 'San Francisco',
      coordinates: { lat: 37.7799, lng: -122.4164 }
    },
    currentAttendees: 200,
    maxAttendees: 500,
    friendsAttending: 5,
    price: 0,
    tags: ['food', 'festival', 'outdoor'],
    image: 'https://example.com/food-truck-festival.jpg'
  }
];

export const mockUser = {
  id: 'user-123',
  name: 'John Doe',
  email: 'john.doe@example.com',
  profilePicture: 'https://example.com/profile-pic.jpg',
  bio: 'Tech enthusiast who loves networking and discovering new events in the city.',
  preferences: {
    categories: ['NETWORKING', 'TECH', 'CULTURE'],
    notifications: {
      eventReminders: true,
      friendActivity: true,
      newEvents: false
    },
    privacy: {
      showProfile: true,
      showAttendance: true,
      allowFriendRequests: true
    }
  },
  stats: {
    eventsAttended: 42,
    eventsCreated: 8,
    friendsCount: 127,
    favoriteCategory: 'NETWORKING'
  },
  location: {
    city: 'San Francisco',
    state: 'CA',
    neighborhood: 'Mission'
  }
};

export const mockFriends = [
  {
    id: 'friend-1',
    name: 'Sarah Johnson',
    profilePicture: 'https://example.com/sarah-profile.jpg',
    mutualFriends: 12,
    commonInterests: ['NETWORKING', 'CULTURE']
  },
  {
    id: 'friend-2',
    name: 'Mike Chen',
    profilePicture: 'https://example.com/mike-profile.jpg',
    mutualFriends: 8,
    commonInterests: ['TECH', 'FITNESS']
  },
  {
    id: 'friend-3',
    name: 'Emily Rodriguez',
    profilePicture: 'https://example.com/emily-profile.jpg',
    mutualFriends: 15,
    commonInterests: ['FOOD', 'CULTURE', 'OUTDOOR']
  }
];

export const mockNotifications = [
  {
    id: 'notif-1',
    type: 'event_reminder',
    title: 'Event Reminder',
    message: 'Coffee & Code Networking starts in 30 minutes',
    timestamp: '2024-12-25T08:30:00Z',
    eventId: '1',
    read: false
  },
  {
    id: 'notif-2',
    type: 'friend_activity',
    title: 'Friend Activity',
    message: 'Sarah Johnson is attending Startup Pitch Night',
    timestamp: '2024-12-24T15:00:00Z',
    friendId: 'friend-1',
    eventId: '2',
    read: true
  },
  {
    id: 'notif-3',
    type: 'new_event',
    title: 'New Event',
    message: 'New NETWORKING event added near you',
    timestamp: '2024-12-24T12:00:00Z',
    eventId: '6',
    read: false
  }
];

export const mockCategories = [
  { id: 'NETWORKING', name: 'Networking', icon: 'users', color: '#6366f1' },
  { id: 'CULTURE', name: 'Culture', icon: 'image', color: '#ec4899' },
  { id: 'FITNESS', name: 'Fitness', icon: 'activity', color: '#10b981' },
  { id: 'FOOD', name: 'Food & Drink', icon: 'coffee', color: '#f59e0b' },
  { id: 'NIGHTLIFE', name: 'Nightlife', icon: 'moon', color: '#8b5cf6' },
  { id: 'OUTDOOR', name: 'Outdoor', icon: 'sun', color: '#059669' },
  { id: 'PROFESSIONAL', name: 'Professional', icon: 'briefcase', color: '#dc2626' }
];

export const mockVenues = [
  {
    id: 'venue-1',
    name: 'Tech Hub Café',
    address: '123 Developer St',
    neighborhood: 'Tech District',
    city: 'San Francisco',
    coordinates: { lat: 37.7749, lng: -122.4194 },
    capacity: 50,
    amenities: ['wifi', 'coffee', 'projector'],
    rating: 4.5
  },
  {
    id: 'venue-2',
    name: 'Innovation Center',
    address: '456 Startup Ave',
    neighborhood: 'Financial District',
    city: 'San Francisco',
    coordinates: { lat: 37.7849, lng: -122.4094 },
    capacity: 200,
    amenities: ['presentation_screen', 'microphone', 'parking'],
    rating: 4.8
  }
];

export const mockErrorStates = {
  networkError: {
    type: 'NETWORK_ERROR',
    message: 'Unable to connect to the server. Please check your internet connection.',
    recoverable: true
  },
  validationError: {
    type: 'VALIDATION_ERROR',
    message: 'Please fill in all required fields.',
    recoverable: true
  },
  permissionError: {
    type: 'PERMISSION_ERROR',
    message: 'Camera permission is required to upload photos.',
    recoverable: true
  },
  serverError: {
    type: 'SERVER_ERROR',
    message: 'Something went wrong on our end. Please try again later.',
    recoverable: true
  }
};

// Mock API responses
export const mockApiResponses = {
  events: {
    success: {
      status: 200,
      data: mockEvents
    },
    error: {
      status: 500,
      message: 'Internal server error'
    },
    empty: {
      status: 200,
      data: []
    }
  },
  user: {
    success: {
      status: 200,
      data: mockUser
    },
    unauthorized: {
      status: 401,
      message: 'Unauthorized'
    }
  }
};

// Test data generators
export const generateMockEvents = (count = 10) => {
  return Array(count).fill(null).map((_, index) => ({
    ...mockEvents[0],
    id: `generated-event-${index}`,
    title: `Generated Event ${index}`,
    datetime: new Date(2024, 11, 25 + (index % 30), 10 + (index % 12)).toISOString()
  }));
};

export const generateLargeEventList = (count = 1000) => {
  return Array(count).fill(null).map((_, index) => ({
    id: `large-event-${index}`,
    title: `Large Event ${index}`,
    description: `Description for event ${index}`,
    datetime: new Date(2024, 0, 1 + (index % 365), 10 + (index % 12)).toISOString(),
    category: mockCategories[index % mockCategories.length].id,
    venue: {
      name: `Venue ${index}`,
      address: `${index} Event Street`,
      neighborhood: `District ${index % 10}`,
      city: 'San Francisco',
      coordinates: { 
        lat: 37.7749 + (Math.random() - 0.5) * 0.1, 
        lng: -122.4194 + (Math.random() - 0.5) * 0.1 
      }
    },
    currentAttendees: Math.floor(Math.random() * 100),
    maxAttendees: 100 + Math.floor(Math.random() * 200),
    friendsAttending: Math.floor(Math.random() * 5),
    price: Math.floor(Math.random() * 50),
    tags: [`tag${index % 10}`, `category${index % 5}`],
    image: `https://example.com/event-${index}.jpg`
  }));
};

export default {
  mockEvents,
  mockUser,
  mockFriends,
  mockNotifications,
  mockCategories,
  mockVenues,
  mockErrorStates,
  mockApiResponses,
  generateMockEvents,
  generateLargeEventList
};