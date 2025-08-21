import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Container, Heading2, Body, Button } from '../../components/base';
import { CalendarView, ListView, ViewToggle, ViewType } from '../../components/calendar';
import { spacing, colors } from '../../design';
import { EventService } from '../../services';
import { Event, SwipeDirection } from '../../types';
import { format } from 'date-fns';

export const MyEventsScreen = () => {
  const [calendarEvents, setCalendarEvents] = useState<Event[]>([]);
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const [currentTab, setCurrentTab] = useState<'calendar' | 'saved'>('calendar');
  const [viewType, setViewType] = useState<ViewType>('calendar');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
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
    Alert.alert(
      event.title,
      `${event.description}\n\nVenue: ${event.venue.name}\nNeighborhood: ${event.venue.neighborhood}`,
      [{ text: 'OK' }]
    );
  }, []);

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const getStatsText = () => {
    const eventService = EventService.getInstance();
    const stats = eventService.getSwipeStats();
    
    return `${stats.interested} going • ${stats.publicEvents} public • ${stats.saved} saved`;
  };

  const renderCalendarTab = () => {
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

    return (
      <View style={styles.contentContainer}>
        {viewType === 'calendar' ? (
          <CalendarView
            events={calendarEvents}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onEventPress={handleEventPress}
          />
        ) : (
          <ListView
            events={calendarEvents}
            onEventPress={handleEventPress}
            emptyMessage="No events in your calendar"
          />
        )}
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
        <Heading2 style={styles.title}>My Events</Heading2>
        <Body color={colors.neutral[500]} style={styles.subtitle}>
          {getStatsText()}
        </Body>
        
        {/* Tab Toggle */}
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
        
        {/* View Toggle (only for calendar tab) */}
        {currentTab === 'calendar' && calendarEvents.length > 0 && (
          <View style={styles.viewToggleContainer}>
            <ViewToggle
              currentView={viewType}
              onViewChange={setViewType}
            />
          </View>
        )}
      </View>

      {/* Content */}
      {currentTab === 'calendar' ? renderCalendarTab() : renderSavedTab()}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  header: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  title: {
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: 14,
    marginBottom: spacing[4],
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: spacing[4],
  },
  tabButton: {
    flex: 1,
    marginHorizontal: spacing[1],
  },
  viewToggleContainer: {
    alignItems: 'center',
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