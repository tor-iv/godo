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
} from '../../components/calendar';
import { spacing, colors } from '../../design';
import { EventService } from '../../services';
import { Event, SwipeDirection } from '../../types';
import { format } from 'date-fns';

export const MyEventsScreen = () => {
  const [calendarEvents, setCalendarEvents] = useState<Event[]>([]);
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const [currentTab, setCurrentTab] = useState<'calendar' | 'saved'>('calendar');
  const [viewType, setViewType] = useState<ViewType>('month');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
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

  const renderCalendarContent = () => {
    if (calendarEvents.length === 0) {
      return (
        <Container variant="screenCentered">
          <Heading2 align="center" style={styles.emptyTitle}>
            No Events Yet
          </Heading2>
          <Body color={colors.neutral[500]} align="center" style={styles.emptySubtitle}>
            Swipe right or up on events in the Discover tab to add them to your calendar!
          </Body>
        </Container>
      );
    }

    switch (viewType) {
      case 'month':
        return (
          <CalendarView
            events={calendarEvents}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onEventPress={handleEventPress}
          />
        );
      case 'week':
        return (
          <WeekView
            events={calendarEvents}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onEventPress={handleEventPress}
          />
        );
      case 'day':
        return (
          <DayView
            events={calendarEvents}
            selectedDate={selectedDate}
            onEventPress={handleEventPress}
          />
        );
      case 'agenda':
        return (
          <AgendaView
            events={calendarEvents}
            onEventPress={handleEventPress}
          />
        );
      default:
        return (
          <ListView
            events={calendarEvents}
            onEventPress={handleEventPress}
            emptyMessage="No events in your calendar"
          />
        );
    }
  };

  const renderCalendarTab = () => {
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
        
        {/* Calendar Content */}
        {renderCalendarContent()}
      </View>
    );
  };

  const renderSavedTab = () => {
    return (
      <View style={styles.contentContainer}>
        <ListView
          events={savedEvents}
          onEventPress={handleEventPress}
          emptyMessage="No saved events. Swipe down on events to save them for later!"
        />
      </View>
    );
  };

  return (
    <Container style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        {/* Title and Stats Row */}
        <View style={styles.titleRow}>
          <View style={styles.titleContainer}>
            <Heading2 style={styles.title}>My Events</Heading2>
            <Body color={colors.neutral[500]} style={styles.subtitle}>
              {getStatsText()}
            </Body>
          </View>
        </View>
        
        {/* Tabs Row */}
        <View style={styles.tabsRow}>
          <View style={styles.tabContainer}>
            <Button
              title="Calendar"
              onPress={() => setCurrentTab('calendar')}
              variant={currentTab === 'calendar' ? 'primary' : 'ghost'}
              size="small"
              style={styles.tabButton}
            />
            <Button
              title="Saved"
              onPress={() => setCurrentTab('saved')}
              variant={currentTab === 'saved' ? 'primary' : 'ghost'}
              size="small"
              style={styles.tabButton}
            />
          </View>
        </View>
        
        {/* View Toggle Row (only for calendar tab) */}
        {currentTab === 'calendar' && calendarEvents.length > 0 && (
          <View style={styles.viewToggleRow}>
            <ViewToggle
              currentView={viewType}
              onViewChange={setViewType}
            />
          </View>
        )}
      </View>

      {/* Content */}
      {currentTab === 'calendar' ? renderCalendarTab() : renderSavedTab()}

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
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  titleContainer: {
    alignItems: 'flex-start',
  },
  title: {
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: 14,
  },
  tabsRow: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[3],
  },
  tabContainer: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  tabButton: {
    flex: 1,
  },
  viewToggleRow: {
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[4],
  },
  contentContainer: {
    flex: 1,
  },
  emptyTitle: {
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    marginBottom: spacing[8],
    paddingHorizontal: spacing[4],
  },
});