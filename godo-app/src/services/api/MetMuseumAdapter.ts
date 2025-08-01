import { BaseEventAdapter } from './BaseEventAdapter';
import { 
  EventSource, 
  Event, 
  EventCategory, 
  EventAPIParams, 
  EventAPIResponse 
} from '../../types';

interface MetObject {
  objectID: number;
  isHighlight: boolean;
  accessionNumber: string;
  accessionYear: string;
  isPublicDomain: boolean;
  primaryImage: string;
  primaryImageSmall: string;
  additionalImages: string[];
  constituents: Array<{
    constituentID: number;
    role: string;
    name: string;
    constituentULAN_URL: string;
    constituentWikidata_URL: string;
    gender: string;
  }> | null;
  department: string;
  objectName: string;
  title: string;
  culture: string;
  period: string;
  dynasty: string;
  reign: string;
  portfolio: string;
  artistRole: string;
  artistPrefix: string;
  artistDisplayName: string;
  artistDisplayBio: string;
  artistSuffix: string;
  artistAlphaSort: string;
  artistNationality: string;
  artistBeginDate: string;
  artistEndDate: string;
  artistGender: string;
  artistWikidata_URL: string;
  artistULAN_URL: string;
  objectDate: string;
  objectBeginDate: number;
  objectEndDate: number;
  medium: string;
  dimensions: string;
  measurements: Array<{
    elementName: string;
    elementDescription: string | null;
    elementMeasurements: {
      Height: number;
      Width: number;
    };
  }> | null;
  creditLine: string;
  geographyType: string;
  city: string;
  state: string;
  county: string;
  country: string;
  region: string;
  subregion: string;
  locale: string;
  locus: string;
  excavation: string;
  river: string;
  classification: string;
  rightsAndReproduction: string;
  linkResource: string;
  metadataDate: string;
  repository: string;
  objectURL: string;
  tags: Array<{
    term: string;
    AAT_URL: string;
    Wikidata_URL: string;
  }> | null;
  objectWikidata_URL: string;
  isTimelineWork: boolean;
  GalleryNumber: string;
}

interface MetSearchResponse {
  total: number;
  objectIDs: number[] | null;
}

export class MetMuseumAdapter extends BaseEventAdapter {
  source = EventSource.NYC_CULTURAL;
  private baseUrl = 'https://collectionapi.metmuseum.org/public/collection/v1';
  
  // Met Museum location
  private readonly metLocation = {
    name: 'The Metropolitan Museum of Art',
    address: '1000 5th Ave, New York, NY 10028',
    coordinates: { lat: 40.7794, lng: -73.9632 }
  };

  async fetchEvents(params: EventAPIParams): Promise<EventAPIResponse> {
    try {
      // The Met API doesn't have traditional "events" but we can create events from:
      // 1. Recent acquisitions (new artworks)
      // 2. Highlighted objects (special exhibitions)
      // 3. Objects on view (current gallery displays)
      
      const events: Event[] = [];
      
      // Fetch highlighted objects as "special exhibition" events
      await this.fetchHighlightedObjects(events, params.limit || 20);
      
      // Fetch recent acquisitions as "new arrival" events
      await this.fetchRecentAcquisitions(events, params.limit || 20);

      return {
        events,
        totalCount: events.length,
        hasMore: false, // Met API doesn't support pagination in this context
        nextCursor: undefined,
      };
    } catch (error) {
      console.error('Error fetching events from Met Museum:', error);
      throw error;
    }
  }

  private async fetchHighlightedObjects(events: Event[], limit: number): Promise<void> {
    try {
      // Search for highlighted objects
      const searchResponse = await fetch(
        `${this.baseUrl}/search?isHighlight=true&q=*&hasImages=true`
      );
      
      if (!searchResponse.ok) {
        throw new Error(`Met API search error: ${searchResponse.statusText}`);
      }
      
      const searchData: MetSearchResponse = await searchResponse.json();
      
      if (!searchData.objectIDs || searchData.objectIDs.length === 0) {
        return;
      }

      // Fetch details for first few highlighted objects
      const objectsToFetch = searchData.objectIDs.slice(0, Math.min(limit, 10));
      
      for (const objectID of objectsToFetch) {
        try {
          const event = await this.createEventFromObject(objectID, 'highlight');
          if (event && this.validateEvent(event)) {
            events.push(event);
          }
        } catch (error) {
          console.warn(`Failed to create event from Met object ${objectID}:`, error);
        }
      }
    } catch (error) {
      console.error('Error fetching highlighted objects:', error);
    }
  }

