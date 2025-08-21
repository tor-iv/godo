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

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  selectedDate,
  onDateSelect,
  onEventPress,
}) => {
  const getCategoryColor = (category: string): string => {
    const categoryColors: Record<string, string> = {
      'NETWORKING': colors.info[500],
      'CULTURE': colors.primary[500],
      'FITNESS': colors.success[500],
      'FOOD': colors.warning[500],
      'NIGHTLIFE': '#ec4899',
      'OUTDOOR': '#059669',
      'PROFESSIONAL': '#6366f1',
    };
    return categoryColors[category] || colors.neutral[400];
  };

  // Convert events to calendar format
  const markedDates = useMemo(() => {
    const marked: any = {};
    
    events.forEach(event => {
      const dateString = format(new Date(event.datetime), 'yyyy-MM-dd');
      
      if (!marked[dateString]) {
        marked[dateString] = {
          dots: [],
          selected: dateString === selectedDate,
          selectedColor: colors.primary[500],
        };
      }
      
      // Add dot for event (color-coded by category)
      marked[dateString].dots.push({
        color: getCategoryColor(event.category),
      });
    });
    
    // Ensure selected date is marked even if no events
    if (selectedDate && !marked[selectedDate]) {
      marked[selectedDate] = {
        selected: true,
        selectedColor: colors.primary[500],
        dots: [],
      };
    }
    
    return marked;
  }, [events, selectedDate, getCategoryColor]);
  
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
        onDayPress={(day) => onDateSelect?.(day.dateString)}
        theme={calendarTheme}
        markingType="multi-dot"
        firstDay={1} // Start week on Monday
        showWeekNumbers={false}
        hideExtraDays={true}
        enableSwipeMonths={true}
        style={styles.calendar}
      />
      
      {/* Event List for Selected Date */}
      {selectedDate && (
        <View style={styles.eventList}>
          <Body style={styles.eventListTitle}>
            Events for {format(new Date(selectedDate), 'MMMM d, yyyy')}
          </Body>
          
          {selectedDateEvents.length === 0 ? (
            <Caption style={styles.noEvents}>No events on this date</Caption>
          ) : (
            selectedDateEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.eventItem}
                onPress={() => onEventPress?.(event)}
              >
                <View style={styles.eventTime}>
                  <Caption color={colors.neutral[500]}>
                    {formatEventTime(event.datetime)}
                  </Caption>
                </View>
                <View style={styles.eventDetails}>
                  <Body style={styles.eventTitle} numberOfLines={1}>
                    {event.title}
                  </Body>
                  <Caption color={colors.neutral[500]} numberOfLines={1}>
                    {event.venue.name}, {event.venue.neighborhood}
                  </Caption>
                </View>
                <View 
                  style={[
                    styles.categoryDot, 
                    { backgroundColor: getCategoryColor(event.category) }
                  ]} 
                />
              </TouchableOpacity>
            ))
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
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[4],
  },
  eventListTitle: {
    marginBottom: spacing[4],
    fontWeight: '600',
  },
  noEvents: {
    textAlign: 'center',
    marginTop: spacing[8],
    fontStyle: 'italic',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  eventTime: {
    width: 60,
    marginRight: spacing[3],
  },
  eventDetails: {
    flex: 1,
    marginRight: spacing[3],
  },
  eventTitle: {
    marginBottom: spacing[1],
    fontWeight: '500',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});