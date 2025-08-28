import React, { useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import { format, isToday, startOfDay, addHours } from 'date-fns';
import { Event } from '../../types';
import { colors, typography, spacing } from '../../design';
import { Body, Caption, Heading3 } from '../../components/base';
import { getCategoryColor } from '../../utils';

interface DayViewProps {
  events: Event[];
  selectedDate: string;
  onEventPress?: (event: Event) => void;
}

export const DayView: React.FC<DayViewProps> = props => {
  const { events, selectedDate, onEventPress } = props;
  const selectedDateObj = new Date(selectedDate);
  const isDayToday = isToday(selectedDateObj);

  // Generate time slots (6 AM to 11 PM) in 30-minute intervals
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 6; hour <= 23; hour++) {
      slots.push({ hour, minute: 0 });
      slots.push({ hour, minute: 30 });
    }
    return slots;
  }, []);

  // Filter events for the selected date
  const dayEvents = useMemo(() => {
    return events
      .filter(event => {
        const eventDate = format(new Date(event.datetime), 'yyyy-MM-dd');
        return eventDate === selectedDate;
      })
      .sort(
        (a, b) =>
          new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
      );
  }, [events, selectedDate]);

  const getEventPosition = (event: Event): { top: number; height: number } => {
    const eventDate = new Date(event.datetime);
    const hour = eventDate.getHours();
    const minutes = eventDate.getMinutes();

    // Calculate position relative to 6 AM start
    const startHour = 6;
    const relativeHour = hour - startHour;
    const slotHeight = 60; // Height per hour

    const top = relativeHour * slotHeight + (minutes / 60) * slotHeight;

    // Event duration (default to 1 hour if not specified)
    const durationMinutes = 60; // Default duration
    const height = Math.max(40, (durationMinutes / 60) * slotHeight);

    return { top: Math.max(0, top), height };
  };

  const formatTimeSlot = (hour: number, minute: number) => {
    const time = new Date();
    time.setHours(hour, minute, 0, 0);
    return format(time, 'h:mm a');
  };

  const isCurrentTimeSlot = (hour: number, minute: number) => {
    if (!isDayToday) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return currentHour === hour && Math.abs(currentMinute - minute) < 30;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Heading3 style={[styles.dateTitle, isDayToday && styles.todayTitle]}>
          {format(selectedDateObj, 'EEEE, MMMM d')}
        </Heading3>
        {isDayToday && <Caption style={styles.todayLabel}>Today</Caption>}
        <Caption color={colors.neutral[500]} style={styles.eventCount}>
          {String(dayEvents.length)}{' '}
          {String(dayEvents.length === 1 ? 'event' : 'events')}
        </Caption>
      </View>

      {/* Time grid */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.timeGrid}>
          {timeSlots.map(({ hour, minute }) => {
            const isCurrentTime = isCurrentTimeSlot(hour, minute);
            const isHourMark = minute === 0;

            return (
              <View
                key={`${hour}-${minute}`}
                style={[
                  styles.timeSlot,
                  isHourMark && styles.hourMark,
                  isCurrentTime && styles.currentTimeSlot,
                ]}
              >
                {/* Time label (only show on hour marks) */}
                {isHourMark && (
                  <View style={styles.timeLabel}>
                    <Caption
                      color={
                        isCurrentTime
                          ? colors.primary[600]
                          : colors.neutral[500]
                      }
                      style={[
                        styles.timeLabelText,
                        isCurrentTime && styles.currentTimeText,
                      ]}
                    >
                      {formatTimeSlot(hour, minute)}
                    </Caption>
                  </View>
                )}

                {/* Event area */}
                <View style={styles.eventArea}>
                  {/* Current time indicator */}
                  {isCurrentTime && (
                    <View style={styles.currentTimeIndicator}>
                      <View style={styles.currentTimeDot} />
                      <View style={styles.currentTimeLine} />
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {/* Overlay events */}
          <View style={styles.eventsOverlay}>
            {dayEvents.map(event => {
              const position = getEventPosition(event);

              return (
                <TouchableOpacity
                  key={event.id}
                  style={[
                    styles.eventBlock,
                    {
                      top: position.top,
                      height: position.height,
                      backgroundColor: getCategoryColor(event.category),
                    },
                  ]}
                  onPress={() => onEventPress?.(event)}
                  activeOpacity={0.8}
                >
                  <View style={styles.eventContent}>
                    <Text style={styles.eventTitle} numberOfLines={2}>
                      {event.title}
                    </Text>
                    <Text style={styles.eventTime}>
                      {format(new Date(event.datetime), 'h:mm a')}
                    </Text>
                    {event.venue?.name && (
                      <Text style={styles.eventVenue} numberOfLines={1}>
                        {event.venue.name}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Empty state */}
      {dayEvents.length === 0 && (
        <View style={styles.emptyState}>
          <Body color={colors.neutral[400]} align="center">
            No events scheduled for this day
          </Body>
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
  header: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    alignItems: 'center',
  },
  dateTitle: {
    marginBottom: spacing[1],
  },
  todayTitle: {
    color: colors.primary[600],
  },
  todayLabel: {
    backgroundColor: colors.primary[100],
    color: colors.primary[700],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 12,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  eventCount: {
    fontSize: 13,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[4],
  },
  timeGrid: {
    position: 'relative',
    paddingHorizontal: spacing[4],
  },
  timeSlot: {
    height: 30,
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: colors.neutral[100],
  },
  hourMark: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  currentTimeSlot: {
    backgroundColor: colors.primary[50],
  },
  timeLabel: {
    width: 70,
    paddingRight: spacing[2],
    justifyContent: 'center',
  },
  timeLabelText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },
  currentTimeText: {
    fontWeight: '700',
  },
  eventArea: {
    flex: 1,
    position: 'relative',
  },
  currentTimeIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 15,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
  },
  currentTimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
    marginLeft: spacing[2],
  },
  currentTimeLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.primary[500],
    marginLeft: spacing[1],
  },
  eventsOverlay: {
    position: 'absolute',
    left: 74, // Time label width + padding
    right: spacing[4],
    top: 0,
    bottom: 0,
  },
  eventBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 6,
    padding: spacing[2],
    marginVertical: 1,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    color: colors.neutral[0],
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
    marginBottom: spacing[1],
  },
  eventTime: {
    color: colors.neutral[0],
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.9,
    marginBottom: spacing[1],
  },
  eventVenue: {
    color: colors.neutral[0],
    fontSize: 10,
    fontWeight: '400',
    opacity: 0.8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[8],
  },
});
