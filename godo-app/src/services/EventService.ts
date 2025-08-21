import { Event, EventCategory, SwipeDirection } from '../types';
import { mockEvents } from '../data/mockEvents';

export class EventService {
  private static instance: EventService;
  private events: Event[] = [];
  private swipedEvents: Map<string, SwipeDirection> = new Map();
  
  private constructor() {
    this.events = [...mockEvents];
  }
  
  public static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }
  
  // Get all events
  public async getAllEvents(): Promise<Event[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...this.events];
  }
  
  // Get events that haven't been swiped yet
  public async getUnswipedEvents(): Promise<Event[]> {
    const allEvents = await this.getAllEvents();
    return allEvents.filter(event => !this.swipedEvents.has(event.id));
  }
  
  // Get events by category
  public async getEventsByCategory(category: EventCategory): Promise<Event[]> {
    const allEvents = await this.getAllEvents();
    return allEvents.filter(event => event.category === category);
  }
  
  // Get featured events
  public async getFeaturedEvents(): Promise<Event[]> {
    const allEvents = await this.getAllEvents();
    return allEvents.filter(event => event.isFeatured);
  }
  
  // Get events with friends attending
  public async getEventsWithFriends(): Promise<Event[]> {
    const allEvents = await this.getAllEvents();
    return allEvents.filter(event => event.friendsAttending && event.friendsAttending > 0);
  }
  
  // Get upcoming events in next N days
  public async getUpcomingEvents(days: number = 7): Promise<Event[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    
    const allEvents = await this.getAllEvents();
    return allEvents
      .filter(event => {
        const eventDate = new Date(event.datetime);
        return eventDate >= now && eventDate <= futureDate;
      })
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  }
  
  // Record a swipe action
  public swipeEvent(eventId: string, direction: SwipeDirection): void {
    this.swipedEvents.set(eventId, direction);
  }
  
  // Get swiped events by direction
  public getSwipedEvents(direction: SwipeDirection): Event[] {
    const swipedEventIds = Array.from(this.swipedEvents.entries())
      .filter(([_, swipeDirection]) => swipeDirection === direction)
      .map(([eventId, _]) => eventId);
    
    return this.events.filter(event => swipedEventIds.includes(event.id));
  }
  
  // Get events for private calendar (right swipes)
  public getPrivateCalendarEvents(): Event[] {
    return this.getSwipedEvents(SwipeDirection.RIGHT);
  }
  
  // Get events for public calendar (up swipes)
  public getPublicCalendarEvents(): Event[] {
    return this.getSwipedEvents(SwipeDirection.UP);
  }
  
  // Get saved events (down swipes)
  public getSavedEvents(): Event[] {
    return this.getSwipedEvents(SwipeDirection.DOWN);
  }
  
  // Get all calendar events (right + up swipes)
  public getAllCalendarEvents(): Event[] {
    return [
      ...this.getPrivateCalendarEvents(),
      ...this.getPublicCalendarEvents()
    ].sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  }
  
  // Check if event has been swiped
  public hasBeenSwiped(eventId: string): boolean {
    return this.swipedEvents.has(eventId);
  }
  
  // Get swipe direction for event
  public getSwipeDirection(eventId: string): SwipeDirection | null {
    return this.swipedEvents.get(eventId) || null;
  }
  
  // Remove swipe (undo action)
  public removeSwipe(eventId: string): void {
    this.swipedEvents.delete(eventId);
  }
  
  // Get event by ID
  public async getEventById(eventId: string): Promise<Event | null> {
    const allEvents = await this.getAllEvents();
    return allEvents.find(event => event.id === eventId) || null;
  }
  
  // Search events
  public async searchEvents(query: string): Promise<Event[]> {
    const allEvents = await this.getAllEvents();
    const lowercaseQuery = query.toLowerCase();
    
    return allEvents.filter(event => 
      event.title.toLowerCase().includes(lowercaseQuery) ||
      event.description?.toLowerCase().includes(lowercaseQuery) ||
      event.venue.name.toLowerCase().includes(lowercaseQuery) ||
      event.venue.neighborhood?.toLowerCase().includes(lowercaseQuery) ||
      event.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }
  
  // Get statistics
  public getSwipeStats(): {
    total: number;
    interested: number;
    saved: number;
    passed: number;
    publicEvents: number;
  } {
    const swipedEntries = Array.from(this.swipedEvents.values());
    
    return {
      total: swipedEntries.length,
      interested: swipedEntries.filter(dir => dir === SwipeDirection.RIGHT).length,
      saved: swipedEntries.filter(dir => dir === SwipeDirection.DOWN).length,
      passed: swipedEntries.filter(dir => dir === SwipeDirection.LEFT).length,
      publicEvents: swipedEntries.filter(dir => dir === SwipeDirection.UP).length,
    };
  }
}