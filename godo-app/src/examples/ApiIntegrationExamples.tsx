/**
 * API Integration Examples
 * Demonstrates how to use the API integration layer
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';

// Import API components
import { useAuth } from '../context/AuthContext';
import {
  useEvents,
  useEventSearch,
  useFeaturedEvents,
  useSwipeEvent,
} from '../hooks/useEvents';
import { useApi, useNetworkStatus, useMutation } from '../hooks/useApi';
import { EventRepository } from '../repositories/EventRepository';
import { ApiEventService } from '../services/ApiEventService';
import {
  LoadingSpinner,
  EventListSkeleton,
} from '../components/common/LoadingStates';
import {
  ErrorState,
  NetworkErrorState,
  EmptyState,
} from '../components/common/ErrorStates';
import { Event, EventCategory, SwipeDirection } from '../types';

/**
 * Authentication Example
 */
export const AuthExample: React.FC = () => {
  const { state, login, logout, register } = useAuth();

  const handleLogin = async () => {
    try {
      await login({
        email: 'demo@example.com',
        password: 'password',
      });
      Alert.alert('Success', 'Logged in successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Login failed');
    }
  };

  const handleRegister = async () => {
    try {
      await register({
        email: 'newuser@example.com',
        password: 'password',
        confirmPassword: 'password',
        name: 'New User',
      });
      Alert.alert('Success', 'Registered successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Registration failed');
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Authentication Example</Text>

      <Text style={styles.status}>
        Status: {state.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </Text>

      {state.user && (
        <Text style={styles.userInfo}>
          Welcome, {state.user.name}! ({state.user.email})
        </Text>
      )}

      {state.error && <Text style={styles.error}>{state.error}</Text>}

      <View style={styles.buttonRow}>
        {!state.isAuthenticated ? (
          <>
            <TouchableOpacity
              style={[styles.button, state.isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={state.isLoading}
            >
              <Text style={styles.buttonText}>
                {state.isLoading ? 'Logging in...' : 'Login'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleRegister}
              disabled={state.isLoading}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Register
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.button} onPress={logout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

/**
 * Event Fetching Example
 */
export const EventFetchingExample: React.FC = () => {
  const {
    data: events,
    loading,
    error,
    refetch,
  } = useEvents({
    limit: 10,
    category: EventCategory.NETWORKING,
  });

  const { data: featuredEvents, loading: featuredLoading } =
    useFeaturedEvents();

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Event Fetching Example</Text>

      <TouchableOpacity style={styles.button} onPress={refetch}>
        <Text style={styles.buttonText}>Refresh Events</Text>
      </TouchableOpacity>

      {loading && <EventListSkeleton count={3} />}

      {error && (
        <ErrorState
          title="Failed to Load Events"
          message={error}
          onAction={refetch}
        />
      )}

      {events && (
        <View>
          <Text style={styles.subsectionTitle}>
            Networking Events ({events.data?.events.length || 0})
          </Text>

          {events.data?.events.slice(0, 3).map((event: Event) => (
            <View key={event.id} style={styles.eventItem}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDetails}>
                {event.venue.name} •{' '}
                {new Date(event.datetime).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {featuredEvents && !featuredLoading && (
        <View>
          <Text style={styles.subsectionTitle}>
            Featured Events ({featuredEvents.data?.length || 0})
          </Text>

          {featuredEvents.data?.slice(0, 2).map((event: Event) => (
            <View key={event.id} style={styles.eventItem}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDetails}>
                {event.venue.name} • Featured ⭐
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

/**
 * Search Example
 */
export const SearchExample: React.FC = () => {
  const {
    searchEvents,
    searchResults,
    loading,
    error,
    searchHistory,
    clearSearch,
  } = useEventSearch();

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchEvents(searchQuery.trim());
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Search Example</Text>

      <View style={styles.searchContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => searchEvents('networking')}
        >
          <Text style={styles.buttonText}>Search "networking"</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={clearSearch}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Clear Search
          </Text>
        </TouchableOpacity>
      </View>

      {loading && <LoadingSpinner message="Searching events..." />}

      {error && <Text style={styles.error}>{error}</Text>}

      {searchResults.length > 0 && (
        <View>
          <Text style={styles.subsectionTitle}>
            Search Results ({searchResults.length})
          </Text>

          {searchResults.slice(0, 3).map((event: Event) => (
            <View key={event.id} style={styles.eventItem}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDetails}>
                {event.venue.name} • {event.category}
              </Text>
            </View>
          ))}
        </View>
      )}

      {searchHistory.length > 0 && (
        <View>
          <Text style={styles.subsectionTitle}>Recent Searches</Text>
          <Text style={styles.searchHistory}>{searchHistory.join(', ')}</Text>
        </View>
      )}
    </View>
  );
};

/**
 * Swiping Example
 */
export const SwipeExample: React.FC = () => {
  const { swipeEvent, swipeHistory, getSwipeDirection } = useSwipeEvent();
  const [selectedEventId, setSelectedEventId] = useState<string>('1');

  const handleSwipe = (direction: SwipeDirection) => {
    try {
      swipeEvent(selectedEventId, direction);
      Alert.alert(
        'Event Swiped!',
        `Event ${selectedEventId} swiped ${direction}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to swipe event');
    }
  };

  const currentDirection = getSwipeDirection(selectedEventId);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Swipe Example</Text>

      <Text style={styles.subsectionTitle}>
        Event ID: {selectedEventId}
        {currentDirection && ` (${currentDirection})`}
      </Text>

      <View style={styles.swipeButtons}>
        <TouchableOpacity
          style={[styles.swipeButton, styles.leftSwipe]}
          onPress={() => handleSwipe(SwipeDirection.LEFT)}
        >
          <Text style={styles.swipeButtonText}>👈 Pass</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.swipeButton, styles.rightSwipe]}
          onPress={() => handleSwipe(SwipeDirection.RIGHT)}
        >
          <Text style={styles.swipeButtonText}>👉 Private</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.swipeButton, styles.upSwipe]}
          onPress={() => handleSwipe(SwipeDirection.UP)}
        >
          <Text style={styles.swipeButtonText}>👆 Public</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.swipeButton, styles.downSwipe]}
          onPress={() => handleSwipe(SwipeDirection.DOWN)}
        >
          <Text style={styles.swipeButtonText}>👇 Save</Text>
        </TouchableOpacity>
      </View>

      {swipeHistory.length > 0 && (
        <View>
          <Text style={styles.subsectionTitle}>Recent Swipes</Text>
          {swipeHistory.slice(0, 5).map((swipe, index) => (
            <Text key={index} style={styles.swipeHistoryItem}>
              Event {swipe.eventId}: {swipe.direction} at{' '}
              {swipe.timestamp.toLocaleTimeString()}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

/**
 * Network Status Example
 */
export const NetworkStatusExample: React.FC = () => {
  const { networkState, isOnline, isOffline } = useNetworkStatus();

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Network Status Example</Text>

      <View style={styles.networkStatus}>
        <Text
          style={[
            styles.statusIndicator,
            isOnline ? styles.online : styles.offline,
          ]}
        >
          {isOnline ? '🟢 Online' : '🔴 Offline'}
        </Text>

        <Text style={styles.networkDetails}>
          Type: {networkState.type || 'Unknown'}
        </Text>

        {networkState.isInternetReachable !== undefined && (
          <Text style={styles.networkDetails}>
            Internet Reachable:{' '}
            {networkState.isInternetReachable ? 'Yes' : 'No'}
          </Text>
        )}
      </View>

      {isOffline && (
        <NetworkErrorState
          onAction={() =>
            Alert.alert('Info', 'Please check your internet connection')
          }
        />
      )}
    </View>
  );
};

/**
 * API Mutation Example
 */
export const MutationExample: React.FC = () => {
  const eventRepository = EventRepository.getInstance();

  const {
    mutate: saveEvent,
    loading,
    error,
    data,
  } = useMutation<void, string>((eventId: string) =>
    eventRepository
      .saveEvent(eventId)
      .then(() => ({ success: true, data: undefined }))
  );

  const handleSaveEvent = async () => {
    try {
      await saveEvent('sample-event-id');
      Alert.alert('Success', 'Event saved successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save event');
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Mutation Example</Text>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSaveEvent}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Saving Event...' : 'Save Event'}
        </Text>
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

/**
 * Main Examples Container
 */
export const ApiIntegrationExamples: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>API Integration Examples</Text>
      <Text style={styles.subtitle}>
        Demonstrates the comprehensive API integration layer
      </Text>

      <AuthExample />
      <EventFetchingExample />
      <SearchExample />
      <SwipeExample />
      <NetworkStatusExample />
      <MutationExample />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495e',
    marginTop: 16,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 4,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3498db',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#3498db',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  status: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 8,
  },
  userInfo: {
    fontSize: 14,
    color: '#27ae60',
    marginBottom: 16,
  },
  error: {
    fontSize: 14,
    color: '#e74c3c',
    marginBottom: 12,
    textAlign: 'center',
  },
  eventItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  eventDetails: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  searchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  searchHistory: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  swipeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  swipeButton: {
    width: '48%',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 4,
  },
  leftSwipe: {
    backgroundColor: '#e74c3c',
  },
  rightSwipe: {
    backgroundColor: '#27ae60',
  },
  upSwipe: {
    backgroundColor: '#f39c12',
  },
  downSwipe: {
    backgroundColor: '#9b59b6',
  },
  swipeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  swipeHistoryItem: {
    fontSize: 12,
    color: '#7f8c8d',
    marginVertical: 2,
  },
  networkStatus: {
    alignItems: 'center',
    marginVertical: 16,
  },
  statusIndicator: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  online: {
    color: '#27ae60',
  },
  offline: {
    color: '#e74c3c',
  },
  networkDetails: {
    fontSize: 14,
    color: '#7f8c8d',
    marginVertical: 2,
  },
});
