import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event, EventSource } from '../../types';

const EVENTS_STORAGE_KEY = 'cached_events';
const SYNC_METADATA_KEY = 'sync_metadata';

export interface SyncMetadata {
  [source: string]: {
    lastSync: Date;
    eventCount: number;
  };
}

export class EventStorageService {
  async getCachedEvents(): Promise<Event[]> {
    try {
      const eventsJson = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
      if (!eventsJson) return [];
      
      const events = JSON.parse(eventsJson);
      // Convert date strings back to Date objects
      return events.map((event: any) => ({
        ...event,
        date: new Date(event.date),
        lastUpdated: new Date(event.lastUpdated),
      }));
    } catch (error) {
      console.error('Error loading cached events:', error);
      return [];
    }
  }

  async cacheEvents(events: Event[]): Promise<void> {
    try {
      await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    } catch (error) {
      console.error('Error caching events:', error);
    }
  }

  async getSyncMetadata(): Promise<SyncMetadata> {
    try {
      const metadataJson = await AsyncStorage.getItem(SYNC_METADATA_KEY);
      if (!metadataJson) return {};
      
      const metadata = JSON.parse(metadataJson);
      // Convert date strings back to Date objects
      Object.keys(metadata).forEach(source => {
        if (metadata[source].lastSync) {
          metadata[source].lastSync = new Date(metadata[source].lastSync);
        }
      });
      
      return metadata;
    } catch (error) {
      console.error('Error loading sync metadata:', error);
      return {};
    }
  }

  async updateSyncMetadata(source: EventSource, eventCount: number): Promise<void> {
    try {
      const metadata = await this.getSyncMetadata();
      metadata[source] = {
        lastSync: new Date(),
        eventCount,
      };
      await AsyncStorage.setItem(SYNC_METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('Error updating sync metadata:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([EVENTS_STORAGE_KEY, SYNC_METADATA_KEY]);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}