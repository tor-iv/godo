/**
 * API Integration Layer - Main Export File
 * Centralized exports for the comprehensive API integration system
 */

// Core API Infrastructure
export { HttpClient, ApiError, NetworkError, TimeoutError } from './HttpClient';
export * from './types';

// Configuration
export * from '../config/api.config';

// Repositories
export { BaseRepository } from '../repositories/BaseRepository';
export { EventRepository } from '../repositories/EventRepository';
export { SwipeRepository } from '../repositories/SwipeRepository';

// Services
export { AuthService } from '../services/AuthService';
export { ApiEventService } from '../services/ApiEventService';

// Authentication Context
export { AuthProvider, useAuth } from '../context/AuthContext';

// Custom Hooks
export * from '../hooks/useApi';
export * from '../hooks/useEvents';

// Storage
export { SecureStorage, STORAGE_KEYS } from '../utils/storage/SecureStorage';

// UI Components
export {
  LoadingSpinner,
  SkeletonLoader,
  EventCardSkeleton,
  EventListSkeleton,
  CalendarSkeleton,
  ProfileSkeleton,
  FullScreenLoading,
  InlineLoading,
  LoadingButton,
} from '../components/common/LoadingStates';

export {
  ErrorState,
  NetworkErrorState,
  EmptyState,
  NoEventsState,
  NoSearchResultsState,
  PermissionDeniedState,
  AuthRequiredState,
  ServerErrorState,
  OfflineState,
  MaintenanceState,
  RateLimitedState,
  ApiErrorState,
} from '../components/common/ErrorStates';

export { ErrorBoundary } from '../components/common/ErrorBoundary';

// Examples
export { ApiIntegrationExamples } from '../examples/ApiIntegrationExamples';

/**
 * Quick Setup Function
 * Initializes the API integration layer with default configuration
 */
export const initializeApiIntegration = async (): Promise<{
  httpClient: HttpClient;
  eventRepository: EventRepository;
  apiEventService: ApiEventService;
  authService: AuthService;
}> => {
  try {
    // Initialize core services
    const httpClient = HttpClient.getInstance();
    const eventRepository = EventRepository.getInstance();
    const apiEventService = ApiEventService.getInstance();
    const authService = AuthService.getInstance();

    // Sync with server if in API mode
    await apiEventService.syncWithServer();

    // API Integration Layer initialized successfully

    return {
      httpClient,
      eventRepository,
      apiEventService,
      authService,
    };
  } catch (error) {
    // Failed to initialize API integration - using fallback services
    throw error;
  }
};

/**
 * Environment-aware Service Factory
 * Returns appropriate service instances based on current environment
 */
export const createServiceFactory = () => {
  const eventService = ApiEventService.getInstance();
  const authService = AuthService.getInstance();
  const httpClient = HttpClient.getInstance();

  return {
    events: eventService,
    auth: authService,
    http: httpClient,

    // Utility methods
    isOnline: () => httpClient.isNetworkAvailable(),
    getNetworkState: () => httpClient.getNetworkState(),
    clearCache: () => httpClient.clearCache(),

    // Environment info
    isUsingMockData: () => !eventService.isUsingApiLayer?.(),
    getEnvironment: () => {
      return 'development'; // Simplified - can be enhanced later
    },
  };
};

/**
 * Default Export - Service Factory
 */
export default createServiceFactory;
