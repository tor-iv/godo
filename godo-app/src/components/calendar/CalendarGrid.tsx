import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { COLORS, SPACING, FONT_SIZES, LAYOUT, SHADOWS } from '../../constants';
import { Event, EventCategory } from '../../types';
import { getCategoryEmoji } from '../../data/mockEvents';

interface CalendarGridProps {
  events: Event[];
  selectedDate?: string;
  onDateSelect: (date: string) => void;
  onEventPress?: (event: Event) => void;
}

interface MarkedDate {
  marked?: boolean;
  dotColor?: string;
  dots?: Array<{
    key: string;
    color: string;
    selectedDotColor?: string;
  }>;
  selected?: boolean;
  selectedColor?: string;
}

const getCategoryColor = (category: EventCategory): string => {
  switch (category) {
    case EventCategory.NETWORKING:
      return COLORS.PRIMARY_PURPLE;
    case EventCategory.CULTURE:
      return '#EC4899';
    case EventCategory.FITNESS:
      return COLORS.SUCCESS;
    case EventCategory.FOOD:
      return COLORS.WARNING;
    case EventCategory.NIGHTLIFE:
      return COLORS.DARK_PURPLE;
    case EventCategory.OUTDOOR:
      return '#10B981';
    case EventCategory.PROFESSIONAL:
      return '#3B82F6';
    default:
      return COLORS.SECONDARY_PURPLE;
  }
};

const EventDayComponent = ({ date, events }: { date: any; events: Event[] }) => {
  const dayEvents = events.filter(event => 
    format(new Date(event.date), 'yyyy-MM-dd') === date.dateString
  );

  if (dayEvents.length === 0) return null;

  return (
    <View style={styles.eventDayContainer}>
      <Text style={styles.dayText}>{date.day}</Text>
      <View style={styles.eventDots}>
        {dayEvents.slice(0, 3).map((event, index) => (
          <View
            key={event.id}
            style={[
              styles.eventDot,
              { backgroundColor: getCategoryColor(event.category) }
            ]}
          />
        ))}
        {dayEvents.length > 3 && (
          <Text style={styles.moreEventsText}>+{dayEvents.length - 3}</Text>
        )}
      </View>
    </View>
  );
};

export default function CalendarGrid({ 
  events, 
  selectedDate, 
  onDateSelect,
  onEventPress 
}: CalendarGridProps) {
  const today = format(new Date(), 'yyyy-MM-dd');

  // Create marked dates object
  const markedDates: { [key: string]: MarkedDate } = {};

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const dateKey = format(new Date(event.date), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as { [key: string]: Event[] });

  // Mark dates with events
  Object.keys(eventsByDate).forEach(dateKey => {
    const dayEvents = eventsByDate[dateKey];
    if (dayEvents) {
      markedDates[dateKey] = {
        dots: dayEvents.slice(0, 3).map((event, index) => ({
          key: event.id,
          color: getCategoryColor(event.category),
        })),
        marked: true,
      };
    }
  });

  // Mark selected date
  if (selectedDate) {
    markedDates[selectedDate] = {
      ...markedDates[selectedDate],
      selected: true,
      selectedColor: COLORS.PRIMARY_PURPLE,
    };
  }

  // Mark today
  if (!markedDates[today]) {
    markedDates[today] = {};
  }

  return (
    <View style={styles.container}>
      <Calendar
        style={styles.calendar}
        theme={{
          backgroundColor: COLORS.WHITE,
          calendarBackground: COLORS.WHITE,
          textSectionTitleColor: COLORS.TEXT_MEDIUM,
          selectedDayBackgroundColor: COLORS.PRIMARY_PURPLE,
          selectedDayTextColor: COLORS.WHITE,
          todayTextColor: COLORS.PRIMARY_PURPLE,
          dayTextColor: COLORS.TEXT_DARK,
          textDisabledColor: COLORS.TEXT_MUTED,
          dotColor: COLORS.PRIMARY_PURPLE,
          selectedDotColor: COLORS.WHITE,
          arrowColor: COLORS.PRIMARY_PURPLE,
          monthTextColor: COLORS.TEXT_DARK,
          indicatorColor: COLORS.PRIMARY_PURPLE,
          textDayFontFamily: 'System',
          textMonthFontFamily: 'System',
          textDayHeaderFontFamily: 'System',
          textDayFontWeight: '400',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '600',
          textDayFontSize: FONT_SIZES.SM,
          textMonthFontSize: FONT_SIZES.LG,
          textDayHeaderFontSize: FONT_SIZES.XS,
        }}
        markedDates={markedDates}
        markingType="multi-dot"
        onDayPress={(day) => onDateSelect(day.dateString)}
        firstDay={0} // Sunday first
        showWeekNumbers={false}
        hideExtraDays={true}
        enableSwipeMonths={true}
      />
      
      {selectedDate && eventsByDate[selectedDate] && (
        <View style={styles.selectedDayEvents}>
          <Text style={styles.selectedDayTitle}>
            Events on {format(new Date(selectedDate), 'MMMM d, yyyy')}
          </Text>
          {eventsByDate[selectedDate].map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventItem}
              onPress={() => onEventPress?.(event)}
            >
              <View style={styles.eventInfo}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventEmoji}>
                    {getCategoryEmoji(event.category)}
                  </Text>
                  <View
                    style={[
                      styles.categoryDot,
                      { backgroundColor: getCategoryColor(event.category) }
                    ]}
                  />
                </View>
                <Text style={styles.eventTitle} numberOfLines={1}>
                  {event.title}
                </Text>
                <Text style={styles.eventTime}>
                  {format(new Date(event.date), 'h:mm a')}
                </Text>
                <Text style={styles.eventLocation} numberOfLines={1}>
                  📍 {event.location.name}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  calendar: {
    marginHorizontal: SPACING.MD,
    marginTop: SPACING.SM,
    borderRadius: LAYOUT.BORDER_RADIUS,
    ...SHADOWS.CARD,
  },
  eventDayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  dayText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_DARK,
    marginBottom: 2,
  },
  eventDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 8,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  moreEventsText: {
    fontSize: 8,
    color: COLORS.TEXT_LIGHT,
    marginLeft: 2,
  },
  selectedDayEvents: {
    margin: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderRadius: LAYOUT.BORDER_RADIUS,
    padding: SPACING.MD,
    ...SHADOWS.CARD,
  },
  selectedDayTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
    marginBottom: SPACING.SM,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  eventInfo: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  eventEmoji: {
    fontSize: FONT_SIZES.SM,
    marginRight: SPACING.XS,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  eventTitle: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginBottom: 2,
  },
  eventTime: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.PRIMARY_PURPLE,
    fontWeight: '500',
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT_LIGHT,
  },
});