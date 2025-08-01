import { EventAggregatorService } from '../api/EventAggregatorService';
import { EventStorageService } from '../storage/EventStorageService';
import { EventAPIParams, EventSyncResult } from '../../types';

export class BackgroundSyncService {
  constructor(
    private aggregatorService: EventAggregatorService,
    private storageService: EventStorageService
  ) {}

  async performFullSync(params?: EventAPIParams): Promise<EventSyncResult[]> {
    const defaultParams: EventAPIParams = {
      location: {
        lat: 40.7831, // NYC coordinates
        lng: -73.9712,
        radius: 25,
      },
      dateRange: {
        start: new Date(),
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
      },
      limit: 200,
      ...params,
    };

    try {
      // Fetch events from all sources
      const response = await this.aggregatorService.fetchEventsFromAllSources(defaultParams);
      
      // Cache the events
      await this.storageService.cacheEvents(response.events);
      
      // Update sync metadata (simplified - in a real app, you'd track per source)
      const syncResults = await this.aggregatorService.syncAllSources(defaultParams);
      
      return syncResults;
    } catch (error) {
      console.error('Full sync failed:', error);
      throw error;
    }
  }

  async shouldPerformSync(): Promise<boolean> {
    const metadata = await this.storageService.getSyncMetadata();
    const now = new Date();
    
    // Check if any source hasn't been synced in the last hour
    for (const [source, data] of Object.entries(metadata)) {
      if (!data.lastSync) return true;
      
      const hoursSinceLastSync = (now.getTime() - data.lastSync.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastSync > 1) {
        return true;
      }
    }
    
    return false;
  }
}