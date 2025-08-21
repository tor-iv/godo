import React, { useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addDays,
  isToday,
  isSameDay,
  startOfDay,
  addHours,
  isSameHour,
} from 'date-fns';
import { Event } from '../../types';
import { colors, typography, spacing, layout } from '../../design';
import { Body, Caption } from '../../components/base';
import { getCategoryColor } from '../../utils';

interface WeekViewProps {
  events: Event[];
  selectedDate: string;
  onDateSelect?: (date: string) => void;
  onEventPress?: (event: Event) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  events,
  selectedDate,
  onDateSelect,
  onEventPress,
}) => {
  const selectedDateObj = new Date(selectedDate);
  
  // Get week days starting from Monday
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDateObj, { weekStartsOn: 1 });
    const end = endOfWeek(selectedDateObj, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [selectedDateObj]);

  // Generate time slots (6 AM to 11 PM)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 6; hour <= 23; hour++) {
      slots.push(hour);
    }
    return slots;
  }, []);

  // Group events by day and time
  const eventsByDay = useMemo(() => {
    const grouped: { [key: string]: Event[] } = {};
    
    weekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      grouped[dayKey] = events.filter(event => {
        const eventDate = format(new Date(event.datetime), 'yyyy-MM-dd');
        return eventDate === dayKey;
      }).sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    });
    
    return grouped;
  }, [events, weekDays]);

  const getEventPosition = (event: Event): { top: number; height: number } => {
    const eventDate = new Date(event.datetime);
    const hour = eventDate.getHours();
    const minutes = eventDate.getMinutes();
    
    // Calculate position relative to 6 AM start
    const startHour = 6;
    const relativeHour = hour - startHour;
    const slotHeight = 60; // Height per hour slot
    
    const top = (relativeHour * slotHeight) + (minutes / 60 * slotHeight);
    const height = 50; // Default event height (could be calculated from duration)
    
    return { top: Math.max(0, top), height };
  };

  const formatTimeSlot = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const handleDatePress = (day: Date) => {
    const dateString = format(day, 'yyyy-MM-dd');
    onDateSelect?.(dateString);
  };

  return (
    <View style={styles.container}>
      {/* Header with days */}
      <View style={styles.header}>
        <View style={styles.timeHeaderSpace} />
        {weekDays.map((day) => {
          const dayString = format(day, 'yyyy-MM-dd');
          const isSelected = dayString === selectedDate;
          const isDayToday = isToday(day);
          
          return (
            <TouchableOpacity
              key={dayString}
              style={[
                styles.dayHeader,
                isSelected && styles.selectedDayHeader,
                isDayToday && styles.todayHeader,
              ]}
              onPress={() => handleDatePress(day)}
            >
              <Caption 
                style={[
                  styles.dayOfWeek,
                  isSelected && styles.selectedDayText,
                  isDayToday && styles.todayText,
                ]}
              >
                {format(day, 'EEE')}
              </Caption>
              <Body 
                style={[
                  styles.dayNumber,
                  isSelected && styles.selectedDayText,
                  isDayToday && styles.todayText,
                ]}
              >
                {format(day, 'd')}
              </Body>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Scrollable time grid */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.timeGrid}>
          {timeSlots.map((hour) => (
            <View key={hour} style={styles.timeRow}>
              {/* Time label */}
              <View style={styles.timeLabel}>
                <Caption color={colors.neutral[500]} style={styles.timeLabelText}>
                  {formatTimeSlot(hour)}
                </Caption>
              </View>

              {/* Day columns */}
              {weekDays.map((day) => {
                const dayString = format(day, 'yyyy-MM-dd');
                const dayEvents = eventsByDay[dayString] || [];
                
                return (
                  <View 
                    key={`${dayString}-${hour}`} 
                    style={[
                      styles.dayColumn,
                      hour === timeSlots[timeSlots.length - 1] && styles.lastRow,
                    ]}
                  >
                    {/* Events for this hour */}
                    {dayEvents
                      .filter(event => {
                        const eventHour = new Date(event.datetime).getHours();
                        return eventHour === hour;
                      })
                      .map((event, index) => {
                        const position = getEventPosition(event);
                        return (
                          <TouchableOpacity
                            key={event.id}
                            style={[
                              styles.eventBlock,
                              {
                                backgroundColor: getCategoryColor(event.category),
                                height: position.height,
                                zIndex: 10 + index,
                              },
                            ]}
                            onPress={() => onEventPress?.(event)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.eventTitle} numberOfLines={2}>
                              {event.title}
                            </Text>
                            <Text style={styles.eventTime}>
                              {format(new Date(event.datetime), 'h:mm a')}
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    }
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    backgroundColor: colors.neutral[0],
  },
  timeHeaderSpace: {
    width: 60,
    borderRightWidth: 1,
    borderRightColor: colors.neutral[100],
  },
  dayHeader: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.neutral[100],
  },
  selectedDayHeader: {
    backgroundColor: colors.primary[50],
  },
  todayHeader: {
    backgroundColor: colors.primary[500],
  },
  dayOfWeek: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  selectedDayText: {
    color: colors.primary[600],
  },
  todayText: {
    color: colors.neutral[0],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[4],
  },
  timeGrid: {
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  timeLabel: {
    width: 60,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: spacing[1],
    borderRightWidth: 1,
    borderRightColor: colors.neutral[100],
  },
  timeLabelText: {
    fontSize: 11,
    fontWeight: '500',
  },
  dayColumn: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: colors.neutral[100],
    position: 'relative',
  },
  eventBlock: {
    position: 'absolute',
    left: 2,
    right: 2,
    borderRadius: 4,
    padding: spacing[1],
    marginVertical: 1,
  },
  eventTitle: {
    color: colors.neutral[0],
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
  },
  eventTime: {
    color: colors.neutral[0],
    fontSize: 9,
    fontWeight: '500',
    opacity: 0.9,
    marginTop: 2,
  },
});