import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Alert, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import type { CalendarStackParamList } from '../../navigation/CalendarStackNavigator';
import {
  Container,
  Heading2,
  Body,
  Button,
  ErrorBoundary,
  LoadingSpinner,
} from '../../components/base';
import {
  CalendarView,
  ListView,
  WeekView,
  DayView,
  AgendaView,
  ViewToggle,
  ViewType,
  DateNavigation,
  EventFilterToggle,
  EventFilterType,
} from '../../components/calendar';
import { spacing, colors } from '../../design';
import { EventService } from '../../services';
import { SwipeInteractionTracker } from '../../services/SwipeInteractionTracker';
import { Event, SwipeDirection } from '../../types';
import { format } from 'date-fns';
import { deviceInfo } from '../../design/responsiveTokens';
import { formatStatsText, getContainerWidth } from '../../utils/responsiveText';

type NavigationProp = StackNavigationProp<CalendarStackParamList>;

export const MyEventsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [calendarEvents, setCalendarEvents] = useState<Event[]>([]);
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const [eventFilter, setEventFilter] = useState<EventFilterType>('all');
  const [viewType, setViewType] = useState<ViewType>('month');
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUserSwipedEvents, setHasUserSwipedEvents] = useState(false); // Track if user has swiped events
  const insets = useSafeAreaInsets();

  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const eventService = EventService.getInstance();

      // Get all calendar events (right + up swipes)
      const allCalendarEvents = eventService.getAllCalendarEvents();
      setCalendarEvents(allCalendarEvents);

      // Get saved events (down swipes)
      const savedEventsList = eventService.getSavedEvents();
      setSavedEvents(savedEventsList);

      // Update hasUserSwipedEvents if user has events
      if (allCalendarEvents.length > 0 || savedEventsList.length > 0) {
        setHasUserSwipedEvents(true);
      }
    } catch (err) {
      setError('Failed to load events. Please try again.');
      console.error('MyEventsScreen: Error loading events:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Reload events when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [loadEvents])
  );

  const handleEventPress = useCallback(
    (event: Event) => {
      navigation.navigate('EventDetail', { event });
    },
    [navigation]
  );

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const getStatsText = () => {
    const eventService = EventService.getInstance();
    const stats = eventService.getSwipeStats();

    // Use responsive text formatting
    return formatStatsText({
      going: stats.interested,
      public: stats.publicEvents,
      saved: stats.saved,
    });
  };

  const shouldShowToggle = () => {
    return calendarEvents.length > 0 && !isLoading;
  };

  const getFilteredEvents = () => {
    const eventService = EventService.getInstance();

    if (eventFilter === 'private') {
      return eventService.getPrivateCalendarEvents();
    } else if (eventFilter === 'public') {
      return eventService.getPublicCalendarEvents();
    }
    return calendarEvents; // 'all'
  };

  const renderCalendarContent = () => {
    const filteredEvents = getFilteredEvents();

    // Always render the calendar views, even when empty
    // The individual calendar components handle their own empty states appropriately

    switch (viewType) {
      case 'month':
        return (
          <CalendarView
            events={filteredEvents}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onEventPress={handleEventPress}
          />
        );
      case 'week':
        return (
          <WeekView
            events={filteredEvents}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onEventPress={handleEventPress}
          />
        );
      case 'day':
        return (
          <DayView
            events={filteredEvents}
            selectedDate={selectedDate}
            onEventPress={handleEventPress}
          />
        );
      case 'agenda':
        return (
          <AgendaView events={filteredEvents} onEventPress={handleEventPress} />
        );
      default:
        return (
          <ListView
            events={filteredEvents}
            onEventPress={handleEventPress}
            emptyMessage={`No ${eventFilter === 'all' ? '' : eventFilter + ' '}events in your calendar`}
          />
        );
    }
  };

  const renderMainContent = () => {
    if (isLoading) {
      return (
        <View style={styles.contentContainer}>
          <LoadingSpinner text="Loading your events..." />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.contentContainer}>
          <ErrorBoundary
            fallback={
              <View style={styles.errorContainer}>
                <Body style={styles.errorText}>{error}</Body>
                <Button
                  title="Retry"
                  onPress={loadEvents}
                  variant="outline"
                  style={styles.retryButton}
                />
              </View>
            }
          >
            <></>
          </ErrorBoundary>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        {/* Date Navigation */}
        {viewType !== 'agenda' && (
          <DateNavigation
            selectedDate={selectedDate}
            viewType={viewType}
            onDateChange={handleDateSelect}
          />
        )}

        {/* Empty state hint for new users */}
        {calendarEvents.length === 0 && (
          <View style={styles.emptyHint}>
            <Body
              color={colors.neutral[400]}
              align="center"
              style={styles.emptyHintText}
            >
              Swipe on events in Discover to add them here
            </Body>
          </View>
        )}

        {/* Calendar Content */}
        {renderCalendarContent()}
      </View>
    );
  };

  return (
    <ErrorBoundary>
      <Container style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          {/* Title and Filter Row */}
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Heading2 style={styles.title}>My Events</Heading2>
              <Body color={colors.neutral[500]} style={styles.subtitle}>
                {getStatsText()}
              </Body>
            </View>
            {shouldShowToggle() && (
              <View style={styles.filterToggleContainer}>
                <EventFilterToggle
                  currentFilter={eventFilter}
                  onFilterChange={setEventFilter}
                  variant="dropdown"
                />
              </View>
            )}
          </View>

          {/* View Toggle Row */}
          {shouldShowToggle() && (
            <View style={styles.viewToggleRow}>
              <ViewToggle currentView={viewType} onViewChange={setViewType} />
            </View>
          )}
        </View>

        {/* Content */}
        {renderMainContent()}
      </Container>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  header: {
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
    minHeight: 80,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'flex-start',
    paddingRight: spacing[3],
    minWidth: 0,
  },
  title: {
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: 14,
    flexWrap: 'wrap',
  },
  viewToggleRow: {
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  contentContainer: {
    flex: 1,
  },
  emptyHint: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    backgroundColor: colors.neutral[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  emptyHintText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  errorText: {
    textAlign: 'center',
    color: colors.error[500],
    marginBottom: spacing[4],
  },
  retryButton: {
    minWidth: 120,
  },
  filterToggleContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 120,
    maxWidth: 140,
  },
});
