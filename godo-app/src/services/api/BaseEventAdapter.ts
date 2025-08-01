import { EventAPIAdapter, EventAPIParams, EventAPIResponse, Event, EventSource } from '../../types';

export abstract class BaseEventAdapter implements EventAPIAdapter {
  abstract source: EventSource;
  
  abstract fetchEvents(params: EventAPIParams): Promise<EventAPIResponse>;
  abstract transformEvent(externalEvent: any): Event;
  
  validateEvent(event: Event): boolean {
    const requiredFields = [
      'id',
      'title',
      'description', 
      'date',
      'location',
      'category',
      'source',
      'externalId'
    ];
    
    for (const field of requiredFields) {
      if (!event[field as keyof Event]) {
        console.warn(`Event validation failed: missing ${field}`, event);
        return false;
      }
    }
    
    // Validate location has required fields
    if (!event.location.name || !event.location.address || !event.location.coordinates) {
      console.warn('Event validation failed: incomplete location data', event);
      return false;
    }
    
    // Validate coordinates
    const { lat, lng } = event.location.coordinates;
    if (typeof lat !== 'number' || typeof lng !== 'number' || 
        lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.warn('Event validation failed: invalid coordinates', event);
      return false;
    }
    
    // Validate date is in the future (with some tolerance for ongoing events)
    const now = new Date();
    const eventDate = new Date(event.date);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    if (eventDate < oneDayAgo) {
      console.warn('Event validation failed: event date is too far in the past', event);
      return false;
    }
    
    return true;
  }
  
  protected generateInternalId(source: EventSource, externalId: string): string {
    return `${source}_${externalId}`;
  }
  
  protected isWithinNYC(lat: number, lng: number): boolean {
    // NYC approximate bounding box
    const nycBounds = {
      north: 40.9176,
      south: 40.4774,
      east: -73.7004,
      west: -74.2591
    };
    
    return lat >= nycBounds.south && 
           lat <= nycBounds.north && 
           lng >= nycBounds.west && 
           lng <= nycBounds.east;
  }
  
  protected calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}