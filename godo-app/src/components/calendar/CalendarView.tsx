import React, { useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Calendar, CalendarProps } from 'react-native-calendars';
import { format } from 'date-fns';
import { Event } from '../../types';
import { colors, typography, spacing } from '../../design';
import { Body, Caption } from '../../components/base';

interface CalendarViewProps {
  events: Event[];
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
  onEventPress?: (event: Event) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = props => {
  const { events, selectedDate, onDateSelect, onEventPress } = props;
  const getCategoryColor = (category: string): string => {
    const categoryColors: Record<string, string> = {
      NETWORKING: colors.info[500],
      CULTURE: colors.primary[500],
      FITNESS: colors.success[500],
      FOOD: colors.warning[500],
      NIGHTLIFE: '#ec4899',
      OUTDOOR: '#059669',
      PROFESSIONAL: '#6366f1',
    };
    return categoryColors[category] || colors.neutral[400];
  };

  // Convert events to calendar format with better indicators
  const markedDates = useMemo(() => {
    const marked: any = {};

    events.forEach(event => {
      const dateString = format(new Date(event.datetime), 'yyyy-MM-dd');

      if (!marked[dateString]) {
        marked[dateString] = {
          dots: [],
          selected: dateString === selectedDate,
          selectedColor: colors.primary[500],
          eventCount: 0,
        };
      }

      marked[dateString].eventCount = (marked[dateString].eventCount || 0) + 1;

      // Add up to 3 dots for events (color-coded by category)
      if (marked[dateString].dots.length < 3) {
        marked[dateString].dots.push({
          color: getCategoryColor(event.category),
        });
      }
    });

    // Ensure selected date is marked even if no events
    if (selectedDate && !marked[selectedDate]) {
      marked[selectedDate] = {
        selected: true,
        selectedColor: colors.primary[500],
        dots: [],
        eventCount: 0,
      };
    }

    return marked;
  }, [events, selectedDate]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];

    return events.filter(event => {
      const eventDate = format(new Date(event.datetime), 'yyyy-MM-dd');
      return eventDate === selectedDate;
    });
  }, [events, selectedDate]);

  const formatEventTime = (datetime: string) => {
    return format(new Date(datetime), 'h:mm a');
  };

  const calendarTheme: CalendarProps['theme'] = {
    backgroundColor: colors.neutral[0],
    calendarBackground: colors.neutral[0],
    textSectionTitleColor: colors.neutral[600],
    textSectionTitleDisabledColor: colors.neutral[300],
    selectedDayBackgroundColor: colors.primary[500],
    selectedDayTextColor: colors.neutral[0],
    todayTextColor: colors.primary[600],
    dayTextColor: colors.neutral[800],
    textDisabledColor: colors.neutral[300],
    dotColor: colors.primary[500],
    selectedDotColor: colors.neutral[0],
    arrowColor: colors.primary[500],
    disabledArrowColor: colors.neutral[300],
    monthTextColor: colors.neutral[800],
    indicatorColor: colors.primary[500],
    textDayFontFamily: typography.body1.fontFamily,
    textMonthFontFamily: typography.h3.fontFamily,
    textDayHeaderFontFamily: typography.label.fontFamily,
    textDayFontWeight: '400',
    textMonthFontWeight: '600',
    textDayHeaderFontWeight: '600',
    textDayFontSize: 16,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 14,
  };

  return (
    <View style={styles.container}>
      <Calendar
        markedDates={markedDates}
        onDayPress={day => onDateSelect?.(day.dateString)}
        theme={calendarTheme}
        markingType="multi-dot"
        firstDay={1} // Start week on Monday
        showWeekNumbers={false}
        hideExtraDays={true}
        enableSwipeMonths={true}
        hideArrows={true}
        style={styles.calendar}
      />

      {/* Event List for Selected Date */}
      {selectedDate && (
        <View style={styles.eventList}>
          <View style={styles.eventListHeader}>
            {selectedDateEvents.length > 0 && (
              <Caption style={styles.eventCount}>
                {selectedDateEvents.length}{' '}
                {String(selectedDateEvents.length === 1 ? 'event' : 'events')}
              </Caption>
            )}
          </View>

          {selectedDateEvents.length === 0 ? (
            <View style={styles.emptyEventsContainer}>
              <Caption style={styles.noEvents}>No events on this date</Caption>
            </View>
          ) : (
            <View style={styles.eventsContainer}>
              {selectedDateEvents.map(event => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventItem}
                  onPress={() => onEventPress?.(event)}
                  activeOpacity={0.7}
                >
                  <View style={styles.eventTimeContainer}>
                    <Caption style={styles.eventTime}>
                      {formatEventTime(event.datetime)}
                    </Caption>
                  </View>

                  <View style={styles.eventDetails}>
                    <Body style={styles.eventTitle} numberOfLines={2}>
                      {event.title}
                    </Body>
                    <Caption
                      color={colors.neutral[500]}
                      numberOfLines={1}
                      style={styles.eventVenue}
                    >
                      {event.venue.name}
                      {event.venue.neighborhood
                        ? `, ${event.venue.neighborhood}`
                        : ''}
                    </Caption>

                    {/* Event metadata */}
                    <View style={styles.eventMetadata}>
                      {event.currentAttendees && event.currentAttendees > 0 && (
                        <Caption
                          color={colors.neutral[400]}
                          style={styles.metadata}
                        >
                          {event.currentAttendees} attending
                        </Caption>
                      )}
                      {event.friendsAttending && event.friendsAttending > 0 && (
                        <Caption
                          color={colors.primary[600]}
                          style={styles.friendsMetadata}
                        >
                          +{event.friendsAttending} friends
                        </Caption>
                      )}
                    </View>
                  </View>

                  <View style={styles.eventActions}>
                    <View
                      style={[
                        styles.categoryDot,
                        { backgroundColor: getCategoryColor(event.category) },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  calendar: {
    marginBottom: spacing[4],
  },
  eventList: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  eventListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    backgroundColor: colors.neutral[50],
  },
  eventListTitle: {
    fontWeight: '600',
    fontSize: 16,
  },
  eventCount: {
    backgroundColor: colors.primary[100],
    color: colors.primary[700],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 12,
    fontSize: 11,
    fontWeight: '600',
  },
  emptyEventsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  noEvents: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: colors.neutral[400],
  },
  eventsContainer: {
    flex: 1,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  eventTimeContainer: {
    width: 70,
    alignItems: 'center',
    paddingTop: spacing[1],
  },
  eventTime: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 8,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  eventDetails: {
    flex: 1,
    marginHorizontal: spacing[3],
  },
  eventTitle: {
    marginBottom: spacing[1],
    fontWeight: '600',
    lineHeight: 20,
  },
  eventVenue: {
    marginBottom: spacing[2],
    lineHeight: 16,
  },
  eventMetadata: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  metadata: {
    fontSize: 11,
  },
  friendsMetadata: {
    fontSize: 11,
    fontWeight: '600',
  },
  eventActions: {
    alignItems: 'center',
    paddingTop: spacing[1],
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
