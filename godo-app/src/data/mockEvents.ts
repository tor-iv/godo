import { Event, EventCategory, EventSource } from '../types';

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Rooftop Networking at WeWork',
    description: 'Connect with fellow professionals in tech, finance, and startups. Enjoy craft cocktails and stunning Manhattan views while building meaningful connections.',
    date: new Date('2024-08-22T18:30:00'),
    datetime: '2024-08-22T18:30:00.000Z',
    location: {
      name: 'WeWork Dumbo Heights',
      address: '81 Prospect St, Brooklyn, NY 11201',
      coordinates: { lat: 40.7033, lng: -73.9987 }
    },
    venue: {
      name: 'WeWork Dumbo Heights',
      neighborhood: 'Dumbo'
    },
    category: EventCategory.NETWORKING,
    source: EventSource.EVENTBRITE,
    imageUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=600&fit=crop',
    priceMin: 25,
    priceMax: 25,
    capacity: 80,
    currentAttendees: 47,
    isFeatured: true,
    friendsAttending: 3,
    tags: ['networking', 'tech', 'professionals', 'rooftop']
  },
  {
    id: '2',
    title: 'MoMA After Dark: Contemporary Art',
    description: 'Explore the museum after hours with exclusive access to new exhibitions, live music, and artisanal cocktails.',
    date: new Date('2024-08-23T19:00:00'),
    datetime: '2024-08-23T19:00:00.000Z',
    location: {
      name: 'Museum of Modern Art',
      address: '11 W 53rd St, New York, NY 10019',
      coordinates: { lat: 40.7614, lng: -73.9776 }
    },
    venue: {
      name: 'MoMA',
      neighborhood: 'Midtown'
    },
    category: EventCategory.CULTURE,
    source: EventSource.MET_MUSEUM,
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
    priceMin: 35,
    priceMax: 35,
    capacity: 150,
    currentAttendees: 92,
    isFeatured: false,
    friendsAttending: 1,
    tags: ['art', 'culture', 'museum', 'after hours']
  },
  {
    id: '3',
    title: 'Morning Yoga in Central Park',
    description: 'Start your day with energizing vinyasa flow in the heart of Manhattan. All levels welcome.',
    date: new Date('2024-08-24T07:00:00'),
    datetime: '2024-08-24T07:00:00.000Z',
    location: {
      name: 'Sheep Meadow, Central Park',
      address: 'Central Park, New York, NY 10024',
      coordinates: { lat: 40.7749, lng: -73.9759 }
    },
    venue: {
      name: 'Central Park',
      neighborhood: 'Upper West Side'
    },
    category: EventCategory.FITNESS,
    source: EventSource.NYC_PARKS,
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop',
    priceMin: 0,
    capacity: 30,
    currentAttendees: 18,
    isFeatured: false,
    friendsAttending: 0,
    tags: ['yoga', 'fitness', 'outdoor', 'morning']
  },
  {
    id: '4',
    title: 'Chef\'s Table at Le Bernardin',
    description: 'Exclusive 7-course tasting menu with wine pairings. Experience world-class French cuisine in an intimate setting.',
    date: new Date('2024-08-25T20:00:00'),
    datetime: '2024-08-25T20:00:00.000Z',
    location: {
      name: 'Le Bernardin',
      address: '155 W 51st St, New York, NY 10019',
      coordinates: { lat: 40.7614, lng: -73.9845 }
    },
    venue: {
      name: 'Le Bernardin',
      neighborhood: 'Midtown'
    },
    category: EventCategory.FOOD,
    source: EventSource.RESY,
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
    priceMin: 295,
    priceMax: 395,
    capacity: 12,
    currentAttendees: 9,
    isFeatured: true,
    friendsAttending: 2,
    tags: ['fine dining', 'french cuisine', 'chef\'s table', 'wine pairing']
  },
  {
    id: '5',
    title: 'Rooftop Cinema: Casablanca',
    description: 'Classic film screening under the stars with city skyline views. Blankets and popcorn provided.',
    date: new Date('2024-08-26T20:30:00'),
    datetime: '2024-08-26T20:30:00.000Z',
    location: {
      name: 'Rooftop Films at Industry City',
      address: '220 36th St, Brooklyn, NY 11232',
      coordinates: { lat: 40.6572, lng: -74.0089 }
    },
    venue: {
      name: 'Industry City',
      neighborhood: 'Sunset Park'
    },
    category: EventCategory.CULTURE,
    source: EventSource.EVENTBRITE,
    imageUrl: 'https://images.unsplash.com/photo-1489599317324-6c059b1c3ae0?w=800&h=600&fit=crop',
    priceMin: 18,
    priceMax: 25,
    capacity: 200,
    currentAttendees: 134,
    isFeatured: false,
    friendsAttending: 4,
    tags: ['movie', 'rooftop', 'outdoor', 'classic film']
  },
  {
    id: '6',
    title: 'Brooklyn Bridge Sunrise Run',
    description: 'Join fellow runners for a scenic 5K across the iconic Brooklyn Bridge at golden hour.',
    date: new Date('2024-08-27T06:00:00'),
    datetime: '2024-08-27T06:00:00.000Z',
    location: {
      name: 'Brooklyn Bridge Park',
      address: '334 Furman St, Brooklyn, NY 11201',
      coordinates: { lat: 40.7023, lng: -73.9964 }
    },
    venue: {
      name: 'Brooklyn Bridge Park',
      neighborhood: 'Dumbo'
    },
    category: EventCategory.FITNESS,
    source: EventSource.NYC_PARKS,
    imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&h=600&fit=crop',
    priceMin: 0,
    capacity: 50,
    currentAttendees: 23,
    isFeatured: false,
    friendsAttending: 1,
    tags: ['running', 'sunrise', 'brooklyn bridge', 'fitness']
  },
  {
    id: '7',
    title: 'Jazz at Lincoln Center: Late Night',
    description: 'Intimate late-night jazz performance featuring emerging artists and established masters.',
    date: new Date('2024-08-28T22:30:00'),
    datetime: '2024-08-28T22:30:00.000Z',
    location: {
      name: 'Dizzy\'s Club',
      address: '10 Columbus Cir, New York, NY 10019',
      coordinates: { lat: 40.7677, lng: -73.9826 }
    },
    venue: {
      name: 'Jazz at Lincoln Center',
      neighborhood: 'Upper West Side'
    },
    category: EventCategory.NIGHTLIFE,
    source: EventSource.TICKETMASTER,
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
    priceMin: 45,
    priceMax: 85,
    capacity: 120,
    currentAttendees: 87,
    isFeatured: true,
    friendsAttending: 2,
    tags: ['jazz', 'music', 'late night', 'lincoln center']
  },
  {
    id: '8',
    title: 'High Line Urban Garden Workshop',
    description: 'Learn sustainable gardening techniques in an urban environment. Take home your own planted container.',
    date: new Date('2024-08-29T14:00:00'),
    datetime: '2024-08-29T14:00:00.000Z',
    location: {
      name: 'High Line Park',
      address: 'Gansevoort St & Washington St, New York, NY 10014',
      coordinates: { lat: 40.7411, lng: -74.0086 }
    },
    venue: {
      name: 'The High Line',
      neighborhood: 'Meatpacking District'
    },
    category: EventCategory.OUTDOOR,
    source: EventSource.NYC_PARKS,
    imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop',
    priceMin: 35,
    priceMax: 35,
    capacity: 25,
    currentAttendees: 12,
    isFeatured: false,
    friendsAttending: 0,
    tags: ['gardening', 'workshop', 'high line', 'urban']
  },
  {
    id: '9',
    title: 'Tech Startup Pitch Competition',
    description: 'Watch innovative startups present their ideas to investors and industry experts. Network with entrepreneurs and VCs.',
    date: new Date('2024-08-30T18:00:00'),
    datetime: '2024-08-30T18:00:00.000Z',
    location: {
      name: 'NYU Stern School of Business',
      address: '44 W 4th St, New York, NY 10012',
      coordinates: { lat: 40.7295, lng: -73.9965 }
    },
    venue: {
      name: 'NYU Stern',
      neighborhood: 'Greenwich Village'
    },
    category: EventCategory.PROFESSIONAL,
    source: EventSource.EVENTBRITE,
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
    priceMin: 15,
    priceMax: 25,
    capacity: 200,
    currentAttendees: 156,
    isFeatured: false,
    friendsAttending: 5,
    tags: ['startups', 'pitch', 'networking', 'tech']
  },
  {
    id: '10',
    title: 'Williamsburg Food Truck Festival',
    description: 'Taste the best street food from across the five boroughs. Live music and craft beer available.',
    date: new Date('2024-08-31T12:00:00'),
    datetime: '2024-08-31T12:00:00.000Z',
    location: {
      name: 'East River State Park',
      address: '90 Kent Ave, Brooklyn, NY 11249',
      coordinates: { lat: 40.7209, lng: -73.9573 }
    },
    venue: {
      name: 'East River State Park',
      neighborhood: 'Williamsburg'
    },
    category: EventCategory.FOOD,
    source: EventSource.NYC_OPEN_DATA,
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop',
    priceMin: 0,
    capacity: 500,
    currentAttendees: 284,
    isFeatured: true,
    friendsAttending: 6,
    tags: ['food trucks', 'festival', 'street food', 'williamsburg']
  },
  {
    id: '11',
    title: 'Cocktail Making Masterclass',
    description: 'Learn from award-winning mixologists. Create three signature cocktails and enjoy light appetizers.',
    date: new Date('2024-09-01T16:00:00'),
    datetime: '2024-09-01T16:00:00.000Z',
    location: {
      name: 'PDT (Please Don\'t Tell)',
      address: '113 St Marks Pl, New York, NY 10009',
      coordinates: { lat: 40.7289, lng: -73.9862 }
    },
    venue: {
      name: 'PDT',
      neighborhood: 'East Village'
    },
    category: EventCategory.NIGHTLIFE,
    source: EventSource.EVENTBRITE,
    imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&h=600&fit=crop',
    priceMin: 65,
    priceMax: 85,
    capacity: 16,
    currentAttendees: 11,
    isFeatured: false,
    friendsAttending: 1,
    tags: ['cocktails', 'mixology', 'masterclass', 'speakeasy']
  },
  {
    id: '12',
    title: 'Central Park Conservancy Concert',
    description: 'Free outdoor concert featuring the New York Philharmonic. Bring a blanket and enjoy classical music under the stars.',
    date: new Date('2024-09-02T19:30:00'),
    datetime: '2024-09-02T19:30:00.000Z',
    location: {
      name: 'Great Lawn, Central Park',
      address: 'Central Park, New York, NY 10024',
      coordinates: { lat: 40.7829, lng: -73.9654 }
    },
    venue: {
      name: 'Central Park',
      neighborhood: 'Upper East Side'
    },
    category: EventCategory.CULTURE,
    source: EventSource.NYC_PARKS,
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
    priceMin: 0,
    capacity: 1000,
    currentAttendees: 432,
    isFeatured: true,
    friendsAttending: 8,
    tags: ['classical music', 'outdoor', 'free', 'philharmonic']
  }
];

// Utility functions for working with mock data
export const getEventsByCategory = (category: EventCategory): Event[] => {
  return mockEvents.filter(event => event.category === category);
};

export const getFeaturedEvents = (): Event[] => {
  return mockEvents.filter(event => event.isFeatured);
};

export const getEventsWithFriends = (): Event[] => {
  return mockEvents.filter(event => event.friendsAttending && event.friendsAttending > 0);
};

export const getFreeEvents = (): Event[] => {
  return mockEvents.filter(event => !event.priceMin || event.priceMin === 0);
};

export const getEventsByNeighborhood = (neighborhood: string): Event[] => {
  return mockEvents.filter(event => 
    event.venue.neighborhood?.toLowerCase().includes(neighborhood.toLowerCase())
  );
};

export const getUpcomingEvents = (days: number = 7): Event[] => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
  
  return mockEvents.filter(event => {
    const eventDate = new Date(event.datetime);
    return eventDate >= now && eventDate <= futureDate;
  }).sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
};