  private async fetchRecentAcquisitions(events: Event[], limit: number): Promise<void> {
    try {
      // Search for recent acquisitions (last 5 years)
      const currentYear = new Date().getFullYear();
      const searchResponse = await fetch(
        `${this.baseUrl}/search?dateBegin=${currentYear - 5}&dateEnd=${currentYear}&hasImages=true&q=*`
      );
      
      if (!searchResponse.ok) {
        throw new Error(`Met API search error: ${searchResponse.statusText}`);
      }
      
      const searchData: MetSearchResponse = await searchResponse.json();
      
      if (!searchData.objectIDs || searchData.objectIDs.length === 0) {
        return;
      }

      // Fetch details for a few recent acquisitions
      const objectsToFetch = searchData.objectIDs.slice(0, Math.min(limit, 5));
      
      for (const objectID of objectsToFetch) {
        try {
          const event = await this.createEventFromObject(objectID, 'acquisition');
          if (event && this.validateEvent(event)) {
            events.push(event);
          }
        } catch (error) {
          console.warn(`Failed to create event from Met object ${objectID}:`, error);
        }
      }
    } catch (error) {
      console.error('Error fetching recent acquisitions:', error);
    }
  }

  private async createEventFromObject(objectID: number, eventType: 'highlight' | 'acquisition'): Promise<Event | null> {
    try {
      const response = await fetch(`${this.baseUrl}/objects/${objectID}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch object ${objectID}: ${response.statusText}`);
      }
      
      const object: MetObject = await response.json();
      
      // Skip objects without sufficient data
      if (!object.title || !object.department) {
        return null;
      }

      const eventTitle = eventType === 'highlight' 
        ? `Featured: ${object.title}`
        : `New Acquisition: ${object.title}`;
      
      const eventDescription = this.createEventDescription(object, eventType);
      
      // Create event date based on type
      const eventDate = eventType === 'highlight' 
        ? this.getHighlightEventDate()
        : this.getAcquisitionEventDate(object);

      return {
        id: this.generateInternalId(this.source, `${eventType}_${objectID}`),
        title: eventTitle,
        description: eventDescription,
        date: eventDate,
        location: this.metLocation,
        category: EventCategory.CULTURE,
        imageUrl: object.primaryImageSmall || object.primaryImage || '',
        ticketUrl: object.objectURL || undefined,
        price: {
          min: 25, // General admission
          max: 25,
          currency: 'USD',
        },
        source: this.source,
        externalId: objectID.toString(),
        sourceUrl: object.objectURL || undefined,
        lastUpdated: new Date(),
        isActive: true,
        tags: this.extractTags(object),
        venue: {
          website: 'https://www.metmuseum.org',
          phone: '+1-212-535-7710',
        },
      };
    } catch (error) {
      console.error(`Error creating event from Met object ${objectID}:`, error);
      return null;
    }
  }

  private createEventDescription(object: MetObject, eventType: 'highlight' | 'acquisition'): string {
    const parts: string[] = [];
    
    if (eventType === 'highlight') {
      parts.push('Experience this featured artwork from The Met\'s collection.');
    } else {
      parts.push('Discover this recent addition to The Met\'s collection.');
    }
    
    if (object.artistDisplayName) {
      parts.push(`Created by ${object.artistDisplayName}.`);
    }
    
    if (object.objectDate) {
      parts.push(`Dating from ${object.objectDate}.`);
    }
    
    if (object.medium) {
      parts.push(`Medium: ${object.medium}.`);
    }
    
    if (object.culture) {
      parts.push(`Culture: ${object.culture}.`);
    }
    
    if (object.GalleryNumber) {
      parts.push(`Currently on view in Gallery ${object.GalleryNumber}.`);
    } else {
      parts.push('Visit The Met to explore this and thousands of other masterpieces.');
    }
    
    return parts.join(' ');
  }

  private getHighlightEventDate(): Date {
    // For highlighted objects, create an ongoing event (today + 30 days)
    const now = new Date();
    return new Date(now.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
  }

  private getAcquisitionEventDate(object: MetObject): Date {
    // For acquisitions, use metadata date or create a recent date
    if (object.metadataDate) {
      const metadataDate = new Date(object.metadataDate);
      if (metadataDate > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) {
        return metadataDate;
      }
    }
    
    // Create a date within the last 30 days
    const now = new Date();
    return new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
  }

  private extractTags(object: MetObject): string[] {
    const tags: string[] = ['met', 'museum', 'art'];
    
    if (object.department) {
      tags.push(object.department.toLowerCase().replace(/\s+/g, '-'));
    }
    
    if (object.culture) {
      tags.push(object.culture.toLowerCase().replace(/\s+/g, '-'));
    }
    
    if (object.classification) {
      tags.push(object.classification.toLowerCase().replace(/\s+/g, '-'));
    }
    
    if (object.tags && object.tags.length > 0) {
      object.tags.slice(0, 3).forEach(tag => {
        tags.push(tag.term.toLowerCase().replace(/\s+/g, '-'));
      });
    }
    
    return tags;
  }

  transformEvent(externalEvent: any): Event {
    // This method is required by the interface but not used in this implementation
    // since we transform objects directly in createEventFromObject
    throw new Error('transformEvent not implemented for MetMuseumAdapter - use createEventFromObject instead');
  }
}