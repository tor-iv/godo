import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Container, Heading2, Body, Button } from '../../components/base';
import {
  CalendarView,
  ListView,
  WeekView,
  DayView,
  AgendaView,
  ViewToggle,
  ViewType,
  DateNavigation,
  EventModal,
  EventFilterToggle,
  EventFilterType,
} from '../../components/calendar';
import { spacing, colors } from '../../design';
import { EventService } from '../../services';
import { Event, SwipeDirection } from '../../types';
import { format } from 'date-fns';

export const MyEventsScreen = () => {
  const [calendarEvents, setCalendarEvents] = useState<Event[]>([]);
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const [eventFilter, setEventFilter] = useState<EventFilterType>('all');
  const [viewType, setViewType] = useState<ViewType>('month');
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const insets = useSafeAreaInsets();

  const loadEvents = useCallback(() => {
    const eventService = EventService.getInstance();

    // Get all calendar events (right + up swipes)
    const allCalendarEvents = eventService.getAllCalendarEvents();
    setCalendarEvents(allCalendarEvents);

    // Get saved events (down swipes)
    const savedEventsList = eventService.getSavedEvents();
    setSavedEvents(savedEventsList);
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

  const handleEventPress = useCallback((event: Event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  }, []);

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const handleRemoveFromCalendar = useCallback(() => {
    loadEvents(); // Reload events after removal
    setShowEventModal(false);
    setSelectedEvent(null);
  }, [loadEvents]);

  const handleCloseModal = useCallback(() => {
    setShowEventModal(false);
    setSelectedEvent(null);
  }, []);

  const getStatsText = () => {
    const eventService = EventService.getInstance();
    const stats = eventService.getSwipeStats();

    return `${stats.interested} going • ${stats.publicEvents} public • ${stats.saved} saved`;
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
          {calendarEvents.length > 0 && (
            <EventFilterToggle
              currentFilter={eventFilter}
              onFilterChange={setEventFilter}
              variant="dropdown"
            />
          )}
        </View>

        {/* View Toggle Row */}
        {calendarEvents.length > 0 && (
          <View style={styles.viewToggleRow}>
            <ViewToggle currentView={viewType} onViewChange={setViewType} />
          </View>
        )}
      </View>

      {/* Content */}
      {renderMainContent()}

      {/* Event Modal */}
      <EventModal
        event={selectedEvent}
        visible={showEventModal}
        onClose={handleCloseModal}
        onRemoveFromCalendar={handleRemoveFromCalendar}
      />
    </Container>
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
    alignItems: 'center', // Changed from 'flex-start' to center align with dropdown
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  titleContainer: {
    flex: 1,
    alignItems: 'flex-start',
    paddingRight: spacing[3], // Reduced padding for tighter layout
  },
  title: {
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: 14,
  },
  viewToggleRow: {
    alignItems: 'center',
    paddingHorizontal: spacing[6],
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
});
