import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  format,
  isSameDay,
  getHours,
  getMinutes,
  addMinutes,
  differenceInMinutes,
} from 'date-fns';
import { COLORS, SPACING, FONT_SIZES, LAYOUT, SHADOWS } from '../../constants';
import { Event, EventCategory } from '../../types';
import { getCategoryIcon } from '../../data/mockEvents';

interface DayViewProps {
  events: Event[];
  selectedDate: Date;
  onEventPress?: (event: Event) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const HOUR_HEIGHT = 80;
const HOURS_IN_DAY = 24;
const TIME_COLUMN_WIDTH = 60;
const EVENT_MARGIN = 2;

const getCategoryColor = (category: EventCategory): string => {
  switch (category) {
    case EventCategory.NETWORKING:
      return COLORS.SECONDARY;
    case EventCategory.CULTURE:
      return '#EC4899';
    case EventCategory.FITNESS:
      return COLORS.SUCCESS;
    case EventCategory.FOOD:
      return COLORS.WARNING;
    case EventCategory.NIGHTLIFE:
      return COLORS.ACCENT;
    case EventCategory.OUTDOOR:
      return '#10B981';
    case EventCategory.PROFESSIONAL:
      return '#3B82F6';
    default:
      return COLORS.PRIMARY;
  }
};

const TimeColumn = () => {
  const hours = Array.from({ length: HOURS_IN_DAY }, (_, i) => i);
  
  return (
    <View style={styles.timeColumn}>
      {hours.map((hour) => (
        <View key={hour} style={styles.timeSlot}>
          <Text style={styles.timeText}>
            {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
          </Text>
        </View>
      ))}
    </View>
  );
};

const CurrentTimeLine = () => {
  const now = new Date();
  const currentHours = getHours(now);
  const currentMinutes = getMinutes(now);
  const topPosition = (currentHours * HOUR_HEIGHT) + (currentMinutes * HOUR_HEIGHT / 60);

  return (
    <View style={[styles.currentTimeLine, { top: topPosition }]}>
      <View style={styles.currentTimeCircle} />
      <View style={styles.currentTimeLineBar} />
    </View>
  );
};

interface ProcessedEvent extends Event {
  top: number;
  height: number;
  width: number;
  left: number;
  column: number;
}

const processEvents = (events: Event[]): ProcessedEvent[] => {
  // Sort events by start time
  const sortedEvents = events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const processedEvents: ProcessedEvent[] = [];
  const columns: { start: number; end: number }[] = [];

  sortedEvents.forEach((event) => {
    const eventStart = new Date(event.date);
    const eventEnd = addMinutes(eventStart, 90); // Default 1.5 hour duration
    
    const startMinutes = getHours(eventStart) * 60 + getMinutes(eventStart);
    const endMinutes = getHours(eventEnd) * 60 + getMinutes(eventEnd);
    
    // Find a column for this event
    let column = 0;
    while (column < columns.length) {
      const colEnd = columns[column]?.end;
      if (colEnd !== undefined && startMinutes >= colEnd) {
        columns[column] = { start: startMinutes, end: endMinutes };
        break;
      }
      column++;
    }
    
    // If no available column, create a new one
    if (column === columns.length) {
      columns.push({ start: startMinutes, end: endMinutes });
    }
    
    const top = (startMinutes / 60) * HOUR_HEIGHT;
    const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 40);
    const maxColumns = Math.max(1, columns.length);
    const width = (screenWidth - TIME_COLUMN_WIDTH - SPACING.MD * 2) / maxColumns - EVENT_MARGIN * 2;
    const left = column * (width + EVENT_MARGIN * 2) + EVENT_MARGIN;
    
    processedEvents.push({
      ...event,
      top,
      height,
      width,
      left,
      column,
    });
  });

  return processedEvents;
};

export default function DayView({ events, selectedDate, onEventPress }: DayViewProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Filter events for the selected day
  const dayEvents = events.filter(event => isSameDay(new Date(event.date), selectedDate));
  const processedEvents = processEvents(dayEvents);
  
  const isToday = isSameDay(selectedDate, new Date());

  // Scroll to current time on mount if viewing today
  React.useEffect(() => {
    if (isToday) {
      const currentHour = new Date().getHours();
      const scrollToPosition = Math.max(0, (currentHour - 2) * HOUR_HEIGHT);
      
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: scrollToPosition, animated: false });
      }, 100);
    }
  }, [isToday, selectedDate]);

  return (
    <View style={styles.container}>
      {/* Day header */}
      <View style={styles.dayHeader}>
        <Text style={styles.dayTitle}>
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </Text>
        {isToday && <Text style={styles.todayIndicator}>Today</Text>}
      </View>

      {/* Scrollable content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ height: HOURS_IN_DAY * HOUR_HEIGHT }}
      >
        <View style={styles.dayContent}>
          <TimeColumn />
          
          <View style={styles.eventsContainer}>
            {/* Hour grid lines */}
            {Array.from({ length: HOURS_IN_DAY }, (_, hour) => (
              <View key={hour} style={[styles.hourLine, { top: hour * HOUR_HEIGHT }]} />
            ))}
            
            {/* Current time line (only for today) */}
            {isToday && <CurrentTimeLine />}
            
            {/* Events */}
            {processedEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={[
                  styles.eventBlock,
                  {
                    top: event.top,
                    height: event.height,
                    width: event.width,
                    left: event.left,
                    backgroundColor: getCategoryColor(event.category),
                  }
                ]}
                onPress={() => onEventPress?.(event)}
              >
                <View style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <Text style={styles.categoryLabel}>
                      {event.category.charAt(0).toUpperCase()}
                    </Text>
                    <Text style={styles.eventTime}>
                      {format(new Date(event.date), 'h:mm a')}
                    </Text>
                  </View>
                  
                  <Text style={styles.eventTitle} numberOfLines={3}>
                    {event.title}
                  </Text>
                  
                  <Text style={styles.eventLocation} numberOfLines={2}>
                    at {event.location.name}
                  </Text>
                  
                  {event.price && (
                    <Text style={styles.eventPrice}>
                      {event.price.min === 0 ? 'Free' : 
                       event.price.min === event.price.max ? 
                       `$${event.price.min}` : 
                       `$${event.price.min} - $${event.price.max}`}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {/* Empty state */}
            {dayEvents.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No events scheduled</Text>
                <Text style={styles.emptyStateSubtext}>
                  {isToday ? 'for today' : `for ${format(selectedDate, 'MMMM d')}`}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  dayHeader: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.SMALL,
  },
  dayTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
  },
  todayIndicator: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.SECONDARY,
    fontWeight: '600',
    backgroundColor: COLORS.LIGHT_GRAY,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: LAYOUT.BORDER_RADIUS_SMALL,
  },
  scrollView: {
    flex: 1,
  },
  dayContent: {
    flexDirection: 'row',
    position: 'relative',
  },
  timeColumn: {
    width: TIME_COLUMN_WIDTH,
    backgroundColor: COLORS.WHITE,
    borderRightWidth: 1,
    borderRightColor: COLORS.BORDER_LIGHT,
  },
  timeSlot: {
    height: HOUR_HEIGHT,
    justifyContent: 'flex-start',
    paddingTop: SPACING.XS,
    paddingRight: SPACING.XS,
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT_LIGHT,
    fontWeight: '500',
  },
  eventsContainer: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    position: 'relative',
    paddingHorizontal: SPACING.SM,
  },
  hourLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.BORDER_LIGHT,
  },
  currentTimeLine: {
    position: 'absolute',
    left: -10,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  currentTimeCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 2,
  },
  currentTimeLineBar: {
    flex: 1,
    height: 2,
    backgroundColor: '#EF4444',
  },
  eventBlock: {
    position: 'absolute',
    borderRadius: LAYOUT.BORDER_RADIUS_SMALL,
    padding: SPACING.XS,
    ...SHADOWS.SMALL,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  categoryLabel: {
    fontSize: FONT_SIZES.XS,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    width: 16,
    height: 16,
    textAlign: 'center',
    lineHeight: 16,
  },
  eventTime: {
    fontSize: FONT_SIZES.XS,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.WHITE,
    fontWeight: '600',
    marginBottom: SPACING.XS,
    lineHeight: FONT_SIZES.SM * 1.2,
  },
  eventLocation: {
    fontSize: FONT_SIZES.XS,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: SPACING.XS,
  },
  eventPrice: {
    fontSize: FONT_SIZES.XS,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    marginTop: HOUR_HEIGHT * 4, // Show empty state in the middle area
  },
  emptyStateText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_LIGHT,
    fontWeight: '500',
    marginBottom: SPACING.XS,
  },
  emptyStateSubtext: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_MUTED,
  },
});