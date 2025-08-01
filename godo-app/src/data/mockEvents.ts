import { Event, EventCategory, EventSource } from '../types';

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Rooftop Party at 230 Fifth',
    description:
      "Dance under the stars at NYC's most iconic rooftop bar with panoramic city views",
    date: new Date('2025-08-01T21:00:00'),
    location: {
      name: '230 Fifth Rooftop Bar',
      address: '230 5th Ave, New York, NY 10001',
      coordinates: { lat: 40.7448, lng: -73.9876 },
    },
    category: EventCategory.NIGHTLIFE,
    imageUrl:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    ticketUrl: 'https://example.com/rooftop-party',
    price: { min: 25, max: 45, currency: 'USD' },
    capacity: 200,
    attendeeCount: 87,
    source: EventSource.MANUAL,
    externalId: 'mock_1',
    lastUpdated: new Date(),
    isActive: true,
  },
  {
    id: '2',
    title: 'SoHo Art Gallery Opening',
    description:
      'Discover cutting-edge contemporary art from emerging NYC artists',
    date: new Date('2025-08-02T19:00:00'),
    location: {
      name: 'Gallery Luna',
      address: '123 Spring St, New York, NY 10012',
      coordinates: { lat: 40.7242, lng: -74.0024 },
    },
    category: EventCategory.CULTURE,
    imageUrl:
      'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800',
    price: { min: 0, max: 0, currency: 'USD' },
    capacity: 150,
    attendeeCount: 42,
    source: EventSource.MANUAL,
    externalId: 'mock_2',
    lastUpdated: new Date(),
    isActive: true,
  },
  {
    id: '3',
    title: 'Morning Yoga in Central Park',
    description: 'Start your day with mindful movement surrounded by nature',
    date: new Date('2025-08-03T08:00:00'),
    location: {
      name: 'Sheep Meadow',
      address: 'Central Park, New York, NY 10024',
      coordinates: { lat: 40.7794, lng: -73.9755 },
    },
    category: EventCategory.FITNESS,
    imageUrl:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    price: { min: 15, max: 15, currency: 'USD' },
    capacity: 50,
    attendeeCount: 23,
    source: EventSource.MANUAL,
    externalId: 'mock_3',
    lastUpdated: new Date(),
    isActive: true,
  },
  {
    id: '4',
    title: 'Food Truck Festival',
    description: 'Taste the best street food NYC has to offer from 20+ vendors',
    date: new Date('2025-08-03T12:00:00'),
    location: {
      name: 'Brooklyn Bridge Park',
      address: 'Brooklyn Bridge Park, Brooklyn, NY 11201',
      coordinates: { lat: 40.7023, lng: -73.9958 },
    },
    category: EventCategory.FOOD,
    imageUrl:
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800',
    price: { min: 0, max: 30, currency: 'USD' },
    capacity: 500,
    attendeeCount: 234,
    source: EventSource.MANUAL,
    externalId: 'mock_4',
    lastUpdated: new Date(),
    isActive: true,
  },
  {
    id: '5',
    title: 'Networking Happy Hour',
    description: 'Connect with fellow young professionals in tech and startups',
    date: new Date('2025-08-04T18:30:00'),
    location: {
      name: 'The Press Lounge',
      address: '653 11th Ave, New York, NY 10019',
      coordinates: { lat: 40.7614, lng: -73.9956 },
    },
    category: EventCategory.PROFESSIONAL,
    imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    price: { min: 20, max: 35, currency: 'USD' },
    capacity: 100,
    attendeeCount: 67,
    source: EventSource.MANUAL,
    externalId: 'mock_5',
    lastUpdated: new Date(),
    isActive: true,
  },
  {
    id: '6',
    title: 'Sunset Kayaking Adventure',
    description:
      'Paddle through Manhattan waters as the sun sets over the skyline',
    date: new Date('2025-08-05T17:30:00'),
    location: {
      name: 'Manhattan Kayak Company',
      address: 'Pier 84, New York, NY 10019',
      coordinates: { lat: 40.7681, lng: -73.9928 },
    },
    category: EventCategory.OUTDOOR,
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
    price: { min: 45, max: 65, currency: 'USD' },
    capacity: 30,
    attendeeCount: 18,
    source: EventSource.MANUAL,
    externalId: 'mock_6',
    lastUpdated: new Date(),
    isActive: true,
  },
  {
    id: '7',
    title: 'Underground Jazz Night',
    description: 'Intimate jazz performance in a hidden speakeasy-style venue',
    date: new Date('2025-08-06T20:00:00'),
    location: {
      name: 'The Django',
      address: '2 6th Ave, New York, NY 10013',
      coordinates: { lat: 40.7209, lng: -74.0007 },
    },
    category: EventCategory.CULTURE,
    imageUrl:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    price: { min: 30, max: 50, currency: 'USD' },
    capacity: 80,
    attendeeCount: 45,
    source: EventSource.MANUAL,
    externalId: 'mock_7',
    lastUpdated: new Date(),
    isActive: true,
  },
  {
    id: '8',
    title: 'Rooftop Brunch & Bottomless Mimosas',
    description: 'Weekend vibes with unlimited mimosas and Manhattan views',
    date: new Date('2025-08-07T11:00:00'),
    location: {
      name: 'Westlight',
      address: '111 N 12th St, Brooklyn, NY 11249',
      coordinates: { lat: 40.7281, lng: -73.9571 },
    },
    category: EventCategory.FOOD,
    imageUrl:
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    price: { min: 55, max: 75, currency: 'USD' },
    capacity: 120,
    attendeeCount: 89,
    source: EventSource.MANUAL,
    externalId: 'mock_8',
    lastUpdated: new Date(),
    isActive: true,
  },
];

export const getCategoryEmoji = (category: EventCategory): string => {
  switch (category) {
    case EventCategory.NIGHTLIFE:
      return '🌙';
    case EventCategory.CULTURE:
      return '🎨';
    case EventCategory.FITNESS:
      return '💪';
    case EventCategory.FOOD:
      return '🍴';
    case EventCategory.PROFESSIONAL:
      return '💼';
    case EventCategory.OUTDOOR:
      return '🌲';
    default:
      return '🎉';
  }
};

export const formatEventTime = (date: Date): string => {
  const now = new Date();
  const eventDate = new Date(date);
  const diffInHours = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24 && diffInHours > 0) {
    return `Tonight • ${eventDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })}`;
  } else if (diffInHours < 48 && diffInHours > 0) {
    return `Tomorrow • ${eventDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })}`;
  } else {
    return eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
};
